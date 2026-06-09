import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PlansService } from "./plans.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { Body } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("Plans")
@UseGuards(JwtAuthGuard)
@Controller("plans")
export class PlansController {
  constructor(private svc: PlansService) {}

  @Public()
  @Get("tiers") getTiers() { return this.svc.getTiers(); }

  @Public()
  @Get("matrix") matrix() { return this.svc.getPricingMatrix(); }

  @ApiBearerAuth()
  @Post("tiers") upsertTier(@Body() dto: any) { return this.svc.upsertTier(dto); }

  @Public()
  @Get("addons") getAddons() { return this.svc.getAddons(); }

  @ApiBearerAuth()
  @Post("addons") upsertAddon(@Body() dto: any) { return this.svc.upsertAddon(dto); }
}
