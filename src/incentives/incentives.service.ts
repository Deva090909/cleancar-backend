import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { TrancheStatus } from '../common/types';

const POOL_BY_TERM: Record<number, number> = { 1: 50, 2: 100, 3: 150, 6: 300, 9: 450, 12: 600 };
const CHECK_MONTHS: Record<number, string[]> = { 1: ["M1"], 2: ["M1","M2"], 3: ["M1","M3"], 6: ["M1","M3","M6"], 9: ["M1","M3","M6","M9"], 12: ["M1","M3","M6","M9","M12"] };
const MONTH_OFFSET: Record<string, number> = { M1: 0, M2: 1, M3: 2, M6: 5, M9: 8, M12: 11 };
const POOL_SPLIT: Record<string, Record<string, number>> = {
  DIGITAL: { TSE: 20, SM: 10, SH: 5, TSM: 7.5 },
  BTL:     { SUPERVISOR: 15, TSE: 20, SH: 5, TSM: 7.5, SM: 10 },
};

function isZeroPool(planType: string, vehicleCategory: string) {
  return planType === "EXPRESS_WASH" && vehicleCategory.toLowerCase().includes("hatchback");
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

@Injectable()
export class IncentivesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    const pool = isZeroPool(dto.planType, dto.vehicleCategory) ? 0 : (POOL_BY_TERM[dto.term] ?? 0);
    const checkMonths = CHECK_MONTHS[dto.term] ?? ["M1"];
    const m1Amt = Math.round(pool * 0.30 * 100) / 100;
    const laterCount = checkMonths.length - 1;
    const laterAmt = laterCount > 0 ? Math.round(((pool - m1Amt) / laterCount) * 100) / 100 : 0;
    const split = POOL_SPLIT[dto.source] ?? {};
    const roleIds: Record<string, { id: string; name: string }> = {
      TSE: { id: dto.tseId, name: dto.tseName },
      TSM: { id: dto.tsmId, name: dto.tsmName },
      SM:  { id: dto.smId,  name: dto.smName },
      SH:  { id: dto.shId,  name: dto.shName },
      SUPERVISOR: { id: dto.supervisorId, name: dto.supervisorName },
    };

    const today = new Date().toISOString().split("T")[0];

    const record = await this.prisma.incentiveRecord.create({
      data: {
        subscriptionId: dto.subscriptionId, customerId: dto.customerId, customerName: dto.customerName,
        cityId: dto.cityId, planType: dto.planType, vehicleCategory: dto.vehicleCategory,
        monthlyAmount: dto.monthlyAmount, term: dto.term, source: dto.source,
        activationDate: dto.activationDate, poolTotal: pool, isZeroPool: pool === 0,
        tseId: dto.tseId, tseName: dto.tseName, smId: dto.smId, smName: dto.smName,
        shId: dto.shId, shName: dto.shName, tsmId: dto.tsmId, tsmName: dto.tsmName,
        supervisorId: dto.supervisorId, supervisorName: dto.supervisorName,
        tranches: {
          create: checkMonths.map((cm, i) => ({
            subscriptionId: dto.subscriptionId,
            checkMonth: cm,
            dueDate: addMonths(dto.activationDate, MONTH_OFFSET[cm]),
            poolAmount: pool === 0 ? 0 : (i === 0 ? m1Amt : laterAmt),
            status: "PENDING",
            rolePayouts: {
              create: Object.entries(split).filter(([role]) => roleIds[role]?.id).map(([role, pct]) => ({
                role, employeeId: roleIds[role].id, employeeName: roleIds[role].name,
                amount: Math.round((pool === 0 ? 0 : (i === 0 ? m1Amt : laterAmt)) * (pct as number) / 100 * 100) / 100,
                percentage: pct as number,
                status: addMonths(dto.activationDate, MONTH_OFFSET[cm]) <= today ? "PAID" : "PENDING",
              })),
            },
          })),
        },
      },
      include: { tranches: { include: { rolePayouts: true } } },
    });
    return record;
  }

  async getForEmployee(employeeId: string, role: string) {
    const payouts = await this.prisma.rolePayout.findMany({
      where: { employeeId, role },
      include: { tranche: { include: { incentiveRecord: true } } },
      orderBy: { tranche: { dueDate: "asc" } },
    });
    const totalPaid    = payouts.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
    const totalPending = payouts.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
    return { employeeId, role, totalPaid, totalPending, count: payouts.length, payouts };
  }

  async processOverdueTranches() {
    const today = new Date().toISOString().split("T")[0];
    const due = await this.prisma.incentiveTranche.findMany({
      where: { dueDate: { lte: today }, status: "PENDING" },
      include: { incentiveRecord: true },
    });
    let processed = 0;
    for (const t of due) {
      if (t.incentiveRecord.status === "CANCELLED") {
        await this.prisma.incentiveTranche.update({ where: { id: t.id }, data: { status: "FORFEITED", forfeitedReason: "CANCELLATION" } });
        await this.prisma.rolePayout.updateMany({ where: { trancheId: t.id, status: "PENDING" }, data: { status: "FORFEITED" } });
      } else {
        await this.prisma.incentiveTranche.update({ where: { id: t.id }, data: { status: "PAID", paidDate: today } });
        await this.prisma.rolePayout.updateMany({ where: { trancheId: t.id, status: "PENDING" }, data: { status: "PAID", paidDate: today } });
      }
      processed++;
    }
    return { processed };
  }

  async cancelRecord(id: string, cancelDate?: string) {
    const date = cancelDate ?? new Date().toISOString().split("T")[0];
    await this.prisma.incentiveRecord.update({ where: { id }, data: { status: "CANCELLED", cancelledDate: date } });
    await this.prisma.incentiveTranche.updateMany({ where: { incentiveRecordId: id, dueDate: { gt: date }, status: "PENDING" }, data: { status: "FORFEITED", forfeitedReason: "CANCELLATION" } });
    return { message: "Record cancelled and future tranches forfeited" };
  }

  async findAll(cityId: string, opts: any = {}) {
    const { tseId, tsmId, status, page = 1, limit = 50 } = opts;
    const where: any = { cityId };
    if (tseId) where.tseId = tseId;
    if (tsmId) where.tsmId = tsmId;
    if (status) where.status = status;
    const [total, items] = await Promise.all([
      this.prisma.incentiveRecord.count({ where }),
      this.prisma.incentiveRecord.findMany({ where, skip: (page - 1) * limit, take: limit, include: { tranches: { include: { rolePayouts: { where: { employeeId: tseId ?? tsmId ?? undefined } } } } }, orderBy: { createdAt: "desc" } }),
    ]);
    return { items, total, page };
  }
}
