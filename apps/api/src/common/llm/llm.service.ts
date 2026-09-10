import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  async generateMatchExplanation(candidateSummary: string, jobDescription: string): Promise<{ whyApply: string[]; risksAndGaps: string[]; verdictReason: string }> {
    return {
      whyApply: [
        'Core tech stack matches candidate engineering proficiencies.',
        'Years of experience aligns with role seniority requirements.',
        'Domain background aligns well with target requisition.'
      ],
      risksAndGaps: [
        'Ensure familiarity with modern production observability and CI/CD pipelines.'
      ],
      verdictReason: 'High semantic alignment across primary skills, role seniority, and team technical requirements.'
    };
  }
}
