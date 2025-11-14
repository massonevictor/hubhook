import { EventStatus } from "@prisma/client";
import { createHmac } from "crypto";
import { formatISO } from "date-fns";
import { fetch } from "undici";
import { prisma } from "../lib/prisma.js";
import { webhookQueue } from "../lib/queue.js";

const MAX_RESPONSE_LENGTH = 5000;

function signPayload(secret: string, payload: unknown) {
  const body = JSON.stringify(payload);
  return createHmac("sha256", secret).update(body).digest("hex");
}

export async function enqueueDelivery(eventId: string, delay = 0) {
  await webhookQueue.add(
    "deliver",
    { eventId },
    {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: true,
      delay,
    },
  );
}

export async function deliverEvent(eventId: string) {
  const event = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
    include: {
      route: {
        include: {
          project: true,
          destinations: true,
        },
      },
    },
  });

  if (!event || !event.route.isActive) {
    return;
  }

  const destinations = event.route.destinations
    .filter((destination) => destination.isActive)
    .sort((a, b) => a.priority - b.priority);

  if (!destinations.length) {
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: EventStatus.FAILED, errorMessage: "Route has no active destinations" },
    });
    return;
  }

  let deliveredCount = 0;
  let lastError: string | null = null;

  for (const destination of destinations) {
    try {
      const signature = signPayload(event.route.secret, event.payload);
      const response = await fetch(destination.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhookhub-event-id": event.id,
          "x-webhookhub-route": event.route.slug,
          "x-webhookhub-project": event.route.project.name,
          "x-webhookhub-signature": signature,
          "x-webhookhub-timestamp": formatISO(new Date()),
        },
        body: JSON.stringify(event.payload),
      });

      const responseBody = (await response.text()).slice(0, MAX_RESPONSE_LENGTH);

      await prisma.deliveryAttempt.create({
        data: {
          eventId: event.id,
          destinationId: destination.id,
          targetEndpoint: destination.endpoint,
          responseStatus: response.status,
          responseBody,
          success: response.ok,
          errorMessage: response.ok ? null : `HTTP ${response.status}`,
        },
      });

      if (response.ok) {
        deliveredCount += 1;
      } else {
        lastError = `HTTP ${response.status}`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      lastError = message;
      await prisma.deliveryAttempt.create({
        data: {
          eventId: event.id,
          destinationId: destination.id,
          targetEndpoint: destination.endpoint,
          responseStatus: null,
          responseBody: null,
          success: false,
          errorMessage: message,
        },
      });
    }
  }

  const nextAttemptCount = event.attemptCount + 1;
  const totalDestinations = destinations.length;
  const deliveredAll = deliveredCount === totalDestinations;
  const nextStatus = deliveredAll
    ? EventStatus.SUCCESS
    : nextAttemptCount >= event.route.maxRetries
      ? EventStatus.FAILED
      : EventStatus.RETRYING;

  await prisma.webhookEvent.update({
    where: { id: event.id },
    data: {
      status: nextStatus,
      attemptCount: nextAttemptCount,
      lastAttemptAt: new Date(),
      destinationCount: totalDestinations,
      deliveredCount,
      errorMessage: deliveredAll ? null : lastError,
    },
  });

  if (!deliveredAll && nextStatus !== EventStatus.FAILED) {
    const delay = Math.min(2 ** nextAttemptCount * 1000, 60_000);
    await enqueueDelivery(event.id, delay);
  }
}
