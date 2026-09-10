import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LlmService } from '../../common/llm/llm.service';
import pdf from 'pdf-parse';

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) {}

  async getUserResumes(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async uploadResume(userId: string, file: Express.Multer.File) {
    let rawText = '';
    try {
      const parsedPdf = await pdf(file.buffer);
      rawText = parsedPdf.text || '';
    } catch (err: any) {
      this.logger.warn(`Failed to parse PDF text: ${err.message}. Saving empty text.`);
      rawText = '';
    }

    const { skills, experienceYears, summary } = await this.llmService.parseResumeText(rawText);

    // If this is the user's first resume, make it primary automatically
    const existingCount = await this.prisma.resume.count({ where: { userId } });
    const isPrimary = existingCount === 0;

    return this.prisma.resume.create({
      data: {
        userId,
        fileName: file.originalname,
        rawText,
        skills: JSON.stringify(skills),
        experienceYears,
        summary,
        isPrimary,
      },
    });
  }

  async setPrimaryResume(userId: string, resumeId: string) {
    const target = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!target) {
      throw new NotFoundException('Resume not found');
    }

    await this.prisma.resume.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    return this.prisma.resume.update({
      where: { id: resumeId },
      data: { isPrimary: true },
    });
  }

  async deleteResume(userId: string, resumeId: string) {
    const target = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!target) {
      throw new NotFoundException('Resume not found');
    }

    return this.prisma.resume.delete({
      where: { id: resumeId },
    });
  }
}
