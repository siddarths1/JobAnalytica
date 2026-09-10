import { Injectable, Logger } from '@nestjs/common';
import { JobSourceAdapter, SourceInfo, NormalizedJob, JobSearchCriteria } from '../base/job-source-adapter.interface';
import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';

@Injectable()
export class LeverAdapter implements JobSourceAdapter {
  private readonly logger = new Logger(LeverAdapter.name);

  getSourceInfo(): SourceInfo {
    return {
      code: 'lever',
      name: 'Lever Public ATS',
      isApi: true,
      rateLimitPerMinute: 100,
    };
  }

  async search(criteria: JobSearchCriteria): Promise<NormalizedJob[]> {
    return [
      {
        externalId: 'lever-seed-01',
        sourceCode: 'lever',
        title: 'AI / Platform Engineer',
        company: 'Figma',
        location: 'Remote',
        workMode: WorkMode.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 3000000,
        maxSalary: 4800000,
        currency: 'INR',
        description: 'Join the platform team building AI-first features for collaborative design. Core stack: TypeScript, Rust, Python, AWS.',
        requiredSkills: ['TypeScript', 'Python', 'AWS', 'Docker', 'AI/ML'],
        minExperience: 2,
        applyUrl: 'https://jobs.lever.co/figma',
        postedAt: new Date(),
      }
    ];
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
