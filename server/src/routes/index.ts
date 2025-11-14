import { FastifyInstance } from "fastify";
import registerProjectsRoutes from "./projects";
import registerWebhookRoutes from "./webhooks";
import registerStatsRoutes from "./stats";
import registerHealthRoutes from "./health";

export default async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);
  await registerProjectsRoutes(app);
  await registerWebhookRoutes(app);
  await registerStatsRoutes(app);
}
