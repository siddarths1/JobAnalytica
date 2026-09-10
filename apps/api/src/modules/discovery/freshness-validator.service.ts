import { Injectable, Logger } from '@nestjs/common';
import { NormalizedJob } from '../../adapters/base/job-source-adapter.interface';

@Injectable()
export class FreshnessValidatorService {
  private readonly logger = new Logger(FreshnessValidatorService.name);

  async isJobFresh(job: NormalizedJob): Promise<boolean> {
    if (!job.applyUrl) return false;

    // Reject jobs older than 60 days if timestamp is available
    if (job.postedAt) {
      const ageInDays = (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays > 60) {
        return false;
      }
    }

    return true;
  }
}
