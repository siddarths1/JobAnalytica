import { Injectable, Logger } from '@nestjs/common';
import { KNOWN_COMPANIES } from './company-directory.constants';

export interface AtsResolvedPortal {
  companyName: string;
  atsProvider: 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'smartrecruiters' | 'custom';
  portalUrl: string;
  sourceUrlType: 'ats' | 'domain' | 'keyword_matched';
}

@Injectable()
export class AtsResolverService {
  private readonly logger = new Logger(AtsResolverService.name);

  resolveFromInput(rawInput: string): AtsResolvedPortal {
    const input = rawInput.trim().toLowerCase();

    // 1. Direct Greenhouse ATS URL
    const greenhouseMatch = input.match(/(?:boards\.greenhouse\.io|job-boards\.greenhouse\.io)\/([^/?#]+)/i);
    if (greenhouseMatch) {
      return {
        companyName: this.cleanCompanyName(greenhouseMatch[1]),
        atsProvider: 'greenhouse',
        portalUrl: `https://boards-api.greenhouse.io/v1/boards/${greenhouseMatch[1]}/jobs`,
        sourceUrlType: 'ats',
      };
    }

    // 2. Direct Lever ATS URL
    const leverMatch = input.match(/jobs\.lever\.co\/([^/?#]+)/i);
    if (leverMatch) {
      return {
        companyName: this.cleanCompanyName(leverMatch[1]),
        atsProvider: 'lever',
        portalUrl: `https://api.lever.co/v0/postings/${leverMatch[1]}`,
        sourceUrlType: 'ats',
      };
    }

    // 3. Direct Ashby ATS URL
    const ashbyMatch = input.match(/jobs\.ashbyhq\.com\/([^/?#]+)/i);
    if (ashbyMatch) {
      return {
        companyName: this.cleanCompanyName(ashbyMatch[1]),
        atsProvider: 'ashby',
        portalUrl: `https://api.ashbyhq.com/posting-api/job-board/${ashbyMatch[1]}`,
        sourceUrlType: 'ats',
      };
    }

    // 4. Known Company Lookup
    for (const [name, info] of Object.entries(KNOWN_COMPANIES)) {
      if (input.includes(name.toLowerCase()) || name.toLowerCase().includes(input)) {
        return {
          companyName: name,
          atsProvider: info.provider as any,
          portalUrl: info.url,
          sourceUrlType: 'keyword_matched',
        };
      }
    }

    // 5. Default generic company resolver
    const cleanName = this.cleanCompanyName(input.replace(/https?:\/\//, '').split('/')[0].split('.')[0]);
    return {
      companyName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      atsProvider: 'custom',
      portalUrl: `https://${cleanName}.com/careers`,
      sourceUrlType: 'domain',
    };
  }

  private cleanCompanyName(str: string): string {
    return str.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
