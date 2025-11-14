import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import registerRoutes from "./routes/index.js";
import "./jobs/deliveryWorker.js";

async function bootstrap() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: env.SERVER_ORIGIN, credentials: true });
  await registerRoutes(app);

  try {
    await app.listen({ port: env.SERVER_PORT, host: "0.0.0.0" });
    console.log(`Server listening on port ${env.SERVER_PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

bootstrap();
