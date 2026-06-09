import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { PayrollStatus } from '../common/types';

function calcStatutory(gross: number, stateCode: string) {
  const pf   = Math.round(Math.min(gross * 0.12, 1800));
  const esic = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  let pt = 0;
  if (stateCode === "GJ") { if (gross > 12000) pt = 200; else if (gross > 6000) pt = 150; }
  return { pf, esic, pt };
}

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async findAll(cityId: string, month: string, opts: any = {}) {
    const { status, page = 1, limit = 50 } = opts;
    const where: any = { cityId, month };
    if (status) where.status = status;
    const [total, items] = await Promise.all([
      this.prisma.payrollRun.count({ where }),
      this.prisma.payrollRun.findMany({ where, skip: (page - 1) * limit, take: limit, include: { employee: { select: { fullName: true, designation: true, role: true } } } }),
    ]);
    return { items, total, month, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const p = await this.prisma.payrollRun.findUnique({ where: { id }, include: { employee: true } });
    if (!p) throw new NotFoundException(`Payroll ${id} not found`);
    return p;
  }

  async compute(employeeId: string, cityId: string, month: string, stateCode = "GJ") {
    const [year, mon] = month.split("-").map(Number);
    const salary = await this.prisma.salaryStructure.findUnique({ where: { employeeId } });
    if (!salary) throw new BadRequestException(`No salary structure for ${employeeId}`);

    const [periodStart, periodEnd] = [`${month}-01`, new Date(year, mon, 0).toISOString().split("T")[0]];
    const totalDays = new Date(year, mon, 0).getDate();

    // Get attendance
    const att = await this.prisma.attendanceRecord.findMany({ where: { employeeId, date: { gte: periodStart, lte: periodEnd } } });
    const presentDays = att.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
    const leaveDays   = att.filter(a => a.status === "LEAVE").length;
    const daysWorked  = presentDays + leaveDays;
    const lateDays    = att.filter(a => a.status === "LATE").length;

    const baseSalary  = Math.round((salary.basicSalary * daysWorked) / Math.max(1, totalDays));
    const allowances  = salary.hra + salary.conveyanceAllowance + salary.medicalAllowance + salary.specialAllowance;
    const grossSalary = baseSalary + allowances;
    const { pf, esic, pt } = calcStatutory(grossSalary, stateCode);
    const lateDeductions = lateDays * Math.round(salary.basicSalary / (totalDays * 4));
    const totalDeductions = pf + esic + pt + lateDeductions;
    const netSalary = grossSalary - totalDeductions;

    const existing = await this.prisma.payrollRun.findUnique({ where: { employeeId_month: { employeeId, month } } });
    if (existing) {
      if (existing.status === "PAID" || existing.status === "LOCKED") throw new BadRequestException("Cannot recompute paid payroll");
      return this.prisma.payrollRun.update({ where: { id: existing.id }, data: { baseSalary, allowances, grossSalary, pf, esic, pt, lateDeductions, totalDeductions, netSalary, daysWorked, presentDays, lateDays, totalDays, periodStart, periodEnd, stateCode } });
    }
    return this.prisma.payrollRun.create({ data: { employeeId, cityId, month, periodStart, periodEnd, stateCode, baseSalary, allowances, grossSalary, pf, esic, pt, lateDeductions, totalDeductions, netSalary, daysWorked, presentDays, lateDays, totalDays, status: "DRAFT" } });
  }

  async approve(id: string, approvedBy: string) {
    const p = await this.findOne(id);
    if (p.status !== "PENDING_REVIEW") throw new BadRequestException("Only PENDING_REVIEW payroll can be approved");
    return this.prisma.payrollRun.update({ where: { id }, data: { status: "APPROVED", approvedBy, approvedAt: new Date() } });
  }

  async markPaid(id: string, paymentRef?: string) {
    return this.prisma.payrollRun.update({ where: { id }, data: { status: "PAID", paidAt: new Date(), paymentRef } });
  }

  async getSalaryStructure(employeeId: string) {
    const s = await this.prisma.salaryStructure.findUnique({ where: { employeeId } });
    if (!s) throw new NotFoundException("No salary structure");
    return s;
  }

  async upsertSalaryStructure(dto: any) {
    return this.prisma.salaryStructure.upsert({
      where: { employeeId: dto.employeeId },
      update: dto,
      create: dto,
    });
  }

  async getMonthSummary(cityId: string, month: string) {
    const runs = await this.prisma.payrollRun.findMany({ where: { cityId, month } });
    return {
      month, cityId,
      totalEmployees: runs.length,
      totalGross: runs.reduce((s, r) => s + r.grossSalary, 0),
      totalNet: runs.reduce((s, r) => s + r.netSalary, 0),
      totalPF: runs.reduce((s, r) => s + r.pf, 0),
      totalESIC: runs.reduce((s, r) => s + r.esic, 0),
      totalPT: runs.reduce((s, r) => s + r.pt, 0),
      byStatus: { DRAFT: runs.filter(r => r.status === "DRAFT").length, PENDING_REVIEW: runs.filter(r => r.status === "PENDING_REVIEW").length, APPROVED: runs.filter(r => r.status === "APPROVED").length, PAID: runs.filter(r => r.status === "PAID").length },
    };
  }
}
