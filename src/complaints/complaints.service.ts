import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { ComplaintStatus } from '../common/types';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async findAll(cityId: string, opts: any = {}) {
    const { status, page = 1, limit = 50 } = opts;
    const where: any = { cityId };
    if (status) where.status = status;
    const [total, items] = await Promise.all([
      this.prisma.complaint.count({ where }),
      this.prisma.complaint.findMany({ where, skip: (page - 1) * limit, take: limit, include: { customer: { select: { firstName: true, lastName: true, phone: true } } }, orderBy: { createdAt: "desc" } }),
    ]);
    return { items, total, page };
  }

  async create(dto: any) { return this.prisma.complaint.create({ data: dto }); }

  async updateStatus(id: string, status: ComplaintStatus, notes?: string, resolvedBy?: string) {
    const data: any = { status };
    if (status === "RESOLVED") { data.resolvedAt = new Date(); data.resolvedBy = resolvedBy; data.resolutionNotes = notes; }
    if (status === "ESCALATED") data.escalatedAt = new Date();
    return this.prisma.complaint.update({ where: { id }, data });
  }

  async assign(id: string, assignedTo: string) {
    return this.prisma.complaint.update({ where: { id }, data: { assignedTo, status: "ASSIGNED" } });
  }

  async getStats(cityId: string) {
    const [open, resolved, escalated] = await Promise.all([
      this.prisma.complaint.count({ where: { cityId, status: { in: ["OPEN","ASSIGNED","IN_PROGRESS"] } } }),
      this.prisma.complaint.count({ where: { cityId, status: "RESOLVED" } }),
      this.prisma.complaint.count({ where: { cityId, status: "ESCALATED" } }),
    ]);
    return { cityId, open, resolved, escalated };
  }
}
