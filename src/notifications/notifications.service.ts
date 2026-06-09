import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { Queue } from "bullmq";
import { QUEUE_TOKEN, NOTIFICATION_QUEUE } from "../common/queue.module";

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(QUEUE_TOKEN(NOTIFICATION_QUEUE)) private notifQueue: Queue,
  ) {}

  async getForEmployee(employeeId: string, page = 1, limit = 20) {
    const [total, items] = await Promise.all([
      this.prisma.notification.count({ where: { employeeId } }),
      this.prisma.notification.findMany({ where: { employeeId }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    ]);
    const unread = await this.prisma.notification.count({ where: { employeeId, isRead: false } });
    return { items, total, unread, page };
  }

  async markRead(id: string) { return this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } }); }

  async markAllRead(employeeId: string) {
    return this.prisma.notification.updateMany({ where: { employeeId, isRead: false }, data: { isRead: true, readAt: new Date() } });
  }

  async send(dto: { employeeId?: string; cityId?: string; type: string; channel: string; title: string; body: string; data?: any }) {
    const notif = await this.prisma.notification.create({ data: dto });
    await this.notifQueue.add("send", notif, { priority: dto.type === "ALERT" ? 1 : 5 });
    return notif;
  }

  async broadcast(cityId: string, title: string, body: string) {
    const employees = await this.prisma.employee.findMany({ where: { cityId, status: "ACTIVE" }, select: { id: true } });
    const notifications = employees.map(e => ({ employeeId: e.id, cityId, type: "INFO", channel: "IN_APP", title, body }));
    return this.prisma.notification.createMany({ data: notifications });
  }
}
