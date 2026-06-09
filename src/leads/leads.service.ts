import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
// LeadStatus and LeadSource used as strings

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(cityId: string, opts: any = {}) {
    const { status, assignedTseId, source, search, page = 1, limit = 50 } = opts;
    const where: any = { cityId };
    if (status) where.status = status;
    if (assignedTseId) where.assignedTseId = assignedTseId;
    if (source) where.leadSource = source;
    if (search) where.OR = [{ firstName: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }];
    const [total, items] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ priority: "asc" }, { createdAt: "asc" }] }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const l = await this.prisma.lead.findUnique({ where: { id }, include: { callHistory: { orderBy: { calledAt: "desc" }, take: 10 }, activities: { orderBy: { createdAt: "desc" }, take: 10 } } });
    if (!l) throw new NotFoundException(`Lead ${id} not found`);
    return l;
  }

  async create(dto: any) {
    return this.prisma.lead.create({ data: dto });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.lead.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, status: string, notes?: string) {
    const lead = await this.findOne(id);
    const data: any = { status, updatedAt: new Date() };
    if (status === "CONVERTED") data.convertedAt = new Date();
    if (notes) {
      await this.prisma.leadActivity.create({ data: { leadId: id, type: "STATUS_CHANGE", notes, outcome: status } });
    }
    return this.prisma.lead.update({ where: { id }, data });
  }

  async addCallHistory(leadId: string, dto: any) {
    await this.update(leadId, { attemptCount: { increment: 1 }, lastContactAt: new Date() });
    return this.prisma.callHistory.create({ data: { leadId, ...dto } });
  }

  async assignToTse(leadId: string, tseId: string) {
    return this.prisma.lead.update({ where: { id: leadId }, data: { assignedTseId: tseId } });
  }

  async getPipelineCounts(cityId: string, tseId?: string) {
    const base: any = { cityId };
    if (tseId) base.assignedTseId = tseId;
    const statuses: string[] = ["NEW","ATTEMPTED","CALLBACK","INTERESTED","NOT_ANSWERED","CONVERTED","LOST"];
    const counts = await Promise.all(statuses.map(s => this.prisma.lead.count({ where: { ...base, status: s } })));
    return Object.fromEntries(statuses.map((s, i) => [s, counts[i]]));
  }
}
