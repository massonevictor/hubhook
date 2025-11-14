import { EventStatus, Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const projectBodySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

export default async function registerProjectsRoutes(app: FastifyInstance) {
  app.get("/api/projects", async () => {
    const projects = await prisma.project.findMany({
      include: { _count: { select: { routes: true } } },
      orderBy: { createdAt: "desc" },
    });

    const enriched = await Promise.all(
      projects.map(async (project) => {
        const where = { route: { projectId: project.id } };
        const [total, success, failed] = await Promise.all([
          prisma.webhookEvent.count({ where }),
          prisma.webhookEvent.count({ where: { ...where, status: EventStatus.SUCCESS } }),
          prisma.webhookEvent.count({ where: { ...where, status: EventStatus.FAILED } }),
        ]);
        const successRate = total === 0 ? 100 : Number(((success / total) * 100).toFixed(1));
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          routes: project._count.routes,
          webhookCount: total,
          successRate,
        };
      }),
    );

    return enriched;
  });

  app.post("/api/projects", async (request, reply) => {
    const parsed = projectBodySchema.parse(request.body);
    const project = await prisma.project.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
      } satisfies Prisma.ProjectCreateInput,
    });
    return reply.code(201).send(project);
  });
}
