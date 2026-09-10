import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { SourceHealthStatus } from '@jobanalytica/shared-types';

@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  async getSourcesHealth() {
    let sources = await this.prisma.jobSource.findMany({
      include: {
        _count: {
          select: { postings: true },
        },
      },
    });

    if (sources.length === 0) {
      // Seed default sources
      await this.prisma.jobSource.createMany({
        data: [
          { code: 'greenhouse', name: 'Greenhouse ATS', baseUrl: 'https://boards-api.greenhouse.io' },
          { code: 'lever', name: 'Lever ATS', baseUrl: 'https://api.lever.co' },
          { code: 'ashby', name: 'Ashby ATS', baseUrl: 'https://api.ashbyhq.com' },
          { code: 'adzuna', name: 'Adzuna Aggregator', baseUrl: 'https://api.adzuna.com' },
        ],
      });

      sources = await this.prisma.jobSource.findMany({
        include: {
          _count: {
            select: { postings: true },
          },
        },
      });
    }

    return sources.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      healthStatus: s.healthStatus as SourceHealthStatus,
      lastPolledAt: s.lastPolledAt,
      lastError: s.lastError,
      consecutiveFailures: s.consecutiveFailures,
      activeJobsCount: s._count.postings,
    }));
  }

  async syncSource(code: string) {
    const source = await this.prisma.jobSource.findUnique({
      where: { code },
    });

    if (!source) throw new NotFoundException(`Source ${code} not found`);

    try {
      const result = await this.jobsService.syncAllSources();
      await this.prisma.jobSource.update({
        where: { code },
        data: {
          lastPolledAt: new Date(),
          healthStatus: 'HEALTHY',
          consecutiveFailures: 0,
        },
      });
      return { success: true, message: `Synced ${code}`, result };
    } catch (err: any) {
      await this.prisma.jobSource.update({
        where: { code },
        data: {
          lastPolledAt: new Date(),
          healthStatus: 'DEGRADED',
          lastError: err.message,
          consecutiveFailures: { increment: 1 },
        },
      });
      throw err;
    }
  }
}
