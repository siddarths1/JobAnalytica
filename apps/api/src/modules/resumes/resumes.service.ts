import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LlmService } from '../../common/llm/llm.service';
import { UpdateCandidateProfileDto } from './dto/resume.dto';
import { JobsService } from '../jobs/jobs.service';
const pdfParse = require('pdf-parse');

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly jobsService: JobsService,
  ) {}

  async createProfileDirectly(userId: string, body: any) {
    const existingCount = await this.prisma.candidateProfile.count({ where: { userId } });
    const isFirst = existingCount === 0 || !!body.isPrimary;
    const label = body.label || 'Candidate Profile';

    if (body.isPrimary) {
      await this.prisma.candidateProfile.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    const profile = await this.prisma.candidateProfile.create({
      data: {
        userId,
        label,
        totalExperience: body.totalExperience || 3.0,
        headline: body.headline || label,
        summary: body.summary || 'Profile summary',
        targetRoles: JSON.stringify(body.targetRoles || []),
        skills: JSON.stringify(body.skills || []),
        primaryLanguages: JSON.stringify(body.primaryLanguages || []),
        frameworks: JSON.stringify(body.frameworks || []),
        domains: JSON.stringify(body.domains || []),
        isPrimary: isFirst,
      },
    });

    return {
      success: true,
      profile,
    };
  }

  async uploadAndParsePdf(userId: string, file: Express.Multer.File, customLabel?: string) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No resume file provided.');
    }

    let parsedText = '';
    try {
      const pdfData = await pdfParse(file.buffer);
      parsedText = (pdfData && pdfData.text) ? pdfData.text.trim() : '';
    } catch (err: any) {
      parsedText = this.fallbackExtractPdfText(file.buffer);
    }

    if (!parsedText) {
      parsedText = this.fallbackExtractPdfText(file.buffer);
    }

    if (!parsedText || parsedText.length < 5) {
      throw new BadRequestException('Could not extract readable text from the PDF.');
    }

    const existingCount = await this.prisma.candidateProfile.count({ where: { userId } });
    const isFirst = existingCount === 0;
    const extracted = await this.llmService.parseResumeText(parsedText);
    const label = customLabel?.trim() || extracted.headline || `Role Profile #${existingCount + 1}`;

    const resume = await this.prisma.resume.create({
      data: {
        userId,
        label,
        fileName: file.originalname || 'resume.pdf',
        fileUrl: 'local://uploads/' + (file.originalname || 'resume.pdf'),
        fileSize: file.size || file.buffer.length,
        mimeType: file.mimetype || 'application/pdf',
        parsedRaw: parsedText,
        isPrimary: isFirst,
      },
    });

    const profile = await this.prisma.candidateProfile.create({
      data: {
        userId,
        resumeId: resume.id,
        label,
        totalExperience: extracted.totalExperience,
        headline: extracted.headline,
        summary: extracted.summary,
        targetRoles: JSON.stringify(extracted.targetRoles || []),
        skills: JSON.stringify(extracted.skills || []),
        primaryLanguages: JSON.stringify(extracted.primaryLanguages || []),
        frameworks: JSON.stringify(extracted.frameworks || []),
        domains: JSON.stringify(extracted.domains || []),
        education: JSON.stringify(extracted.education || []),
        workHistory: JSON.stringify(extracted.workHistory || []),
        isPrimary: isFirst,
      },
    });

    // Recalculate matches across all profiles for this user
    await this.jobsService.generateMatchesForUser(userId);

    return { resume, profile: this.formatProfile(profile, resume.fileName) };
  }

  async getAllProfiles(userId: string) {
    const profiles = await this.prisma.candidateProfile.findMany({
      where: { userId },
      include: { resume: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    return profiles.map((p) => this.formatProfile(p, p.resume?.fileName));
  }

  async setPrimaryProfile(userId: string, profileId: string) {
    await this.prisma.candidateProfile.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    const primary = await this.prisma.candidateProfile.update({
      where: { id: profileId },
      data: { isPrimary: true },
      include: { resume: true },
    });

    if (primary.resumeId) {
      await this.prisma.resume.updateMany({ where: { userId }, data: { isPrimary: false } });
      await this.prisma.resume.update({ where: { id: primary.resumeId }, data: { isPrimary: true } });
    }

    await this.jobsService.generateMatchesForUser(userId);
    return this.formatProfile(primary, primary.resume?.fileName);
  }

  async deleteProfile(userId: string, profileId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile || profile.userId !== userId) {
      throw new NotFoundException('Profile not found.');
    }

    if (profile.resumeId) {
      await this.prisma.resume.delete({ where: { id: profile.resumeId } }).catch(() => {});
    }

    await this.prisma.candidateProfile.delete({ where: { id: profileId } });
    await this.prisma.jobMatch.deleteMany({ where: { userId, profileId } }).catch(() => {});

    // Ensure at least one profile is primary if any exist
    const remaining = await this.prisma.candidateProfile.findFirst({
      where: { userId },
    });
    if (remaining) {
      await this.prisma.candidateProfile.update({
        where: { id: remaining.id },
        data: { isPrimary: true },
      });
    }

    await this.jobsService.generateMatchesForUser(userId);
    return { success: true };
  }

  async updateProfile(userId: string, profileId: string, dto: UpdateCandidateProfileDto) {
    const profile = await this.prisma.candidateProfile.update({
      where: { id: profileId },
      data: {
        totalExperience: dto.totalExperience,
        headline: dto.headline,
        summary: dto.summary,
        targetRoles: JSON.stringify(dto.targetRoles || []),
        skills: JSON.stringify(dto.skills || []),
        primaryLanguages: JSON.stringify(dto.primaryLanguages || []),
        frameworks: JSON.stringify(dto.frameworks || []),
        domains: JSON.stringify(dto.domains || []),
        education: JSON.stringify(dto.education || []),
        workHistory: JSON.stringify(dto.workHistory || []),
      },
      include: { resume: true },
    });

    await this.jobsService.generateMatchesForUser(userId);
    return this.formatProfile(profile, profile.resume?.fileName);
  }

  private fallbackExtractPdfText(buffer: Buffer): string {
    try {
      const str = buffer.toString('latin1');
      const matches: string[] = [];
      const tjRegex = /\(([^()]+)\)\s*Tj/g;
      let match;
      while ((match = tjRegex.exec(str)) !== null) {
        if (match[1]) matches.push(match[1]);
      }
      if (matches.length > 0) return matches.join(' ').replace(/\\([()])/g, '$1');
      const asciiRegex = /[A-Za-z0-9,.:;()\/\-+@#&\s]{4,}/g;
      const words = str.match(asciiRegex) || [];
      return words.filter(w => !w.startsWith('obj') && !w.startsWith('endobj') && !w.startsWith('stream')).join(' ');
    } catch {
      return '';
    }
  }

  private formatProfile(profile: any, fileName?: string | null) {
    return {
      ...profile,
      resumeFileName: fileName || null,
      targetRoles: JSON.parse(profile.targetRoles || '[]'),
      skills: JSON.parse(profile.skills || '[]'),
      primaryLanguages: JSON.parse(profile.primaryLanguages || '[]'),
      frameworks: JSON.parse(profile.frameworks || '[]'),
      domains: JSON.parse(profile.domains || '[]'),
      education: JSON.parse(profile.education || '[]'),
      workHistory: JSON.parse(profile.workHistory || '[]'),
    };
  }
}
