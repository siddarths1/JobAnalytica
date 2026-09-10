import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { ApplicationStatus } from '@jobanalytica/shared-types';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserApplications(userId: string, status?: ApplicationStatus) {
    return this.prisma.application.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      include: {
        job: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createApplication(userId: string, dto: CreateApplicationDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Job post not found');
    }

    const existing = await this.prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId: dto.jobId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('You have already added this job to your tracker');
    }

    return this.prisma.application.create({
      data: {
        userId,
        jobId: dto.jobId,
        status: dto.status || ApplicationStatus.SAVED,
        notes: dto.notes,
        resumeId: dto.resumeId,
        appliedAt: dto.status === ApplicationStatus.APPLIED ? new Date() : null,
      },
      include: {
        job: true,
      },
    });
  }

  async updateStatus(userId: string, id: string, dto: UpdateApplicationStatusDto) {
    const app = await this.prisma.application.findFirst({
      where: { id, userId },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.application.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes !== undefined ? dto.notes : app.notes,
        appliedAt: dto.status === ApplicationStatus.APPLIED && !app.appliedAt ? new Date() : app.appliedAt,
      },
      include: {
        job: true,
      },
    });
  }
}
