/**
 * Onboarding Static Data
 *
 * Static data for onboarding flow including user types, industries,
 * app benefits, and default configurations.
 */

import {
  UserTypeOption,
  IndustryCategory,
  AppBenefit,
  PermissionRequest,
  TimeZone,
} from '../types/onboarding';

// User type options with descriptions and benefits
export const USER_TYPE_OPTIONS: UserTypeOption[] = [
  {
    id: 'founder',
    title: 'Founder',
    description: 'Building and leading a company',
    icon: 'rocket-launch',
    benefits: [
      'Connect with investors and advisors',
      'Find co-founders and key talent',
      'Access startup resources and mentorship',
      'Join founder communities',
      'Showcase your company to potential partners',
    ],
  },
  {
    id: 'investor',
    title: 'Investor',
    description: 'Investing in startups and companies',
    icon: 'trending-up',
    benefits: [
      'Discover high-potential startups',
      'Connect with other investors',
      'Access deal flow and due diligence',
      'Build your investment portfolio network',
      'Share expertise with entrepreneurs',
    ],
  },
  {
    id: 'employee',
    title: 'Professional',
    description: 'Working as an employee or consultant',
    icon: 'briefcase',
    benefits: [
      'Find exciting job opportunities',
      'Connect with industry professionals',
      'Build your professional network',
      'Access career development resources',
      'Discover companies and startups',
    ],
  },
];

// App benefits for welcome screen
export const APP_BENEFITS: AppBenefit[] = [
  {
    id: 'networking',
    title: 'Smart Networking',
    description:
      'Connect with the right people based on your goals and interests',
    icon: 'people',
    color: '#3B82F6',
  },
  {
    id: 'opportunities',
    title: 'Discover Opportunities',
    description:
      'Find investment deals, job opportunities, and business partnerships',
    icon: 'search',
    color: '#10B981',
  },
  {
    id: 'insights',
    title: 'Industry Insights',
    description: 'Stay updated with industry trends and expert knowledge',
    icon: 'analytics',
    color: '#F59E0B',
  },
  {
    id: 'community',
    title: 'Join Communities',
    description:
      'Be part of exclusive groups and industry-specific communities',
    icon: 'chatbubbles',
    color: '#8B5CF6',
  },
];

// Permission requests configuration
export const PERMISSION_REQUESTS: PermissionRequest[] = [
  {
    type: 'notifications',
    title: 'Push Notifications',
    description:
      'Get notified about new connections, messages, and opportunities',
    icon: 'notifications',
    required: false,
  },
  {
    type: 'contacts',
    title: 'Contacts Access',
    description: 'Find people you know and invite them to connect',
    icon: 'person-add',
    required: false,
  },
  {
    type: 'location',
    title: 'Location Services',
    description: 'Discover local events and nearby professionals',
    icon: 'location',
    required: false,
  },
  {
    type: 'camera',
    title: 'Camera Access',
    description: 'Take photos for your profile and share moments',
    icon: 'camera',
    required: false,
  },
];

