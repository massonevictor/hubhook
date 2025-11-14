import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../env.js";

const connection = new Redis(env.REDIS_URL);

export const webhookQueue = new Queue("webhook-delivery", { connection });
