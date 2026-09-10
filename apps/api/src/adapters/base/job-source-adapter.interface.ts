import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';

export interface NormalizedJob {
  externalId: string;
  sourceCode: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  description: string;
  requiredSkills: string[];
  minExperience?: number;
  maxExperience?: number;
  applyUrl: string;
  sourceUrl?: string;
  rawPayload?: Record<string, any>;
  postedAt?: Date;
}

export interface JobSourceAdapter {
  readonly sourceCode: string;
  readonly name: string;
  fetchJobs(options?: Record<string, any>): Promise<NormalizedJob[]>;
}
