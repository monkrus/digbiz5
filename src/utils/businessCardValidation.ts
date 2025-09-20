/**
 * Business Card Validation Utilities
 *
 * This file contains validation functions for business card forms, including
 * field validation, form validation, and error message generation.
 */

import {
  BusinessCardFormData,
  BusinessCardValidationErrors,
  BasicInfo,
  StartupInfo,
  BusinessCardSocialLinks,
  CustomField,
  FundingStage,
  TeamSize,
} from '../types/businessCard';

// Regular expressions for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[1-9][\d\s\-()]{7,15}$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

// Social platform specific regex patterns
const SOCIAL_PATTERNS = {
  linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/,
  twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[\w]+\/?$/,
  github: /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/?$/,
  instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[\w.]+\/?$/,
  facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/[\w.]+\/?$/,
  youtube:
    /^(https?:\/\/)?(www\.)?youtube\.com\/(channel\/|user\/|c\/)?[\w-]+\/?$/,
  medium: /^(https?:\/\/)?(www\.)?medium\.com\/@?[\w-]+\/?$/,
  behance: /^(https?:\/\/)?(www\.)?behance\.net\/[\w-]+\/?$/,
  dribbble: /^(https?:\/\/)?(www\.)?dribbble\.com\/[\w-]+\/?$/,
  producthunt: /^(https?:\/\/)?(www\.)?producthunt\.com\/@?[\w-]+\/?$/,
  angellist: /^(https?:\/\/)?(www\.)?angellist\.com\/[\w-]+\/?$/,
  crunchbase:
    /^(https?:\/\/)?(www\.)?crunchbase\.com\/(organization|person)\/[\w-]+\/?$/,
  tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/@?[\w.]+\/?$/,
  discord:
    /^(https?:\/\/)?(www\.)?discord\.gg\/[\w-]+\/?$|^(https?:\/\/)?(www\.)?discord\.com\/(invite|channels)\/[\w-]+\/?$/,
  snapchat: /^(https?:\/\/)?(www\.)?snapchat\.com\/(add|u)\/[\w.]+\/?$/,
  telegram: /^(https?:\/\/)?(www\.)?t\.me\/[\w]+\/?$/,
  whatsapp:
    /^(https?:\/\/)?(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\/[\w+]+\/?$/,
};

// Validation constants
export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 50,
    required: true,
  },
  title: {
    minLength: 2,
    maxLength: 100,
    required: true,
  },
  company: {
    minLength: 2,
    maxLength: 100,
    required: true,
  },
  email: {
    required: true,
  },
  phone: {
    minLength: 7,
    maxLength: 20,
    required: false,
  },
  bio: {
    minLength: 10,
    maxLength: 500,
    required: false,
  },
  location: {
    maxLength: 100,
    required: false,
  },
  customFields: {
    maxCount: 10,
    labelMaxLength: 30,
    valueMaxLength: 200,
  },
  fundingAmount: {
    maxLength: 50,
  },
  fundingRound: {
    maxLength: 50,
  },
  customers: {
    maxLength: 100,
  },
  growth: {
    maxLength: 100,
  },
};

/**
 * Validates basic information fields
 */
