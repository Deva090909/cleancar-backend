import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { LeadsService } from "./leads.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CityId } from "../common/decorators/city.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Leads")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("leads")
export class LeadsController {
  constructor(private svc: LeadsService) {}

  @Get()
  findAll(@CityId() cityId: string, @Query() query: any) { return this.svc.findAll(cityId, query); }

  @Get("pipeline")
  pipeline(@CityId() cityId: string, @Query("tseId") tseId?: string) { return this.svc.getPipelineCounts(cityId, tseId); }

  @Get("mine")
  mine(@CurrentUser() user: any, @CityId() cityId: string) { return this.svc.findAll(cityId, { assignedTseId: user.id }); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: any, @CityId() cityId: string) { return this.svc.create({ ...dto, cityId }); }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: any) { return this.svc.update(id, dto); }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update lead status" })
  updateStatus(@Param("id") id: string, @Body("status") status: any, @Body("notes") notes?: string) {
    return this.svc.updateStatus(id, status, notes);
  }

  @Post(":id/calls")
  addCall(@Param("id") leadId: string, @Body() dto: any) { return this.svc.addCallHistory(leadId, dto); }

  @Patch(":id/assign")
  assign(@Param("id") id: string, @Body("tseId") tseId: string) { return this.svc.assignToTse(id, tseId); }
}
