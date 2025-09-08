/**
 * Profile Form Validation Utilities
 * 
 * This file contains validation functions for profile forms, including
 * field validation, form validation, and error message generation.
 */

import {
  ProfileFormData,
  ProfileValidationErrors,
  ProfileFormField,
  SocialLinks,
} from '../types/profile';

// Regular expressions for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
const LINKEDIN_REGEX = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[\w-]+\/?$/;
const TWITTER_REGEX = /^(https?:\/\/)?(www\.)?twitter\.com\/[\w]+\/?$/;
const GITHUB_REGEX = /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/?$/;
const INSTAGRAM_REGEX = /^(https?:\/\/)?(www\.)?instagram\.com\/[\w.]+\/?$/;
const FACEBOOK_REGEX = /^(https?:\/\/)?(www\.)?facebook\.com\/[\w.]+\/?$/;

// Validation constants
export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 100,
    required: true,
  },
  title: {
    minLength: 2,
    maxLength: 150,
    required: true,
  },
  company: {
    minLength: 2,
    maxLength: 100,
    required: true,
  },
  bio: {
    minLength: 10,
    maxLength: 1000,
    required: false,
  },
  email: {
    required: true,
  },
  phone: {
    required: false,
  },
  location: {
    maxLength: 100,
    required: false,
  },
  website: {
    required: false,
  },
  skills: {
    minItems: 1,
    maxItems: 20,
    maxLength: 50,
  },
};

/**
 * Validates a single profile form field
 */
export const validateProfileField = (
  field: ProfileFormField,
  value: any,
  allValues?: Partial<ProfileFormData>
): string | undefined => {
  const stringValue = (value === null || value === undefined) ? '' : 
    (typeof value === 'string' ? value.trim() : String(value));

  switch (field) {
    case 'name':
      return validateName(stringValue);
    case 'title':
      return validateTitle(stringValue);
    case 'company':
      return validateCompany(stringValue);
    case 'bio':
      return validateBio(stringValue);
    case 'email':
      return validateEmail(stringValue);
    case 'phone':
      return validatePhone(stringValue);
    case 'location':
      return validateLocation(stringValue);
    case 'website':
      return validateWebsite(stringValue);
    case 'socialLinks':
      return validateSocialLinks(value as SocialLinks);
    case 'skills':
      return validateSkills(value as string[]);
    default:
      return undefined;
  }
};

/**
 * Validates the entire profile form
 */
export const validateProfileForm = (
  formData: Partial<ProfileFormData>
): ProfileValidationErrors => {
  const errors: ProfileValidationErrors = {};

  // Check required fields first
  const requiredFields: (keyof ProfileFormData)[] = ['name', 'title', 'company', 'email'];
  requiredFields.forEach(field => {
    if (!formData[field] || (typeof formData[field] === 'string' && !formData[field]?.trim())) {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      errors[field] = `${fieldName} is required`;
    }
  });

  // Validate each field that has a value
  Object.keys(formData).forEach(key => {
    const field = key as ProfileFormField;
    const error = validateProfileField(field, formData[field], formData);
    if (error && !errors[field as keyof ProfileValidationErrors]) {
      if (field === 'socialLinks') {
        errors.socialLinks = validateSocialLinksDetailed(formData.socialLinks!);
      } else {
        errors[field as keyof ProfileValidationErrors] = error;
      }
    }
  });

  // Special handling for skills
  if (!formData.skills || !Array.isArray(formData.skills) || formData.skills.length === 0) {
    errors.skills = 'Please add at least one skill';
  }

  return errors;
};

/**
 * Checks if the profile form is valid
 */
export const isProfileFormValid = (
  formData: Partial<ProfileFormData>,
  errors: ProfileValidationErrors
): boolean => {
  const hasErrors = Object.keys(errors).length > 0;
  const requiredFields = ['name', 'title', 'company', 'email'];
  const hasRequiredFields = requiredFields.every(field => 
    formData[field as keyof ProfileFormData]
  );

  return !hasErrors && hasRequiredFields;
};

