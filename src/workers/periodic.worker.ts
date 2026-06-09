/**
 * periodic.worker.ts — BullMQ processor for the "periodic-service" queue
 * Generates upcoming periodic service jobs (shampoo, wax, vacuum) for active subscriptions.
 * Schedule: run daily at 2am via a cron trigger (see cron.ts).
 */
import { Worker, Job } from "bullmq";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

const config = new ConfigService();
const redisUrl = config.get<string>("app.redisUrl") ?? "redis://localhost:6379";
const url = new URL(redisUrl);
const connection = { host: url.hostname, port: Number(url.port) || 6379, password: url.password || undefined };
const prisma = new PrismaClient();

const PERIODIC_PLANS: Record<string, string[]> = {
  SMART_WASH:  ["shampoo_wash", "interior_vacuum", "tyre_dressing"],
  ELITE_WASH:  ["shampoo_wash", "interior_vacuum", "tyre_dressing", "wax_polish", "dashboard_wipe"],
};

export const periodicWorker = new Worker(
  "periodic-service",
  async (job: Job) => {
    const { date, daysAhead = 2 } = job.data;
    const targetDate = date ?? new Date(Date.now() + daysAhead * 86400000).toISOString().split("T")[0];
    const activeSubs = await prisma.subscription.findMany({ where: { status: "ACTIVE", packageType: { in: ["SMART_WASH", "ELITE_WASH"] } } });
    let scheduled = 0;
    for (const sub of activeSubs) {
      const services = PERIODIC_PLANS[sub.packageType] ?? [];
      if (!services.length) continue;
      const customer = await prisma.customer.findUnique({ where: { id: sub.customerId } });
      if (!customer) continue;
      // Create periodic job if not already exists
      const existing = await prisma.job.findFirst({ where: { subscriptionId: sub.id, scheduledDate: targetDate, jobType: "ADD_ON" } });
      if (!existing) {
        await prisma.job.create({ data: { cityId: sub.cityId, customerId: sub.customerId, subscriptionId: sub.id, scheduledDate: targetDate, timeSlot: sub.preferredTimeSlot ?? "Morning (7am – 9am)", status: "UNASSIGNED", jobType: "ADD_ON", packageName: sub.packageName, vehicleCategory: sub.vehicleCategory, addOns: services, addressLine1: customer.addressLine1 ?? "", area: customer.area, pinCode: customer.pinCode } });
        scheduled++;
      }
    }
    console.log(`[PeriodicWorker] Scheduled ${scheduled} periodic jobs for ${targetDate}`);
    return { scheduled, date: targetDate };
  },
  { connection }
);
