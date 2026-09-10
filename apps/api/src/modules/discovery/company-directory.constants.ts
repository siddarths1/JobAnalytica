export interface CompanyPortalDirectoryEntry {
  provider: 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'smartrecruiters' | 'custom';
  url: string;
  category: 'Tech & Cloud' | 'Fintech' | 'AI & Data' | 'Enterprise' | 'Design & Collab';
}

export const KNOWN_COMPANIES: Record<string, CompanyPortalDirectoryEntry> = {
  Stripe: {
    provider: 'greenhouse',
    url: 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs',
    category: 'Fintech',
  },
  Airbnb: {
    provider: 'greenhouse',
    url: 'https://boards-api.greenhouse.io/v1/boards/airbnb/jobs',
    category: 'Tech & Cloud',
  },
  GitHub: {
    provider: 'greenhouse',
    url: 'https://boards-api.greenhouse.io/v1/boards/github/jobs',
    category: 'Tech & Cloud',
  },
  Cloudflare: {
    provider: 'greenhouse',
    url: 'https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs',
    category: 'Tech & Cloud',
  },
  Figma: {
    provider: 'lever',
    url: 'https://api.lever.co/v0/postings/figma',
    category: 'Design & Collab',
  },
  Notion: {
    provider: 'ashby',
    url: 'https://api.ashbyhq.com/posting-api/job-board/notion',
    category: 'Design & Collab',
  },
  OpenAI: {
    provider: 'greenhouse',
    url: 'https://boards-api.greenhouse.io/v1/boards/openai/jobs',
    category: 'AI & Data',
  },
  Datadog: {
    provider: 'greenhouse',
    url: 'https://boards-api.greenhouse.io/v1/boards/datadog/jobs',
    category: 'Enterprise',
  },
};
