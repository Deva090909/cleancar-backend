import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { JobStatus } from '../common/types';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async findAll(cityId: string, opts: any = {}) {
    const { washerId, status, date, jobType, page = 1, limit = 100 } = opts;
    const where: any = { cityId };
    if (washerId) where.washerId = washerId;
    if (status) where.status = status;
    if (date) where.scheduledDate = date;
    if (jobType) where.jobType = jobType;
    const [total, items] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({ where, skip: (page - 1) * limit, take: limit, include: { washer: { select: { fullName: true, mobile: true } } }, orderBy: { scheduledDate: "desc" } }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const j = await this.prisma.job.findUnique({ where: { id }, include: { washer: true, customer: true, subscription: true } });
    if (!j) throw new NotFoundException(`Job ${id} not found`);
    return j;
  }

  async create(dto: any) { return this.prisma.job.create({ data: dto }); }

  async updateStatus(id: string, status: JobStatus, extras: any = {}) {
    const data: any = { status, ...extras };
    if (status === "IN_PROGRESS") data.startedAt = new Date();
    if (status === "COMPLETED")   data.completedAt = new Date();
    return this.prisma.job.update({ where: { id }, data });
  }

  async assign(id: string, washerId: string) {
    return this.prisma.job.update({ where: { id }, data: { washerId, status: "ASSIGNED" } });
  }

  async completeWithQA(id: string, dto: any) {
    return this.prisma.job.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date(), qualityScore: dto.qualityScore, verificationStatus: dto.verificationStatus ?? "pending", beforePhotoUrl: dto.beforePhotoUrl, afterPhotoUrl: dto.afterPhotoUrl } });
  }

  async updateWasherLocation(jobId: string, dto: { lat: number; lng: number; accuracy?: number; timestamp?: string }) {
    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        washerLat: dto.lat,
        washerLng: dto.lng,
        washerLocationUpdatedAt: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      },
    });
  }

  async getWasherLocation(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { washerLat: true, washerLng: true, washerLocationUpdatedAt: true, washerId: true, status: true },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    return job;
  }

  async getWasherDashboard(washerId: string, date: string) {
    const jobs = await this.prisma.job.findMany({ where: { washerId, scheduledDate: date }, orderBy: { timeSlot: "asc" } });
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === "COMPLETED").length;
    const inProgress = jobs.find(j => j.status === "IN_PROGRESS");
    return { date, total, completed, remaining: total - completed, inProgress, jobs };
  }
}

