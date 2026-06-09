import { Injectable, UnauthorizedException, BadRequestException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../common/prisma.service";
import { AccountStatus } from '../common/types';
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from "./auth.dto";

interface JwtPayload {
  sub: string;
  role: string;
  cityId: string;
  fullName: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const employee = await this.prisma.employee.findUnique({ where: { loginMobile: dto.loginMobile } });

    if (!employee) {
      throw new UnauthorizedException("Invalid mobile number or password");
    }

    // Check lockout
    if (employee.lockedUntil && employee.lockedUntil > new Date()) {
      const mins = Math.ceil((employee.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${mins} minutes.`);
    }

    // Check account status
    if (employee.accountStatus === AccountStatus.SUSPENDED) throw new UnauthorizedException("Account suspended");
    if (employee.accountStatus === AccountStatus.PENDING_ONBOARDING) throw new UnauthorizedException("Account pending onboarding. Contact HR.");
    if (employee.accountStatus === AccountStatus.PENDING_PASSWORD) throw new UnauthorizedException("Please complete onboarding and set your password.");

    // Verify password
    const isValid = employee.passwordHash && await bcrypt.compare(dto.password, employee.passwordHash);
    const MAX_ATTEMPTS = this.config.get<number>("app.maxLoginAttempts") ?? 5;
    const LOCKOUT_MINS = this.config.get<number>("app.lockoutMinutes") ?? 30;

    if (!isValid) {
      const attempts = employee.failedLoginAttempts + 1;
      const lockUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINS * 60000) : null;
      await this.prisma.employee.update({
        where: { id: employee.id },
        data: { failedLoginAttempts: attempts, lockedUntil: lockUntil ?? undefined, accountStatus: lockUntil ? AccountStatus.LOCKED : undefined },
      });
      const remaining = MAX_ATTEMPTS - attempts;
      throw new UnauthorizedException(remaining > 0 ? `Wrong password. ${remaining} attempts remaining.` : `Account locked for ${LOCKOUT_MINS} minutes.`);
    }

    // Success — reset attempts
    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date(), accountStatus: AccountStatus.ACTIVE },
    });

    const tokens = await this.generateTokens(employee);

    // Persist refresh token
    await this.prisma.refreshToken.create({
      data: {
        employeeId: employee.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        ipAddress: ip,
        userAgent,
      },
    });

    this.logger.log(`Login: ${employee.fullName} (${employee.role}) from ${ip}`);

    return { ...tokens, employee: this.sanitize(employee) };
  }

  // ── REFRESH ─────────────────────────────────────────────────────────────────
  async refresh(dto: RefreshTokenDto) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: dto.refreshToken }, include: { employee: true } });
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } });
    const tokens = await this.generateTokens(stored.employee);
    await this.prisma.refreshToken.create({
      data: { employeeId: stored.employee.id, token: tokens.refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
    });

    return { ...tokens, employee: this.sanitize(stored.employee) };
  }

  // ── LOGOUT ──────────────────────────────────────────────────────────────────
  async logout(employeeId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { isRevoked: true } });
    } else {
      await this.prisma.refreshToken.updateMany({ where: { employeeId, isRevoked: false }, data: { isRevoked: true } });
    }
    return { message: "Logged out successfully" };
  }

  // ── FORGOT PASSWORD ─────────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const employee = await this.prisma.employee.findFirst({ where: { loginMobile: dto.loginMobile } });
    if (!employee) return { message: "If this number is registered, an OTP has been sent." };

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + (this.config.get<number>("app.otpExpiryMinutes") ?? 10) * 60000);

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { passwordResetOTP: otp, passwordResetOTPExpiry: expiry },
    });

    // TODO: Send OTP via SMS gateway
    this.logger.log(`OTP for ${employee.loginMobile}: ${otp} (expires ${expiry.toISOString()})`);
    return { message: "OTP sent to registered mobile number." };
  }

  // ── RESET PASSWORD ──────────────────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const employee = await this.prisma.employee.findFirst({ where: { loginMobile: dto.loginMobile } });
    if (!employee) throw new BadRequestException("Invalid mobile number");
    if (!employee.passwordResetOTP || employee.passwordResetOTP !== dto.otp) throw new BadRequestException("Invalid OTP");
    if (!employee.passwordResetOTPExpiry || employee.passwordResetOTPExpiry < new Date()) throw new BadRequestException("OTP expired");

    const hash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { passwordHash: hash, passwordResetOTP: null, passwordResetOTPExpiry: null, accountStatus: AccountStatus.ACTIVE, onboardingPasswordSet: true, failedLoginAttempts: 0, lockedUntil: null, passwordChangedAt: new Date() },
    });
    return { message: "Password reset successfully. You can now log in." };
  }

  // ── CHANGE PASSWORD ─────────────────────────────────────────────────────────
  async changePassword(employeeId: string, oldPassword: string, newPassword: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee?.passwordHash) throw new UnauthorizedException();
    const isValid = await bcrypt.compare(oldPassword, employee.passwordHash);
    if (!isValid) throw new UnauthorizedException("Current password is incorrect");
    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.employee.update({ where: { id: employeeId }, data: { passwordHash: hash, passwordChangedAt: new Date() } });
    return { message: "Password changed successfully" };
  }

  // ── ME ───────────────────────────────────────────────────────────────────────
  async getMe(employeeId: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId }, include: { city: true, department: true } });
    if (!emp) throw new UnauthorizedException();
    return this.sanitize(emp);
  }

  // ── HELPERS ─────────────────────────────────────────────────────────────────
  private async generateTokens(employee: any) {
    const payload: JwtPayload = { sub: employee.id, role: employee.role, cityId: employee.cityId, fullName: employee.fullName };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { secret: this.config.get("app.jwtSecret"), expiresIn: this.config.get("app.jwtExpiresIn") ?? "15m" }),
      this.jwt.signAsync({ sub: employee.id }, { secret: this.config.get("app.jwtRefreshSecret"), expiresIn: this.config.get("app.jwtRefreshExpiresIn") ?? "7d" }),
    ]);
    return { accessToken, refreshToken };
  }

  private sanitize(emp: any) {
    const { passwordHash, passwordResetOTP, passwordResetOTPExpiry, tempPin, ...safe } = emp;
    return safe;
  }
}