// Industry categories and options
export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  {
    id: 'technology',
    name: 'Technology',
    industries: [
      {
        id: 'software',
        name: 'Software & SaaS',
        category: 'technology',
        keywords: ['software', 'saas', 'platform', 'app', 'web'],
      },
      {
        id: 'ai-ml',
        name: 'Artificial Intelligence & Machine Learning',
        category: 'technology',
        keywords: [
          'ai',
          'ml',
          'artificial intelligence',
          'machine learning',
          'deep learning',
        ],
      },
      {
        id: 'cybersecurity',
        name: 'Cybersecurity',
        category: 'technology',
        keywords: ['security', 'cybersecurity', 'privacy', 'encryption'],
      },
      {
        id: 'blockchain',
        name: 'Blockchain & Crypto',
        category: 'technology',
        keywords: ['blockchain', 'crypto', 'cryptocurrency', 'web3', 'defi'],
      },
      {
        id: 'mobile',
        name: 'Mobile Technology',
        category: 'technology',
        keywords: ['mobile', 'ios', 'android', 'app development'],
      },
      {
        id: 'cloud',
        name: 'Cloud Computing',
        category: 'technology',
        keywords: ['cloud', 'aws', 'azure', 'gcp', 'infrastructure'],
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance & Fintech',
    industries: [
      {
        id: 'fintech',
        name: 'Financial Technology',
        category: 'finance',
        keywords: ['fintech', 'payments', 'banking', 'financial services'],
      },
      {
        id: 'investment',
        name: 'Investment & Wealth Management',
        category: 'finance',
        keywords: ['investment', 'wealth management', 'portfolio', 'trading'],
      },
      {
        id: 'insurance',
        name: 'Insurance & Insurtech',
        category: 'finance',
        keywords: ['insurance', 'insurtech', 'risk management'],
      },
      {
        id: 'real-estate',
        name: 'Real Estate & Proptech',
        category: 'finance',
        keywords: ['real estate', 'proptech', 'property', 'construction'],
      },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    industries: [
      {
        id: 'healthtech',
        name: 'Health Technology',
        category: 'healthcare',
        keywords: [
          'healthtech',
          'digital health',
          'telemedicine',
          'medical devices',
        ],
      },
      {
        id: 'biotech',
        name: 'Biotechnology',
        category: 'healthcare',
        keywords: ['biotech', 'pharmaceuticals', 'drug discovery', 'genomics'],
      },
      {
        id: 'medtech',
        name: 'Medical Devices',
        category: 'healthcare',
        keywords: ['medical devices', 'diagnostics', 'surgical equipment'],
      },
    ],
  },
  {
    id: 'commerce',
    name: 'Commerce & Retail',
    industries: [
      {
        id: 'ecommerce',
        name: 'E-commerce & Marketplaces',
        category: 'commerce',
        keywords: ['ecommerce', 'marketplace', 'retail', 'online shopping'],
      },
      {
        id: 'consumer-goods',
        name: 'Consumer Goods',
        category: 'commerce',
        keywords: ['consumer goods', 'cpg', 'fmcg', 'retail products'],
      },
      {
        id: 'fashion',
        name: 'Fashion & Beauty',
        category: 'commerce',
        keywords: ['fashion', 'beauty', 'cosmetics', 'apparel', 'lifestyle'],
      },
    ],
  },
  {
    id: 'media',
    name: 'Media & Entertainment',
    industries: [
      {
        id: 'content',
        name: 'Content & Media',
        category: 'media',
        keywords: ['content', 'media', 'publishing', 'journalism', 'news'],
      },
      {
        id: 'gaming',
        name: 'Gaming & Esports',
        category: 'media',
        keywords: ['gaming', 'esports', 'game development', 'entertainment'],
      },
      {
        id: 'streaming',
        name: 'Streaming & Video',
        category: 'media',
        keywords: ['streaming', 'video', 'entertainment', 'ott'],
      },
    ],
  },
  {
    id: 'sustainability',
    name: 'Sustainability & Climate',
    industries: [
      {
        id: 'cleantech',
        name: 'Clean Technology',
        category: 'sustainability',
        keywords: [
          'cleantech',
          'renewable energy',
          'solar',
          'wind',
          'green tech',
        ],
      },
      {
        id: 'climate',
        name: 'Climate & Environment',
        category: 'sustainability',
        keywords: [
          'climate',
          'environment',
          'sustainability',
          'carbon',
          'green',
        ],
      },
    ],
  },
  {
    id: 'mobility',
    name: 'Mobility & Transportation',
    industries: [
      {
        id: 'automotive',
        name: 'Automotive & EV',
        category: 'mobility',
        keywords: ['automotive', 'electric vehicles', 'ev', 'transportation'],
      },
      {
        id: 'logistics',
        name: 'Logistics & Supply Chain',
        category: 'mobility',
        keywords: ['logistics', 'supply chain', 'shipping', 'delivery'],
      },
    ],
  },
  {
    id: 'other',
    name: 'Other Industries',
    industries: [
      {
        id: 'education',
        name: 'Education & Edtech',
        category: 'other',
        keywords: ['education', 'edtech', 'learning', 'training'],
      },
      {
        id: 'food',
        name: 'Food & Agriculture',
        category: 'other',
        keywords: ['food', 'agriculture', 'foodtech', 'agtech'],
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing & Industrial',
        category: 'other',
        keywords: ['manufacturing', 'industrial', 'automation', 'robotics'],
      },
    ],
  },
];

// Common timezones
export const COMMON_TIMEZONES: TimeZone[] = [
  {
    id: 'utc',
    name: 'UTC (Coordinated Universal Time)',
    offset: '+00:00',
    region: 'Global',
  },
  {
    id: 'est',
    name: 'Eastern Time (EST)',
    offset: '-05:00',
    region: 'North America',
  },
  {
    id: 'cst',
    name: 'Central Time (CST)',
    offset: '-06:00',
    region: 'North America',
  },
  {
    id: 'mst',
    name: 'Mountain Time (MST)',
    offset: '-07:00',
    region: 'North America',
  },
  {
    id: 'pst',
    name: 'Pacific Time (PST)',
    offset: '-08:00',
    region: 'North America',
  },
  {
    id: 'gmt',
    name: 'Greenwich Mean Time (GMT)',
    offset: '+00:00',
    region: 'Europe',
  },
  {
    id: 'cet',
    name: 'Central European Time (CET)',
    offset: '+01:00',
    region: 'Europe',
  },
  {
    id: 'eet',
    name: 'Eastern European Time (EET)',
    offset: '+02:00',
    region: 'Europe',
  },
  {
    id: 'ist',
    name: 'India Standard Time (IST)',
    offset: '+05:30',
    region: 'Asia',
  },
  {
    id: 'jst',
    name: 'Japan Standard Time (JST)',
    offset: '+09:00',
    region: 'Asia',
  },
  {
    id: 'aest',
    name: 'Australian Eastern Time (AEST)',
    offset: '+10:00',
    region: 'Australia',
  },
];

// Default onboarding configuration
export const DEFAULT_ONBOARDING_CONFIG = {
  skipEnabled: true,
  autoAdvance: false,
  showProgress: true,
  allowBack: true,
  requiredSteps: ['userType', 'industry'],
  optionalSteps: ['location', 'permissions'],
};
