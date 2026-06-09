import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CityId } from "../common/decorators/city.decorator";

@ApiTags("Customers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("customers")
export class CustomersController {
  constructor(private svc: CustomersService) {}

  @Get()
  findAll(@CityId() cityId: string, @Query("search") search?: string, @Query("status") status?: string, @Query("page") page?: number, @Query("limit") limit?: number) {
    return this.svc.findAll(cityId, search, status, Number(page) || 1, Number(limit) || 50);
  }

  @Get("stats")
  stats(@CityId() cityId: string) { return this.svc.getStats(cityId); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: any) { return this.svc.update(id, dto); }
}
