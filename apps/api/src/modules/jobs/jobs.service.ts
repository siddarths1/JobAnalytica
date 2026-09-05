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
      {\n        externalId: 'startup-langflow-01',
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

  async generateMatchesForUser(userId: string): Promise<void> {\n    const candidateProfiles = await this.prisma.candidateProfile.findMany({\n      where: { userId },\n    });\n    const rawPreferences = await this.prisma.userPreference.findUnique({\n      where: { userId },\n    });\n\n    const hasProfiles = candidateProfiles.length > 0;\n    const excludedCompanies: string[] = rawPreferences ? JSON.parse(rawPreferences.excludedCompanies || '[]') : [];\n    const preferredWorkModes: string[] = rawPreferences ? JSON.parse(rawPreferences.workModes || '[]') : ['REMOTE', 'HYBRID', 'ONSITE'];\n    const preferredTiers: string[] = rawPreferences ? JSON.parse(rawPreferences.preferredTiers || '[]') : [];\n\n    const allJobs = await this.prisma.canonicalJob.findMany({\n      where: { isActive: true },\n      include: { sourcePostings: { include: { source: true } } },\n    });\n\n    for (const job of allJobs) {\n      if (excludedCompanies.some(c => c.toLowerCase() === job.company.toLowerCase())) {\n        continue;\n      }\n\n      const rawJobSkills: string[] = JSON.parse(job.requiredSkills || '[]');\n      const jobSkills = rawJobSkills.map(s => s.toLowerCase().trim());\n      const jobMinExp = job.minExperience !== null && job.minExperience !== undefined ? job.minExperience : 2;\n\n      if (!hasProfiles) {\n        await this.prisma.jobMatch.upsert({\n          where: { userId_jobId_profileId: { userId, jobId: job.id, profileId: '' } },\n          create: {\n            userId,\n            jobId: job.id,\n            profileId: null,\n            matchedProfileLabel: 'General Profile',\n            overallScore: 50,\n            skillScore: 0,\n            experienceScore: 0,\n            roleScore: 0,\n            locationScore: 0,\n            applicationPriority: 50,\n            recommendation: 'WORTH_APPLYING',\n            whyApply: JSON.stringify(['Upload your resume in Profile tab to see personalized role & skill matching']),\n            risksAndGaps: JSON.stringify(['Requires resume upload for custom scoring']),\n            verdictReason: 'Upload a resume to calculate tailored fit scores.',\n            alternateProfiles: JSON.stringify([]),\n          },\n          update: {\n            overallScore: 50,\n            applicationPriority: 50,\n          },\n        });\n        continue;\n      }\n\n      // Evaluate job against ALL candidate profiles\n      const evaluations = candidateProfiles.map((prof) => {\n        const candidateSkills: string[] = JSON.parse(prof.skills || '[]').map((s: string) => s.toLowerCase().trim());\n        const candidateRoles: string[] = JSON.parse(prof.targetRoles || '[]').map((r: string) => r.toLowerCase().trim());\n        const candidateExp = prof.totalExperience || 0;\n\n        const matchedSkills = rawJobSkills.filter(s =>\n          candidateSkills.some(cs => cs === s.toLowerCase() || s.toLowerCase().includes(cs) || cs.includes(s.toLowerCase()))\n        );\n        const missingSkills = rawJobSkills.filter(s => !matchedSkills.includes(s));\n\n        let skillScore = 40;\n        if (jobSkills.length > 0) {\n          skillScore = Math.round((matchedSkills.length / jobSkills.length) * 100);\n        }\n\n        const expDiff = candidateExp - jobMinExp;\n        let experienceScore = 100;\n        if (expDiff < 0) {\n          experienceScore = Math.max(30, Math.round(100 - Math.abs(expDiff) * 25));\n        }\n\n        const titleLower = job.title.toLowerCase();\n        const roleMatch = candidateRoles.some(r => titleLower.includes(r) || r.includes(titleLower));\n        const roleScore = roleMatch ? 95 : 70;\n\n        let locationScore = 75;\n        if (preferredWorkModes.includes(job.workMode)) locationScore = 100;\n        else if (job.workMode === 'REMOTE') locationScore = 95;\n\n        // Tier alignment bonus\n        let tierBonus = 0;\n        if (preferredTiers.length > 0 && preferredTiers.includes(job.companyTier)) {\n          tierBonus = 5;\n        }\n\n        const overallScore = Math.min(99, Math.round(\n          skillScore * 0.45 + experienceScore * 0.25 + roleScore * 0.15 + locationScore * 0.15 + tierBonus,\n        ));\n\n        const applicationPriority = Math.min(99, Math.max(20, Math.round(\n          overallScore * 0.9 + (job.workMode === 'REMOTE' ? 6 : 0) + (matchedSkills.length >= 3 ? 5 : 0)\n        )));\n\n        let recommendation = 'WORTH_APPLYING';\n        if (applicationPriority >= 80 && skillScore >= 60) recommendation = 'APPLY_HIGH_PRIORITY';\n        else if (applicationPriority < 55) recommendation = 'POSSIBLE_MATCH';\n\n        const tierName =\n          job.companyTier === 'STARTUP_EARLY_STAGE' ? 'Early-Stage Startup' :\n          job.companyTier === 'TIER_3_SERVICES' ? 'IT / Engineering Services' :\n          job.companyTier === 'TIER_1_LARGE_CAP' ? 'Tier 1 Enterprise' : 'Mid-Cap Growth';\n\n        const whyApply: string[] = [];\n        if (matchedSkills.length > 0) {\n          whyApply.push(`Match with ${prof.label}: ${matchedSkills.length}/${rawJobSkills.length} key skills (${matchedSkills.slice(0, 4).join(', ')})`);\n        }\n        if (candidateExp >= jobMinExp) {\n          whyApply.push(`Experience on ${prof.label} (${candidateExp} yrs) satisfies requirement (${jobMinExp}+ yrs)`);\n        }\n        whyApply.push(`Company Scale: ${tierName} (${job.companyScale})`);\n\n        const risksAndGaps: string[] = [];\n        if (missingSkills.length > 0) {\n          risksAndGaps.push(`Missing skills for ${prof.label}: ${missingSkills.slice(0, 3).join(', ')}`);\n        }\n        if (candidateExp < jobMinExp) {\n          risksAndGaps.push(`Job prefers ${jobMinExp}+ years of experience (${prof.label} has ${candidateExp} yrs)`);\n        }\n\n        return {\n          profileId: prof.id,\n          profileLabel: prof.label,\n          isPrimary: prof.isPrimary,\n          overallScore,\n          skillScore,\n          experienceScore,\n          roleScore,\n          locationScore,\n          applicationPriority,\n          recommendation,\n          whyApply,\n          risksAndGaps,\n          verdictReason: applicationPriority >= 80\n            ? `High-yield opportunity at ${job.company} (${tierName}) with your ${prof.label}.`\n            : `Moderate match with ${prof.label}.`,\n        };\n      });\n\n      evaluations.sort((a, b) => b.applicationPriority - a.applicationPriority);\n      const alternateProfiles = evaluations.slice(1).map(e => ({\n        profileLabel: e.profileLabel,\n        priorityScore: e.applicationPriority,\n        skillScore: e.skillScore,\n      }));\n\n      for (const ev of evaluations) {\n        await this.prisma.jobMatch.upsert({\n          where: {\n            userId_jobId_profileId: {\n              userId,\n              jobId: job.id,\n              profileId: ev.profileId,\n            },\n          },\n          create: {\n            userId,\n            jobId: job.id,\n            profileId: ev.profileId,\n            matchedProfileLabel: ev.profileLabel,\n            overallScore: ev.overallScore,\n            skillScore: ev.skillScore,\n            experienceScore: ev.experienceScore,\n            roleScore: ev.roleScore,\n            locationScore: ev.locationScore,\n            applicationPriority: ev.applicationPriority,\n            recommendation: ev.recommendation,\n            whyApply: JSON.stringify(ev.whyApply),\n            risksAndGaps: JSON.stringify(ev.risksAndGaps),\n            verdictReason: ev.verdictReason,\n            alternateProfiles: JSON.stringify(alternateProfiles),\n          },\n          update: {\n            matchedProfileLabel: ev.profileLabel,\n            overallScore: ev.overallScore,\n            skillScore: ev.skillScore,\n            experienceScore: ev.experienceScore,\n            roleScore: ev.roleScore,\n            locationScore: ev.locationScore,\n            applicationPriority: ev.applicationPriority,\n            recommendation: ev.recommendation,\n            whyApply: JSON.stringify(ev.whyApply),\n            risksAndGaps: JSON.stringify(ev.risksAndGaps),\n            verdictReason: ev.verdictReason,\n            alternateProfiles: JSON.stringify(alternateProfiles),\n          },\n        });\n      }\n    }\n  }\n\n  async importCustomJob(userId: string, dto: { title: string; company: string; location?: string; workMode?: string; description: string; applyUrl?: string }) {\n    const knownSkills = [\n      'Node.js', 'NestJS', 'Next.js', 'React', 'TypeScript', 'JavaScript', 'Python', 'Go',\n      'Java', 'C++', 'Rust', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',\n      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'CI/CD', 'FastAPI', 'PyTorch', 'AI/ML'\n    ];\n    const extractedSkills = knownSkills.filter(s => {\n      const escaped = s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');\n      return new RegExp(`\\\\b${escaped}\\\\b`, 'i').test(dto.description);\n    });\n\n    const { tier, scale } = this.classifyCompanyTier(dto.company, dto.description);\n\n    const normalizedJob: NormalizedJob = {\n      externalId: 'custom-' + Date.now(),\n      sourceCode: 'manual',\n      title: dto.title,\n      company: dto.company,\n      location: dto.location || 'Remote',\n      workMode: (dto.workMode as any) || 'REMOTE',\n      employmentType: EmploymentType.FULL_TIME as any,\n      description: dto.description,\n      requiredSkills: extractedSkills.length > 0 ? extractedSkills : ['Engineering'],\n      applyUrl: dto.applyUrl || '#',\n      sourceUrl: dto.applyUrl,\n      postedAt: new Date(),\n    };\n\n    await this.ingestJob(normalizedJob);\n    await this.generateMatchesForUser(userId);\n    return { success: true, message: 'Custom job evaluated across company tiers and role profiles!' };\n  }\n\n  async getFeed(userId: string, profileId?: string) {\n    const profiles = await this.prisma.candidateProfile.findMany({\n      where: { userId },\n      select: { id: true, label: true, isPrimary: true },\n    });\n    const hasProfile = profiles.length > 0;\n\n    const matchCount = await this.prisma.jobMatch.count({ where: { userId } });\n    if (matchCount === 0) {\n      await this.syncAllSources();\n      await this.generateMatchesForUser(userId);\n    }\n\n    const whereClause: any = { userId, isIgnored: false };\n    if (profileId && profileId !== 'ALL') {\n      whereClause.profileId = profileId;\n    }\n\n    const rawMatches = await this.prisma.jobMatch.findMany({\n      where: whereClause,\n      orderBy: { applicationPriority: 'desc' },\n      include: {\n        job: {\n          include: {\n            sourcePostings: {\n              include: { source: true },\n            },\n          },\n        },\n      },\n    });\n\n    const seenJobs = new Set<string>();\n    const matches: any[] = [];\n\n    for (const m of rawMatches) {\n      if (!profileId || profileId === 'ALL') {\n        if (seenJobs.has(m.jobId)) continue;\n        seenJobs.add(m.jobId);\n      }\n      matches.push(m);\n    }\n\n    return {\n      hasProfile,\n      profiles,\n      matches: matches.map((m) => ({\n        ...m,\n        whyApply: JSON.parse(m.whyApply || '[]'),\n        risksAndGaps: JSON.parse(m.risksAndGaps || '[]'),\n        alternateProfiles: JSON.parse(m.alternateProfiles || '[]'),\n        job: {\n          ...m.job,\n          requiredSkills: JSON.parse(m.job.requiredSkills || '[]'),\n        },\n      })),\n    };\n  }\n}