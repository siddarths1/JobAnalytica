import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NormalizedJob } from '../../adapters/base/job-source-adapter.interface';
import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';
import { AdzunaAdapter } from '../../adapters/adzuna/adzuna.adapter';
import { GreenhouseAdapter } from '../../adapters/greenhouse/greenhouse.adapter';
import { LeverAdapter } from '../../adapters/lever/lever.adapter';
import { AshbyAdapter } from '../../adapters/ashby/ashby.adapter';
import * as crypto from 'crypto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adzunaAdapter: AdzunaAdapter,
    private readonly greenhouseAdapter: GreenhouseAdapter,
    private readonly leverAdapter: LeverAdapter,
    private readonly ashbyAdapter: AshbyAdapter,
  ) {}

  classifyCompanyTier(companyName: string, description: string = ''): { tier: string; scale: string } {
    const c = companyName.toLowerCase();
    const d = description.toLowerCase();

    // Tier 1 / Large Cap Enterprise Tech & Elite Unicorns
    const tier1Keywords = [
      'google', 'microsoft', 'amazon', 'apple', 'meta', 'notion', 'figma', 'stripe',
      'uber', 'atlassian', 'salesforce', 'razorpay', 'airbnb', 'netflix', 'openai', 'anthropic'
    ];
    if (tier1Keywords.some(k => c.includes(k))) {
      return { tier: 'TIER_1_LARGE_CAP', scale: 'ENTERPRISE' };
    }

    // Tier 3 IT & Product Engineering Services
    const tier3Keywords = [
      'thoughtworks', 'persistent', 'lti', 'mindtree', 'coforge', 'nagarro', 'happiest minds',
      'kellton', 'infosys', 'tcs', 'wipro', 'hcl', 'cognizant', 'accenture', 'capgemini', 'services', 'consulting'
    ];
    if (tier3Keywords.some(k => c.includes(k)) || d.includes('client project') || d.includes('consulting services')) {
      return { tier: 'TIER_3_SERVICES', scale: 'SERVICES' };
    }

    // Early Stage Startups / Seed / Series A
    const startupKeywords = [
      'seed', 'series a', 'stealth', 'early stage', 'founding engineer', 'yc ', 'y combinator',
      'langflow', 'cursor', 'devrev', 'kula', 'resend', 'midday', 'hyperverge', 'supabase', 'vercel'
    ];
    if (startupKeywords.some(k => c.includes(k) || d.includes(k))) {
      return { tier: 'STARTUP_EARLY_STAGE', scale: 'STARTUP' };
    }

    // Tier 2 / Mid Cap Growth Scaleups (Default tech product companies)
    return { tier: 'TIER_2_MID_CAP', scale: 'MID_MARKET' };
  }

  async ingestJob(job: NormalizedJob): Promise<void> {
    const normCompany = job.company.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const normTitle = job.title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const normLocation = job.location.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    const canonicalHash = crypto
      .createHash('sha256')
      .update(`${normCompany}:${normTitle}:${normLocation}`)
      .digest('hex');

    let source = await this.prisma.jobSource.findUnique({
      where: { code: job.sourceCode },
    });

    if (!source) {
      source = await this.prisma.jobSource.create({
        data: {
          code: job.sourceCode,
          name: job.sourceCode.toUpperCase(),
        },
      });
    }

    const { tier, scale } = this.classifyCompanyTier(job.company, job.description);

    const canonicalJob = await this.prisma.canonicalJob.upsert({
      where: { canonicalHash },
      create: {
        canonicalHash,
        title: job.title,
        company: job.company,
        companyTier: tier,
        companyScale: scale,
        normalizedTitle: normTitle,
        normalizedCompany: normCompany,
        location: job.location,
        normalizedLocation: normLocation,
        workMode: job.workMode,
        employmentType: job.employmentType,
        minSalary: job.minSalary,
        maxSalary: job.maxSalary,
        currency: job.currency,
        description: job.description,
        requiredSkills: JSON.stringify(job.requiredSkills || []),
        minExperience: job.minExperience,
        maxExperience: job.maxExperience,
        primaryApplyUrl: job.applyUrl,
        firstSeenAt: job.postedAt || new Date(),
        lastSeenAt: new Date(),
      },
      update: {
        lastSeenAt: new Date(),
        primaryApplyUrl: job.applyUrl,
        companyTier: tier,
        companyScale: scale,
      },
    });

    const existingPosting = await this.prisma.jobSourcePosting.findUnique({
      where: {
        sourceId_externalJobId: {
          sourceId: source.id,
          externalJobId: job.externalId,
        },
      },
    });

    if (!existingPosting) {
      await this.prisma.jobSourcePosting.create({
        data: {
          canonicalJobId: canonicalJob.id,
          sourceId: source.id,
          externalJobId: job.externalId,
          applyUrl: job.applyUrl,
          sourceUrl: job.sourceUrl,
          rawPayload: JSON.stringify(job.rawPayload || {}),
          postedAt: job.postedAt,
        },
      });
    }
  }

  async syncAllSources(): Promise<{ totalIngested: number }> {
    const multiTierCatalog: NormalizedJob[] = [
      // 1. EARLY-STAGE STARTUPS & SEED/SERIES-A
      {
        externalId: 'startup-langflow-01',
        sourceCode: 'ashby',
        title: 'Founding AI Systems Engineer',
        company: 'Langflow (Seed Stage)',
        location: 'Remote',
        workMode: WorkMode.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 2400000,
        maxSalary: 4200000,
        currency: 'INR',
        description: 'Join our early-stage founding team building open-source visual AI pipeline builders. Work on Python, PyTorch, LangChain, FastAPI, and Next.js.',
        requiredSkills: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'AI/ML', 'Docker'],
        minExperience: 2,
        maxExperience: 5,
        applyUrl: 'https://langflow.org/careers/founding-engineer',
        postedAt: new Date(),
      },
      {
        externalId: 'startup-cursor-02',
        sourceCode: 'ashby',
        title: 'Full Stack Infrastructure Engineer',
        company: 'Cursor AI (Series A)',
        location: 'Remote',
        workMode: WorkMode.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 2800000,
        maxSalary: 4800000,
        currency: 'INR',
        description: 'Building AI-first developer tooling. Scale low-latency distributed code intelligence engines using TypeScript, Rust, Node.js, and Kubernetes.',
        requiredSkills: ['TypeScript', 'Node.js', 'Rust', 'Kubernetes', 'Docker', 'AWS'],
        minExperience: 2,
        maxExperience: 6,
        applyUrl: 'https://cursor.com/careers',
        postedAt: new Date(),
      },
      {
        externalId: 'startup-devrev-03',
        sourceCode: 'greenhouse',
        title: 'Backend Platform Engineer',
        company: 'DevRev (Series A)',
        location: 'Bengaluru / Hybrid',
        workMode: WorkMode.HYBRID,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 2000000,
        maxSalary: 3500000,
        currency: 'INR',
        description: 'Build real-time search and AI-native customer relationship platform using Go, Python, PostgreSQL, and GraphQL.',
        requiredSkills: ['Go', 'Python', 'PostgreSQL', 'GraphQL', 'Microservices', 'Kubernetes'],
        minExperience: 2,
        maxExperience: 5,
        applyUrl: 'https://devrev.ai/careers',
        postedAt: new Date(),
      },

      // 2. MID-CAP & TIER-2 GROWTH SCALEUPS
      {
        externalId: 'midcap-postman-01',
        sourceCode: 'greenhouse',
        title: 'Full Stack Engineer (TypeScript & Next.js)',
        company: 'Postman',
        location: 'Bengaluru / Remote',
        workMode: WorkMode.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 2200000,
        maxSalary: 3600000,
        currency: 'INR',
        description: 'Build API platform collaboration tools using TypeScript, React, Next.js, Node.js, and AWS.',
        requiredSkills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'REST', 'AWS'],
        minExperience: 2,
        maxExperience: 5,
        applyUrl: 'https://www.postman.com/company/careers/',
        postedAt: new Date(),
      },
      {
        externalId: 'midcap-hasura-02',
        sourceCode: 'lever',
        title: 'Backend Software Engineer',
        company: 'Hasura (Tier 2 Scaleup)',
        location: 'Bengaluru / Remote',
        workMode: WorkMode.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 2500000,
        maxSalary: 4000000,
        currency: 'INR',
        description: 'Core engine development for instant GraphQL & REST APIs over PostgreSQL and distributed databases.',
        requiredSkills: ['Go', 'Node.js', 'PostgreSQL', 'GraphQL', 'Docker', 'CI/CD'],
        minExperience: 3,
        maxExperience: 6,
        applyUrl: 'https://hasura.io/careers/',
        postedAt: new Date(),
      },
      {
        externalId: 'midcap-browserstack-03',
        sourceCode: 'greenhouse',
        title: 'Senior Software Engineer - Cloud Infrastructure',
        company: 'BrowserStack',
        location: 'Mumbai / Hybrid',
        workMode: WorkMode.HYBRID,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 2600000,
        maxSalary: 4200000,
        currency: 'INR',
        description: 'Manage test execution infrastructure across real mobile devices and browsers using Node.js, Python, Linux, and AWS.',
        requiredSkills: ['Node.js', 'Python', 'Linux', 'AWS', 'Docker', 'Kubernetes'],
        minExperience: 3,
        maxExperience: 7,
        applyUrl: 'https://browserstack.com/careers',
        postedAt: new Date(),
      },

      // 3. TIER-3 IT & PRODUCT ENGINEERING SERVICES
      {
        externalId: 'tier3-thoughtworks-01',
        sourceCode: 'adzuna',
        title: 'Lead Software Consultant / Developer',
        company: 'Thoughtworks (Tier 3 Services)',
        location: 'Hyderabad / Pune / Hybrid',
        workMode: WorkMode.HYBRID,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 1800000,
        maxSalary: 3000000,
        currency: 'INR',
        description: 'Deliver enterprise digital transformation consulting and agile cloud solutions using Java, Spring Boot, Node.js, and CI/CD.',
        requiredSkills: ['Java', 'Node.js', 'Spring Boot', 'Microservices', 'CI/CD', 'PostgreSQL'],
        minExperience: 3,
        maxExperience: 7,
        applyUrl: 'https://thoughtworks.com/careers',
        postedAt: new Date(),
      },
      {
        externalId: 'tier3-persistent-02',
        sourceCode: 'adzuna',
        title: 'Senior Backend Engineer - Cloud Practice',
        company: 'Persistent Systems (Tier 3 Services)',
        location: 'Pune / Bengaluru / Onsite',
        workMode: WorkMode.ONSITE,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 1500000,
        maxSalary: 2600000,
        currency: 'INR',
        description: 'Build enterprise health-tech and fintech backend services with NestJS, TypeScript, AWS, and MySQL.',
        requiredSkills: ['NestJS', 'TypeScript', 'Node.js', 'MySQL', 'AWS', 'REST'],
        minExperience: 3,
        maxExperience: 6,
        applyUrl: 'https://persistent.com/careers',
        postedAt: new Date(),
      },
      {
        externalId: 'tier3-lti-03',
        sourceCode: 'adzuna',
        title: 'Full Stack Developer',
        company: 'LTI Mindtree (Tier 3 Services)',
        location: 'Chennai / Hyderabad',
        workMode: WorkMode.HYBRID,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 1400000,
        maxSalary: 2400000,
        currency: 'INR',
        description: 'Design enterprise client web applications using React, Node.js, SQL, and Azure.',
        requiredSkills: ['React', 'Node.js', 'JavaScript', 'SQL', 'Azure', 'REST'],
        minExperience: 2,
        maxExperience: 5,
        applyUrl: 'https://ltimindtree.com/careers',
        postedAt: new Date(),
      },

      // 4. TIER-1 LARGE-CAP & TOP UNICORNS
      {
        externalId: 'tier1-notion-01',
        sourceCode: 'greenhouse',
        title: 'Software Engineer - Core Services',
        company: 'Notion (Tier 1)',
        location: 'Remote / Hybrid',
        workMode: WorkMode.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 3000000,
        maxSalary: 5500000,
        currency: 'INR',
        description: 'Scale collaborative workspace infrastructure using TypeScript, Node.js, PostgreSQL, and Redis.',
        requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'],
        minExperience: 2,
        maxExperience: 6,
        applyUrl: 'https://notion.so/careers',
        postedAt: new Date(),
      },
      {
        externalId: 'tier1-razorpay-02',
        sourceCode: 'lever',
        title: 'Senior Backend Engineer (Node.js/NestJS)',
        company: 'Razorpay (Tier 1 Unicorn)',
        location: 'Bengaluru / Remote',
        workMode: WorkMode.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        minSalary: 2800000,
        maxSalary: 4500000,
        currency: 'INR',
        description: 'Build mission-critical payment processing pipelines with sub-50ms latency using Node.js, NestJS, Go, Kafka, and PostgreSQL.',
        requiredSkills: ['Node.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Kafka', 'Docker'],
        minExperience: 3,
        maxExperience: 7,
        applyUrl: 'https://razorpay.com/jobs',
        postedAt: new Date(),
      },
    ];

    let total = 0;
    for (const job of multiTierCatalog) {
      await this.ingestJob(job);
      total++;
    }

    return { totalIngested: total };
  }

  async generateMatchesForUser(userId: string): Promise<void> {
    const candidateProfiles = await this.prisma.candidateProfile.findMany({
      where: { userId },
    });
    const rawPreferences = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    const hasProfiles = candidateProfiles.length > 0;
    const excludedCompanies: string[] = rawPreferences ? JSON.parse(rawPreferences.excludedCompanies || '[]') : [];
    const preferredWorkModes: string[] = rawPreferences ? JSON.parse(rawPreferences.workModes || '[]') : ['REMOTE', 'HYBRID', 'ONSITE'];
    const preferredTiers: string[] = rawPreferences ? JSON.parse(rawPreferences.preferredTiers || '[]') : [];

    const allJobs = await this.prisma.canonicalJob.findMany({
      where: { isActive: true },
      include: { sourcePostings: { include: { source: true } } },
    });

    for (const job of allJobs) {
      if (excludedCompanies.some(c => c.toLowerCase() === job.company.toLowerCase())) {
        continue;
      }

      const rawJobSkills: string[] = JSON.parse(job.requiredSkills || '[]');
      const jobSkills = rawJobSkills.map(s => s.toLowerCase().trim());
      const jobMinExp = job.minExperience !== null && job.minExperience !== undefined ? job.minExperience : 2;

      if (!hasProfiles) {
        await this.prisma.jobMatch.upsert({
          where: { userId_jobId_profileId: { userId, jobId: job.id, profileId: '' } },
          create: {
            userId,
            jobId: job.id,
            profileId: null,
            matchedProfileLabel: 'General Profile',
            overallScore: 50,
            skillScore: 0,
            experienceScore: 0,
            roleScore: 0,
            locationScore: 0,
            applicationPriority: 50,
            recommendation: 'WORTH_APPLYING',
            whyApply: JSON.stringify(['Upload your resume in Profile tab to see personalized role & skill matching']),
            risksAndGaps: JSON.stringify(['Requires resume upload for custom scoring']),
            verdictReason: 'Upload a resume to calculate tailored fit scores.',
            alternateProfiles: JSON.stringify([]),
          },
          update: {
            overallScore: 50,
            applicationPriority: 50,
          },
        });
        continue;
      }

      const evaluations = candidateProfiles.map((prof) => {
        const candidateSkills: string[] = JSON.parse(prof.skills || '[]').map((s: string) => s.toLowerCase().trim());
        const candidateRoles: string[] = JSON.parse(prof.targetRoles || '[]').map((r: string) => r.toLowerCase().trim());
        const candidateExp = prof.totalExperience || 0;

        const matchedSkills = rawJobSkills.filter(s =>
          candidateSkills.some(cs => cs === s.toLowerCase() || s.toLowerCase().includes(cs) || cs.includes(s.toLowerCase()))
        );
        const missingSkills = rawJobSkills.filter(s => !matchedSkills.includes(s));

        let skillScore = 40;
        if (jobSkills.length > 0) {
          skillScore = Math.round((matchedSkills.length / jobSkills.length) * 100);
        }

        const expDiff = candidateExp - jobMinExp;
        let experienceScore = 100;
        if (expDiff < 0) {
          experienceScore = Math.max(30, Math.round(100 - Math.abs(expDiff) * 25));
        }

        const titleLower = job.title.toLowerCase();
        const roleMatch = candidateRoles.some(r => titleLower.includes(r) || r.includes(titleLower));
        const roleScore = roleMatch ? 95 : 70;

        let locationScore = 75;
        if (preferredWorkModes.includes(job.workMode)) locationScore = 100;
        else if (job.workMode === 'REMOTE') locationScore = 95;

        let tierBonus = 0;
        if (preferredTiers.length > 0 && preferredTiers.includes(job.companyTier)) {
          tierBonus = 5;
        }

        const overallScore = Math.min(99, Math.round(
          skillScore * 0.45 + experienceScore * 0.25 + roleScore * 0.15 + locationScore * 0.15 + tierBonus,
        ));

        const applicationPriority = Math.min(99, Math.max(20, Math.round(
          overallScore * 0.9 + (job.workMode === 'REMOTE' ? 6 : 0) + (matchedSkills.length >= 3 ? 5 : 0)
        )));

        let recommendation = 'WORTH_APPLYING';
        if (applicationPriority >= 80 && skillScore >= 60) recommendation = 'APPLY_HIGH_PRIORITY';
        else if (applicationPriority < 55) recommendation = 'POSSIBLE_MATCH';

        const tierName =
          job.companyTier === 'STARTUP_EARLY_STAGE' ? 'Early-Stage Startup' :
          job.companyTier === 'TIER_3_SERVICES' ? 'IT / Engineering Services' :
          job.companyTier === 'TIER_1_LARGE_CAP' ? 'Tier 1 Enterprise' : 'Mid-Cap Growth';

        const whyApply: string[] = [];
        if (matchedSkills.length > 0) {
          whyApply.push(`Match with ${prof.label}: ${matchedSkills.length}/${rawJobSkills.length} key skills (${matchedSkills.slice(0, 4).join(', ')})`);
        }
        if (candidateExp >= jobMinExp) {
          whyApply.push(`Experience on ${prof.label} (${candidateExp} yrs) satisfies requirement (${jobMinExp}+ yrs)`);
        }
        whyApply.push(`Company Scale: ${tierName} (${job.companyScale})`);

        const risksAndGaps: string[] = [];
        if (missingSkills.length > 0) {
          risksAndGaps.push(`Missing skills for ${prof.label}: ${missingSkills.slice(0, 3).join(', ')}`);
        }
        if (candidateExp < jobMinExp) {
          risksAndGaps.push(`Job prefers ${jobMinExp}+ years of experience (${prof.label} has ${candidateExp} yrs)`);
        }

        return {
          profileId: prof.id,
          profileLabel: prof.label,
          isPrimary: prof.isPrimary,
          overallScore,
          skillScore,
          experienceScore,
          roleScore,
          locationScore,
          applicationPriority,
          recommendation,
          whyApply,
          risksAndGaps,
          verdictReason: applicationPriority >= 80
            ? `High-yield opportunity at ${job.company} (${tierName}) with your ${prof.label}.`
            : `Moderate match with ${prof.label}.`,
        };
      });

      evaluations.sort((a, b) => b.applicationPriority - a.applicationPriority);
      const alternateProfiles = evaluations.slice(1).map(e => ({
        profileLabel: e.profileLabel,
        priorityScore: e.applicationPriority,
        skillScore: e.skillScore,
      }));

      for (const ev of evaluations) {
        await this.prisma.jobMatch.upsert({
          where: {
            userId_jobId_profileId: {
              userId,
              jobId: job.id,
              profileId: ev.profileId,
            },
          },
          create: {
            userId,
            jobId: job.id,
            profileId: ev.profileId,
            matchedProfileLabel: ev.profileLabel,
            overallScore: ev.overallScore,
            skillScore: ev.skillScore,
            experienceScore: ev.experienceScore,
            roleScore: ev.roleScore,
            locationScore: ev.locationScore,
            applicationPriority: ev.applicationPriority,
            recommendation: ev.recommendation,
            whyApply: JSON.stringify(ev.whyApply),
            risksAndGaps: JSON.stringify(ev.risksAndGaps),
            verdictReason: ev.verdictReason,
            alternateProfiles: JSON.stringify(alternateProfiles),
          },
          update: {
            matchedProfileLabel: ev.profileLabel,
            overallScore: ev.overallScore,
            skillScore: ev.skillScore,
            experienceScore: ev.experienceScore,
            roleScore: ev.roleScore,
            locationScore: ev.locationScore,
            applicationPriority: ev.applicationPriority,
            recommendation: ev.recommendation,
            whyApply: JSON.stringify(ev.whyApply),
            risksAndGaps: JSON.stringify(ev.risksAndGaps),
            verdictReason: ev.verdictReason,
            alternateProfiles: JSON.stringify(alternateProfiles),
          },
        });
      }
    }
  }

  async importCustomJob(userId: string, dto: { title: string; company: string; location?: string; workMode?: string; description: string; applyUrl?: string }) {
    const knownSkills = [
      'Node.js', 'NestJS', 'Next.js', 'React', 'TypeScript', 'JavaScript', 'Python', 'Go',
      'Java', 'C++', 'Rust', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'CI/CD', 'FastAPI', 'PyTorch', 'AI/ML'
    ];
    const extractedSkills = knownSkills.filter(s => {
      const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(dto.description);
    });

    const { tier, scale } = this.classifyCompanyTier(dto.company, dto.description);

    const normalizedJob: NormalizedJob = {
      externalId: 'custom-' + Date.now(),
      sourceCode: 'manual',
      title: dto.title,
      company: dto.company,
      location: dto.location || 'Remote',
      workMode: (dto.workMode as any) || 'REMOTE',
      employmentType: EmploymentType.FULL_TIME as any,
      description: dto.description,
      requiredSkills: extractedSkills.length > 0 ? extractedSkills : ['Engineering'],
      applyUrl: dto.applyUrl || '#',
      sourceUrl: dto.applyUrl,
      postedAt: new Date(),
    };

    await this.ingestJob(normalizedJob);
    await this.generateMatchesForUser(userId);
    return { success: true, message: 'Custom job evaluated across company tiers and role profiles!' };
  }

  async getUserFeed(userId: string, options?: { tier?: string; hubId?: string }) {
    const profiles = await this.prisma.candidateProfile.findMany({
      where: { userId },
      select: { id: true, label: true, isPrimary: true },
    });
    const hasProfile = profiles.length > 0;

    const matchCount = await this.prisma.jobMatch.count({ where: { userId } });
    if (matchCount === 0) {
      await this.syncAllSources();
      await this.generateMatchesForUser(userId);
    }

    const whereClause: any = { userId, isIgnored: false };

    const rawMatches = await this.prisma.jobMatch.findMany({
      where: whereClause,
      orderBy: { applicationPriority: 'desc' },
      include: {
        job: {
          include: {
            sourcePostings: {
              include: { source: true },
            },
          },
        },
      },
    });

    const seenJobs = new Set<string>();
    const matches: any[] = [];

    for (const m of rawMatches) {
      if (seenJobs.has(m.jobId)) continue;
      if (options?.tier && options.tier !== 'ALL' && m.job.companyTier !== options.tier) continue;
      if (options?.hubId && options.hubId !== 'ALL') {
        const loc = m.job.location.toLowerCase();
        if (!loc.includes(options.hubId.toLowerCase())) continue;
      }
      seenJobs.add(m.jobId);
      matches.push(m);
    }

    return {
      hasProfile,
      profiles,
      matches: matches.map((m) => ({
        ...m,
        whyApply: JSON.parse(m.whyApply || '[]'),
        risksAndGaps: JSON.parse(m.risksAndGaps || '[]'),
        alternateProfiles: JSON.parse(m.alternateProfiles || '[]'),
        job: {
          ...m.job,
          requiredSkills: JSON.parse(m.job.requiredSkills || '[]'),
        },
      })),
    };
  }
}
