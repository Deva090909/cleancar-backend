/**
 * incentive.worker.ts — BullMQ processor for the "incentives" queue
 * Runs nightly: auto-processes tranche payouts whose due dates have passed.
 */
import { Worker, Job } from "bullmq";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

const config = new ConfigService();
const redisUrl = config.get<string>("app.redisUrl") ?? "redis://localhost:6379";
const url = new URL(redisUrl);
const connection = { host: url.hostname, port: Number(url.port) || 6379, password: url.password || undefined };
const prisma = new PrismaClient();

export const incentiveWorker = new Worker(
  "incentives",
  async (job: Job) => {
    const today = new Date().toISOString().split("T")[0];
    const due = await prisma.incentiveTranche.findMany({
      where: { dueDate: { lte: today }, status: "PENDING" },
      include: { incentiveRecord: true },
    });
    let paid = 0, forfeited = 0;
    for (const t of due) {
      if (t.incentiveRecord.status === "CANCELLED") {
        await prisma.incentiveTranche.update({ where: { id: t.id }, data: { status: "FORFEITED", forfeitedReason: "CANCELLATION" } });
        await prisma.rolePayout.updateMany({ where: { trancheId: t.id }, data: { status: "FORFEITED" } });
        forfeited++;
      } else {
        await prisma.incentiveTranche.update({ where: { id: t.id }, data: { status: "PAID", paidDate: today } });
        await prisma.rolePayout.updateMany({ where: { trancheId: t.id, status: "PENDING" }, data: { status: "PAID", paidDate: today } });
        paid++;
      }
    }
    console.log(`[IncentiveWorker] Processed ${paid} paid, ${forfeited} forfeited`);
    return { paid, forfeited };
  },
  { connection }
);
