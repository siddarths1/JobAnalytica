import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateCandidateProfileDto } from './dto/resume.dto';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  async getUserProfiles(userId: string) {
    const profiles = await this.prisma.candidateProfile.findMany({
      where: { userId },
      include: { resume: true },
      orderBy: { isPrimary: 'desc' },
    });

    return profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      resumeId: p.resumeId,
      label: p.label,
      totalExperience: p.totalExperience,
      headline: p.headline,
      summary: p.summary,
      targetRoles: JSON.parse(p.targetRoles || '[]'),
      skills: JSON.parse(p.skills || '[]'),
      primaryLanguages: JSON.parse(p.primaryLanguages || '[]'),
      frameworks: JSON.parse(p.frameworks || '[]'),
      domains: JSON.parse(p.domains || '[]'),
      education: JSON.parse(p.education || '[]'),
      workHistory: JSON.parse(p.workHistory || '[]'),
      isPrimary: p.isPrimary,
      resumeFileName: p.resume?.fileName,
      updatedAt: p.updatedAt,
    }));
  }

  async createCandidateProfile(userId: string, dto: CreateCandidateProfileDto) {
    const existingProfilesCount = await this.prisma.candidateProfile.count({
      where: { userId },
    });

    const isPrimary = dto.isPrimary ?? existingProfilesCount === 0;

    if (isPrimary) {
      await this.prisma.candidateProfile.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    const profile = await this.prisma.candidateProfile.create({
      data: {
        userId,
        label: dto.label || 'Custom Resume Profile',
        totalExperience: dto.totalExperience || 3,
        headline: dto.headline || `${dto.label} Specialist`,
        summary: dto.summary || `Experienced professional specializing in ${dto.skills.slice(0, 5).join(', ')}.`,
        targetRoles: JSON.stringify(dto.targetRoles || []),
        skills: JSON.stringify(dto.skills || []),
        primaryLanguages: JSON.stringify(dto.primaryLanguages || ['TypeScript', 'JavaScript']),
        frameworks: JSON.stringify(dto.frameworks || ['React', 'Node.js', 'NestJS']),
        domains: JSON.stringify(dto.domains || ['SaaS', 'Cloud Engineering']),
        isPrimary,
      },
    });

    await this.jobsService.generateMatchesForUser(userId);
    return profile;
  }

  async uploadAndParseResume(
    userId: string,
    file: Express.Multer.File,
    customLabel?: string,
  ) {
    let parsedText = '';
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      try {
        const pdfData = await pdfParse(file.buffer);
        parsedText = pdfData.text;
      } catch (err: any) {
        this.logger.warn(`PDF parse error: ${err.message}. Using buffer string.`);
        parsedText = file.buffer.toString('utf8');
      }
    } else {
      parsedText = file.buffer.toString('utf8');
    }

    const lower = parsedText.toLowerCase();
    const knownSkills = [
      'JavaScript', 'TypeScript', 'Node.js', 'React', 'Next.js', 'NestJS', 'Python', 'FastAPI',
      'Django', 'Java', 'Spring Boot', 'Go', 'Rust', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'GraphQL', 'REST', 'CI/CD', 'Kafka', 'AI/ML',
    ];

    const detectedSkills = knownSkills.filter((s) => lower.includes(s.toLowerCase()));

    const targetRoles = [];
    if (lower.includes('backend') || lower.includes('node') || lower.includes('python')) targetRoles.push('Backend Engineer');
    if (lower.includes('frontend') || lower.includes('react') || lower.includes('next')) targetRoles.push('Frontend Engineer');
    if (lower.includes('full stack') || lower.includes('fullstack')) targetRoles.push('Full Stack Developer');
    if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('data')) targetRoles.push('AI/ML Engineer');
    if (targetRoles.length === 0) targetRoles.push('Software Engineer');

    const label = customLabel || targetRoles[0] || 'General Resume';

    const resume = await this.prisma.resume.create({
      data: {
        userId,
        label,
        fileName: file.originalname,
        fileUrl: `local://${file.originalname}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        parsedRaw: parsedText.slice(0, 10000),
      },
    });

    const existingCount = await this.prisma.candidateProfile.count({ where: { userId } });

    const profile = await this.prisma.candidateProfile.create({
      data: {
        userId,
        resumeId: resume.id,
        label,
        totalExperience: 3.5,
        headline: `${label} Professional`,
        summary: parsedText.slice(0, 500).replace(/\\s+/g, ' ').trim(),
        targetRoles: JSON.stringify(targetRoles),
        skills: JSON.stringify(detectedSkills.length > 0 ? detectedSkills : ['TypeScript', 'Node.js', 'React']),
        primaryLanguages: JSON.stringify(['TypeScript', 'Python']),
        frameworks: JSON.stringify(['React', 'NestJS', 'Next.js']),
        domains: JSON.stringify(['Web Applications', 'Distributed Systems']),
        isPrimary: existingCount === 0,
      },
    });

    await this.jobsService.generateMatchesForUser(userId);

    return {
      success: true,
      resumeId: resume.id,
      profileId: profile.id,
      label,
      detectedSkills,
      targetRoles,
    };
  }

  async setPrimaryProfile(userId: string, profileId: string) {
    await this.prisma.candidateProfile.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    const profile = await this.prisma.candidateProfile.update({
      where: { id: profileId },
      data: { isPrimary: true },
    });

    await this.jobsService.generateMatchesForUser(userId);
    return profile;
  }

  async deleteProfile(userId: string, profileId: string) {
    const profile = await this.prisma.candidateProfile.findFirst({
      where: { id: profileId, userId },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    await this.prisma.candidateProfile.delete({
      where: { id: profileId },
    });

    if (profile.resumeId) {
      await this.prisma.resume.delete({
        where: { id: profile.resumeId },
      }).catch(() => {});
    }

    await this.jobsService.generateMatchesForUser(userId);
    return { success: true };
  }
}
