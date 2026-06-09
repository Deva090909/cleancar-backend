import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CityId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest();
  return req.headers['x-city-id'] ?? req.user?.cityId ?? 'CITY-SURAT';
});
