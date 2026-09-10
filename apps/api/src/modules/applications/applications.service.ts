import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateApplicationDto, UpdateStatusDto } from './dto/application.dto';
import { ApplicationStatus } from '@jobanalytica/shared-types';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getApplications(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        job: true,
        events: { orderBy: { eventTime: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createApplication(userId: string, dto: CreateApplicationDto) {
    const status = (dto.status as ApplicationStatus) || ApplicationStatus.SAVED;
    const appliedAt = status === ApplicationStatus.APPLIED ? new Date() : undefined;

    const application = await this.prisma.application.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId: dto.jobId,
        },
      },
      create: {
        userId,
        jobId: dto.jobId,
        status,
        appliedAt,
        notes: dto.notes,
        events: {
          create: {
            toStatus: status,
            note: dto.notes || 'Initial application created',
          },
        },
      },
      update: {
        status,
        appliedAt: appliedAt || undefined,
        notes: dto.notes || undefined,
      },
      include: { job: true },
    });

    return application;
  }

  async updateStatus(userId: string, applicationId: string, dto: UpdateStatusDto) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!app || app.userId !== userId) {
      throw new NotFoundException('Application not found');
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: dto.status as ApplicationStatus,
        appliedAt: dto.status === ApplicationStatus.APPLIED && !app.appliedAt ? new Date() : app.appliedAt,
        events: {
          create: {
            fromStatus: app.status,
            toStatus: dto.status as ApplicationStatus,
            note: dto.note || `Status transitioned to ${dto.status}`,
          },
        },
      },
      include: { job: true },
    });

    return updated;
  }

  async deleteApplication(userId: string, applicationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!app || app.userId !== userId) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.application.delete({
      where: { id: applicationId },
    });
  }
}
