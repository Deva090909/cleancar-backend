import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(config: ConfigService) {
    super({ jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"), secretOrKey: config.get("app.jwtRefreshSecret") });
  }
  validate(payload: { sub: string }) { return payload; }
}
