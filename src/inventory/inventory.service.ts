import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(cityId: string) { return this.prisma.inventoryItem.findMany({ where: { cityId, isActive: true } }); }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  async create(dto: any) { return this.prisma.inventoryItem.create({ data: dto }); }
  async update(id: string, dto: any) { return this.prisma.inventoryItem.update({ where: { id }, data: dto }); }

  async issue(itemId: string, to: string, quantity: number, performedBy: string) {
    const item = await this.findOne(itemId);
    if (item.centralStock < quantity) throw new BadRequestException("Insufficient central stock");
    const update: any = { centralStock: { decrement: quantity } };
    if (to === "SUPERVISOR") update.supervisorStock = { increment: quantity };
    if (to === "WASHER")     update.washerStock = { increment: quantity };
    await this.prisma.inventoryItem.update({ where: { id: itemId }, data: update });
    return this.prisma.stockTransaction.create({ data: { inventoryItemId: itemId, type: "TRANSFER", quantity, fromLocation: "CENTRAL", toLocation: to, performedBy } });
  }

  async receive(itemId: string, quantity: number, referenceId: string, performedBy: string) {
    await this.prisma.inventoryItem.update({ where: { id: itemId }, data: { centralStock: { increment: quantity } } });
    return this.prisma.stockTransaction.create({ data: { inventoryItemId: itemId, type: "IN", quantity, toLocation: "CENTRAL", referenceId, performedBy } });
  }

  async getLowStock(cityId: string) {
    const items = await this.prisma.inventoryItem.findMany({ where: { cityId } });
    return items.filter(i => i.centralStock <= i.reorderLevel);
  }

  async getTransactions(itemId: string) {
    return this.prisma.stockTransaction.findMany({ where: { inventoryItemId: itemId }, orderBy: { createdAt: "desc" }, take: 50 });
  }
}
