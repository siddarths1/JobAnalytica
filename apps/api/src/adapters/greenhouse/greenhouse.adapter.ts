import { Injectable, Logger } from '@nestjs/common';
import { JobSourceAdapter, NormalizedJob } from '../base/job-source-adapter.interface';
import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';

@Injectable()
export class GreenhouseAdapter implements JobSourceAdapter {
  readonly sourceCode = 'greenhouse';
  readonly name = 'Greenhouse ATS';
  private readonly logger = new Logger(GreenhouseAdapter.name);

  async fetchJobs(options?: { boardToken?: string }): Promise<NormalizedJob[]> {
    const board = options?.boardToken || 'postman';
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Greenhouse HTTP ${res.status}`);
      const data = await res.json();
      return (data.jobs || []).map((j: any) => {
        const text = (j.title + ' ' + (j.content || '')).toLowerCase();
        const knownSkills = ['Node.js', 'React', 'Python', 'Go', 'TypeScript', 'Java', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'];
        const extracted = knownSkills.filter(s => text.includes(s.toLowerCase()));

        return {
          externalId: `gh-${board}-${j.id}`,
          sourceCode: this.sourceCode,
          title: j.title,
          company: board.toUpperCase(),
          location: j.location?.name || 'India / Remote',
          workMode: text.includes('remote') ? WorkMode.REMOTE : (text.includes('hybrid') ? WorkMode.HYBRID : WorkMode.ONSITE),
          employmentType: EmploymentType.FULL_TIME,
          description: (j.content || j.title).replace(/<[^>]*>/g, ' ').slice(0, 3000),
          requiredSkills: extracted.length > 0 ? extracted : ['Engineering'],
          minExperience: text.includes('senior') ? 3 : 2,
          applyUrl: j.absolute_url,
          postedAt: new Date(j.updated_at || Date.now()),
        };
      });
    } catch (err: any) {
      this.logger.warn(`Failed to fetch Greenhouse jobs for ${board}: ${err.message}`);
      return [];
    }
  }
}
