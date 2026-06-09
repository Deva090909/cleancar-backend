import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { CreateEmployeeDto, UpdateEmployeeDto, ListEmployeeDto } from "./employees.dto";
import * as bcrypt from "bcryptjs";
import { AccountStatus } from '../common/types';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ListEmployeeDto) {
    const { cityId, role, status, search, page, limit } = query;
    const where: any = {};
    if (cityId) where.cityId = cityId;
    if (role)   where.role = role;
    if (status) where.status = status;
    if (search) where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { mobile:   { contains: search } },
      { email:    { contains: search, mode: "insensitive" } },
      { designation: { contains: search, mode: "insensitive" } },
    ];

    const [total, items] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where, skip: (page - 1) * limit, take: limit,
        select: { id:true, fullName:true, designation:true, role:true, mobile:true, email:true, status:true, cityId:true, accountStatus:true, dateOfJoining:true, department:{ select:{ name:true } } },
        orderBy: { fullName: "asc" },
      }),
    ]);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: { city: true, department: true, salaryStructure: true, leaveBalance: true },
    });
    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    const { passwordHash, passwordResetOTP, tempPin, ...safe } = emp as any;
    return safe;
  }

  async create(dto: CreateEmployeeDto) {
    if (dto.loginMobile) {
      const existing = await this.prisma.employee.findUnique({ where: { loginMobile: dto.loginMobile } });
      if (existing) throw new ConflictException(`Mobile ${dto.loginMobile} already registered`);
    }
    const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
    if (!city) throw new NotFoundException(`City ${dto.cityId} not found`);

    return this.prisma.employee.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    return this.prisma.employee.update({ where: { id }, data: dto as any });
  }

  async setPassword(id: string, password: string) {
    const hash = await bcrypt.hash(password, 12);
    return this.prisma.employee.update({
      where: { id },
      data: { passwordHash: hash, accountStatus: AccountStatus.ACTIVE, onboardingPasswordSet: true, passwordChangedAt: new Date() },
    });
  }

  async unlock(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { accountStatus: AccountStatus.ACTIVE, failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  async toggleStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.employee.update({ where: { id }, data: { status: status as any } });
  }

  async getByRole(role: string, cityId?: string) {
    return this.prisma.employee.findMany({
      where: { role: role as any, ...(cityId ? { cityId } : {}), status: { in: ["ACTIVE", "ON_LEAVE"] } },
      select: { id: true, fullName: true, role: true, mobile: true, designation: true },
    });
  }
}
