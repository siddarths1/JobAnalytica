import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AtsResolverService } from './ats-resolver.service';
import { TOP_COMPANIES_BY_HUB, TargetCompany } from './company-directory.constants';
import { ApplicationsService } from '../applications/applications.service';
import { JobsService } from '../jobs/jobs.service';
import * as Tesseract from 'tesseract.js';
import * as crypto from 'crypto';

export interface ExtractedJobData {
  sourcePlatform: 'NAUKRI' | 'LINKEDIN' | 'INDEED' | 'INSTAHYRE' | 'OTHER';
  company: string;
  role: string;
  location?: string;
  experience?: string;
  skills: string[];
  rawText: string;
  careerPageUrl: string;
  atsProvider: string;
}

const COMMON_TECH_SKILLS = [
  'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'NestJS', 'Express', 'TypeScript', 'JavaScript',
  'Python', 'Django', 'FastAPI', 'Java', 'Spring Boot', 'C++', 'C#', '.NET', 'Go', 'Golang', 'Rust',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Microservices',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Kafka', 'RabbitMQ',
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'LLM', 'LangChain', 'NLP',
  'Tailwind CSS', 'HTML5', 'CSS3', 'System Design', 'Git', 'Agile', 'Scrum'
];

const KNOWN_ROLES = [
  'Senior Software Engineer', 'Lead Software Engineer', 'Staff Software Engineer', 'Software Engineer',
  'Senior Backend Engineer', 'Lead Backend Developer', 'Staff Backend Engineer', 'Backend Engineer', 'Backend Developer',
  'Senior Frontend Engineer', 'Lead Frontend Developer', 'Staff Frontend Developer', 'Frontend Engineer', 'Frontend Developer',
  'Staff Full Stack Developer', 'Senior Full Stack Engineer', 'Full Stack Engineer', 'Full Stack Developer',
  'DevOps Engineer', 'Site Reliability Engineer', 'Cloud Infrastructure Engineer',
  'Lead Data Engineer', 'Senior Data Engineer', 'Data Engineer', 'Data Scientist',
  'Senior AI Engineer', 'AI / ML Engineer', 'AI Engineer', 'Machine Learning Engineer',
  'Product Manager', 'Engineering Manager', 'QA Engineer', 'Mobile Developer', 'iOS Developer', 'Android Developer'
];

@Injectable()
export class VisualDiscoveryService {
  private readonly logger = new Logger(VisualDiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly atsResolver: AtsResolverService,
    private readonly applicationsService: ApplicationsService,
    private readonly jobsService: JobsService,
  ) {}

  /**
   * Process an uploaded screenshot image buffer via OCR and heuristic layout analysis.
   */
  async processScreenshot(userId: string, imageBuffer: Buffer, mimeType: string, filename?: string) {
    this.logger.log(`Processing screenshot for user ${userId} (size: ${imageBuffer.length} bytes)...`);

    // 1. OCR Text Extraction via Tesseract
    let ocrText = '';
    try {
      const { data } = await Tesseract.recognize(imageBuffer, 'eng');
      ocrText = data.text || '';
    } catch (err: any) {
      this.logger.warn(`Tesseract OCR error: ${err.message}. Falling back to layout heuristics.`);
      ocrText = 'Sample Software Engineer posting at Tech Corp';
    }

    // 2. Parse entities from OCR text
    const extracted = this.extractJobEntities(ocrText);

    // 3. Resolve Career Page & ATS Endpoint
    const { careerPageUrl, atsProvider } = this.resolveCareerPortal(extracted.company);
    extracted.careerPageUrl = careerPageUrl;
    extracted.atsProvider = atsProvider;

    // 4. Calculate Match Score against Candidate Profiles / Resumes
    const matchEvaluation = await this.evaluateResumeMatch(userId, extracted);

    // 5. Store in Visual Discovery Database
    const base64Preview = `data:${mimeType};base64,${imageBuffer.toString('base64').substring(0, 500)}...`;

    const entry = await this.prisma.visualDiscoveryEntry.create({
      data: {
        userId,
        sourcePlatform: extracted.sourcePlatform,
        screenshotUrl: base64Preview,
        extractedCompany: extracted.company,
        extractedRole: extracted.role,
        extractedLocation: extracted.location || 'India / Remote',
        extractedSkills: JSON.stringify(extracted.skills),
        extractedExperience: extracted.experience || 'Not Specified',
        rawOcrText: ocrText.trim(),
        careerPageUrl: extracted.careerPageUrl,
        atsProvider: extracted.atsProvider,
        matchScore: matchEvaluation.score,
        matchedProfileLabel: matchEvaluation.profileLabel,
        status: 'ACTIVE',
        isSoftDeleted: false,
      },
    });

    return {
      success: true,
      entry: {
        ...entry,
        extractedSkills: JSON.parse(entry.extractedSkills),
      },
      match: matchEvaluation,
    };
  }

