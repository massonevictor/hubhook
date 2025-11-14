import { EventStatus, Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { enqueueDelivery } from "../services/delivery.js";
import { slugify } from "../utils/slugify.js";

const destinationInputSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  endpoint: z.string().url(),
  priority: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().optional(),
});

const createRouteSchema = z.object({
  name: z.string().min(3),
  projectId: z.string().min(1),
  retentionDays: z.coerce.number().int().min(7).max(90).default(30),
  maxRetries: z.coerce.number().int().min(1).max(10).default(3),
  destinations: z.array(destinationInputSchema.omit({ id: true })).min(1),
});

const updateRouteSchema = z.object({
  name: z.string().min(3).optional(),
  retentionDays: z.coerce.number().int().min(7).max(90).optional(),
  maxRetries: z.coerce.number().int().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
  destinations: z.array(destinationInputSchema).optional(),
});

const inboundParamsSchema = z.object({ slug: z.string().min(1) });
const inboundQuerySchema = z.object({ secret: z.string().optional() });

const retryParamsSchema = z.object({ id: z.string().min(1) });
const listQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const detailParamsSchema = z.object({ id: z.string().min(1) });

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 32);

const routeIncludes = {
  project: true,
  destinations: true,
  _count: { select: { events: true } },
} as const;

