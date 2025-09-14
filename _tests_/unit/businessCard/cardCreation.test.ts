/**
 * Business Card Creation Tests
 *
 * Comprehensive tests for business card creation functionality including
 * all field types, validation, form handling, and error scenarios.
 */

import {
  validateBusinessCardForm,
  validateBasicInfo,
  validateStartupInfo,
  validateSocialLinks,
  validateCustomFields,
  isBusinessCardFormValid,
  getBusinessCardCompletionPercentage,
  getBusinessCardSuggestions,
} from '../../../src/utils/businessCardValidation';

import {
  BusinessCardFormData,
  BusinessCard,
  BasicInfo,
  StartupInfo,
  SocialLinks,
  CustomField,
  FundingStage,
  TeamSize,
  BusinessModel,
  RevenueStage,
} from '../../../src/types/businessCard';

describe('Business Card Creation - All Field Types', () => {
  // Extended field type coverage for comprehensive testing
  const validBasicInfo: BasicInfo = {
    name: 'John Smith',
    title: 'CEO & Founder',
    company: 'TechStart Inc.',
    email: 'john@techstart.com',
    phone: '+1-555-123-4567',
    location: 'San Francisco, CA',
    bio: 'Experienced entrepreneur with a passion for innovative technology solutions.',
    profilePhoto: 'https://example.com/profile.jpg',
    companyLogo: 'https://example.com/logo.png',
  };

  const validStartupInfo: StartupInfo = {
    fundingStage: 'seed',
    fundingAmount: '$2M',
    fundingRound: 'Seed Round A',
    teamSize: '11-25',
    foundedYear: 2023,
    industry: ['Technology', 'SaaS', 'AI'],
    businessModel: 'b2b',
    revenue: '0-10k',
    customers: '50+ early adopters',
    growth: '20% MoM',
    seekingFunding: true,
    seekingTalent: true,
    seekingPartners: false,
    seekingMentors: true,
  };

  const validSocialLinks: SocialLinks = {
    linkedin: 'https://linkedin.com/in/johnsmith',
    twitter: 'https://twitter.com/johnsmith',
    website: 'https://techstart.com',
    github: 'https://github.com/johnsmith',
    gitlab: 'https://gitlab.com/johnsmith',
    stackoverflow: 'https://stackoverflow.com/users/123456/johnsmith',
    instagram: 'https://instagram.com/johnsmith',
    facebook: 'https://facebook.com/johnsmith',
    youtube: 'https://youtube.com/c/johnsmith',
    tiktok: 'https://tiktok.com/@johnsmith',
    telegram: 'https://t.me/johnsmith',
    whatsapp: 'https://wa.me/15551234567',
    discord: 'https://discord.gg/johnsmith',
    slack: 'https://techstart.slack.com/team/U123456',
    medium: 'https://medium.com/@johnsmith',
    behance: 'https://behance.net/johnsmith',
    dribbble: 'https://dribbble.com/johnsmith',
    producthunt: 'https://producthunt.com/@johnsmith',
    angellist: 'https://angellist.com/johnsmith',
    crunchbase: 'https://crunchbase.com/person/john-smith',
  };

  const validCustomFields: CustomField[] = [
    {
      id: '1',
      label: 'Investment Focus',
      value: 'B2B SaaS, AI, Fintech',
      type: 'text',
      icon: '💼',
      isPublic: true,
      order: 1,
    },
    {
      id: '2',
      label: 'Portfolio Website',
      value: 'https://portfolio.johnsmith.com',
      type: 'url',
      icon: '🌐',
      isPublic: true,
      order: 2,
    },
    {
      id: '3',
      label: 'Secondary Email',
      value: 'john.personal@email.com',
      type: 'email',
      icon: '📧',
      isPublic: false,
      order: 3,
    },
    {
      id: '4',
      label: 'Mobile Number',
      value: '+1-555-987-6543',
      type: 'phone',
      icon: '📱',
      isPublic: true,
      order: 4,
    },
    {
      id: '5',
      label: 'Years of Experience',
      value: '15',
      type: 'number',
      icon: '📈',
      isPublic: true,
      order: 5,
    },
    {
      id: '6',
      label: 'Next Funding Date',
      value: '2024-12-31',
      type: 'date',
      icon: '📅',
      isPublic: false,
      order: 6,
    },
    {
      id: '7',
      label: 'Looking for Investors',
      value: 'true',
      type: 'boolean',
      icon: '💰',
      isPublic: true,
      order: 7,
    },
  ];

  const validFormData: BusinessCardFormData = {
    basicInfo: validBasicInfo,
    startupInfo: validStartupInfo,
    socialLinks: validSocialLinks,
    customFields: validCustomFields,
    themeId: 'professional-theme-1',
    templateId: 'startup-template-1',
    isDefault: false,
    isPublic: true,
  };

  describe('Basic Information Validation', () => {
    test('should validate complete basic info successfully', () => {
      const errors = validateBasicInfo(validBasicInfo);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('should require name field', () => {
      const invalidInfo = { ...validBasicInfo, name: '' };
      const errors = validateBasicInfo(invalidInfo);
      expect(errors.name).toBe('Name is required');
    });

    test('should require title field', () => {
      const invalidInfo = { ...validBasicInfo, title: '' };
      const errors = validateBasicInfo(invalidInfo);
      expect(errors.title).toBe('Title is required');
    });

    test('should require company field', () => {
      const invalidInfo = { ...validBasicInfo, company: '' };
      const errors = validateBasicInfo(invalidInfo);
      expect(errors.company).toBe('Company is required');
    });

    test('should require email field', () => {
      const invalidInfo = { ...validBasicInfo, email: '' };
      const errors = validateBasicInfo(invalidInfo);
      expect(errors.email).toBe('Email is required');
    });

    test('should validate email format', () => {
      const invalidInfo = { ...validBasicInfo, email: 'invalid-email' };
      const errors = validateBasicInfo(invalidInfo);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    test('should validate phone format when provided', () => {
      const invalidInfo = { ...validBasicInfo, phone: 'invalid-phone' };
      const errors = validateBasicInfo(invalidInfo);
      expect(errors.phone).toBe('Please enter a valid phone number');
    });

    test('should enforce name length limits', () => {
      const shortName = { ...validBasicInfo, name: 'A' };
      const longName = { ...validBasicInfo, name: 'A'.repeat(51) };

      expect(validateBasicInfo(shortName).name).toContain(
        'at least 2 characters',
      );
      expect(validateBasicInfo(longName).name).toContain(
        'less than 50 characters',
      );
    });
  });

  describe('Startup Information Validation', () => {
    test('should validate complete startup info successfully', () => {
      const errors = validateStartupInfo(validStartupInfo);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('should validate funding stages', () => {
      const validStages: FundingStage[] = [
        'idea',
        'pre-seed',
        'seed',
        'series-a',
        'series-b',
        'series-c',
        'series-d+',
        'ipo',
        'acquired',
        'bootstrapped',
      ];

      validStages.forEach(stage => {
        const info = { ...validStartupInfo, fundingStage: stage };
        const errors = validateStartupInfo(info);
        expect(errors.fundingStage).toBeUndefined();
      });
    });

    test('should validate team sizes', () => {
      const validSizes: TeamSize[] = [
        'solo',
        '2-5',
        '6-10',
        '11-25',
        '26-50',
        '51-100',
        '101-250',
        '250+',
      ];

      validSizes.forEach(size => {
        const info = { ...validStartupInfo, teamSize: size };
        const errors = validateStartupInfo(info);
        expect(errors.teamSize).toBeUndefined();
      });
    });

    test('should validate business models', () => {
      const validModels: BusinessModel[] = [
        'b2b',
        'b2c',
        'b2b2c',
        'marketplace',
        'saas',
        'subscription',
        'freemium',
        'advertising',
        'commission',
        'licensing',
        'hardware',
        'other',
      ];

      validModels.forEach(model => {
        const info = { ...validStartupInfo, businessModel: model };
        const errors = validateStartupInfo(info);
        expect(errors.fundingStage).toBeUndefined();
      });
    });

    test('should validate founded year', () => {
      const currentYear = new Date().getFullYear();
      const validYear = { ...validStartupInfo, foundedYear: currentYear };
      const oldYear = { ...validStartupInfo, foundedYear: 1800 };
      const futureYear = { ...validStartupInfo, foundedYear: currentYear + 2 };

      expect(validateStartupInfo(validYear).fundingStage).toBeUndefined();
      expect(validateStartupInfo(oldYear).fundingStage).toContain(
        'valid founded year',
      );
      expect(validateStartupInfo(futureYear).fundingStage).toContain(
        'valid founded year',
      );
    });
  });

  describe('Social Links Validation', () => {
    test('should validate all social links successfully', () => {
      const errors = validateSocialLinks(validSocialLinks);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('should validate LinkedIn URLs', () => {
      const validLinkedIn = [
        'https://linkedin.com/in/user',
        'https://www.linkedin.com/company/company',
      ];
      const invalidLinkedIn = ['https://facebook.com/user', 'not-a-url'];

      validLinkedIn.forEach(url => {
        const links = { linkedin: url };
        const errors = validateSocialLinks(links);
        expect(errors.linkedin).toBeUndefined();
      });

      invalidLinkedIn.forEach(url => {
        const links = { linkedin: url };
        const errors = validateSocialLinks(links);
        expect(errors.linkedin).toBeDefined();
      });
    });

    test('should validate Twitter URLs', () => {
      const validTwitter = ['https://twitter.com/user', 'https://x.com/user'];
      const invalidTwitter = ['https://facebook.com/user', 'not-a-url'];

      validTwitter.forEach(url => {
        const links = { twitter: url };
        const errors = validateSocialLinks(links);
        expect(errors.twitter).toBeUndefined();
      });

      invalidTwitter.forEach(url => {
        const links = { twitter: url };
        const errors = validateSocialLinks(links);
        expect(errors.twitter).toBeDefined();
      });
    });

    test('should validate GitHub URLs', () => {
      const validGitHub = [
        'https://github.com/user',
        'https://www.github.com/user',
      ];
      const invalidGitHub = ['https://gitlab.com/user', 'not-a-url'];

      validGitHub.forEach(url => {
        const links = { github: url };
        const errors = validateSocialLinks(links);
        expect(errors.github).toBeUndefined();
      });

      invalidGitHub.forEach(url => {
        const links = { github: url };
        const errors = validateSocialLinks(links);
        expect(errors.github).toBeDefined();
      });
    });

    test('should validate general URLs for non-specific platforms', () => {
      const validWebsite = 'https://example.com';
      const invalidWebsite = 'not-a-url';

      const validLinks = { website: validWebsite };
      const invalidLinks = { website: invalidWebsite };

      expect(validateSocialLinks(validLinks).website).toBeUndefined();
      expect(validateSocialLinks(invalidLinks).website).toBeDefined();
    });
  });

  describe('Custom Fields Validation', () => {
    test('should validate all custom field types successfully', () => {
      const errors = validateCustomFields(validCustomFields);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('should enforce maximum custom fields limit', () => {
      const tooManyFields = Array.from({ length: 12 }, (_, i) => ({
        id: String(i),
        label: `Field ${i}`,
        value: `Value ${i}`,
        type: 'text' as const,
        isPublic: true,
        order: i,
      }));

      const errors = validateCustomFields(tooManyFields);
      expect(errors.general).toContain('up to 10 custom fields');
    });

    test('should require field labels and values', () => {
      const invalidFields: CustomField[] = [
        {
          id: '1',
          label: '',
          value: 'Valid Value',
          type: 'text',
          isPublic: true,
          order: 1,
        },
        {
          id: '2',
          label: 'Valid Label',
          value: '',
          type: 'text',
          isPublic: true,
          order: 2,
        },
      ];

      const errors = validateCustomFields(invalidFields);
      expect(errors.field_0).toContain('Label is required');
      expect(errors.field_1).toContain('Value is required');
    });

    test('should validate email custom fields', () => {
      const emailField: CustomField[] = [
        {
          id: '1',
          label: 'Email',
          value: 'invalid-email',
          type: 'email',
          isPublic: true,
          order: 1,
        },
      ];

      const errors = validateCustomFields(emailField);
      expect(errors.field_0).toContain('valid email address');
    });

    test('should validate phone custom fields', () => {
      const phoneField: CustomField[] = [
        {
          id: '1',
          label: 'Phone',
          value: 'invalid-phone',
          type: 'phone',
          isPublic: true,
          order: 1,
        },
      ];

      const errors = validateCustomFields(phoneField);
      expect(errors.field_0).toContain('valid phone number');
    });

    test('should validate URL custom fields', () => {
      const urlField: CustomField[] = [
        {
          id: '1',
          label: 'Website',
          value: 'not-a-url',
          type: 'url',
          isPublic: true,
          order: 1,
        },
      ];

      const errors = validateCustomFields(urlField);
      expect(errors.field_0).toContain('valid URL');
    });

    test('should validate number custom fields', () => {
      const numberField: CustomField[] = [
        {
          id: '1',
          label: 'Count',
          value: 'not-a-number',
          type: 'number',
          isPublic: true,
          order: 1,
        },
      ];

      const errors = validateCustomFields(numberField);
      expect(errors.field_0).toContain('valid number');
    });

    test('should validate date custom fields', () => {
      const dateField: CustomField[] = [
        {
          id: '1',
          label: 'Date',
          value: 'not-a-date',
          type: 'date',
          isPublic: true,
          order: 1,
        },
      ];

      const errors = validateCustomFields(dateField);
      expect(errors.field_0).toContain('valid date');
    });

    test('should prevent duplicate field labels', () => {
      const duplicateFields: CustomField[] = [
        {
          id: '1',
          label: 'Website',
          value: 'https://site1.com',
          type: 'url',
          isPublic: true,
          order: 1,
        },
        {
          id: '2',
          label: 'website', // Same label (case-insensitive)
          value: 'https://site2.com',
          type: 'url',
          isPublic: true,
          order: 2,
        },
      ];

      const errors = validateCustomFields(duplicateFields);
      expect(errors.general).toContain('must be unique');
    });
  });

  describe('Complete Form Validation', () => {
    test('should validate complete form successfully', () => {
      const errors = validateBusinessCardForm(validFormData);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('should require theme selection', () => {
      const invalidForm = { ...validFormData, themeId: '' };
      const errors = validateBusinessCardForm(invalidForm);
      expect(errors.theme).toBe('Please select a theme');
    });

    test('should require template selection', () => {
      const invalidForm = { ...validFormData, templateId: '' };
      const errors = validateBusinessCardForm(invalidForm);
      expect(errors.template).toBe('Please select a template');
    });

    test('should check form validity correctly', () => {
      const validErrors = validateBusinessCardForm(validFormData);
      expect(isBusinessCardFormValid(validFormData, validErrors)).toBe(true);

      const invalidForm = {
        ...validFormData,
        basicInfo: { ...validBasicInfo, name: '' },
      };
      const invalidErrors = validateBusinessCardForm(invalidForm);
      expect(isBusinessCardFormValid(invalidForm, invalidErrors)).toBe(false);
    });
  });

  describe('Form Completion and Suggestions', () => {
    test('should calculate completion percentage', () => {
      const completion = getBusinessCardCompletionPercentage(validFormData);
      expect(completion).toBeGreaterThan(80);
      expect(completion).toBeLessThanOrEqual(100);
    });

    test('should provide helpful suggestions', () => {
      const minimalForm: BusinessCardFormData = {
        basicInfo: {
          name: 'John Smith',
          title: 'CEO',
          company: 'TechStart',
          email: 'john@techstart.com',
        },
        socialLinks: {},
        customFields: [],
        themeId: 'theme-1',
        templateId: 'template-1',
      };

      const suggestions = getBusinessCardSuggestions(minimalForm);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('phone'))).toBe(true);
      expect(suggestions.some(s => s.includes('LinkedIn'))).toBe(true);
    });

    test('should suggest profile photo when missing', () => {
      const noPhotoForm = {
        ...validFormData,
        basicInfo: { ...validBasicInfo, profilePhoto: '' },
      };

      const suggestions = getBusinessCardSuggestions(noPhotoForm);
      expect(suggestions.some(s => s.includes('profile photo'))).toBe(true);
    });

    test('should suggest bio when missing or too short', () => {
      const noBioForm = {
        ...validFormData,
        basicInfo: { ...validBasicInfo, bio: '' },
      };

      const shortBioForm = {
        ...validFormData,
        basicInfo: { ...validBasicInfo, bio: 'Short' },
      };

      expect(
        getBusinessCardSuggestions(noBioForm).some(s => s.includes('bio')),
      ).toBe(true);
      expect(
        getBusinessCardSuggestions(shortBioForm).some(s => s.includes('bio')),
      ).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null and undefined values gracefully', () => {
      const nullForm = {
        basicInfo: { name: null, title: null, company: null, email: null },
        socialLinks: {},
        customFields: [],
        themeId: '',
        templateId: '',
      } as any;

      expect(() => validateBusinessCardForm(nullForm)).not.toThrow();
    });

    test('should handle empty arrays and objects', () => {
      const emptyForm: BusinessCardFormData = {
        basicInfo: {} as BasicInfo,
        socialLinks: {},
        customFields: [],
        themeId: '',
        templateId: '',
      };

      expect(() => validateBusinessCardForm(emptyForm)).not.toThrow();
    });

    test('should handle very long input values', () => {
      const longStringForm = {
        ...validFormData,
        basicInfo: {
          ...validBasicInfo,
          name: 'A'.repeat(1000),
          bio: 'B'.repeat(1000),
        },
      };

      const errors = validateBusinessCardForm(longStringForm);
      expect(errors.basicInfo?.name).toBeDefined();
    });

    test('should handle special characters in fields', () => {
      const specialCharForm = {
        ...validFormData,
        basicInfo: {
          ...validBasicInfo,
          name: 'José María Aznar-López',
          company: 'Company™ & Co.',
        },
      };

      const errors = validateBusinessCardForm(specialCharForm);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle typical startup founder profile', () => {
      const founderProfile: BusinessCardFormData = {
        basicInfo: {
          name: 'Sarah Chen',
          title: 'Co-Founder & CTO',
          company: 'AI Vision Labs',
          email: 'sarah@aivisionlabs.ai',
          phone: '+1-415-555-0123',
          location: 'Palo Alto, CA',
          bio: 'Building the future of computer vision with deep learning. Former Google AI researcher with 8 years in ML.',
        },
        startupInfo: {
          fundingStage: 'series-a',
          teamSize: '11-25',
          industry: ['AI', 'Computer Vision', 'B2B'],
          businessModel: 'b2b',
          revenue: '100k-1m',
          seekingFunding: false,
          seekingTalent: true,
          seekingPartners: true,
          seekingMentors: false,
        },
        socialLinks: {
          linkedin: 'https://linkedin.com/in/sarahchen',
          twitter: 'https://twitter.com/sarahchen_ai',
          github: 'https://github.com/sarahchen',
          website: 'https://aivisionlabs.ai',
        },
        customFields: [
          {
            id: '1',
            label: 'Patents Filed',
            value: '3',
            type: 'number',
            isPublic: true,
            order: 1,
          },
          {
            id: '2',
            label: 'Research Papers',
            value: '12',
            type: 'number',
            isPublic: true,
            order: 2,
          },
        ],
        themeId: 'tech-theme',
        templateId: 'modern-template',
        isDefault: true,
        isPublic: true,
      };

      const errors = validateBusinessCardForm(founderProfile);
      expect(Object.keys(errors)).toHaveLength(0);

      const completion = getBusinessCardCompletionPercentage(founderProfile);
      expect(completion).toBeGreaterThan(85);
    });

    test('should handle investor profile', () => {
      const investorProfile: BusinessCardFormData = {
        basicInfo: {
          name: 'Michael Rodriguez',
          title: 'Managing Partner',
          company: 'Venture Capital Partners',
          email: 'michael@vcpartners.com',
          phone: '+1-212-555-0987',
          location: 'New York, NY',
          bio: 'Investing in early-stage B2B SaaS companies. $500M+ AUM. Former entrepreneur with 3 exits.',
        },
        startupInfo: {
          fundingStage: 'acquired',
          teamSize: '51-100',
          industry: ['Venture Capital', 'B2B', 'SaaS'],
          businessModel: 'commission',
          revenue: '10m-100m',
          seekingFunding: false,
          seekingTalent: false,
          seekingPartners: true,
          seekingMentors: false,
        },
        socialLinks: {
          linkedin: 'https://linkedin.com/in/michaelrodriguez',
          twitter: 'https://twitter.com/mrodriguez_vc',
          website: 'https://vcpartners.com',
          angellist: 'https://angellist.com/michaelrodriguez',
          crunchbase: 'https://crunchbase.com/person/michael-rodriguez',
        },
        customFields: [
          {
            id: '1',
            label: 'Investment Range',
            value: '$500K - $5M',
            type: 'text',
            isPublic: true,
            order: 1,
          },
          {
            id: '2',
            label: 'Check Size',
            value: '$1M',
            type: 'text',
            isPublic: true,
            order: 2,
          },
          {
            id: '3',
            label: 'Portfolio Companies',
            value: '45',
            type: 'number',
            isPublic: true,
            order: 3,
          },
        ],
        themeId: 'professional-theme',
        templateId: 'executive-template',
        isDefault: true,
        isPublic: true,
      };

      const errors = validateBusinessCardForm(investorProfile);
      expect(Object.keys(errors)).toHaveLength(0);

      const completion = getBusinessCardCompletionPercentage(investorProfile);
      expect(completion).toBeGreaterThan(90);
    });
  });

  describe('Comprehensive Field Types Testing', () => {
    test('should handle all supported custom field types', () => {
      const allFieldTypes: CustomField[] = [
        {
          id: '1',
          label: 'Text Field',
          value: 'Sample text content',
          type: 'text',
          isPublic: true,
          order: 1,
        },
        {
          id: '2',
          label: 'Email Field',
          value: 'test@example.com',
          type: 'email',
          isPublic: true,
          order: 2,
        },
        {
          id: '3',
          label: 'Phone Field',
          value: '+1-555-987-6543',
          type: 'phone',
          isPublic: true,
          order: 3,
        },
        {
          id: '4',
          label: 'URL Field',
          value: 'https://example.com',
          type: 'url',
          isPublic: true,
          order: 4,
        },
        {
          id: '5',
          label: 'Number Field',
          value: '42',
          type: 'number',
          isPublic: true,
          order: 5,
        },
        {
          id: '6',
          label: 'Date Field',
          value: '2024-12-31',
          type: 'date',
          isPublic: true,
          order: 6,
        },
        {
          id: '7',
          label: 'Social Media',
          value: 'https://twitter.com/user',
          type: 'social',
          isPublic: true,
          order: 7,
        },
        {
          id: '8',
          label: 'Location',
          value: 'San Francisco, CA, USA',
          type: 'location',
          isPublic: true,
          order: 8,
        },
      ];

      const errors = validateCustomFields(allFieldTypes);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('should validate complex business profiles', () => {
      const complexProfile: BusinessCardFormData = {
        basicInfo: {
          name: 'Dr. Sarah Chen',
          title: 'Chief Technology Officer & Co-Founder',
          company: 'NextGen AI Solutions',
          email: 'sarah.chen@nextgenai.com',
          phone: '+1-555-789-0123',
          location: 'Seattle, WA',
          bio: 'AI researcher turned entrepreneur with 15 years experience building scalable machine learning systems. PhD in Computer Science from Stanford.',
          profilePhoto: 'https://cdn.nextgenai.com/profiles/sarah-chen.jpg',
          companyLogo: 'https://cdn.nextgenai.com/logo.png',
        },
        startupInfo: {
          fundingStage: 'series-a',
          fundingAmount: '$15M',
          fundingRound: 'Series A',
          teamSize: '26-50',
          foundedYear: 2021,
          industry: ['AI/ML', 'Enterprise Software', 'B2B SaaS'],
          businessModel: 'b2b',
          revenue: '1m-10m',
          customers: '200+ enterprise clients',
          growth: '150% YoY',
          seekingFunding: true,
          seekingTalent: true,
          seekingPartners: true,
          seekingMentors: false,
        },
        socialLinks: {
          linkedin: 'https://linkedin.com/in/sarahchenai',
          twitter: 'https://twitter.com/sarahchen_ai',
          website: 'https://nextgenai.com',
          github: 'https://github.com/sarahchen',
          medium: 'https://medium.com/@sarahchen_ai',
          youtube: 'https://youtube.com/c/nextgenai',
        },
        customFields: [
          {
            id: '1',
            label: 'Research Publications',
            value: '45',
            type: 'number',
            icon: '📚',
            isPublic: true,
            order: 1,
          },
          {
            id: '2',
            label: 'Patents Filed',
            value: '12',
            type: 'number',
            icon: '🔬',
            isPublic: true,
            order: 2,
          },
          {
            id: '3',
            label: 'Next Conference',
            value: '2024-06-15',
            type: 'date',
            icon: '📅',
            isPublic: true,
            order: 3,
          },
          {
            id: '4',
            label: 'Office Hours',
            value: 'Fridays 2-4 PM PST',
            type: 'text',
            icon: '⏰',
            isPublic: true,
            order: 4,
          },
          {
            id: '5',
            label: 'Calendly',
            value: 'https://calendly.com/sarahchen',
            type: 'url',
            icon: '📅',
            isPublic: true,
            order: 5,
          },
        ],
        themeId: 'tech-theme-dark',
        templateId: 'executive-template',
        isDefault: false,
        isPublic: true,
      };

      const errors = validateBusinessCardForm(complexProfile);
      expect(Object.keys(errors)).toHaveLength(0);
      expect(isBusinessCardFormValid(complexProfile, errors)).toBe(true);

      const completion = getBusinessCardCompletionPercentage(complexProfile);
      expect(completion).toBe(100);
    });

    test('should handle international field formats', () => {
      const internationalProfile: BusinessCardFormData = {
        basicInfo: {
          name: 'Akira Tanaka',
          title: 'Managing Director',
          company: '田中グループ (Tanaka Group)',
          email: 'akira@tanaka.co.jp',
          phone: '+81-3-1234-5678',
          location: 'Tokyo, Japan',
          bio: 'Global business leader specializing in cross-cultural partnerships and technology innovation.',
          profilePhoto: 'https://tanaka.co.jp/profiles/akira.jpg',
        },
        startupInfo: {
          fundingStage: 'growth',
          fundingAmount: '¥2B',
          teamSize: '100+',
          foundedYear: 1995,
          industry: ['Manufacturing', 'Technology'],
          businessModel: 'b2b',
          revenue: '100m+',
          seekingFunding: false,
          seekingTalent: true,
          seekingPartners: true,
          seekingMentors: false,
        },
        socialLinks: {
          linkedin: 'https://linkedin.com/in/akira-tanaka-jp',
          website: 'https://tanaka.co.jp',
        },
        customFields: [
          {
            id: '1',
            label: 'WhatsApp (International)',
            value: '+81-90-1234-5678',
            type: 'phone',
            icon: '📱',
            isPublic: true,
            order: 1,
          },
          {
            id: '2',
            label: 'WeChat ID',
            value: 'akira_tanaka_jp',
            type: 'text',
            icon: '💬',
            isPublic: true,
            order: 2,
          },
          {
            id: '3',
            label: 'LINE ID',
            value: '@tanaka_group',
            type: 'text',
            icon: '💚',
            isPublic: true,
            order: 3,
          },
        ],
        themeId: 'minimal-theme',
        templateId: 'international-template',
        isDefault: false,
        isPublic: true,
      };

      const errors = validateBusinessCardForm(internationalProfile);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});
