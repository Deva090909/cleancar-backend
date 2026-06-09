import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { CustomersModule } from './customers/customers.module';
import { LeadsModule } from './leads/leads.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { JobsModule } from './jobs/jobs.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PayrollModule } from './payroll/payroll.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { IncentivesModule } from './incentives/incentives.module';
import { GstModule } from './gst/gst.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { PlansModule } from './plans/plans.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QueueModule } from './common/queue.module';
import appConfig from './common/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    PrismaModule,
    QueueModule,
    AuthModule,
    EmployeesModule,
    CustomersModule,
    LeadsModule,
    SubscriptionsModule,
    JobsModule,
    AttendanceModule,
    PayrollModule,
    FinanceModule,
    InventoryModule,
    IncentivesModule,
    GstModule,
    ComplaintsModule,
    PlansModule,
    NotificationsModule,
  ],
})
export class AppModule {}
