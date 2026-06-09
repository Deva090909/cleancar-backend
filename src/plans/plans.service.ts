import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getTiers() { return this.prisma.planTier.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }, { sortOrder: "asc" }] }); }
  async upsertTier(dto: any) { return this.prisma.planTier.upsert({ where: { name_vehicleCategory: { name: dto.name, vehicleCategory: dto.vehicleCategory } }, update: dto, create: dto }); }
  async getAddons() { return this.prisma.planAddon.findMany({ where: { isActive: true } }); }
  async upsertAddon(dto: any) {
    if (dto.id) return this.prisma.planAddon.update({ where: { id: dto.id }, data: dto });
    return this.prisma.planAddon.create({ data: dto });
  }
  async getPricingMatrix() {
    const tiers = await this.prisma.planTier.findMany({ where: { isActive: true } });
    const matrix: Record<string, any> = {};
    for (const t of tiers) {
      matrix[t.name] = matrix[t.name] ?? {};
      matrix[t.name][t.vehicleCategory] = t.baseMonthlyPrice;
    }
    return matrix;
  }
}
