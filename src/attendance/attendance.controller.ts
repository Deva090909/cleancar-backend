import { Controller, Get, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AttendanceService } from "./attendance.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CityId } from "../common/decorators/city.decorator";

@ApiTags("Attendance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("attendance")
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  @Post("punch-in")
  punchIn(@CurrentUser() user: any, @Body() body: any) {
    return this.svc.punch(user.id, user.cityId, "IN", body.gps, body.notes);
  }

  @Post("punch-out")
  punchOut(@CurrentUser() user: any, @Body() body: any) {
    return this.svc.punch(user.id, user.cityId, "OUT", body.gps, body.notes);
  }

  @Post("mark")
  mark(@Body() dto: any) { return this.svc.mark(dto); }

  @Get("me/:month")
  myAttendance(@CurrentUser() user: any, @Param("month") month: string) {
    return this.svc.getForEmployee(user.id, month);
  }

  @Get("employee/:id/:month")
  employeeAttendance(@Param("id") id: string, @Param("month") month: string) {
    return this.svc.getForEmployee(id, month);
  }

  @Get("city")
  cityAttendance(@CityId() cityId: string, @Query("date") date: string) {
    return this.svc.getForCity(cityId, date ?? new Date().toISOString().split("T")[0]);
  }

  @Get("summary")
  summary(@CityId() cityId: string, @Query("date") date: string) {
    return this.svc.getSummary(cityId, date ?? new Date().toISOString().split("T")[0]);
  }
}
