import { Injectable, Logger } from '@nestjs/common';
import { JobSourceAdapter, NormalizedJob } from '../base/job-source-adapter.interface';
import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';

@Injectable()
export class AshbyAdapter implements JobSourceAdapter {
  readonly sourceCode = 'ashby';
  readonly name = 'Ashby ATS';
  private readonly logger = new Logger(AshbyAdapter.name);

  async fetchJobs(options?: { organization?: string }): Promise<NormalizedJob[]> {
    const org = options?.organization || 'langflow';
    try {
      const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${org}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Ashby HTTP ${res.status}`);
      const data = await res.json();
      return (data.jobs || []).map((j: any) => ({
        externalId: `ashby-${org}-${j.id}`,
        sourceCode: this.sourceCode,
        title: j.title,
        company: org.toUpperCase(),
        location: j.location || 'Remote',
        workMode: WorkMode.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        description: j.descriptionPlain || j.title,
        requiredSkills: ['TypeScript', 'Python', 'AI/ML'],
        minExperience: 2,
        applyUrl: j.jobUrl,
        postedAt: new Date(j.publishedAt || Date.now()),
      }));
    } catch (err: any) {
      this.logger.warn(`Failed to fetch Ashby jobs for ${org}: ${err.message}`);
      return [];
    }
  }
}
