import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JobsService } from "./jobs.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CityId } from "../common/decorators/city.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Jobs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("jobs")
export class JobsController {
  constructor(private svc: JobsService) {}

  @Get()
  findAll(@CityId() cityId: string, @Query() query: any) { return this.svc.findAll(cityId, query); }

  @Get("washer/today")
  washerToday(@CurrentUser() user: any) {
    return this.svc.getWasherDashboard(user.id, new Date().toISOString().split("T")[0]);
  }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: any, @CityId() cityId: string) { return this.svc.create({ ...dto, cityId }); }

  @Patch(":id/assign")
  assign(@Param("id") id: string, @Body("washerId") washerId: string) { return this.svc.assign(id, washerId); }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body("status") status: any, @Body() extras: any) { return this.svc.updateStatus(id, status, extras); }

  @Patch(":id/complete")
  complete(@Param(":id") id: string, @Body() dto: any) { return this.svc.completeWithQA(id, dto); }

  @Patch(":id/location")
  updateLocation(@Param(":id") id: string, @Body() dto: any) { return this.svc.updateWasherLocation(id, dto); }

  @Get(":id/location")
  getLocation(@Param(":id") id: string) { return this.svc.getWasherLocation(id); }
}

