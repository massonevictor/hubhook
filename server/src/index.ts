import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env";
import registerRoutes from "./routes";
import "./jobs/deliveryWorker";

async function bootstrap() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
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
