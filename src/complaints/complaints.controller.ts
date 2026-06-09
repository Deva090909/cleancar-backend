import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ComplaintsService } from "./complaints.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CityId } from "../common/decorators/city.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Complaints")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("complaints")
export class ComplaintsController {
  constructor(private svc: ComplaintsService) {}

  @Get() findAll(@CityId() cityId: string, @Query() opts: any) { return this.svc.findAll(cityId, opts); }
  @Get("stats") stats(@CityId() cityId: string) { return this.svc.getStats(cityId); }
  @Post() create(@Body() dto: any, @CityId() cityId: string) { return this.svc.create({ ...dto, cityId }); }
  @Patch(":id/status") updateStatus(@Param("id") id: string, @Body("status") status: any, @Body("notes") notes?: string, @Body("resolvedBy") resolvedBy?: string) { return this.svc.updateStatus(id, status, notes, resolvedBy); }
  @Patch(":id/assign") assign(@Param("id") id: string, @Body("assignedTo") assignedTo: string) { return this.svc.assign(id, assignedTo); }
}
