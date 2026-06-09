import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { FinanceService } from "./finance.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CityId } from "../common/decorators/city.decorator";

@ApiTags("Finance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("finance")
export class FinanceController {
  constructor(private svc: FinanceService) {}

  @Get("dashboard")
  dashboard(@CityId() cityId: string, @Query("month") month: string) {
    return this.svc.getDashboard(cityId, month ?? new Date().toISOString().slice(0, 7));
  }

  @Get("mrr") mrr(@CityId() cityId: string, @Query("month") month: string) { return this.svc.getMRR(cityId, month); }

  @Get("revenues") revenues(@CityId() cityId: string, @Query("month") month: string, @Query() opts: any) { return this.svc.getRevenues(cityId, month, Number(opts.page) || 1); }
  @Post("revenues") createRevenue(@Body() dto: any) { return this.svc.createRevenue(dto); }

  @Get("payables") payables(@CityId() cityId: string, @Query() opts: any) { return this.svc.getPayables(cityId, opts); }
  @Post("payables") createPayable(@Body() dto: any) { return this.svc.createPayable(dto); }
  @Put("payables/:id") updatePayable(@Param("id") id: string, @Body() dto: any) { return this.svc.updatePayable(id, dto); }

  @Get("ledger") ledger(@CityId() cityId: string, @Query() opts: any) { return this.svc.getLedger(cityId, opts); }
  @Post("ledger") createEntry(@Body() dto: any) { return this.svc.createLedgerEntry(dto); }

  @Get("invoices") invoices(@Query() opts: any) { return this.svc.getInvoices(opts); }
  @Post("invoices") createInvoice(@Body() dto: any) { return this.svc.createInvoice(dto); }

  @Get("budget") budget(@CityId() cityId: string, @Query("month") month: string) { return this.svc.getBudget(cityId, month); }
  @Post("budget") upsertBudget(@Body() dto: any) { return this.svc.upsertBudget(dto); }
}
