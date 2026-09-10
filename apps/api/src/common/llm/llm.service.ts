import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly configService: ConfigService) {}

  async parseResumeText(rawText: string): Promise<{
    skills: string[];
    experienceYears: number;
    roles: string[];
    summary: string;
  }> {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

    const commonSkills = [
      'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
      'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'NestJS', 'Express',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
      'AWS', 'GCP', 'Azure', 'Git', 'CI/CD', 'GraphQL', 'REST'
    ];

    const detectedSkills = commonSkills.filter((s) =>
      new RegExp(`\\b${s}\\b`, 'i').test(rawText),
    );

    let experienceYears = 2;
    const expMatch = rawText.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (expMatch) {
      experienceYears = parseInt(expMatch[1], 10);
    }

    const summary = lines.slice(0, 3).join(' ') || 'Experienced software professional';

    return {
      skills: detectedSkills.length > 0 ? detectedSkills : ['TypeScript', 'React', 'Node.js'],
      experienceYears,
      roles: ['Software Engineer', 'Full Stack Engineer'],
      summary,
    };
  }
}
