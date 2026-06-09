import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: config.get("app.jwtSecret") });
  }

  async validate(payload: { sub: string; role: string; cityId: string; fullName: string }) {
    const emp = await this.prisma.employee.findUnique({ where: { id: payload.sub } });
    if (!emp || emp.accountStatus === "SUSPENDED") throw new UnauthorizedException();
    return { id: emp.id, role: emp.role, cityId: emp.cityId, fullName: emp.fullName };
  }
}
