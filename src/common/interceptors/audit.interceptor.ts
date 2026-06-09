import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma.service';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!WRITE_METHODS.has(req.method) || !user) return next.handle();

    return next.handle().pipe(
      tap(async () => {
        try {
          await this.prisma.auditLog.create({
            data: {
              action: req.method === 'DELETE' ? 'DELETE' : req.method === 'POST' ? 'CREATE' : 'UPDATE',
              entity: req.url.split('/')[3] ?? 'unknown',
              actorId: user.id,
              actorName: user.fullName,
              actorRole: user.role,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              description: `${req.method} ${req.url}`,
            },
          });
        } catch { /* non-blocking */ }
      }),
    );
  }
}
