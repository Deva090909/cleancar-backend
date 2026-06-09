import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { EmployeesService } from "./employees.service";
import { createEmployeeSchema, updateEmployeeSchema, setPasswordSchema, listEmployeeSchema } from "./employees.dto";
import { ZodPipe } from "../common/pipes/zod.pipe";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { Role } from '../common/types';

@ApiTags("Employees")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("employees")
export class EmployeesController {
  constructor(private svc: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: "List employees with filters" })
  findAll(@Query(new ZodPipe(listEmployeeSchema)) query: any) {
    return this.svc.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR)
  create(@Body(new ZodPipe(createEmployeeSchema)) dto: any) { return this.svc.create(dto); }

  @Put(":id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR)
  update(@Param("id") id: string, @Body(new ZodPipe(updateEmployeeSchema)) dto: any) { return this.svc.update(id, dto); }

  @Patch(":id/set-password")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR)
  setPassword(@Param("id") id: string, @Body(new ZodPipe(setPasswordSchema)) dto: any) { return this.svc.setPassword(id, dto.password); }

  @Patch(":id/unlock")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  unlock(@Param("id") id: string) { return this.svc.unlock(id); }

  @Patch(":id/status")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR)
  status(@Param("id") id: string, @Body("status") status: string) { return this.svc.toggleStatus(id, status); }

  @Get("by-role/:role")
  getByRole(@Param("role") role: string, @Query("cityId") cityId?: string) { return this.svc.getByRole(role, cityId); }
}
