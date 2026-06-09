import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { GstService } from "./gst.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CityId } from "../common/decorators/city.decorator";

@ApiTags("GST")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("gst")
export class GstController {
  constructor(private svc: GstService) {}

  @Get("transactions")
  transactions(@CityId() cityId: string, @Query("year") year: number, @Query("month") month: string) {
    return this.svc.getTransactions(cityId, Number(year), month);
  }

  @Post("transactions")
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Get("gstr1")
  gstr1(@CityId() cityId: string, @Query("year") year: number, @Query("month") month: string) {
    return this.svc.getGSTR1(cityId, Number(year), month);
  }

  @Get("gstr3b")
  gstr3b(@CityId() cityId: string, @Query("year") year: number, @Query("month") month: string) {
    return this.svc.getGSTR3B(cityId, Number(year), month);
  }
}
