import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TOP_COMPANIES_BY_HUB } from './company-directory.constants';
import { JobsService } from '../jobs/jobs.service';
import { ApplicationsService } from '../applications/applications.service';
import { createWorker } from 'tesseract.js';
import * as crypto from 'crypto';

export interface ExtractedJobEntities {
  company: string;
  role: string;
  location: string;
  skills: string[];
  rawText: string;
  sourcePlatform: 'NAUKRI' | 'LINKEDIN' | 'INDEED' | 'INSTAHYRE' | 'OTHER';
}

@Injectable()
export class VisualDiscoveryService {
  private readonly logger = new Logger(VisualDiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async processScreenshot(
    userId: string,
    imageBuffer: Buffer,
    mimeType = 'image/png',
    originalName = 'screenshot.png',
  ) {
    this.logger.log(`Processing visual screenshot (${imageBuffer.length} bytes) for user ${userId}...`);

    let ocrText = '';
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageBuffer);
      ocrText = ret.data.text;
      await worker.terminate();
    } catch (err: any) {
      this.logger.warn(`Tesseract OCR error: ${err.message}. Falling back to basic regex parsing.`);
      ocrText = originalName;
    }

    const entities = this.extractJobEntities(ocrText);
    const resolvedCareer = this.resolveCareerPortal(entities.company);
    const matchAnalysis = await this.evaluateResumeMatch(userId, entities.skills, entities.role);

    const entry = await this.prisma.visualDiscoveryEntry.create({
      data: {
        userId,
        sourcePlatform: entities.sourcePlatform,
        extractedCompany: entities.company,
        extractedRole: entities.role,
        extractedLocation: entities.location,
        extractedSkills: JSON.stringify(entities.skills),
        rawOcrText: ocrText.slice(0, 5000),
        careerPageUrl: resolvedCareer.careerPageUrl,
        atsProvider: resolvedCareer.atsProvider,
        matchScore: matchAnalysis.matchScore,
        matchedProfileLabel: matchAnalysis.matchedProfileLabel,
        status: 'ACTIVE',
        isSoftDeleted: false,
      },
    });

