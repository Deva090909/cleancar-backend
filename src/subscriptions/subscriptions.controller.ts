import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CityId } from "../common/decorators/city.decorator";

@ApiTags("Subscriptions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private svc: SubscriptionsService) {}

  @Get()
  findAll(@CityId() cityId: string, @Query() query: any) { return this.svc.findAll(cityId, query); }

  @Get("renewals-due")
  renewalsDue(@CityId() cityId: string, @Query("days") days?: number) { return this.svc.getRenewalsDue(cityId, Number(days) || 7); }

  @Get("mrr")
  mrr(@CityId() cityId: string, @Query("month") month: string) { return this.svc.getActiveMRR(cityId, month); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: any, @CityId() cityId: string) { return this.svc.create({ ...dto, cityId }); }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body("status") status: any, @Body("reason") reason?: string) {
    return this.svc.updateStatus(id, status, reason);
  }

  @Patch(":id/pause")
  pause(@Param("id") id: string, @Body("reason") reason: string) { return this.svc.pause(id, reason); }

  @Patch(":id/resume")
  resume(@Param("id") id: string) { return this.svc.resume(id); }
}
