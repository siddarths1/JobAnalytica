import { Injectable, Logger } from '@nestjs/common';
import { JobSourceAdapter, NormalizedJob } from '../base/job-source-adapter.interface';
import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';

@Injectable()
export class LeverAdapter implements JobSourceAdapter {
  readonly sourceCode = 'lever';
  readonly name = 'Lever ATS';
  private readonly logger = new Logger(LeverAdapter.name);

  async fetchJobs(options?: { site?: string }): Promise<NormalizedJob[]> {
    const site = options?.site || 'hasura';
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${site}?mode=json`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Lever HTTP ${res.status}`);
      const data = await res.json();
      return (data || []).map((j: any) => {
        const text = (j.text + ' ' + (j.descriptionPlain || '')).toLowerCase();
        const knownSkills = ['Node.js', 'React', 'Python', 'Go', 'TypeScript', 'Java', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'];
        const extracted = knownSkills.filter(s => text.includes(s.toLowerCase()));

        return {
          externalId: `lever-${site}-${j.id}`,
          sourceCode: this.sourceCode,
          title: j.text,
          company: site.toUpperCase(),
          location: j.categories?.location || 'India / Remote',
          workMode: text.includes('remote') ? WorkMode.REMOTE : (text.includes('hybrid') ? WorkMode.HYBRID : WorkMode.ONSITE),
          employmentType: EmploymentType.FULL_TIME,
          description: (j.descriptionPlain || j.text).slice(0, 3000),
          requiredSkills: extracted.length > 0 ? extracted : ['Engineering'],
          minExperience: text.includes('senior') ? 3 : 2,
          applyUrl: j.hostedUrl || j.applyUrl,
          postedAt: new Date(j.createdAt || Date.now()),
        };
      });
    } catch (err: any) {
      this.logger.warn(`Failed to fetch Lever jobs for ${site}: ${err.message}`);
      return [];
    }
  }
}
