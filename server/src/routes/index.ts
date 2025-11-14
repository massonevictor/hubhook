import { FastifyInstance } from "fastify";
import registerProjectsRoutes from "./projects.js";
import registerWebhookRoutes from "./webhooks.js";
import registerStatsRoutes from "./stats.js";
import registerHealthRoutes from "./health.js";

export default async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);
  await registerProjectsRoutes(app);
  await registerWebhookRoutes(app);
  await registerStatsRoutes(app);
}
