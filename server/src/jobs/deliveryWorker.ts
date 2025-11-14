import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../env.js";
import { deliverEvent } from "../services/delivery.js";

export const deliveryWorker = new Worker(
  "webhook-delivery",
  async (job) => {
    const { eventId } = job.data as { eventId: string };
    if (eventId) {
      await deliverEvent(eventId);
    }
  },
  {
    connection: new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }),
  },
);

deliveryWorker.on("failed", (job, err) => {
  const metadata = job?.data ?? {};
  console.error("Delivery job failed", { metadata, error: err });
});
