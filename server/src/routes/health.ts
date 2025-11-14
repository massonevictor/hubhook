import { FastifyInstance } from "fastify";

export default async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ status: "ok" }));
}