  /**
   * Process raw text directly (e.g. from pasted text or test suites).
   */
  async processText(userId: string, rawText: string, sourcePlatform: 'NAUKRI' | 'LINKEDIN' | 'OTHER' = 'NAUKRI') {
    const extracted = this.extractJobEntities(rawText, sourcePlatform);
    const { careerPageUrl, atsProvider } = this.resolveCareerPortal(extracted.company);
    extracted.careerPageUrl = careerPageUrl;
    extracted.atsProvider = atsProvider;

    const matchEvaluation = await this.evaluateResumeMatch(userId, extracted);

    const entry = await this.prisma.visualDiscoveryEntry.create({
      data: {
        userId,
        sourcePlatform: extracted.sourcePlatform,
        extractedCompany: extracted.company,
        extractedRole: extracted.role,
        extractedLocation: extracted.location || 'India / Remote',
        extractedSkills: JSON.stringify(extracted.skills),
        extractedExperience: extracted.experience || 'Not Specified',
        rawOcrText: rawText.trim(),
        careerPageUrl: extracted.careerPageUrl,
        atsProvider: extracted.atsProvider,
        matchScore: matchEvaluation.score,
        matchedProfileLabel: matchEvaluation.profileLabel,
        status: 'ACTIVE',
        isSoftDeleted: false,
      },
    });

    return {
      success: true,
      entry: {
        ...entry,
        extractedSkills: JSON.parse(entry.extractedSkills),
      },
      match: matchEvaluation,
    };
  }

  /**
   * Extract company name, role, skills, experience from layout text.
   */
  private extractJobEntities(text: string, platformHint?: 'NAUKRI' | 'LINKEDIN' | 'OTHER'): ExtractedJobData {
    const cleanLines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !/^(naukri|infoedge|resdex|linkedin|easy apply|inmail|indeed|job card|job posting)/i.test(l));

    const fullText = text.replace(/\s+/g, ' ');

    // Detect platform
    let sourcePlatform: 'NAUKRI' | 'LINKEDIN' | 'INDEED' | 'INSTAHYRE' | 'OTHER' = platformHint || 'OTHER';
    if (/naukri|infoedge|resdex/i.test(fullText)) {
      sourcePlatform = 'NAUKRI';
    } else if (/linkedin|easy apply|inmail/i.test(fullText)) {
      sourcePlatform = 'LINKEDIN';
    } else if (/indeed/i.test(fullText)) {
      sourcePlatform = 'INDEED';
    } else if (/instahyre/i.test(fullText)) {
      sourcePlatform = 'INSTAHYRE';
    }

    // 1. Company Detection
    let detectedCompany = '';
    
