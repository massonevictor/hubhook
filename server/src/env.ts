import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  SERVER_PORT: z.coerce.number().default(4000),
  SERVER_ORIGIN: z.string().url(),
  WEBHOOK_DEFAULT_SECRET: z.string().min(8, "WEBHOOK_DEFAULT_SECRET must be at least 8 characters"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  SERVER_PORT: process.env.SERVER_PORT,
  SERVER_ORIGIN: process.env.SERVER_ORIGIN,
  WEBHOOK_DEFAULT_SECRET: process.env.WEBHOOK_DEFAULT_SECRET,
});