function normalizeHeaders(headers: unknown) {
  if (!headers || typeof headers !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(headers as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
  );
}

function mapRoute(route: any) {
  return {
    id: route.id,
    name: route.name,
    slug: route.slug,
    project: route.project,
    retentionDays: route.retentionDays,
    maxRetries: route.maxRetries,
    isActive: route.isActive,
    secret: route.secret,
    inboundUrl: `/api/inbound/${route.slug}`,
    webhookCount: route._count?.events ?? 0,
    destinations: (route.destinations ?? [])
      .slice()
      .sort((a: any, b: any) => a.priority - b.priority)
      .map((destination: any) => ({
        id: destination.id,
        label: destination.label,
        endpoint: destination.endpoint,
        priority: destination.priority,
        isActive: destination.isActive,
      })),
  };
}

export default async function registerWebhookRoutes(app: FastifyInstance) {
  app.get("/api/routes", async () => {
    const routes = await prisma.webhookRoute.findMany({
      include: routeIncludes,
      orderBy: { createdAt: "desc" },
    });

    return routes.map(mapRoute);
  });

  app.get("/api/routes/:id", async (request, reply) => {
    const { id } = detailParamsSchema.parse(request.params);
    const route = await prisma.webhookRoute.findUnique({
      where: { id },
      include: routeIncludes,
    });

    if (!route) {
      return reply.code(404).send({ message: "Rota não encontrada" });
    }

    return mapRoute(route);
  });

  app.post("/api/routes", async (request, reply) => {
    const parsed = createRouteSchema.parse(request.body);
    const { destinations, ...routeData } = parsed;
    const project = await prisma.project.findUnique({ where: { id: routeData.projectId } });
    if (!project) {
      return reply.code(404).send({ message: "Projeto não encontrado" });
    }

    const baseSlug = slugify(routeData.name) || `route-${nanoid(6)}`;

    let slug = baseSlug;
    let suffix = 1;
    let hasUniqueSlug = false;

    while (!hasUniqueSlug) {
      const existing = await prisma.webhookRoute.findUnique({ where: { slug } });
      if (!existing) {
        hasUniqueSlug = true;
      } else {
        slug = `${baseSlug}-${suffix++}`;
      }
    }

    const secret = nanoid();

    const route = await prisma.webhookRoute.create({
      data: {
        name: routeData.name,
        retentionDays: routeData.retentionDays,
        maxRetries: routeData.maxRetries,
        slug,
        secret,
        project: { connect: { id: routeData.projectId } },
        destinations: {
          create: destinations
            .slice()
            .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
            .map((destination, index) => ({
              label: destination.label,
              endpoint: destination.endpoint,
              priority: destination.priority ?? index,
              isActive: destination.isActive ?? true,
            })),
        },
      },
      include: routeIncludes,
    });

    return reply.code(201).send(mapRoute(route));
  });

  app.patch("/api/routes/:id", async (request, reply) => {
    const { id } = detailParamsSchema.parse(request.params);
    const parsed = updateRouteSchema.parse(request.body);
    const existing = await prisma.webhookRoute.findUnique({
      where: { id },
      include: { destinations: true, project: true },
    });

    if (!existing) {
      return reply.code(404).send({ message: "Rota não encontrada" });
    }

    if (parsed.destinations) {
      const allowedIds = new Set(existing.destinations.map((destination) => destination.id));
      for (const destination of parsed.destinations) {
        if (destination.id && !allowedIds.has(destination.id)) {
          return reply.code(400).send({ message: "Destino inválido" });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      const { destinations, ...routeData } = parsed;
      if (Object.keys(routeData).length > 0) {
        await tx.webhookRoute.update({
          where: { id },
          data: routeData,
        });
      }

      if (destinations) {
        const incomingIds = new Set(destinations.map((destination) => destination.id).filter(Boolean) as string[]);

        await Promise.all(
          destinations.map((destination, index) => {
            const payload = {
              label: destination.label,
              endpoint: destination.endpoint,
              priority: destination.priority ?? index,
              isActive: destination.isActive ?? true,
            };

            if (destination.id) {
              return tx.webhookDestination.update({
                where: { id: destination.id },
                data: payload,
              });
            }

            return tx.webhookDestination.create({
              data: {
                ...payload,
                routeId: id,
              },
            });
          }),
        );

        const idsToDisable = existing.destinations
          .filter((destination) => !incomingIds.has(destination.id))
          .map((destination) => destination.id);

        if (idsToDisable.length > 0) {
          await tx.webhookDestination.updateMany({
            where: { id: { in: idsToDisable } },
            data: { isActive: false },
          });
        }
      }
    });

    const updated = await prisma.webhookRoute.findUnique({
      where: { id },
      include: routeIncludes,
    });

    if (!updated) {
      return reply.code(404).send({ message: "Rota não encontrada" });
    }

    return mapRoute(updated);
  });

  app.get("/api/webhooks", async (request) => {
    const { search, limit } = listQuerySchema.parse(request.query);

    const where: Prisma.WebhookEventWhereInput = search
      ? {
          OR: [
            { route: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
            { route: { project: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
          ],
        }
      : {};

    const events = await prisma.webhookEvent.findMany({
      where,
      include: {
        route: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    } satisfies Prisma.WebhookEventFindManyArgs);

    return events.map((event) => ({
      id: event.id,
      name: event.route.name,
      project: event.route.project.name,
      status: event.status,
      attempts: event.attemptCount,
      timestamp: event.createdAt,
      routeId: event.routeId,
      slug: event.route.slug,
      destinationCount: event.destinationCount,
      deliveredCount: event.deliveredCount,
    }));
  });

  app.get("/api/events/:id", async (request, reply) => {
    const { id } = detailParamsSchema.parse(request.params);
    const event = await prisma.webhookEvent.findUnique({
      where: { id },
      include: {
        route: {
          include: {
            project: true,
            destinations: true,
          },
        },
        attempts: {
          orderBy: { createdAt: "desc" },
          include: {
            destination: true,
          },
        },
      },
    });

    if (!event) {
      return reply.code(404).send({ message: "Evento não encontrado" });
    }

    return {
      id: event.id,
      status: event.status,
      timestamp: event.createdAt,
      lastAttemptAt: event.lastAttemptAt,
      payload: event.payload,
      headers: normalizeHeaders(event.headers),
      attemptCount: event.attemptCount,
      destinationCount: event.destinationCount,
      deliveredCount: event.deliveredCount,
      errorMessage: event.errorMessage,
      route: {
        id: event.route.id,
        name: event.route.name,
        slug: event.route.slug,
        project: event.route.project,
        inboundUrl: `/api/inbound/${event.route.slug}`,
        secret: event.route.secret,
        destinations: event.route.destinations
          .slice()
          .sort((a, b) => a.priority - b.priority)
          .map((destination) => ({
            id: destination.id,
            label: destination.label,
            endpoint: destination.endpoint,
            priority: destination.priority,
            isActive: destination.isActive,
          })),
      },
      attempts: event.attempts.map((attempt) => ({
        id: attempt.id,
        success: attempt.success,
        responseStatus: attempt.responseStatus,
        responseBody: attempt.responseBody,
        errorMessage: attempt.errorMessage,
        createdAt: attempt.createdAt,
        destination: attempt.destination
          ? {
              id: attempt.destination.id,
              label: attempt.destination.label,
              endpoint: attempt.destination.endpoint,
            }
          : null,
      })),
    };
  });

  app.post("/api/events/:id/retry", async (request, reply) => {
    const { id } = retryParamsSchema.parse(request.params);
    const event = await prisma.webhookEvent.findUnique({
      where: { id },
      include: {
        route: {
          include: {
            destinations: { where: { isActive: true } },
          },
        },
      },
    });
    if (!event) {
      return reply.code(404).send({ message: "Evento não encontrado" });
    }

    const destinationCount = event.route.destinations.length;
    if (!destinationCount) {
      return reply.code(400).send({ message: "Rota sem destinos ativos" });
    }

    await prisma.webhookEvent.update({
      where: { id },
      data: {
        status: EventStatus.PENDING,
        attemptCount: 0,
        errorMessage: null,
        deliveredCount: 0,
        destinationCount,
      },
    });

    await enqueueDelivery(id);
    return { status: "queued" };
  });

  app.post("/api/inbound/:slug", async (request, reply) => {
    const { slug } = inboundParamsSchema.parse(request.params);
    const { secret: secretQuery } = inboundQuerySchema.parse(request.query);
    const providedSecret = (request.headers["x-route-secret"] as string | undefined) ?? secretQuery ?? "";

    const route = await prisma.webhookRoute.findUnique({
      where: { slug },
      include: {
        destinations: { where: { isActive: true } },
      },
    });
    if (!route || !route.isActive) {
      return reply.code(404).send({ message: "Webhook não encontrado" });
    }

    if (route.secret !== providedSecret) {
      return reply.code(401).send({ message: "Segredo inválido" });
    }

    if (!route.destinations.length) {
      return reply.code(400).send({ message: "Nenhum destino ativo configurado" });
    }

    const payload = (request.body ?? {}) as Prisma.InputJsonValue;

    const headers = Object.fromEntries(
      Object.entries(request.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value]),
    ) as Record<string, string>;

    const event = await prisma.webhookEvent.create({
      data: {
        routeId: route.id,
        payload,
        headers: headers as Prisma.InputJsonValue,
        status: EventStatus.PENDING,
        destinationCount: route.destinations.length,
        deliveredCount: 0,
      },
    });

    await enqueueDelivery(event.id);

    return reply.code(202).send({ id: event.id, status: "enqueued" });
  });
}