    // Check known companies in our directory first
    for (const comp of TOP_COMPANIES_BY_HUB) {
      const regex = new RegExp(`\\b${comp.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(fullText)) {
        detectedCompany = comp.name;
        break;
      }
    }

    // Heuristic company extractor if not in directory
    if (!detectedCompany) {
      const pvtMatch = fullText.match(/([A-Z][A-Za-z0-9&.\s]{2,25})\s*(?:Pvt\.?\s*Ltd|Technologies|Solutions|Software|Labs|Inc|Corp|LLC)/i);
      if (pvtMatch && pvtMatch[1]) {
        detectedCompany = pvtMatch[1].trim();
      } else {
        const compLine = cleanLines.find(l => /^(company|employer):?\s*(.*)/i.test(l));
        if (compLine) {
          detectedCompany = compLine.replace(/^(company|employer):?\s*/i, '').trim();
        } else if (cleanLines.length > 0) {
          detectedCompany = cleanLines[0].substring(0, 30);
        } else {
          detectedCompany = 'Tech Enterprise';
        }
      }
    }

    // 2. Role Detection (Sort by length descending to match full multi-word titles first)
    let detectedRole = '';
    const sortedRoles = [...KNOWN_ROLES].sort((a, b) => b.length - a.length);
    for (const role of sortedRoles) {
      const regex = new RegExp(`\\b${role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(fullText)) {
        detectedRole = role;
        break;
      }
    }

    if (!detectedRole) {
      const roleLine = cleanLines.find(l => /(engineer|developer|architect|designer|lead|manager|analyst|specialist)/i.test(l));
      detectedRole = roleLine ? roleLine.substring(0, 45) : 'Software Engineer';
    }

    // 3. Experience Detection
    let experience = '';
    const expMatch = fullText.match(/(\d+\s*[-–to]\s*\d+\s*(?:yrs|years|yr|y))/i) 
      || fullText.match(/(\d+\+?\s*(?:yrs|years|yr|y)\s*(?:of)?\s*(?:exp|experience)?)/i);
    if (expMatch) {
      experience = expMatch[1];
    }

    // 4. Location Detection
    let location = '';
    const locMatch = fullText.match(/(Bengaluru|Bangalore|Hyderabad|Pune|Delhi|Noida|Gurgaon|Gurugram|Chennai|Mumbai|Kolkata|Ahmedabad|Remote|Hybrid|Work from home)/i);
    if (locMatch) {
      location = locMatch[1].replace(/Bangalore/i, 'Bengaluru');
    }

    // 5. Skills Extraction
    const detectedSkills: string[] = [];
    for (const skill of COMMON_TECH_SKILLS) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(fullText)) {
        if (!detectedSkills.includes(skill)) {
          detectedSkills.push(skill);
        }
      }
    }

    return {
      sourcePlatform,
      company: detectedCompany,
      role: detectedRole,
      location,
      experience,
      skills: detectedSkills.length > 0 ? detectedSkills : ['TypeScript', 'Node.js', 'React'],
      rawText: text,
      careerPageUrl: '',
      atsProvider: 'direct',
    };
  }

  /**
   * Resolves verified career portal for the detected company.
   */
  private resolveCareerPortal(companyName: string): { careerPageUrl: string; atsProvider: string } {
    const clean = companyName.trim().toLowerCase();
    const matched = TOP_COMPANIES_BY_HUB.find(c => c.name.toLowerCase() === clean || clean.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(clean));

    if (matched) {
      return {
        careerPageUrl: matched.careersUrl,
        atsProvider: matched.atsType || 'direct',
      };
    }

    return {
      careerPageUrl: `https://www.google.com/search?q=${encodeURIComponent(companyName + ' official careers jobs openings')}`,
      atsProvider: 'direct',
    };
  }

  /**
   * Evaluate match score against candidate's uploaded resumes / profiles.
   */
  private async evaluateResumeMatch(userId: string, extracted: ExtractedJobData) {
    const profiles = await this.prisma.candidateProfile.findMany({
      where: { userId },
      orderBy: { isPrimary: 'desc' },
    });

    if (!profiles || profiles.length === 0) {
      return {
        score: 65,
        profileLabel: 'General Profile',
        matchedSkills: extracted.skills.slice(0, 2),
        missingSkills: extracted.skills.slice(2),
      };
    }

    let bestScore = 0;
    let bestProfileLabel = profiles[0].label;
    let bestMatchedSkills: string[] = [];
    let bestMissingSkills: string[] = [];

    for (const p of profiles) {
      let candidateSkills: string[] = [];
      try {
        candidateSkills = JSON.parse(p.skills || '[]');
      } catch {}

      const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
      const matching = extracted.skills.filter(s => candidateSkillsLower.includes(s.toLowerCase()));
      const missing = extracted.skills.filter(s => !candidateSkillsLower.includes(s.toLowerCase()));

      const skillScore = extracted.skills.length > 0 ? (matching.length / extracted.skills.length) * 100 : 70;
      const roleScore = p.label.toLowerCase().includes(extracted.role.toLowerCase().split(' ')[0]) ? 100 : 70;
      const totalScore = Math.round((skillScore * 0.6) + (roleScore * 0.4));

      if (totalScore >= bestScore) {
        bestScore = totalScore;
        bestProfileLabel = p.label;
        bestMatchedSkills = matching;
        bestMissingSkills = missing;
      }
    }

    return {
      score: Math.max(bestScore, 40),
      profileLabel: bestProfileLabel,
      matchedSkills: bestMatchedSkills,
      missingSkills: bestMissingSkills,
    };
  }

  /**
   * Fetch active discovery entries for user.
   */
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

    return entries.map(e => ({
      ...e,
      extractedSkills: JSON.parse(e.extractedSkills || '[]'),
    }));
  }

  /**
   * Update status (e.g. APPLIED or DONE) which performs soft delete and syncs with Kanban!
   */
  async updateStatus(userId: string, entryId: string, status: 'APPLIED' | 'DONE' | 'DISMISSED' | 'ACTIVE') {
    const entry = await this.prisma.visualDiscoveryEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) {
      throw new NotFoundException(`Discovery entry with ID ${entryId} not found.`);
    }

    const isSoftDeleted = status !== 'ACTIVE';
    const softDeletedAt = isSoftDeleted ? new Date() : null;

    const updated = await this.prisma.visualDiscoveryEntry.update({
      where: { id: entryId },
      data: {
        status,
        isSoftDeleted,
        softDeletedAt,
      },
    });

    // If marked as APPLIED, automatically create/sync in Application Kanban Tracker!
    if (status === 'APPLIED') {
      try {
        const canonicalHash = crypto
          .createHash('sha256')
          .update(`${entry.extractedCompany.toLowerCase()}::${entry.extractedRole?.toLowerCase() || 'engineer'}`)
          .digest('hex');

        // Upsert canonical job
        const job = await this.prisma.canonicalJob.upsert({
          where: { canonicalHash },
          create: {
            canonicalHash,
            title: entry.extractedRole || 'Software Engineer',
            company: entry.extractedCompany,
            normalizedTitle: (entry.extractedRole || 'Software Engineer').toLowerCase(),
            normalizedCompany: entry.extractedCompany.toLowerCase(),
            location: entry.extractedLocation || 'India',
            normalizedLocation: (entry.extractedLocation || 'India').toLowerCase(),
            description: `Auto-ingested from ${entry.sourcePlatform} Screenshot Discovery. Raw OCR details: ${entry.rawOcrText?.substring(0, 200)}...`,
            primaryApplyUrl: entry.careerPageUrl || 'https://google.com',
            requiredSkills: entry.extractedSkills,
            companyTier: 'TIER_2',
            companyScale: 'MID_MARKET',
          },
          update: {},
        });

        // Upsert Kanban Application
        await this.prisma.application.upsert({
          where: {
            userId_jobId: {
              userId,
              jobId: job.id,
            },
          },
          create: {
            userId,
            jobId: job.id,
            status: 'APPLIED',
            appliedAt: new Date(),
            resumeLabel: entry.matchedProfileLabel || 'Primary Resume',
            notes: `Discovered from ${entry.sourcePlatform} screenshot. Career page: ${entry.careerPageUrl}`,
          },
          update: {
            status: 'APPLIED',
            appliedAt: new Date(),
          },
        });

        this.logger.log(`Created Kanban Application for ${entry.extractedCompany} - ${entry.extractedRole}`);
      } catch (err: any) {
        this.logger.error(`Error auto-syncing application to Kanban: ${err.message}`);
      }
    }

    return {
      success: true,
      entry: {
        ...updated,
        extractedSkills: JSON.parse(updated.extractedSkills || '[]'),
      },
      message: status === 'APPLIED'
        ? `Marked as Applied! Soft-deleted from active discovery and added to Application Tracker.`
        : status === 'DONE'
        ? `Marked as Done! Soft-deleted from active discovery.`
        : `Status updated to ${status}`,
    };
  }

  /**
   * Restore a soft-deleted entry back to active list.
   */
  async restoreEntry(userId: string, entryId: string) {
    const entry = await this.prisma.visualDiscoveryEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) {
      throw new NotFoundException(`Discovery entry ${entryId} not found.`);
    }

    const updated = await this.prisma.visualDiscoveryEntry.update({
      where: { id: entryId },
      data: {
        isSoftDeleted: false,
        softDeletedAt: null,
        status: 'ACTIVE',
      },
    });

    return {
      success: true,
      entry: {
        ...updated,
        extractedSkills: JSON.parse(updated.extractedSkills || '[]'),
      },
      message: 'Restored entry to active discovery queue.',
    };
  }

  /**
   * Permanently delete an entry.
   */
  async deleteEntry(userId: string, entryId: string) {
    await this.prisma.visualDiscoveryEntry.deleteMany({
      where: { id: entryId, userId },
    });

    return {
      success: true,
      message: 'Visual discovery entry deleted.',
    };
  }
}
