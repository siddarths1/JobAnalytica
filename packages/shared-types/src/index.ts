export enum CompanyTier {
  ALL = 'ALL',
  STARTUP_EARLY_STAGE = 'STARTUP_EARLY_STAGE', // Early-Stage / Seed / Series A
  TIER_2_MID_CAP = 'TIER_2_MID_CAP',           // Mid-Cap / Growth SaaS / Scaleups
  TIER_3_SERVICES = 'TIER_3_SERVICES',         // IT & Product Engineering Services
  TIER_1_LARGE_CAP = 'TIER_1_LARGE_CAP',       // Large-Cap / Top Unicorns / Big Tech
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum WorkMode {
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  ONSITE = 'ONSITE'
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP'
}

export enum ApplicationStatus {
  SAVED = 'SAVED',
  APPLIED = 'APPLIED',
  ASSESSMENT = 'ASSESSMENT',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum MatchRecommendation {
  APPLY_HIGH_PRIORITY = 'APPLY_HIGH_PRIORITY',
  WORTH_APPLYING = 'WORTH_APPLYING',
  POSSIBLE_MATCH = 'POSSIBLE_MATCH',
  NOT_RECOMMENDED = 'NOT_RECOMMENDED'
}

export enum SourceHealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN'
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponseDto {
  user: UserDto;
  accessToken: string;
}

export interface CandidateProfileDto {
  id: string;
  userId: string;
  resumeId?: string | null;
  label: string;
  totalExperience: number;
  headline?: string | null;
  summary?: string | null;
  targetRoles: string[];
  skills: string[];
  primaryLanguages: string[];
  frameworks: string[];
  domains: string[];
  education?: Array<{ degree: string; institution: string; year?: string }> | null;
  workHistory?: Array<{ company: string; role: string; duration?: string; highlights?: string[] }> | null;
  isPrimary: boolean;
  resumeFileName?: string | null;
  updatedAt: string;
}

export interface UserPreferenceDto {
  id: string;
  userId: string;
  targetRoles: string[];
  locations: string[];
  workModes: WorkMode[];
  minSalary?: number | null;
  maxSalary?: number | null;
  currency: string;
  minExperience: number;
  maxExperience?: number | null;
  preferredCompanies: string[];
  excludedCompanies: string[];
  enableDailyDigest: boolean;
  digestTime: string;
}

export interface AlternateProfileScore {
  profileLabel: string;
  priorityScore: number;
  skillScore: number;
}

export interface JobMatchDto {
  id: string;
  jobId: string;
  profileId?: string | null;
  matchedProfileLabel: string;
  title: string;
  company: string;
  location: string;
  companyTier?: string;
  companyScale?: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string | null;
  description: string;
  requiredSkills: string[];
  applyUrl: string;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  roleScore: number;
  locationScore: number;
  applicationPriority: number;
  recommendation: MatchRecommendation;
  whyApply: string[];
  risksAndGaps: string[];
  verdictReason: string;
  alternateProfiles?: AlternateProfileScore[];
  isViewed: boolean;
  isIgnored: boolean;
  firstSeenAt: string;
  sourcePostings?: Array<{ sourceCode: string; applyUrl: string }>;
}

export interface ApplicationDto {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  applyUrl: string;
  resumeLabel?: string | null;
  status: ApplicationStatus;
  appliedAt?: string | null;
  notes?: string | null;
  salaryOffered?: number | null;
  interviewDate?: string | null;
  overallScore?: number | null;
  applicationPriority?: number | null;
  updatedAt: string;
}

export interface SourceHealthDto {
  id: string;
  code: string;
  name: string;
  healthStatus: SourceHealthStatus;
  lastPolledAt?: string | null;
  lastError?: string | null;
  consecutiveFailures: number;
  activeJobsCount: number;
}
