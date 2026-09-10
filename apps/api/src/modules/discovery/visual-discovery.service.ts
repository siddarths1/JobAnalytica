import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AtsResolverService, AtsResolvedPortal } from './ats-resolver.service';
import { JobsService } from '../jobs/jobs.service';
import { WorkMode, EmploymentType, ApplicationStatus } from '@jobanalytica/shared-types';
import Tesseract from 'tesseract.js';

export interface VisualDiscoveryJobCandidate {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  primaryApplyUrl: string;
  matchScore: number;
  matchGrade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  matchedSkills: string[];
  missingSkills: string[];
  postedAt: string;
  sourceType: 'ats' | 'domain' | 'keyword_matched';
  companyPortal: string;
}

export interface VisualDiscoveryResult {
  ocrParsedText: string;
  detectedKeywords: string[];
  resolvedPortals: AtsResolvedPortal[];
  jobs: VisualDiscoveryJobCandidate[];
}

@Injectable()
export class VisualDiscoveryService {
  private readonly logger = new Logger(VisualDiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly atsResolver: AtsResolverService,
    private readonly jobsService: JobsService,
  ) {}

  async processScreenshot(file: Express.Multer.File, userId?: string): Promise<VisualDiscoveryResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid or missing image file');
    }

    this.logger.log(`Running OCR extraction on screenshot (${file.size} bytes)...`);
    let ocrText = '';
    try {
      const { data } = await Tesseract.recognize(file.buffer, 'eng');
      ocrText = data.text || '';
    } catch (err: any) {
      this.logger.warn(`OCR extraction failed: ${err.message}. Falling back to text matching.`);
      ocrText = '';
    }

    const detectedKeywords = this.extractKeywords(ocrText);
    const resolvedPortals = detectedKeywords.map((kw) => this.atsResolver.resolveFromInput(kw));

    // Fetch user resume for match scoring
    let resumeSkills: string[] = ['TypeScript', 'Node.js', 'React', 'PostgreSQL'];
    if (userId) {
      const resume = await this.prisma.resume.findFirst({
        where: { userId, isPrimary: true },
      });
      if (resume && resume.skills) {
        try {
          resumeSkills = JSON.parse(resume.skills);
        } catch {}
      }
    }

    const jobs = await this.queryJobsForKeywords(detectedKeywords, resumeSkills);

    return {
      ocrParsedText: ocrText.slice(0, 500),
      detectedKeywords,
      resolvedPortals,
      jobs,
    };
  }

  private extractKeywords(text: string): string[] {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
    const set = new Set<string>();

    const knownEntities = ['Stripe', 'Airbnb', 'GitHub', 'Cloudflare', 'Figma', 'Notion', 'OpenAI', 'Datadog', 'Google', 'Amazon', 'Microsoft'];
    for (const entity of knownEntities) {
      if (new RegExp(`\\b${entity}\\b`, 'i').test(text)) {
        set.add(entity);
      }
    }

    for (const line of lines.slice(0, 10)) {
      if (/^[A-Za-z0-9\s]{3,30}$/.test(line) && !line.toLowerCase().includes('http')) {
        set.add(line);
      }
    }

    return Array.from(set).slice(0, 5);
  }

  private async queryJobsForKeywords(keywords: string[], resumeSkills: string[]): Promise<VisualDiscoveryJobCandidate[]> {
    const conditions = keywords.map((kw) => ({
      OR: [
        { company: { contains: kw } },
        { title: { contains: kw } },
        { description: { contains: kw } },
      ],
    }));

    const foundJobs = await this.prisma.job.findMany({
      where: conditions.length > 0 ? { OR: conditions.flatMap((c) => c.OR) } : {},
      take: 20,
      orderBy: { postedAt: 'desc' },
    });

    return foundJobs.map((job) => {
      let requiredSkills: string[] = [];
      try {
        requiredSkills = JSON.parse(job.requiredSkills || '[]');
      } catch {}

      const matchedSkills = requiredSkills.filter((s) =>
        resumeSkills.some((rs) => rs.toLowerCase() === s.toLowerCase()),
      );
      const missingSkills = requiredSkills.filter(
        (s) => !resumeSkills.some((rs) => rs.toLowerCase() === s.toLowerCase()),
      );

      const score = requiredSkills.length > 0
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 75;

      let matchGrade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'FAIR';
      if (score >= 80) matchGrade = 'EXCELLENT';
      else if (score >= 60) matchGrade = 'GOOD';
      else if (score < 40) matchGrade = 'POOR';

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        workMode: job.workMode as WorkMode,
        employmentType: job.employmentType as EmploymentType,
        primaryApplyUrl: job.primaryApplyUrl,
        matchScore: score,
        matchGrade,
        matchedSkills,
        missingSkills,
        postedAt: job.postedAt.toISOString(),
        sourceType: 'ats',
        companyPortal: `https://${job.company.toLowerCase().replace(/\s+/g, '')}.com/careers`,
      };
    });
  }
}
