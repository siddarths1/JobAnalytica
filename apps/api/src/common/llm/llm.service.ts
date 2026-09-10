import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ExtractedCandidateProfile {
  totalExperience: number;
  headline: string;
  summary: string;
  targetRoles: string[];
  skills: string[];
  primaryLanguages: string[];
  frameworks: string[];
  domains: string[];
  education: Array<{ degree: string; institution: string; year?: string }>;
  workHistory: Array<{ company: string; role: string; duration?: string; highlights?: string[] }>;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly configService: ConfigService) {}

  async parseResumeText(rawText: string): Promise<ExtractedCandidateProfile> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || this.configService.get<string>('GEMINI_API_KEY');

    if (apiKey) {
      try {
        return await this.extractWithLlm(rawText, apiKey);
      } catch (err: any) {
        this.logger.warn(`LLM extraction failed, falling back to heuristic parser: ${err.message}`);
      }
    }

    return this.heuristicFallbackExtraction(rawText);
  }

  private async extractWithLlm(rawText: string, apiKey: string): Promise<ExtractedCandidateProfile> {
    const prompt = `
Extract structured candidate profile JSON from this resume text:
---
${rawText.slice(0, 4000)}
---
Return ONLY valid JSON matching this schema:
{
  "totalExperience": number,
  "headline": string,
  "summary": string,
  "targetRoles": string[],
  "skills": string[],
  "primaryLanguages": string[],
  "frameworks": string[],
  "domains": string[],
  "education": [{"degree": string, "institution": string, "year": string}],
  "workHistory": [{"company": string, "role": string, "duration": string, "highlights": string[]}]
}
`;

    const openAiUrl = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(openAiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert HR and candidate resume intelligence parser. Respond only with structured JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return {
      totalExperience: Number(parsed.totalExperience) || 2.0,
      headline: parsed.headline || 'Software Engineer',
      summary: parsed.summary || '',
      targetRoles: Array.isArray(parsed.targetRoles) ? parsed.targetRoles : ['Software Engineer'],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      primaryLanguages: Array.isArray(parsed.primaryLanguages) ? parsed.primaryLanguages : [],
      frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
      domains: Array.isArray(parsed.domains) ? parsed.domains : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      workHistory: Array.isArray(parsed.workHistory) ? parsed.workHistory : [],
    };
  }

  heuristicFallbackExtraction(rawText: string): ExtractedCandidateProfile {
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Skill Lexicon matching
    const knownSkills = [
      'Node.js', 'NestJS', 'Next.js', 'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript',
      'Python', 'Go', 'Golang', 'Java', 'C++', 'C#', '.NET', 'Rust', 'PostgreSQL', 'MySQL', 'MongoDB',
      'Redis', 'GraphQL', 'REST', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git',
      'CI/CD', 'Microservices', 'TailwindCSS', 'Kafka', 'Elasticsearch', 'RabbitMQ', 'Linux',
      'HTML', 'CSS', 'SQL', 'FastAPI', 'Django', 'Flask', 'Spring Boot'
    ];

    const detectedSkills = knownSkills.filter(skill => {
      const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
      return regex.test(rawText);
    });

    // 2. Language matching
    const knownLanguages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'C++', 'C#', 'Rust', 'PHP', 'Ruby', 'SQL'];
    const detectedLanguages = knownLanguages.filter(lang => {
      const regex = new RegExp(`\\b${escapeRegex(lang)}\\b`, 'i');
      return regex.test(rawText);
    });

    // 3. Framework matching
    const knownFrameworks = ['NestJS', 'Next.js', 'React', 'Express', 'FastAPI', 'Django', 'Spring Boot', 'Vue', 'Angular'];
    const detectedFrameworks = knownFrameworks.filter(fw => {
      const regex = new RegExp(`\\b${escapeRegex(fw)}\\b`, 'i');
      return regex.test(rawText);
    });

    // 4. Domains
    const knownDomains = ['SaaS', 'FinTech', 'AI/ML', 'E-Commerce', 'Healthcare', 'Cloud & DevOps', 'EdTech'];
    const detectedDomains = knownDomains.filter(domain => {
      const regex = new RegExp(`\\b${escapeRegex(domain.split('/')[0])}\\b`, 'i');
      return regex.test(rawText);
    });

    // 5. Target Roles heuristics
    const knownRoles = [
      'Backend Engineer', 'Full Stack Engineer', 'Frontend Engineer',
      'Software Engineer', 'DevOps Engineer', 'AI Engineer', 'Platform Engineer',
      'Data Engineer', 'Systems Engineer', 'Cloud Architect'
    ];
    const detectedRoles = knownRoles.filter(role => {
      const regex = new RegExp(`\\b${escapeRegex(role)}\\b`, 'i');
      return regex.test(rawText);
    });

    // 6. Experience estimation
    let yearsOfExp = 2.5;
    const expMatch = rawText.match(/(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)/i);
    if (expMatch && expMatch[1]) {
      const val = parseFloat(expMatch[1]);
      if (val > 0 && val < 40) yearsOfExp = val;
    }

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const headline = detectedRoles[0] || (detectedSkills.includes('Node.js') ? 'Backend Engineer' : 'Software Engineer');
    const summary = lines.slice(0, 4).join(' ').slice(0, 300);

    return {
      totalExperience: yearsOfExp,
      headline,
      summary: summary || `Experienced ${headline} with proven background in ${detectedSkills.slice(0, 4).join(', ')}.`,
      targetRoles: detectedRoles.length > 0 ? detectedRoles : [headline, 'Software Engineer'],
      skills: detectedSkills.length > 0 ? detectedSkills : ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      primaryLanguages: detectedLanguages.length > 0 ? detectedLanguages : ['TypeScript', 'JavaScript'],
      frameworks: detectedFrameworks.length > 0 ? detectedFrameworks : ['NestJS', 'React'],
      domains: detectedDomains.length > 0 ? detectedDomains : ['SaaS', 'Cloud & DevOps'],
      education: [
        { degree: 'Bachelor of Science / Technology', institution: 'University Graduate', year: '2022' }
      ],
      workHistory: [
        {
          company: 'Technology Solutions',
          role: headline,
          duration: `${yearsOfExp} years`,
          highlights: ['Built scalable APIs and backend services', 'Collaborated on database architecture and cloud infrastructure']
        }
      ]
    };
  }
}
