import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { IncentivesService } from "./incentives.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CityId } from "../common/decorators/city.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Incentives")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("incentives")
export class IncentivesController {
  constructor(private svc: IncentivesService) {}

  @Get()
  findAll(@CityId() cityId: string, @Query() opts: any) { return this.svc.findAll(cityId, opts); }

  @Get("me")
  mine(@CurrentUser() user: any) { return this.svc.getForEmployee(user.id, user.role); }

  @Get("employee/:id")
  forEmployee(@Param("id") id: string, @Query("role") role: string) { return this.svc.getForEmployee(id, role); }

  @Post()
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Post("process-due")
  processDue() { return this.svc.processOverdueTranches(); }

  @Patch(":id/cancel")
  cancel(@Param("id") id: string, @Body("cancelDate") date?: string) { return this.svc.cancelRecord(id, date); }
}