/**
 * Gets the completion percentage of a profile
 */
export const getProfileCompletionPercentage = (
  formData: Partial<ProfileFormData>
): number => {
  const allFields = [
    'name', 'title', 'company', 'bio', 'email', 'phone', 
    'location', 'website', 'socialLinks', 'skills'
  ];
  
  let completedFields = 0;
  
  allFields.forEach(field => {
    const value = formData[field as keyof ProfileFormData];
    if (isFieldCompleted(field as ProfileFormField, value)) {
      completedFields++;
    }
  });

  return Math.round((completedFields / allFields.length) * 100);
};

/**
 * Individual field validation functions
 */
const validateName = (value: string): string | undefined => {
  if (!value) {
    return 'Name is required';
  }
  if (value.length < VALIDATION_RULES.name.minLength) {
    return `Name must be at least ${VALIDATION_RULES.name.minLength} characters`;
  }
  if (value.length > VALIDATION_RULES.name.maxLength) {
    return `Name must be less than ${VALIDATION_RULES.name.maxLength} characters`;
  }
  if (!/^[a-zA-Z\s'-]+$/.test(value)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return undefined;
};

const validateTitle = (value: string): string | undefined => {
  if (!value) {
    return 'Title is required';
  }
  if (value.length < VALIDATION_RULES.title.minLength) {
    return `Title must be at least ${VALIDATION_RULES.title.minLength} characters`;
  }
  if (value.length > VALIDATION_RULES.title.maxLength) {
    return `Title must be less than ${VALIDATION_RULES.title.maxLength} characters`;
  }
  return undefined;
};

const validateCompany = (value: string): string | undefined => {
  if (!value) {
    return 'Company is required';
  }
  if (value.length < VALIDATION_RULES.company.minLength) {
    return `Company must be at least ${VALIDATION_RULES.company.minLength} characters`;
  }
  if (value.length > VALIDATION_RULES.company.maxLength) {
    return `Company must be less than ${VALIDATION_RULES.company.maxLength} characters`;
  }
  return undefined;
};

const validateBio = (value: string): string | undefined => {
  if (!value) return undefined; // Bio is optional
  
  if (value.length < VALIDATION_RULES.bio.minLength) {
    return `Bio must be at least ${VALIDATION_RULES.bio.minLength} characters`;
  }
  if (value.length > VALIDATION_RULES.bio.maxLength) {
    return `Bio must be less than ${VALIDATION_RULES.bio.maxLength} characters`;
  }
  return undefined;
};

const validateEmail = (value: string): string | undefined => {
  if (!value) {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(value)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};

const validatePhone = (value: string): string | undefined => {
  if (!value) return undefined; // Phone is optional
  
  if (!PHONE_REGEX.test(value)) {
    return 'Please enter a valid phone number';
  }
  return undefined;
};

const validateLocation = (value: string): string | undefined => {
  if (!value) return undefined; // Location is optional
  
  if (value.length > VALIDATION_RULES.location!.maxLength!) {
    return `Location must be less than ${VALIDATION_RULES.location!.maxLength} characters`;
  }
  return undefined;
};

const validateWebsite = (value: string): string | undefined => {
  if (!value) return undefined; // Website is optional
  
  if (!URL_REGEX.test(value)) {
    return 'Please enter a valid website URL';
  }
  return undefined;
};

const validateSocialLinks = (socialLinks: SocialLinks): string | undefined => {
  if (!socialLinks) return undefined;
  
  const errors = validateSocialLinksDetailed(socialLinks);
  const hasErrors = Object.keys(errors).length > 0;
  
  return hasErrors ? 'Please check your social media links' : undefined;
};

const validateSocialLinksDetailed = (socialLinks: SocialLinks) => {
  const errors: NonNullable<ProfileValidationErrors['socialLinks']> = {};

  if (socialLinks.linkedin && !LINKEDIN_REGEX.test(socialLinks.linkedin)) {
    errors.linkedin = 'Please enter a valid LinkedIn URL';
  }
  if (socialLinks.twitter && !TWITTER_REGEX.test(socialLinks.twitter)) {
    errors.twitter = 'Please enter a valid Twitter URL';
  }
  if (socialLinks.github && !GITHUB_REGEX.test(socialLinks.github)) {
    errors.github = 'Please enter a valid GitHub URL';
  }
  if (socialLinks.instagram && !INSTAGRAM_REGEX.test(socialLinks.instagram)) {
    errors.instagram = 'Please enter a valid Instagram URL';
  }
  if (socialLinks.facebook && !FACEBOOK_REGEX.test(socialLinks.facebook)) {
    errors.facebook = 'Please enter a valid Facebook URL';
  }

  return errors;
};

const validateSkills = (skills: string[]): string | undefined => {
  if (!skills || !Array.isArray(skills)) {
    return 'Please add at least one skill';
  }
  
  if (skills.length < VALIDATION_RULES.skills.minItems) {
    return `Please add at least ${VALIDATION_RULES.skills.minItems} skill`;
  }
  if (skills.length > VALIDATION_RULES.skills.maxItems) {
    return `You can add up to ${VALIDATION_RULES.skills.maxItems} skills`;
  }
  
  const invalidSkills = skills.filter(skill => 
    !skill || skill.trim().length === 0 || skill.length > VALIDATION_RULES.skills.maxLength
  );
  
  if (invalidSkills.length > 0) {
    return `Each skill must be between 1 and ${VALIDATION_RULES.skills.maxLength} characters`;
  }
  
  // Check for duplicates
  const uniqueSkills = new Set(skills.map(skill => skill.toLowerCase().trim()));
  if (uniqueSkills.size !== skills.length) {
    return 'Please remove duplicate skills';
  }
  
  return undefined;
};

/**
 * Helper function to check if a field is completed
 */
const isFieldCompleted = (field: ProfileFormField, value: any): boolean => {
  switch (field) {
    case 'skills':
      return Array.isArray(value) && value.length > 0;
    case 'socialLinks':
      return value && Object.values(value).some(link => link && link.trim());
    case 'isPublic':
      return typeof value === 'boolean';
    default:
      return value !== undefined && value !== null && value !== '';
  }
};

/**
 * Formats validation errors for display
 */
export const formatValidationError = (error: string): string => {
  return error.charAt(0).toUpperCase() + error.slice(1);
};

/**
 * Gets suggested improvements for profile completion
 */
export const getProfileSuggestions = (
  formData: Partial<ProfileFormData>
): string[] => {
  const suggestions: string[] = [];
  
  if (!formData.bio || formData.bio.trim().length < 50) {
    suggestions.push('Add a detailed bio to help others understand your background');
  }
  
  if (!formData.phone) {
    suggestions.push('Add your phone number to help people contact you');
  }
  
  if (!formData.location) {
    suggestions.push('Add your location to connect with local professionals');
  }
  
  if (!formData.website) {
    suggestions.push('Add your website or portfolio link');
  }
  
  if (!formData.skills || formData.skills.length < 5) {
    suggestions.push('Add more skills to showcase your expertise');
  }
  
  const socialLinks = formData.socialLinks;
  const hasSocialLinks = socialLinks && Object.values(socialLinks).some(link => link);
  if (!hasSocialLinks) {
    suggestions.push('Add social media links to expand your network');
  }
  
  return suggestions;
};

/**
 * Real-time field validation for forms
 */
export const validateFieldRealTime = (
  field: ProfileFormField,
  value: any,
  debounceMs: number = 500
): Promise<string | undefined> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const error = validateProfileField(field, value);
      resolve(error);
    }, debounceMs);
  });
};

/**
 * Batch validation for multiple fields
 */
export const validateFields = (
  fields: Array<{ field: ProfileFormField; value: any }>
): Record<ProfileFormField, string | undefined> => {
  const results: Record<string, string | undefined> = {};
  
  fields.forEach(({ field, value }) => {
    results[field] = validateProfileField(field, value);
  });
  
  return results;
};