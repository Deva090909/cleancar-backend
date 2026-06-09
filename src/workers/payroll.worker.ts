/**
 * payroll.worker.ts — BullMQ processor for the "payroll" queue
 * Handles bulk payroll computation triggered by HR admin.
 */
import { Worker, Job } from "bullmq";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

const config = new ConfigService();
const redisUrl = config.get<string>("app.redisUrl") ?? "redis://localhost:6379";
const url = new URL(redisUrl);
const connection = { host: url.hostname, port: Number(url.port) || 6379, password: url.password || undefined };
const prisma = new PrismaClient();

function calcStatutory(gross: number, stateCode: string) {
  const pf   = Math.round(Math.min(gross * 0.12, 1800));
  const esic = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  let pt = 0;
  if (stateCode === "GJ") { if (gross > 12000) pt = 200; else if (gross > 6000) pt = 150; }
  return { pf, esic, pt };
}

export const payrollWorker = new Worker(
  "payroll",
  async (job: Job) => {
    const { cityId, month, stateCode = "GJ" } = job.data;
    const [year, mon] = month.split("-").map(Number);
    const periodStart = `${month}-01`;
    const periodEnd   = new Date(year, mon, 0).toISOString().split("T")[0];
    const totalDays   = new Date(year, mon, 0).getDate();

    const employees = await prisma.employee.findMany({ where: { cityId, status: "ACTIVE" }, include: { salaryStructure: true } });
    let processed = 0, skipped = 0;

    for (const emp of employees) {
      if (!emp.salaryStructure) { skipped++; continue; }
      const s = emp.salaryStructure;
      const att = await prisma.attendanceRecord.findMany({ where: { employeeId: emp.id, date: { gte: periodStart, lte: periodEnd } } });
      const presentDays = att.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
      const leaveDays   = att.filter(a => a.status === "LEAVE").length;
      const daysWorked  = presentDays + leaveDays;
      const lateDays    = att.filter(a => a.status === "LATE").length;
      const baseSalary  = Math.round((s.basicSalary * daysWorked) / Math.max(1, totalDays));
      const allowances  = s.hra + s.conveyanceAllowance + s.medicalAllowance + s.specialAllowance;
      const grossSalary = baseSalary + allowances;
      const { pf, esic, pt } = calcStatutory(grossSalary, stateCode);
      const lateDeductions = lateDays * Math.round(s.basicSalary / (totalDays * 4));
      const totalDeductions = pf + esic + pt + lateDeductions;
      const netSalary = grossSalary - totalDeductions;

      await prisma.payrollRun.upsert({
        where: { employeeId_month: { employeeId: emp.id, month } },
        update: { baseSalary, allowances, grossSalary, pf, esic, pt, lateDeductions, totalDeductions, netSalary, daysWorked, presentDays, lateDays, totalDays, periodStart, periodEnd },
        create: { employeeId: emp.id, cityId, month, periodStart, periodEnd, stateCode, baseSalary, allowances, grossSalary, pf, esic, pt, lateDeductions, totalDeductions, netSalary, daysWorked, presentDays, lateDays, totalDays, status: "DRAFT" },
      });
      processed++;
    }
    console.log(`[PayrollWorker] ${month} ${cityId}: ${processed} computed, ${skipped} skipped`);
    return { processed, skipped };
  },
  { connection, limiter: { max: 1, duration: 5000 } }
);
