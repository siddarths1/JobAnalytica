import { Injectable, Logger } from '@nestjs/common';
import { JobSourceAdapter, SourceInfo, NormalizedJob, JobSearchCriteria } from '../base/job-source-adapter.interface';
import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';

@Injectable()
export class AshbyAdapter implements JobSourceAdapter {
  private readonly logger = new Logger(AshbyAdapter.name);

  getSourceInfo(): SourceInfo {
    return {
      code: 'ashby',
      name: 'Ashby Public ATS',
      isApi: true,
      rateLimitPerMinute: 80,
    };
  }

  async search(criteria: JobSearchCriteria): Promise<NormalizedJob[]> {
    return [
      {
        externalId: 'ashby-seed-01',
        sourceCode: 'ashby',
        title: 'Software Engineer - Core Services',
        company: 'Notion',
        location: 'Remote / Hybrid',
        workMode: WorkMode.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 3200000,
        maxSalary: 5000000,
        currency: 'INR',
        description: 'Build backend microservices for Notion collaborative workspace. TypeScript, Node.js, PostgreSQL, Redis.',
        requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
        minExperience: 2,
        applyUrl: 'https://jobs.ashbyhq.com/notion',
        postedAt: new Date(),
      }
    ];
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
