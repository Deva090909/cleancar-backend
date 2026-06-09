import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { InventoryService } from "./inventory.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CityId } from "../common/decorators/city.decorator";

@ApiTags("Inventory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("inventory")
export class InventoryController {
  constructor(private svc: InventoryService) {}

  @Get() findAll(@CityId() cityId: string) { return this.svc.findAll(cityId); }
  @Get("low-stock") lowStock(@CityId() cityId: string) { return this.svc.getLowStock(cityId); }
  @Get(":id") findOne(@Param("id") id: string) { return this.svc.findOne(id); }
  @Get(":id/transactions") transactions(@Param("id") id: string) { return this.svc.getTransactions(id); }
  @Post() create(@Body() dto: any, @CityId() cityId: string) { return this.svc.create({ ...dto, cityId }); }
  @Put(":id") update(@Param("id") id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Patch(":id/issue") issue(@Param("id") id: string, @Body() dto: any) { return this.svc.issue(id, dto.to, dto.quantity, dto.performedBy); }
  @Patch(":id/receive") receive(@Param("id") id: string, @Body() dto: any) { return this.svc.receive(id, dto.quantity, dto.referenceId, dto.performedBy); }
}
