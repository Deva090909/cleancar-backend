import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(cityId: string, month: string) {
    const [mrr, revenues, payables, ledger] = await Promise.all([
      this.prisma.financeMRR.aggregate({ where: { cityId, month, status: "Active" }, _sum: { revenue: true }, _count: true }),
      this.prisma.financeRevenue.aggregate({ where: { cityId, month }, _sum: { amount: true }, _count: true }),
      this.prisma.financePayable.aggregate({ where: { cityId }, _sum: { amount: true } }),
      this.prisma.ledgerEntry.findMany({ where: { cityId, entryDate: { startsWith: month } }, take: 50, orderBy: { entryDate: "desc" } }),
    ]);
    const totalRevenue  = revenues._sum.amount ?? 0;
    const totalExpenses = payables._sum.amount ?? 0;
    const ebitda = totalRevenue - totalExpenses;
    return { month, cityId, mrr: { total: mrr._sum.revenue ?? 0, count: mrr._count }, revenue: { total: totalRevenue, count: revenues._count }, payables: { total: totalExpenses }, ebitda, ebitdaMargin: totalRevenue > 0 ? ((ebitda / totalRevenue) * 100).toFixed(1) : "0", recentLedger: ledger };
  }

  async getMRR(cityId: string, month: string) {
    return this.prisma.financeMRR.findMany({ where: { cityId, month }, include: { subscription: { select: { packageType: true, vehicleCategory: true } } } });
  }

  async getRevenues(cityId: string, month: string, page = 1, limit = 50) {
    const where = { cityId, month };
    const [total, items] = await Promise.all([
      this.prisma.financeRevenue.count({ where }),
      this.prisma.financeRevenue.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    ]);
    return { items, total, page };
  }

  async createRevenue(dto: any) { return this.prisma.financeRevenue.create({ data: dto }); }

  async getPayables(cityId: string, opts: any = {}) {
    const { type, status, page = 1, limit = 50 } = opts;
    const where: any = { cityId };
    if (type) where.type = type;
    if (status) where.paymentStatus = status;
    const [total, items] = await Promise.all([
      this.prisma.financePayable.count({ where }),
      this.prisma.financePayable.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    ]);
    return { items, total, page };
  }

  async createPayable(dto: any) { return this.prisma.financePayable.create({ data: dto }); }

  async updatePayable(id: string, dto: any) { return this.prisma.financePayable.update({ where: { id }, data: dto }); }

  async getLedger(cityId: string, opts: any = {}) {
    const { month, accountCode, page = 1, limit = 100 } = opts;
    const where: any = { cityId };
    if (month) where.entryDate = { startsWith: month };
    if (accountCode) where.accountCode = accountCode;
    const [total, items] = await Promise.all([
      this.prisma.ledgerEntry.count({ where }),
      this.prisma.ledgerEntry.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { entryDate: "desc" } }),
    ]);
    return { items, total, page };
  }

  async createLedgerEntry(dto: any) { return this.prisma.ledgerEntry.create({ data: dto }); }

  async getInvoices(opts: any = {}) {
    const { customerId, subscriptionId, status, page = 1, limit = 50 } = opts;
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (status) where.paymentStatus = status;
    const [total, items] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    ]);
    return { items, total, page };
  }

  async createInvoice(dto: any) {
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;
    return this.prisma.invoice.create({ data: { ...dto, invoiceNumber } });
  }

  async getBudget(cityId: string, month: string) {
    return this.prisma.budget.findUnique({ where: { cityId_month: { cityId, month } } });
  }

  async upsertBudget(dto: any) {
    return this.prisma.budget.upsert({
      where: { cityId_month: { cityId: dto.cityId, month: dto.month } },
      update: dto,
      create: dto,
    });
  }
}