export const validateBasicInfo = (
  basicInfo: Partial<BasicInfo>,
): Partial<BusinessCardValidationErrors['basicInfo']> => {
  const errors: Partial<BusinessCardValidationErrors['basicInfo']> = {};

  // Validate name
  if (!basicInfo.name?.trim()) {
    errors.name = 'Name is required';
  } else if (basicInfo.name.length < VALIDATION_RULES.name.minLength) {
    errors.name = `Name must be at least ${VALIDATION_RULES.name.minLength} characters`;
  } else if (basicInfo.name.length > VALIDATION_RULES.name.maxLength) {
    errors.name = `Name must be less than ${VALIDATION_RULES.name.maxLength} characters`;
  }

  // Validate title
  if (!basicInfo.title?.trim()) {
    errors.title = 'Title is required';
  } else if (basicInfo.title.length < VALIDATION_RULES.title.minLength) {
    errors.title = `Title must be at least ${VALIDATION_RULES.title.minLength} characters`;
  } else if (basicInfo.title.length > VALIDATION_RULES.title.maxLength) {
    errors.title = `Title must be less than ${VALIDATION_RULES.title.maxLength} characters`;
  }

  // Validate company
  if (!basicInfo.company?.trim()) {
    errors.company = 'Company is required';
  } else if (basicInfo.company.length < VALIDATION_RULES.company.minLength) {
    errors.company = `Company must be at least ${VALIDATION_RULES.company.minLength} characters`;
  } else if (basicInfo.company.length > VALIDATION_RULES.company.maxLength) {
    errors.company = `Company must be less than ${VALIDATION_RULES.company.maxLength} characters`;
  }

  // Validate email
  if (!basicInfo.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(basicInfo.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate phone (optional)
  if (basicInfo.phone && basicInfo.phone.trim()) {
    if (!PHONE_REGEX.test(basicInfo.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
  }

  return errors;
};

/**
 * Validates startup information fields
 */
export const validateStartupInfo = (
  startupInfo?: Partial<StartupInfo>,
): Partial<BusinessCardValidationErrors['startupInfo']> => {
  if (!startupInfo) return {};

  const errors: Partial<BusinessCardValidationErrors['startupInfo']> = {};

  // Validate funding stage
  const validFundingStages: FundingStage[] = [
    'idea',
    'pre-seed',
    'seed',
    'growth',
    'series-a',
    'series-b',
    'series-c',
    'series-d+',
    'ipo',
    'acquired',
    'bootstrapped',
  ];
  if (
    startupInfo.fundingStage &&
    !validFundingStages.includes(startupInfo.fundingStage)
  ) {
    errors.fundingStage = 'Please select a valid funding stage';
  }

  // Validate team size
  const validTeamSizes: TeamSize[] = [
    'solo',
    '2-5',
    '6-10',
    '11-25',
    '26-50',
    '51-100',
    '101-250',
    '250+',
  ];
  if (startupInfo.teamSize && !validTeamSizes.includes(startupInfo.teamSize)) {
    errors.teamSize = 'Please select a valid team size';
  }

  // Validate industry
  if (startupInfo.industry && startupInfo.industry.length === 0) {
    errors.industry = 'Please select at least one industry';
  }

  // Validate founded year
  if ((startupInfo as any).foundedYear) {
    const currentYear = new Date().getFullYear();
    if (
      (startupInfo as any).foundedYear < 1900 ||
      (startupInfo as any).foundedYear > currentYear + 1
    ) {
      (errors as any).foundedYear = 'Please enter a valid founded year';
    }
  }

  return errors;
};

/**
 * Validates social links
 */
export const validateSocialLinks = (
  socialLinks: Partial<any>,
): Partial<BusinessCardValidationErrors['socialLinks']> => {
  const errors: Partial<BusinessCardValidationErrors['socialLinks']> = {};

  Object.entries(socialLinks).forEach(([platform, url]) => {
    if (url && (url as string).trim()) {
      // Check if platform has specific pattern
      if (platform in SOCIAL_PATTERNS) {
        const pattern =
          SOCIAL_PATTERNS[platform as keyof typeof SOCIAL_PATTERNS];
        if (!pattern.test(url as string)) {
          (errors as any)[platform] = `Please enter a valid ${platform} URL`;
        }
      } else {
        // General URL validation
        if (!URL_REGEX.test(url as string)) {
          (errors as any)[platform] = `Please enter a valid URL`;
        }
      }
    }
  });

  return errors;
};

/**
 * Validates custom fields
 */
export const validateCustomFields = (
  customFields: CustomField[],
): Partial<BusinessCardValidationErrors['customFields']> => {
  const errors: Partial<BusinessCardValidationErrors['customFields']> = {};

  if (customFields.length > VALIDATION_RULES.customFields.maxCount) {
    errors.general = `You can add up to ${VALIDATION_RULES.customFields.maxCount} custom fields`;
    return errors;
  }

  customFields.forEach((field, index) => {
    const fieldErrors: string[] = [];

    // Validate label
    if (!field.label.trim()) {
      fieldErrors.push('Label is required');
    } else if (
      field.label.length > VALIDATION_RULES.customFields.labelMaxLength
    ) {
      fieldErrors.push(
        `Label must be less than ${VALIDATION_RULES.customFields.labelMaxLength} characters`,
      );
    }

    // Validate value
    if (!field.value.trim()) {
      fieldErrors.push('Value is required');
    } else if (
      field.value.length > VALIDATION_RULES.customFields.valueMaxLength
    ) {
      fieldErrors.push(
        `Value must be less than ${VALIDATION_RULES.customFields.valueMaxLength} characters`,
      );
    }

    // Type-specific validation
    if (field.type === 'email' && field.value.trim()) {
      if (!EMAIL_REGEX.test(field.value)) {
        fieldErrors.push('Please enter a valid email address');
      }
    } else if (field.type === 'phone' && field.value.trim()) {
      if (!PHONE_REGEX.test(field.value)) {
        fieldErrors.push('Please enter a valid phone number');
      }
    } else if (field.type === 'url' && field.value.trim()) {
      if (!URL_REGEX.test(field.value)) {
        fieldErrors.push('Please enter a valid URL');
      }
    } else if (field.type === 'number' && field.value.trim()) {
      if (isNaN(Number(field.value))) {
        fieldErrors.push('Please enter a valid number');
      }
    } else if (field.type === 'date' && field.value.trim()) {
      if (isNaN(Date.parse(field.value))) {
        fieldErrors.push('Please enter a valid date');
      }
    }

    if (fieldErrors.length > 0) {
      errors[`field_${index}`] = fieldErrors.join(', ');
    }
  });

  // Check for duplicate labels
  const labels = customFields.map(field => field.label.toLowerCase().trim());
  const duplicates = labels.filter(
    (label, index) => labels.indexOf(label) !== index,
  );
  if (duplicates.length > 0) {
    errors.general = 'Custom field labels must be unique';
  }

  return errors;
};

/**
 * Validates the entire business card form
 */
export const validateBusinessCardForm = (
  formData: BusinessCardFormData,
): BusinessCardValidationErrors => {
  const errors: BusinessCardValidationErrors = {};

  // Validate basic info
  const basicInfoErrors = validateBasicInfo(formData.basicInfo);
  if (basicInfoErrors && Object.keys(basicInfoErrors).length > 0) {
    errors.basicInfo = basicInfoErrors;
  }

  // Validate startup info only if it exists
  if (formData.startupInfo) {
    const startupInfoErrors = validateStartupInfo(formData.startupInfo);
    if (startupInfoErrors && Object.keys(startupInfoErrors).length > 0) {
      errors.startupInfo = startupInfoErrors;
    }
  }

  // Validate social links only if they exist
  if (formData.socialLinks) {
    const socialLinksErrors = validateSocialLinks(formData.socialLinks);
    if (socialLinksErrors && Object.keys(socialLinksErrors).length > 0) {
      errors.socialLinks = socialLinksErrors;
    }
  }

  // Validate custom fields only if they exist
  if (formData.customFields && formData.customFields.length > 0) {
    const customFieldsErrors = validateCustomFields(formData.customFields);
    if (customFieldsErrors && Object.keys(customFieldsErrors).length > 0) {
      errors.customFields = customFieldsErrors;
    }
  }

  // Validate theme and template selection
  if (!formData.themeId) {
    errors.theme = 'Please select a theme';
  }

  if (!formData.templateId) {
    errors.template = 'Please select a template';
  }

  return errors;
};

/**
 * Checks if the business card form is valid
 */
export const isBusinessCardFormValid = (
  formData: BusinessCardFormData,
  errors: BusinessCardValidationErrors,
): boolean => {
  const hasErrors = Object.keys(errors).length > 0;
  const hasRequiredFields =
    formData.basicInfo.name?.trim() &&
    formData.basicInfo.title?.trim() &&
    formData.basicInfo.company?.trim() &&
    formData.basicInfo.email?.trim() &&
    formData.themeId &&
    formData.templateId;

  return !hasErrors && !!hasRequiredFields;
};

/**
 * Gets the completion percentage of a business card
 */
export const getBusinessCardCompletionPercentage = (
  formData: BusinessCardFormData,
): number => {
  const fields = [
    // Basic info (weight: 60%)
    formData.basicInfo.name,
    formData.basicInfo.title,
    formData.basicInfo.company,
    formData.basicInfo.email,
    formData.basicInfo.phone,
    formData.basicInfo.location,
    formData.basicInfo.bio,
    formData.basicInfo.profilePhoto,

    // Social links (weight: 20%)
    formData.socialLinks.linkedin,
    formData.socialLinks.twitter,
    formData.socialLinks.website,

    // Startup info (weight: 15%)
    formData.startupInfo?.fundingStage,
    formData.startupInfo?.teamSize,
    formData.startupInfo?.industry?.length,

    // Theme/template (weight: 5%)
    formData.themeId,
    formData.templateId,
  ];

  const completedFields = fields.filter(field => {
    if (Array.isArray(field)) {
      return field.length > 0;
    }
    return field && String(field).trim().length > 0;
  }).length;

  return Math.round((completedFields / fields.length) * 100);
};

/**
 * Gets suggested improvements for business card completion
 */
export const getBusinessCardSuggestions = (
  formData: BusinessCardFormData,
): string[] => {
  const suggestions: string[] = [];

  // Basic info suggestions
  if (!formData.basicInfo.phone) {
    suggestions.push(
      'Add your phone number to make it easy for contacts to reach you',
    );
  }

  if (!formData.basicInfo.location) {
    suggestions.push('Add your location to help with local networking');
  }

  if (!formData.basicInfo.bio || formData.basicInfo.bio.length < 50) {
    suggestions.push('Add a compelling bio to tell your story');
  }

  if (!formData.basicInfo.profilePhoto) {
    suggestions.push(
      'Add a professional profile photo to make your card more personal',
    );
  }

  // Social links suggestions
  const socialLinksCount = Object.values(formData.socialLinks || {}).filter(
    link => link?.trim(),
  ).length;
  if (socialLinksCount < 2) {
    suggestions.push('Add social media links to expand your network');
  }

  if (!formData.socialLinks?.linkedin) {
    suggestions.push(
      "Add your LinkedIn profile - it's essential for professional networking",
    );
  }

  if (!formData.socialLinks?.website) {
    suggestions.push('Add your website or portfolio to showcase your work');
  }

  // Startup info suggestions
  if (!formData.startupInfo?.fundingStage) {
    suggestions.push(
      'Add your funding stage to attract relevant investors and partners',
    );
  }

  if (!formData.startupInfo?.teamSize) {
    suggestions.push(
      'Add your team size to give context about your company stage',
    );
  }

  if (
    !formData.startupInfo?.industry ||
    formData.startupInfo.industry.length === 0
  ) {
    suggestions.push(
      'Specify your industry to connect with relevant professionals',
    );
  }

  // Custom fields suggestions
  if (formData.customFields.length === 0) {
    suggestions.push(
      'Add custom fields to highlight unique aspects of your business',
    );
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
};

/**
 * Validates individual field in real-time
 */
export const validateFieldRealTime = (
  field: string,
  value: any,
  debounceMs: number = 500,
): Promise<string | undefined> => {
  return new Promise(resolve => {
    setTimeout(() => {
      let error: string | undefined;

      switch (field) {
        case 'name':
          if (!value?.trim()) {
            error = 'Name is required';
          } else if (value.length < VALIDATION_RULES.name.minLength) {
            error = `Name must be at least ${VALIDATION_RULES.name.minLength} characters`;
          }
          break;

        case 'email':
          if (!value?.trim()) {
            error = 'Email is required';
          } else if (!EMAIL_REGEX.test(value)) {
            error = 'Please enter a valid email address';
          }
          break;

        case 'phone':
          if (value?.trim() && !PHONE_REGEX.test(value)) {
            error = 'Please enter a valid phone number';
          }
          break;

        default:
          error = undefined;
      }

      resolve(error);
    }, debounceMs);
  });
};

/**
 * Format validation error message
 */
export const formatValidationError = (error: string): string => {
  return error.charAt(0).toUpperCase() + error.slice(1);
};
