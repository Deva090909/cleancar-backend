import { Controller, Post, Body, Req, Get, UseGuards, UsePipes, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "./auth.dto";
import { ZodPipe } from "../common/pipes/zod.pipe";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("Auth")
@UseGuards(JwtAuthGuard)
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with mobile + password — returns access & refresh tokens" })
  @UsePipes(new ZodPipe(loginSchema))
  login(@Body() dto: any, @Req() req: Request) {
    return this.authService.login(dto, req.ip, req.headers["user-agent"]);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate refresh token — returns new access & refresh tokens" })
  @UsePipes(new ZodPipe(refreshTokenSchema))
  refresh(@Body() dto: any) {
    return this.authService.refresh(dto);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  logout(@CurrentUser() user: any, @Body("refreshToken") rt?: string) {
    return this.authService.logout(user.id, rt);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated employee" })
  me(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodPipe(forgotPasswordSchema))
  forgotPassword(@Body() dto: any) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodPipe(resetPasswordSchema))
  resetPassword(@Body() dto: any) {
    return this.authService.resetPassword(dto);
  }

  @Post("change-password")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: any, @Body(new ZodPipe(changePasswordSchema)) dto: any) {
    return this.authService.changePassword(user.id, dto.oldPassword, dto.newPassword);
  }
}
