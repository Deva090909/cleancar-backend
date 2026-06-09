import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get("mine")
  mine(@CurrentUser() user: any, @Query("page") page?: number) {
    return this.svc.getForEmployee(user.id, Number(page) || 1);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string) { return this.svc.markRead(id); }

  @Patch("mark-all-read")
  markAllRead(@CurrentUser() user: any) { return this.svc.markAllRead(user.id); }

  @Post("send")
  send(@Body() dto: any) { return this.svc.send(dto); }

  @Post("broadcast")
  broadcast(@Body("cityId") cityId: string, @Body("title") title: string, @Body("body") body: string) {
    return this.svc.broadcast(cityId, title, body);
  }
}
