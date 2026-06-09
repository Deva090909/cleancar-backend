import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { z } from "zod";

const createSchema = z.object({
  cityId:          z.string(),
  firstName:       z.string(),
  lastName:        z.string(),
  phone:           z.string(),
  email:           z.string().email().optional(),
  addressLine1:    z.string().default(""),
  addressLine2:    z.string().optional(),
  area:            z.string().default(""),
  pinCode:         z.string().default(""),
  vehicleCategory: z.string().optional(),
  vehicleBrand:    z.string().optional(),
  vehicleColor:    z.string().optional(),
  vehicleReg:      z.string().optional(),
  leadSource:      z.string().optional(),
  status:          z.string().optional(),
  tags:            z.array(z.string()).default([]),
  notes:           z.string().optional(),
  assignedTseId:   z.string().optional(),
});

type CustomerCreate = z.infer<typeof createSchema>;

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(cityId: string, search?: string, status?: string, page = 1, limit = 50) {
    const where: any = { cityId };
    if (status) where.status = status;
    if (search) where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName:  { contains: search, mode: "insensitive" } },
      { phone:     { contains: search } },
    ];
    const [total, items] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const c = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        subscriptions: { where: { status: "ACTIVE" } },
        complaints:    { take: 5, orderBy: { createdAt: "desc" } },
      },
    });
    if (!c) throw new NotFoundException(`Customer ${id} not found`);
    return c;
  }

  async create(dto: any) {
    const data: CustomerCreate = createSchema.parse(dto);
    return this.prisma.customer.create({ data: data as any });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto as any });
  }

  async getStats(cityId: string) {
    const [total, active, churned] = await Promise.all([
      this.prisma.customer.count({ where: { cityId } }),
      this.prisma.customer.count({ where: { cityId, status: "ACTIVE" } }),
      this.prisma.customer.count({ where: { cityId, status: "CHURNED" } }),
    ]);
    return { total, active, churned, conversionRate: total > 0 ? ((active / total) * 100).toFixed(1) : "0" };
  }
}
