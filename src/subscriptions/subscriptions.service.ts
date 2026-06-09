import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { SubscriptionStatus } from '../common/types';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(cityId: string, opts: any = {}) {
    const { customerId, status, packageType, tseId, page = 1, limit = 50 } = opts;
    const where: any = { cityId };
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (packageType) where.packageType = packageType;
    if (tseId) where.tseId = tseId;
    const [total, items] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({ where, skip: (page - 1) * limit, take: limit, include: { customer: { select: { firstName: true, lastName: true, phone: true } } }, orderBy: { createdAt: "desc" } }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const s = await this.prisma.subscription.findUnique({ where: { id }, include: { customer: true, jobs: { take: 5, orderBy: { scheduledDate: "desc" } } } });
    if (!s) throw new NotFoundException(`Subscription ${id} not found`);
    return s;
  }

  async create(dto: any) {
    const sub = await this.prisma.subscription.create({ data: { ...dto, priceLocked: dto.finalPrice ?? dto.basePrice } });
    // Auto-create MRR record
    const now = new Date();
    await this.prisma.financeMRR.create({ data: { cityId: sub.cityId, month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, subscriptionId: sub.id, customerId: sub.customerId, revenue: sub.priceLocked, status: "Active" } });
    return sub;
  }

  async updateStatus(id: string, status: SubscriptionStatus, reason?: string) {
    const data: any = { status };
    if (status === "CANCELLED") { data.cancelReason = reason; data.cancelledAt = new Date(); }
    return this.prisma.subscription.update({ where: { id }, data });
  }

  async pause(id: string, reason: string) {
    const sub = await this.findOne(id);
    const history = [...(sub.pauseHistory as any[]), { pausedAt: new Date().toISOString(), reason }];
    return this.prisma.subscription.update({ where: { id }, data: { status: "PAUSED", pauseHistory: history } });
  }

  async resume(id: string) {
    const sub = await this.findOne(id);
    const history = (sub.pauseHistory as any[]).map((p, i) =>
      i === (sub.pauseHistory as any[]).length - 1 ? { ...p, resumedAt: new Date().toISOString() } : p
    );
    return this.prisma.subscription.update({ where: { id }, data: { status: "ACTIVE", pauseHistory: history } });
  }

  async getActiveMRR(cityId: string, month: string) {
    const subs = await this.prisma.subscription.findMany({ where: { cityId, status: "ACTIVE" } });
    return { month, cityId, count: subs.length, totalMRR: subs.reduce((sum, s) => sum + s.priceLocked, 0) };
  }

  async getRenewalsDue(cityId: string, daysAhead = 7) {
    const cutoff = new Date(Date.now() + daysAhead * 86400000).toISOString().split("T")[0];
    return this.prisma.subscription.findMany({
      where: { cityId, status: "ACTIVE", renewalDate: { lte: cutoff } },
      include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
    });
  }
}