    return {
      success: true,
      entry: {
        ...entry,
        extractedSkills: JSON.parse(entry.extractedSkills || '[]'),
        whyApply: matchAnalysis.whyApply,
        risksAndGaps: matchAnalysis.risksAndGaps,
      },
    };
  }

  async processText(userId: string, rawText: string, platformHint?: 'NAUKRI' | 'LINKEDIN' | 'OTHER') {
    const entities = this.extractJobEntities(rawText, platformHint);
    const resolvedCareer = this.resolveCareerPortal(entities.company);
    const matchAnalysis = await this.evaluateResumeMatch(userId, entities.skills, entities.role);

    const entry = await this.prisma.visualDiscoveryEntry.create({
      data: {
        userId,
        sourcePlatform: entities.sourcePlatform,
        extractedCompany: entities.company,
        extractedRole: entities.role,
        extractedLocation: entities.location,
        extractedSkills: JSON.stringify(entities.skills),
        rawOcrText: rawText.slice(0, 5000),
        careerPageUrl: resolvedCareer.careerPageUrl,
        atsProvider: resolvedCareer.atsProvider,
        matchScore: matchAnalysis.matchScore,
        matchedProfileLabel: matchAnalysis.matchedProfileLabel,
        status: 'ACTIVE',
        isSoftDeleted: false,
      },
    });

    return {
      success: true,
      entry: {
        ...entry,
        extractedSkills: JSON.parse(entry.extractedSkills || '[]'),
        whyApply: matchAnalysis.whyApply,
        risksAndGaps: matchAnalysis.risksAndGaps,
      },
    };
  }

  extractJobEntities(text: string, platformHint?: 'NAUKRI' | 'LINKEDIN' | 'OTHER'): ExtractedJobEntities {
    const lower = text.toLowerCase();

    let sourcePlatform: 'NAUKRI' | 'LINKEDIN' | 'INDEED' | 'INSTAHYRE' | 'OTHER' = platformHint || 'OTHER';
    if (lower.includes('naukri') || lower.includes('infoedge') || lower.includes('resdex')) {
      sourcePlatform = 'NAUKRI';
    } else if (lower.includes('linkedin') || lower.includes('inmail') || lower.includes('easy apply')) {
      sourcePlatform = 'LINKEDIN';
    } else if (lower.includes('indeed')) {
      sourcePlatform = 'INDEED';
    } else if (lower.includes('instahyre')) {
      sourcePlatform = 'INSTAHYRE';
    }

    let detectedCompany = '';
    for (const comp of TOP_COMPANIES_BY_HUB) {
      if (lower.includes(comp.name.toLowerCase())) {
        detectedCompany = comp.name;
        break;
      }
    }

    if (!detectedCompany) {
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 2 && !/^(naukri|infoedge|resdex|linkedin|easy apply|inmail|indeed|job card|job posting)/i.test(l));

      const companyRegex = /(?:at|company|hiring for|join)\s+([A-Z][A-Za-z0-9\s&]{2,30})/i;
      for (const line of lines) {
        const m = line.match(companyRegex);
        if (m && m[1]) {
          detectedCompany = m[1].trim();
          break;
        }
      }

      if (!detectedCompany && lines.length > 1) {
        detectedCompany = lines[1].replace(/[^a-zA-Z0-9\s&]/g, '').trim().slice(0, 30);
      }
      if (!detectedCompany && lines.length > 0) {
        detectedCompany = lines[0].replace(/[^a-zA-Z0-9\s&]/g, '').trim().slice(0, 30);
      }
    }

    if (!detectedCompany || detectedCompany.length < 2) {
      detectedCompany = 'Tech Innovations Ltd';
    }

    const KNOWN_ROLES = [
      'Founding AI Systems Engineer',
      'Senior Software Engineer',
      'Senior Backend Engineer',
      'Senior Frontend Engineer',
      'Staff Software Engineer',
      'Backend Engineer',
      'Frontend Engineer',
      'Full Stack Developer',
      'Full Stack Engineer',
      'AI/ML Engineer',
      'Machine Learning Engineer',
      'DevOps Engineer',
      'Cloud Platform Engineer',
      'Data Engineer',
      'Software Development Engineer',
      'SDE 2',
      'SDE 1',
      'SDE 3',
    ];

    let detectedRole = '';
    const sortedRoles = [...KNOWN_ROLES].sort((a, b) => b.length - a.length);
    for (const r of sortedRoles) {
      if (lower.includes(r.toLowerCase())) {
        detectedRole = r;
        break;
      }
    }

    if (!detectedRole) {
      const roleRegex = /(?:role|position|title|looking for|hiring)\s*:\s*([A-Za-z0-9\s/()-]{3,40})/i;
      const m = text.match(roleRegex);
      if (m && m[1]) {
        detectedRole = m[1].trim();
      } else {
        detectedRole = 'Software Engineer';
      }
    }

    const KNOWN_LOCATIONS = [
      'Bengaluru', 'Bangalore', 'Hyderabad', 'Pune', 'Delhi NCR', 'Gurugram',
      'Noida', 'Chennai', 'Mumbai', 'Ahmedabad', 'GIFT City', 'Kochi', 'Kolkata', 'Remote', 'Hybrid',
    ];
    let detectedLocation = 'India / Remote';
    for (const loc of KNOWN_LOCATIONS) {
      if (new RegExp(`\\b${loc}\\b`, 'i').test(text)) {
        detectedLocation = loc.toLowerCase() === 'bangalore' ? 'Bengaluru' : loc;
        break;
      }
    }

    const KNOWN_SKILLS = [
      'JavaScript', 'TypeScript', 'Node.js', 'NestJS', 'React', 'Next.js', 'Python', 'FastAPI',
      'Django', 'Java', 'Spring Boot', 'Go', 'Rust', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'GraphQL', 'REST', 'CI/CD', 'Kafka', 'AI/ML',
      'PyTorch', 'LangChain', 'TailwindCSS', 'Microservices', 'Distributed Systems',
    ];

    const detectedSkills: string[] = [];
    for (const skill of KNOWN_SKILLS) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) {
        detectedSkills.push(skill);
      }
    }

    return {
      company: detectedCompany,
      role: detectedRole,
      location: detectedLocation,
      skills: detectedSkills.length > 0 ? detectedSkills : ['TypeScript', 'Node.js', 'PostgreSQL'],
      rawText: text,
      sourcePlatform,
    };
  }

  resolveCareerPortal(companyName: string): { careerPageUrl: string; atsProvider: string } {
    const clean = companyName.toLowerCase().trim();

    for (const comp of TOP_COMPANIES_BY_HUB) {
      if (comp.name.toLowerCase() === clean || clean.includes(comp.name.toLowerCase()) || comp.name.toLowerCase().includes(clean)) {
        return {
          careerPageUrl: comp.careersUrl,
          atsProvider: comp.atsType ? comp.atsType.toUpperCase() : 'DIRECT_PORTAL',
        };
      }
    }

    const encoded = encodeURIComponent(`${companyName} careers jobs apply`);
    return {
      careerPageUrl: `https://www.google.com/search?q=${encoded}`,
      atsProvider: 'DIRECT_PORTAL',
    };
  }

  async evaluateResumeMatch(userId: string, extractedSkills: string[], extractedRole: string): Promise<{
    matchScore: number;
    matchedProfileLabel: string;
    whyApply: string[];
    risksAndGaps: string[];
  }> {
    const candidateProfiles = await this.prisma.candidateProfile.findMany({
      where: { userId },
    });

    if (candidateProfiles.length === 0) {
      return {
        matchScore: 65,
        matchedProfileLabel: 'General Candidate Profile',
        whyApply: ['Matches general software engineering stack. Upload specific role resumes for precise fit scoring.'],
        risksAndGaps: ['Upload a targeted resume in Resume Hub to see detailed skill gap analysis.'],
      };
    }

    let highestScore = 0;
    let bestProfile = candidateProfiles[0];
    let bestMatchedSkills: string[] = [];
    let bestMissingSkills: string[] = [];

    const jobSkills = extractedSkills.map((s) => s.toLowerCase());

    for (const prof of candidateProfiles) {
      const profSkills: string[] = JSON.parse(prof.skills || '[]').map((s: string) => s.toLowerCase());
      const profRoles: string[] = JSON.parse(prof.targetRoles || '[]').map((r: string) => r.toLowerCase());

      const matched = extractedSkills.filter((s) =>
        profSkills.some((ps) => ps === s.toLowerCase() || s.toLowerCase().includes(ps) || ps.includes(s.toLowerCase())),
      );
      const missing = extractedSkills.filter((s) => !matched.includes(s));

      let skillScore = 40;
      if (jobSkills.length > 0) {
        skillScore = Math.round((matched.length / jobSkills.length) * 100);
      }

      const roleLower = extractedRole.toLowerCase();
      const roleMatch = profRoles.some((r) => roleLower.includes(r) || r.includes(roleLower));
      const roleScore = roleMatch ? 95 : 70;

      const score = Math.min(99, Math.round(skillScore * 0.6 + roleScore * 0.4));

      if (score > highestScore) {
        highestScore = score;
        bestProfile = prof;
        bestMatchedSkills = matched;
        bestMissingSkills = missing;
      }
    }

    const whyApply: string[] = [];
    if (bestMatchedSkills.length > 0) {
      whyApply.push(`Strong overlap on ${bestProfile.label}: ${bestMatchedSkills.slice(0, 4).join(', ')}`);
    } else {
      whyApply.push(`Good foundation for ${bestProfile.label}`);
    }

    const risksAndGaps: string[] = [];
    if (bestMissingSkills.length > 0) {
      risksAndGaps.push(`Suggested skills to highlight: ${bestMissingSkills.slice(0, 3).join(', ')}`);
    }

    return {
      matchScore: highestScore,
      matchedProfileLabel: bestProfile.label,
      whyApply,
      risksAndGaps,
    };
  }

  async getUserEntries(userId: string, filter: 'ACTIVE' | 'ARCHIVED' | 'ALL' = 'ACTIVE') {
    const where: any = { userId };
    if (filter === 'ACTIVE') {
      where.isSoftDeleted = false;
    } else if (filter === 'ARCHIVED') {
      where.isSoftDeleted = true;
    }

    const entries = await this.prisma.visualDiscoveryEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return entries.map((e) => ({
      ...e,
      extractedSkills: JSON.parse(e.extractedSkills || '[]'),
    }));
  }

  async updateStatus(
    userId: string,
    entryId: string,
    status: 'APPLIED' | 'DONE' | 'DISMISSED' | 'ACTIVE',
  ) {
    const entry = await this.prisma.visualDiscoveryEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) throw new NotFoundException('Visual discovery entry not found');

    const shouldSoftDelete = status === 'APPLIED' || status === 'DONE' || status === 'DISMISSED';

    const updated = await this.prisma.visualDiscoveryEntry.update({
      where: { id: entryId },
      data: {
        status,
        isSoftDeleted: shouldSoftDelete,
        softDeletedAt: shouldSoftDelete ? new Date() : null,
      },
    });

    if (status === 'APPLIED') {
      try {
        const normCompany = entry.extractedCompany.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const normTitle = (entry.extractedRole || 'Software Engineer').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const normLocation = (entry.extractedLocation || 'India').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

        const canonicalHash = crypto
          .createHash('sha256')
          .update(`${normCompany}:${normTitle}:${normLocation}`)
          .digest('hex');

        const canonicalJob = await this.prisma.canonicalJob.upsert({
          where: { canonicalHash },
          create: {
            canonicalHash,
            title: entry.extractedRole || 'Software Engineer',
            company: entry.extractedCompany,
            companyTier: 'TIER_2',
            companyScale: 'MID_MARKET',
            normalizedTitle: normTitle,
            normalizedCompany: normCompany,
            location: entry.extractedLocation || 'India / Remote',
            normalizedLocation: normLocation,
            description: entry.rawOcrText || `Job opportunity at ${entry.extractedCompany}`,
            requiredSkills: entry.extractedSkills,
            primaryApplyUrl: entry.careerPageUrl || 'https://www.google.com',
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          },
          update: {
            lastSeenAt: new Date(),
          },
        });

        await this.prisma.application.upsert({
          where: {
            userId_jobId: {
              userId,
              jobId: canonicalJob.id,
            },
          },
          create: {
            userId,
            jobId: canonicalJob.id,
            resumeLabel: entry.matchedProfileLabel || 'Visual Discovery Match',
            status: 'APPLIED',
            appliedAt: new Date(),
            notes: `Discovered from ${entry.sourcePlatform} screenshot. Career link: ${entry.careerPageUrl}`,
          },
          update: {
            status: 'APPLIED',
            appliedAt: new Date(),
          },
        });
      } catch (err: any) {
        this.logger.error(`Failed to auto-sync applied visual discovery to Kanban: ${err.message}`);
      }
    }

    return {
      success: true,
      entry: {
        ...updated,
        extractedSkills: JSON.parse(updated.extractedSkills || '[]'),
      },
    };
  }

  async restoreEntry(userId: string, entryId: string) {
    const entry = await this.prisma.visualDiscoveryEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) throw new NotFoundException('Visual discovery entry not found');

    const updated = await this.prisma.visualDiscoveryEntry.update({
      where: { id: entryId },
      data: {
        status: 'ACTIVE',
        isSoftDeleted: false,
        softDeletedAt: null,
      },
    });

    return {
      success: true,
      entry: {
        ...updated,
        extractedSkills: JSON.parse(updated.extractedSkills || '[]'),
      },
    };
  }

  async deleteEntry(userId: string, entryId: string) {
    const entry = await this.prisma.visualDiscoveryEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) throw new NotFoundException('Visual discovery entry not found');

    await this.prisma.visualDiscoveryEntry.delete({
      where: { id: entryId },
    });

    return { success: true };
  }
}
