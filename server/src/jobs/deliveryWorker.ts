import { Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../env";
import { deliverEvent } from "../services/delivery";

export const deliveryWorker = new Worker(
  "webhook-delivery",
  async (job) => {
    const { eventId } = job.data as { eventId: string };
    if (eventId) {
      await deliverEvent(eventId);
    }
  },
  {
    connection: new IORedis(env.REDIS_URL),
  },
);

deliveryWorker.on("failed", (job, err) => {
  const metadata = job?.data ?? {};
  console.error("Delivery job failed", { metadata, error: err });
});
