import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class GstService {
  constructor(private prisma: PrismaService) {}

  async getTransactions(cityId: string, year: number, month: string) {
    return this.prisma.gSTTransaction.findMany({ where: { cityId, year, month }, orderBy: { createdAt: "desc" } });
  }

  async create(dto: any) {
    const totalTax = (dto.cgst ?? 0) + (dto.sgst ?? 0) + (dto.igst ?? 0) + (dto.cess ?? 0);
    return this.prisma.gSTTransaction.create({ data: { ...dto, totalTax } });
  }

  async getGSTR1(cityId: string, year: number, month: string) {
    const txns = await this.prisma.gSTTransaction.findMany({ where: { cityId, year, month, type: { in: ["B2B","B2C"] } } });
    const b2b = txns.filter(t => t.type === "B2B");
    const b2c = txns.filter(t => t.type === "B2C");
    return {
      cityId, year, month,
      b2b: { count: b2b.length, taxable: b2b.reduce((s, t) => s + t.taxableAmount, 0), tax: b2b.reduce((s, t) => s + t.totalTax, 0), transactions: b2b },
      b2c: { count: b2c.length, taxable: b2c.reduce((s, t) => s + t.taxableAmount, 0), tax: b2c.reduce((s, t) => s + t.totalTax, 0), transactions: b2c },
    };
  }

  async getGSTR3B(cityId: string, year: number, month: string) {
    const [outward, inward] = await Promise.all([
      this.prisma.gSTTransaction.aggregate({ where: { cityId, year, month, isRCM: false }, _sum: { taxableAmount: true, cgst: true, sgst: true, igst: true, totalTax: true } }),
      this.prisma.gSTTransaction.aggregate({ where: { cityId, year, month, isRCM: true  }, _sum: { taxableAmount: true, cgst: true, sgst: true, igst: true, totalTax: true } }),
    ]);
    return {
      cityId, year, month,
      outwardSupplies: outward._sum,
      inwardSuppliesRCM: inward._sum,
      netTaxLiability: (outward._sum.totalTax ?? 0) - (inward._sum.totalTax ?? 0),
    };
  }
}
