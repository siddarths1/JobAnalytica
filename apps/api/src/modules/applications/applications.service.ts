import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserApplications(userId: string) {
    const apps = await this.prisma.application.findMany({
      where: { userId },
      include: {
        job: true,
        events: {
          orderBy: { eventTime: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return apps.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job.title,
      company: app.job.company,
      location: app.job.location,
      applyUrl: app.job.primaryApplyUrl,
      resumeLabel: app.resumeLabel,
      status: app.status,
      appliedAt: app.appliedAt,
      notes: app.notes,
      salaryOffered: app.salaryOffered,
      interviewDate: app.interviewDate,
      updatedAt: app.updatedAt,
      events: app.events,
    }));
  }

  async createApplication(userId: string, dto: CreateApplicationDto) {
    return this.prisma.application.create({
      data: {
        userId,
        jobId: dto.jobId,
        resumeLabel: dto.resumeLabel || 'Primary Resume',
        status: dto.status || 'APPLIED',
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : new Date(),
        notes: dto.notes,
      },
    });
  }

  async updateApplication(userId: string, id: string, dto: UpdateApplicationDto) {
    const app = await this.prisma.application.findFirst({
      where: { id, userId },
    });

    if (!app) throw new NotFoundException('Application not found');

    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        status: dto.status ?? app.status,
        notes: dto.notes ?? app.notes,
        salaryOffered: dto.salaryOffered ?? app.salaryOffered,
        interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : app.interviewDate,
      },
    });

    if (dto.status && dto.status !== app.status) {
      await this.prisma.applicationEvent.create({
        data: {
          applicationId: app.id,
          fromStatus: app.status,
          toStatus: dto.status,
          note: dto.notes || `Status changed from ${app.status} to ${dto.status}`,
        },
      });
    }

    return updated;
  }
}
