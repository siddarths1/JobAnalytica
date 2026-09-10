import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FreshnessValidatorService {
  private readonly logger = new Logger(FreshnessValidatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validatePostings(): Promise<{
    totalChecked: number;
    activeCount: number;
    deactivatedCount: number;
  }> {
    const jobs = await this.prisma.canonicalJob.findMany({
      where: { isActive: true },
      include: { sourcePostings: true },
    });

    let deactivated = 0;
    const now = Date.now();
    const MAX_AGE_DAYS = 45;

    for (const job of jobs) {
      const ageInDays = (now - new Date(job.firstSeenAt).getTime()) / (1000 * 60 * 60 * 24);

      // Stale check
      if (ageInDays > MAX_AGE_DAYS) {
        await this.prisma.canonicalJob.update({
          where: { id: job.id },
          data: { isActive: false },
        });
        deactivated++;
        continue;
      }

      // Quick liveness probe for real external URLs
      if (job.primaryApplyUrl && job.primaryApplyUrl.startsWith('http')) {
        try {
          const res = await fetch(job.primaryApplyUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(2500),
          });

          // 404 or 410 Gone indicates closed requisition
          if (res.status === 404 || res.status === 410) {
            await this.prisma.canonicalJob.update({
              where: { id: job.id },
              data: { isActive: false },
            });
            deactivated++;
          }
        } catch {
          // Network timeout / bot protection on HEAD is non-fatal
        }
      }
    }

    return {
      totalChecked: jobs.length,
      activeCount: jobs.length - deactivated,
      deactivatedCount: deactivated,
    };
  }
}
