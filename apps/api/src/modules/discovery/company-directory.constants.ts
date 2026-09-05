export interface TargetCompany {
  name: string;
  hubId: string;
  tier: 'STARTUP_EARLY_STAGE' | 'TIER_2_MID_CAP' | 'TIER_3_SERVICES' | 'TIER_1_LARGE_CAP';
  scale: 'STARTUP' | 'MID_MARKET' | 'ENTERPRISE' | 'SERVICES';
  atsType?: 'greenhouse' | 'ashby' | 'lever' | 'workday' | 'direct';
  atsSlug?: string;
  website: string;
  careersUrl: string;
  sampleRoles: Array<{
    title: string;
    skills: string[];
    minExp: number;
    workMode: 'REMOTE' | 'HYBRID' | 'ONSITE';
    minSalary?: number;
    maxSalary?: number;
  }>;
}

export const TOP_COMPANIES_BY_HUB: TargetCompany[] = [
  // --- BENGALURU ---
  {
    name: 'Langflow',
    hubId: 'bengaluru',
    tier: 'STARTUP_EARLY_STAGE',
    scale: 'STARTUP',
    atsType: 'ashby',
    atsSlug: 'langflow',
    website: 'https://langflow.org',
    careersUrl: 'https://langflow.org/careers',
    sampleRoles: [
      { title: 'Founding AI Systems Engineer', skills: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'AI/ML'], minExp: 2, workMode: 'REMOTE', minSalary: 2500000, maxSalary: 4500000 },
      { title: 'Senior Frontend Engineer (React/Canvas)', skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'], minExp: 3, workMode: 'REMOTE', minSalary: 2200000, maxSalary: 3800000 },
    ],
  },
  {
    name: 'DevRev',
    hubId: 'bengaluru',
    tier: 'STARTUP_EARLY_STAGE',
    scale: 'STARTUP',
    atsType: 'greenhouse',
    atsSlug: 'devrev',
    website: 'https://devrev.ai',
    careersUrl: 'https://devrev.ai/careers',
    sampleRoles: [
      { title: 'Backend Platform Engineer', skills: ['Go', 'Python', 'PostgreSQL', 'GraphQL', 'Kubernetes'], minExp: 2, workMode: 'HYBRID', minSalary: 2200000, maxSalary: 4000000 },
    ],
  },
  {
    name: 'Postman',
    hubId: 'bengaluru',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'greenhouse',
    atsSlug: 'postman',
    website: 'https://postman.com',
    careersUrl: 'https://postman.com/company/careers',
    sampleRoles: [
      { title: 'Senior Software Engineer (API Platform)', skills: ['TypeScript', 'Node.js', 'React', 'AWS', 'Microservices'], minExp: 3, workMode: 'REMOTE', minSalary: 2800000, maxSalary: 4800000 },
    ],
  },
  {
    name: 'Hasura',
    hubId: 'bengaluru',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'lever',
    atsSlug: 'hasura',
    website: 'https://hasura.io',
    careersUrl: 'https://hasura.io/careers',
    sampleRoles: [
      { title: 'Backend Software Engineer - GraphQL Engine', skills: ['Go', 'Rust', 'PostgreSQL', 'GraphQL', 'Docker'], minExp: 3, workMode: 'REMOTE', minSalary: 2600000, maxSalary: 4500000 },
    ],
  },
  {
    name: 'Razorpay',
    hubId: 'bengaluru',
    tier: 'TIER_1_LARGE_CAP',
    scale: 'ENTERPRISE',
    atsType: 'lever',
    atsSlug: 'razorpay',
    website: 'https://razorpay.com',
    careersUrl: 'https://razorpay.com/jobs',
    sampleRoles: [
      { title: 'Senior Backend Engineer (Payments Core)', skills: ['Node.js', 'NestJS', 'Go', 'Kafka', 'PostgreSQL', 'AWS'], minExp: 3, workMode: 'HYBRID', minSalary: 3000000, maxSalary: 5500000 },
      { title: 'Frontend Engineer (Merchant Experience)', skills: ['React', 'TypeScript', 'Next.js', 'Redux', 'REST'], minExp: 2, workMode: 'HYBRID', minSalary: 2000000, maxSalary: 3500000 },
    ],
  },
  {
    name: 'Thoughtworks',
    hubId: 'bengaluru',
    tier: 'TIER_3_SERVICES',
    scale: 'SERVICES',
    atsType: 'direct',
    website: 'https://thoughtworks.com',
    careersUrl: 'https://thoughtworks.com/careers',
    sampleRoles: [
      { title: 'Lead Software Consultant', skills: ['Java', 'Node.js', 'Spring Boot', 'Microservices', 'CI/CD', 'PostgreSQL'], minExp: 4, workMode: 'HYBRID', minSalary: 2000000, maxSalary: 3400000 },
    ],
  },

  // --- HYDERABAD ---
  {
    name: 'Darwinbox',
    hubId: 'hyderabad',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'lever',
    atsSlug: 'darwinbox',
    website: 'https://darwinbox.com',
    careersUrl: 'https://darwinbox.com/careers',
    sampleRoles: [
      { title: 'Full Stack Engineer - HR Tech Core', skills: ['Node.js', 'React', 'MongoDB', 'Redis', 'AWS'], minExp: 2, workMode: 'HYBRID', minSalary: 1800000, maxSalary: 3000000 },
    ],
  },
  {
    name: 'HighRadius',
    hubId: 'hyderabad',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'greenhouse',
    atsSlug: 'highradius',
    website: 'https://highradius.com',
    careersUrl: 'https://highradius.com/careers',
    sampleRoles: [
      { title: 'Software Engineer - AI Financial Platform', skills: ['Java', 'Python', 'AI/ML', 'MySQL', 'Spring Boot'], minExp: 2, workMode: 'HYBRID', minSalary: 1700000, maxSalary: 2800000 },
    ],
  },
  {
    name: 'Persistent Systems',
    hubId: 'hyderabad',
    tier: 'TIER_3_SERVICES',
    scale: 'SERVICES',
    atsType: 'direct',
    website: 'https://persistent.com',
    careersUrl: 'https://persistent.com/careers',
    sampleRoles: [
      { title: 'Senior Backend Developer - Cloud Practice', skills: ['NestJS', 'TypeScript', 'Node.js', 'MySQL', 'AWS'], minExp: 3, workMode: 'ONSITE', minSalary: 1600000, maxSalary: 2700000 },
    ],
  },
  {
    name: 'Uber India Tech Center',
    hubId: 'hyderabad',
    tier: 'TIER_1_LARGE_CAP',
    scale: 'ENTERPRISE',
    atsType: 'greenhouse',
    atsSlug: 'uber',
    website: 'https://uber.com',
    careersUrl: 'https://uber.com/careers',
    sampleRoles: [
      { title: 'Software Engineer II - Mobility Platform', skills: ['Go', 'Java', 'Kafka', 'Distributed Systems', 'Docker'], minExp: 3, workMode: 'HYBRID', minSalary: 3200000, maxSalary: 6000000 },
    ],
  },

  // --- PUNE ---
  {
    name: 'Druva',
    hubId: 'pune',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'greenhouse',
    atsSlug: 'druva',
    website: 'https://druva.com',
    careersUrl: 'https://druva.com/about/careers',
    sampleRoles: [
      { title: 'Cloud Infrastructure & Storage Engineer', skills: ['Python', 'AWS', 'Docker', 'Kubernetes', 'Linux'], minExp: 3, workMode: 'HYBRID', minSalary: 2400000, maxSalary: 4200000 },
    ],
  },
  {
    name: 'Icertis',
    hubId: 'pune',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'greenhouse',
    atsSlug: 'icertis',
    website: 'https://icertis.com',
    careersUrl: 'https://icertis.com/company/careers',
    sampleRoles: [
      { title: 'Senior Software Engineer (Enterprise Contract AI)', skills: ['C#', '.NET', 'Azure', 'React', 'TypeScript', 'SQL'], minExp: 3, workMode: 'HYBRID', minSalary: 2000000, maxSalary: 3600000 },
    ],
  },
  {
    name: 'Coforge',
    hubId: 'pune',
    tier: 'TIER_3_SERVICES',
    scale: 'SERVICES',
    atsType: 'direct',
    website: 'https://coforge.com',
    careersUrl: 'https://coforge.com/careers',
    sampleRoles: [
      { title: 'Full Stack Java / React Engineer', skills: ['Java', 'Spring Boot', 'React', 'TypeScript', 'MySQL'], minExp: 3, workMode: 'HYBRID', minSalary: 1400000, maxSalary: 2400000 },
    ],
  },

  // --- DELHI NCR ---
  {
    name: 'Zomato',
    hubId: 'ncr',
    tier: 'TIER_1_LARGE_CAP',
    scale: 'ENTERPRISE',
    atsType: 'lever',
    atsSlug: 'zomato',
    website: 'https://zomato.com',
    careersUrl: 'https://zomato.com/careers',
    sampleRoles: [
      { title: 'Software Development Engineer - Ordering Infra', skills: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Microservices'], minExp: 2, workMode: 'ONSITE', minSalary: 2600000, maxSalary: 4800000 },
    ],
  },
  {
    name: 'Urban Company',
    hubId: 'ncr',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'lever',
    atsSlug: 'urbancompany',
    website: 'https://urbancompany.com',
    careersUrl: 'https://urbancompany.com/careers',
    sampleRoles: [
      { title: 'Senior Backend Engineer', skills: ['Node.js', 'Python', 'MySQL', 'Redis', 'Kafka'], minExp: 3, workMode: 'HYBRID', minSalary: 2500000, maxSalary: 4200000 },
    ],
  },
  {
    name: 'Nagarro',
    hubId: 'ncr',
    tier: 'TIER_3_SERVICES',
    scale: 'SERVICES',
    atsType: 'direct',
    website: 'https://nagarro.com',
    careersUrl: 'https://nagarro.com/careers',
    sampleRoles: [
      { title: 'Senior Software Engineer (Cloud Solutions)', skills: ['Node.js', 'TypeScript', 'AWS', 'Docker', 'PostgreSQL'], minExp: 3, workMode: 'REMOTE', minSalary: 1600000, maxSalary: 2800000 },
    ],
  },

  // --- CHENNAI ---
  {
    name: 'Freshworks',
    hubId: 'chennai',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'greenhouse',
    atsSlug: 'freshworks',
    website: 'https://freshworks.com',
    careersUrl: 'https://freshworks.com/careers',
    sampleRoles: [
      { title: 'Full Stack Engineer (Customer Experience)', skills: ['Ruby', 'Node.js', 'React', 'PostgreSQL', 'AWS'], minExp: 2, workMode: 'HYBRID', minSalary: 2000000, maxSalary: 3600000 },
    ],
  },
  {
    name: 'LTI Mindtree',
    hubId: 'chennai',
    tier: 'TIER_3_SERVICES',
    scale: 'SERVICES',
    atsType: 'direct',
    website: 'https://ltimindtree.com',
    careersUrl: 'https://ltimindtree.com/careers',
    sampleRoles: [
      { title: 'Frontend Developer (React / Next.js)', skills: ['React', 'Next.js', 'JavaScript', 'TailwindCSS', 'REST'], minExp: 2, workMode: 'HYBRID', minSalary: 1300000, maxSalary: 2200000 },
    ],
  },

  // --- MUMBAI ---
  {
    name: 'BrowserStack',
    hubId: 'mumbai',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'greenhouse',
    atsSlug: 'browserstack',
    website: 'https://browserstack.com',
    careersUrl: 'https://browserstack.com/careers',
    sampleRoles: [
      { title: 'Senior Software Engineer - Infrastructure', skills: ['Node.js', 'Python', 'Linux', 'AWS', 'Docker', 'Kubernetes'], minExp: 3, workMode: 'HYBRID', minSalary: 2600000, maxSalary: 4200000 },
    ],
  },
  {
    name: 'CleverTap',
    hubId: 'mumbai',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'greenhouse',
    atsSlug: 'clevertap',
    website: 'https://clevertap.com',
    careersUrl: 'https://clevertap.com/careers',
    sampleRoles: [
      { title: 'Backend Distributed Systems Engineer', skills: ['Java', 'C++', 'Redis', 'Kafka', 'Distributed Systems'], minExp: 3, workMode: 'HYBRID', minSalary: 2500000, maxSalary: 4000000 },
    ],
  },

  // --- AHMEDABAD & GIFT CITY ---
  {
    name: 'HyperVerge',
    hubId: 'ahmedabad_gift',
    tier: 'STARTUP_EARLY_STAGE',
    scale: 'STARTUP',
    atsType: 'lever',
    atsSlug: 'hyperverge',
    website: 'https://hyperverge.co',
    careersUrl: 'https://hyperverge.co/careers',
    sampleRoles: [
      { title: 'Computer Vision & AI Platform Engineer', skills: ['Python', 'PyTorch', 'FastAPI', 'Docker', 'AI/ML'], minExp: 2, workMode: 'REMOTE', minSalary: 2000000, maxSalary: 3800000 },
    ],
  },

  // --- KOCHI ---
  {
    name: 'SurveySparrow',
    hubId: 'kochi',
    tier: 'TIER_2_MID_CAP',
    scale: 'MID_MARKET',
    atsType: 'lever',
    atsSlug: 'surveysparrow',
    website: 'https://surveysparrow.com',
    careersUrl: 'https://surveysparrow.com/careers',
    sampleRoles: [
      { title: 'Frontend Engineer (React & Microfrontends)', skills: ['React', 'TypeScript', 'Redux', 'REST', 'CSS'], minExp: 2, workMode: 'HYBRID', minSalary: 1400000, maxSalary: 2400000 },
    ],
  },
];
