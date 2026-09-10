import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';

export interface SourceInfo {
  code: string;
  name: string;
  isApi: boolean;
  rateLimitPerMinute: number;
}

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
  postedAt?: Date;
  rawPayload?: Record<string, unknown>;
}

export interface JobSearchCriteria {
  keywords?: string[];
  roles?: string[];
  locations?: string[];
  workModes?: WorkMode[];
  limit?: number;
  postedAfter?: Date;
}

export interface JobSourceAdapter {
  getSourceInfo(): SourceInfo;
  search(criteria: JobSearchCriteria): Promise<NormalizedJob[]>;
  getJob?(externalId: string): Promise<NormalizedJob | null>;
  healthCheck(): Promise<boolean>;
}
