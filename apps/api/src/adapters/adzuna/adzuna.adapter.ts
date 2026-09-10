import { Injectable, Logger } from '@nestjs/common';
import { JobSourceAdapter, SourceInfo, NormalizedJob, JobSearchCriteria } from '../base/job-source-adapter.interface';
import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';

@Injectable()
export class AdzunaAdapter implements JobSourceAdapter {
  private readonly logger = new Logger(AdzunaAdapter.name);

  getSourceInfo(): SourceInfo {
    return {
      code: 'adzuna',
      name: 'Adzuna Global',
      isApi: true,
      rateLimitPerMinute: 60,
    };
  }

  async search(criteria: JobSearchCriteria): Promise<NormalizedJob[]> {
    return [
      {
        externalId: 'adzuna-seed-01',
        sourceCode: 'adzuna',
        title: 'Full Stack Engineer (React/Node.js)',
        company: 'CloudScale Technologies',
        location: 'Bengaluru, India',
        workMode: WorkMode.HYBRID,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 1800000,
        maxSalary: 2800000,
        currency: 'INR',
        description: 'Design and build enterprise cloud applications with TypeScript, Next.js, and NestJS.',
        requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
        minExperience: 3,
        applyUrl: 'https://adzuna.com/jobs/cloudscale-fullstack',
        postedAt: new Date(),
      }
    ];
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
