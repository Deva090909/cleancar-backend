import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PayrollService } from "./payroll.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { Role } from '../common/types';
import { CityId } from "../common/decorators/city.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Payroll")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("payroll")
export class PayrollController {
  constructor(private svc: PayrollService) {}

  @Get()
  findAll(@CityId() cityId: string, @Query("month") month: string, @Query() opts: any) {
    return this.svc.findAll(cityId, month, opts);
  }

  @Get("summary")
  summary(@CityId() cityId: string, @Query("month") month: string) {
    return this.svc.getMonthSummary(cityId, month);
  }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.svc.findOne(id); }

  @Post("compute")
  @Roles(Role.HR, Role.SUPER_ADMIN, Role.ADMIN)
  compute(@Body("employeeId") empId: string, @CityId() cityId: string, @Body("month") month: string, @Body("stateCode") sc?: string) {
    return this.svc.compute(empId, cityId, month, sc);
  }

  @Patch(":id/approve")
  @Roles(Role.HR, Role.SUPER_ADMIN, Role.ADMIN)
  approve(@Param("id") id: string, @CurrentUser() user: any) { return this.svc.approve(id, user.fullName); }

  @Patch(":id/mark-paid")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTS)
  markPaid(@Param("id") id: string, @Body("paymentRef") ref?: string) { return this.svc.markPaid(id, ref); }

  @Get("salary-structure/:employeeId")
  getSalary(@Param("employeeId") id: string) { return this.svc.getSalaryStructure(id); }

  @Post("salary-structure")
  @Roles(Role.HR, Role.SUPER_ADMIN, Role.ADMIN)
  upsertSalary(@Body() dto: any) { return this.svc.upsertSalaryStructure(dto); }
}
