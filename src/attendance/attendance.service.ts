import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AttendanceStatus } from '../common/types';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async punch(employeeId: string, cityId: string, type: "IN"|"OUT", gps?: any, notes?: string) {
    const today = new Date().toISOString().split("T")[0];
    const time  = new Date().toTimeString().slice(0, 8);
    const existing = await this.prisma.attendanceRecord.findUnique({ where: { employeeId_date: { employeeId, date: today } } });

    if (type === "IN") {
      if (existing?.checkInTime) throw new ConflictException("Already punched in today");
      const lateMinutes = this.calcLateMinutes(time);
      if (existing) return this.prisma.attendanceRecord.update({ where: { id: existing.id }, data: { checkInTime: time, gpsCheckIn: gps, lateMinutes, status: lateMinutes > 0 ? "LATE" : "PRESENT", flag: lateMinutes > 0 ? "LATE" : "NONE" } });
      return this.prisma.attendanceRecord.create({ data: { employeeId, cityId, date: today, checkInTime: time, gpsCheckIn: gps, lateMinutes, status: lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT, flag: lateMinutes > 0 ? "LATE" : "NONE" } });
    }

    // PUNCH OUT
    if (!existing?.checkInTime) throw new ConflictException("Not punched in yet");
    const checkIn = existing.checkInTime!;
    const [ih, im] = checkIn.split(":").map(Number);
    const [oh, om] = time.split(":").map(Number);
    const worked = Math.max(0, (oh * 60 + om) - (ih * 60 + im));
    return this.prisma.attendanceRecord.update({ where: { id: existing.id }, data: { checkOutTime: time, gpsCheckOut: gps, hoursWorked: worked / 60, workMinutes: worked, notes } });
  }

  async mark(dto: any) {
    return this.prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date: dto.date } },
      update: { status: dto.status, notes: dto.notes },
      create: { employeeId: dto.employeeId, cityId: dto.cityId, date: dto.date, status: dto.status, notes: dto.notes },
    });
  }

  async getForEmployee(employeeId: string, month: string) {
    const [year, mon] = month.split("-");
    const start = `${year}-${mon}-01`;
    const end   = new Date(Number(year), Number(mon), 0).toISOString().split("T")[0];
    const records = await this.prisma.attendanceRecord.findMany({ where: { employeeId, date: { gte: start, lte: end } }, orderBy: { date: "asc" } });
    const present = records.filter(r => r.status === "PRESENT").length;
    const late    = records.filter(r => r.status === "LATE").length;
    const absent  = records.filter(r => r.status === "ABSENT").length;
    const leave   = records.filter(r => r.status === "LEAVE").length;
    return { month, employeeId, records, summary: { present, late, absent, leave, total: records.length } };
  }

  async getForCity(cityId: string, date: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { cityId, date },
      include: { employee: { select: { fullName: true, designation: true, role: true } } },
      orderBy: { employee: { fullName: "asc" } },
    });
  }

  async getSummary(cityId: string, date: string) {
    const records = await this.prisma.attendanceRecord.findMany({ where: { cityId, date } });
    const empCount = await this.prisma.employee.count({ where: { cityId, status: "ACTIVE" } });
    const present  = records.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const absent   = empCount - present;
    return { date, cityId, total: empCount, present, absent, late: records.filter(r => r.status === "LATE").length, attendanceRate: empCount > 0 ? ((present / empCount) * 100).toFixed(1) : "0" };
  }

  private calcLateMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    const LATE_AFTER = 9 * 60 + 15; // 09:15
    const actual = h * 60 + m;
    return Math.max(0, actual - LATE_AFTER);
  }
}
