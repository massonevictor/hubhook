import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../env";

const connection = new IORedis(env.REDIS_URL);

export const webhookQueue = new Queue("webhook-delivery", { connection });
