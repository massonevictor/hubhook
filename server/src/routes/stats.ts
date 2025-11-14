import { EventStatus, prisma } from "../lib/prisma.js";
import { FastifyInstance } from "fastify";
import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns";

export default async function registerStatsRoutes(app: FastifyInstance) {
  app.get("/api/stats/summary", async () => {
    const [total, success, failed, pending, projects, routes] = await Promise.all([
      prisma.webhookEvent.count(),
      prisma.webhookEvent.count({ where: { status: EventStatus.SUCCESS } }),
      prisma.webhookEvent.count({ where: { status: EventStatus.FAILED } }),
      prisma.webhookEvent.count({ where: { status: { in: [EventStatus.PENDING, EventStatus.RETRYING] } } }),
      prisma.project.count(),
      prisma.webhookRoute.count({ where: { isActive: true } }),
    ]);

    const today = startOfDay(new Date());
    const startDate = subDays(today, 6);

    const chartDays = Array.from({ length: 7 }).map((_, index) => addDays(startDate, index));

    const chart = [] as Array<{ date: string; total: number; success: number; failed: number }>;

    for (const day of chartDays) {
      const [dayTotal, daySuccess, dayFailed] = await Promise.all([
        prisma.webhookEvent.count({ where: { createdAt: { gte: startOfDay(day), lte: endOfDay(day) } } }),
        prisma.webhookEvent.count({ where: { createdAt: { gte: startOfDay(day), lte: endOfDay(day) }, status: EventStatus.SUCCESS } }),
        prisma.webhookEvent.count({ where: { createdAt: { gte: startOfDay(day), lte: endOfDay(day) }, status: EventStatus.FAILED } }),
      ]);

      chart.push({
        date: format(day, "dd/MM"),
        total: dayTotal,
        success: daySuccess,
        failed: dayFailed,
      });
    }

    return {
      totalWebhooks: total,
      successCount: success,
      failedCount: failed,
      pendingCount: pending,
      successRate: total === 0 ? 100 : Number(((success / total) * 100).toFixed(1)),
      projects,
      activeRoutes: routes,
      chart,
    };
  });
}
