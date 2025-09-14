/**
 * Profile Validation Unit Tests
 *
 * This test suite validates the profile form validation utilities including
 * field validation, form validation, completion calculation, and error handling.
 */

import {
  validateProfileField,
  validateProfileForm,
  isProfileFormValid,
  getProfileCompletionPercentage,
  getProfileSuggestions,
  VALIDATION_RULES,
} from '../../../src/utils/profileValidation';
import {
  ProfileFormData,
  ProfileValidationErrors,
  SocialLinks,
} from '../../../src/types/profile';

describe('Profile Validation', () => {
  const validProfileData: ProfileFormData = {
    name: 'John Doe',
    title: 'Software Engineer',
    company: 'Tech Company',
    bio: 'Experienced software engineer with expertise in React and Node.js. Passionate about building scalable applications.',
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    website: 'https://johndoe.com',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: 'https://twitter.com/johndoe',
      github: 'https://github.com/johndoe',
      instagram: null,
      facebook: null,
    },
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB'],
    isPublic: true,
  };

  describe('Field Validation', () => {
    describe('Name Validation', () => {
      it('should accept valid names', () => {
        expect(validateProfileField('name', 'John Doe')).toBeUndefined();
        expect(
          validateProfileField('name', 'Mary Smith-Johnson'),
        ).toBeUndefined();
        expect(validateProfileField('name', "O'Connor")).toBeUndefined();
      });

      it('should reject empty names', () => {
        expect(validateProfileField('name', '')).toBe('Name is required');
        expect(validateProfileField('name', '   ')).toBe('Name is required');
      });

      it('should reject names that are too short', () => {
        expect(validateProfileField('name', 'A')).toBe(
          `Name must be at least ${VALIDATION_RULES.name.minLength} characters`,
        );
      });

      it('should reject names that are too long', () => {
        const longName = 'A'.repeat(VALIDATION_RULES.name.maxLength + 1);
        expect(validateProfileField('name', longName)).toBe(
          `Name must be less than ${VALIDATION_RULES.name.maxLength} characters`,
        );
      });

      it('should reject names with invalid characters', () => {
        expect(validateProfileField('name', 'John123')).toBe(
          'Name can only contain letters, spaces, hyphens, and apostrophes',
        );
        expect(validateProfileField('name', 'John@Doe')).toBe(
          'Name can only contain letters, spaces, hyphens, and apostrophes',
        );
      });
    });

    describe('Email Validation', () => {
      it('should accept valid emails', () => {
        expect(
          validateProfileField('email', 'test@example.com'),
        ).toBeUndefined();
        expect(
          validateProfileField('email', 'user.name+tag@example.co.uk'),
        ).toBeUndefined();
      });

      it('should reject empty emails', () => {
        expect(validateProfileField('email', '')).toBe('Email is required');
      });

      it('should reject invalid email formats', () => {
        expect(validateProfileField('email', 'invalid-email')).toBe(
          'Please enter a valid email address',
        );
        expect(validateProfileField('email', 'test@')).toBe(
          'Please enter a valid email address',
        );
        expect(validateProfileField('email', '@example.com')).toBe(
          'Please enter a valid email address',
        );
      });
    });

    describe('Phone Validation', () => {
      it('should accept valid phone numbers', () => {
        expect(validateProfileField('phone', '+1234567890')).toBeUndefined();
        expect(validateProfileField('phone', '1234567890')).toBeUndefined();
      });

      it('should accept empty phone numbers', () => {
        expect(validateProfileField('phone', '')).toBeUndefined();
      });

      it('should reject invalid phone formats', () => {
        expect(validateProfileField('phone', 'abc123')).toBe(
          'Please enter a valid phone number',
        );
        expect(validateProfileField('phone', '0123456789')).toBe(
          'Please enter a valid phone number',
        );
      });
    });

    describe('Website Validation', () => {
      it('should accept valid URLs', () => {
        expect(
          validateProfileField('website', 'https://example.com'),
        ).toBeUndefined();
        expect(
          validateProfileField('website', 'http://example.com'),
        ).toBeUndefined();
        expect(validateProfileField('website', 'example.com')).toBeUndefined();
      });

      it('should accept empty website', () => {
        expect(validateProfileField('website', '')).toBeUndefined();
      });

      it('should reject invalid URLs', () => {
        expect(validateProfileField('website', 'invalid-url')).toBe(
          'Please enter a valid website URL',
        );
        expect(validateProfileField('website', 'ftp://example')).toBe(
          'Please enter a valid website URL',
        );
      });
    });

    describe('Skills Validation', () => {
      it('should accept valid skill arrays', () => {
        expect(
          validateProfileField('skills', ['JavaScript', 'React']),
        ).toBeUndefined();
      });

      it('should reject empty skill arrays', () => {
        expect(validateProfileField('skills', [])).toBe(
          'Please add at least 1 skill',
        );
        expect(validateProfileField('skills', null)).toBe(
          'Please add at least one skill',
        );
      });

      it('should reject too many skills', () => {
        const tooManySkills = Array(VALIDATION_RULES.skills.maxItems + 1).fill(
          'Skill',
        );
        expect(validateProfileField('skills', tooManySkills)).toBe(
          `You can add up to ${VALIDATION_RULES.skills.maxItems} skills`,
        );
      });

      it('should reject skills that are too long', () => {
        const longSkill = 'A'.repeat(VALIDATION_RULES.skills.maxLength + 1);
        expect(validateProfileField('skills', [longSkill])).toBe(
          `Each skill must be between 1 and ${VALIDATION_RULES.skills.maxLength} characters`,
        );
      });

      it('should reject duplicate skills', () => {
        expect(
          validateProfileField('skills', ['JavaScript', 'javascript']),
        ).toBe('Please remove duplicate skills');
      });
    });

    describe('Social Links Validation', () => {
      it('should accept valid social links', () => {
        const validSocialLinks: SocialLinks = {
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe',
          github: 'https://github.com/johndoe',
          instagram: null,
          facebook: null,
        };
        expect(
          validateProfileField('socialLinks', validSocialLinks),
        ).toBeUndefined();
      });

      it('should reject invalid social links', () => {
        const invalidSocialLinks: SocialLinks = {
          linkedin: 'invalid-linkedin-url',
          twitter: null,
          github: null,
          instagram: null,
          facebook: null,
        };
        expect(validateProfileField('socialLinks', invalidSocialLinks)).toBe(
          'Please check your social media links',
        );
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate complete valid form', () => {
      const errors = validateProfileForm(validProfileData);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should return errors for invalid form', () => {
      const invalidData: Partial<ProfileFormData> = {
        name: '',
        email: 'invalid-email',
        skills: [],
      };
      const errors = validateProfileForm(invalidData);

      expect(errors.name).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.skills).toBeDefined();
    });

    it('should validate required fields', () => {
      const incompleteData: Partial<ProfileFormData> = {
        bio: 'Some bio',
        phone: '+1234567890',
      };
      const errors = validateProfileForm(incompleteData);

      expect(errors.name).toBe('Name is required');
      expect(errors.title).toBe('Title is required');
      expect(errors.company).toBe('Company is required');
      expect(errors.email).toBe('Email is required');
      expect(errors.skills).toBe('Please add at least one skill');
    });

    it('should not validate optional fields if empty', () => {
      const dataWithEmptyOptionals: ProfileFormData = {
        ...validProfileData,
        bio: '',
        phone: '',
        location: '',
        website: '',
        socialLinks: {
          linkedin: null,
          twitter: null,
          github: null,
          instagram: null,
          facebook: null,
        },
      };
      const errors = validateProfileForm(dataWithEmptyOptionals);

      expect(errors.bio).toBeUndefined();
      expect(errors.phone).toBeUndefined();
      expect(errors.location).toBeUndefined();
      expect(errors.website).toBeUndefined();
      expect(errors.socialLinks).toBeUndefined();
    });
  });

  describe('Form Validity', () => {
    it('should return true for valid form with no errors', () => {
      const errors: ProfileValidationErrors = {};
      expect(isProfileFormValid(validProfileData, errors)).toBe(true);
    });

    it('should return false for form with errors', () => {
      const errors: ProfileValidationErrors = {
        name: 'Name is required',
      };
      expect(isProfileFormValid(validProfileData, errors)).toBe(false);
    });

    it('should return false for form missing required fields', () => {
      const incompleteData: Partial<ProfileFormData> = {
        name: 'John Doe',
        // missing required fields
      };
      const errors: ProfileValidationErrors = {};
      expect(isProfileFormValid(incompleteData, errors)).toBe(false);
    });

    it('should return true for form with all required fields and no errors', () => {
      const minimalValidData: Partial<ProfileFormData> = {
        name: 'John Doe',
        title: 'Engineer',
        company: 'Tech Co',
        email: 'john@example.com',
      };
      const errors: ProfileValidationErrors = {};
      expect(isProfileFormValid(minimalValidData, errors)).toBe(true);
    });
  });

  describe('Profile Completion', () => {
    it('should calculate 100% for complete profile', () => {
      const percentage = getProfileCompletionPercentage(validProfileData);
      expect(percentage).toBe(100);
    });

    it('should calculate correct percentage for partial profile', () => {
      const partialData: Partial<ProfileFormData> = {
        name: 'John Doe',
        title: 'Engineer',
        company: 'Tech Co',
        email: 'john@example.com',
        skills: ['JavaScript'],
        // 5 out of 10 fields completed = 50%
      };
      const percentage = getProfileCompletionPercentage(partialData);
      expect(percentage).toBe(50);
    });

    it('should return 0% for empty profile', () => {
      const percentage = getProfileCompletionPercentage({});
      expect(percentage).toBe(0);
    });

    it('should handle social links as single field', () => {
      const dataWithSocial: Partial<ProfileFormData> = {
        name: 'John Doe',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: null,
          github: null,
          instagram: null,
          facebook: null,
        },
        // 2 out of 10 fields = 20%
      };
      const percentage = getProfileCompletionPercentage(dataWithSocial);
      expect(percentage).toBe(20);
    });
  });

  describe('Profile Suggestions', () => {
    it('should suggest bio improvement for short bio', () => {
      const dataWithShortBio: Partial<ProfileFormData> = {
        ...validProfileData,
        bio: 'Short bio',
      };
      const suggestions = getProfileSuggestions(dataWithShortBio);
      expect(suggestions).toContain(
        'Add a detailed bio to help others understand your background',
      );
    });

    it('should suggest adding missing contact info', () => {
      const dataWithoutContact: Partial<ProfileFormData> = {
        ...validProfileData,
        phone: '',
        location: '',
        website: '',
      };
      const suggestions = getProfileSuggestions(dataWithoutContact);

      expect(suggestions).toContain(
        'Add your phone number to help people contact you',
      );
      expect(suggestions).toContain(
        'Add your location to connect with local professionals',
      );
      expect(suggestions).toContain('Add your website or portfolio link');
    });

    it('should suggest adding more skills', () => {
      const dataWithFewSkills: Partial<ProfileFormData> = {
        ...validProfileData,
        skills: ['JavaScript'],
      };
      const suggestions = getProfileSuggestions(dataWithFewSkills);
      expect(suggestions).toContain(
        'Add more skills to showcase your expertise',
      );
    });

    it('should suggest adding social links', () => {
      const dataWithoutSocial: Partial<ProfileFormData> = {
        ...validProfileData,
        socialLinks: {
          linkedin: null,
          twitter: null,
          github: null,
          instagram: null,
          facebook: null,
        },
      };
      const suggestions = getProfileSuggestions(dataWithoutSocial);
      expect(suggestions).toContain(
        'Add social media links to expand your network',
      );
    });

    it('should return empty suggestions for complete profile', () => {
      const suggestions = getProfileSuggestions(validProfileData);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      expect(validateProfileField('name', null)).toBe('Name is required');
      expect(validateProfileField('name', undefined)).toBe('Name is required');
      expect(validateProfileField('phone', null)).toBeUndefined();
      expect(validateProfileField('phone', undefined)).toBeUndefined();
    });

    it('should trim whitespace before validation', () => {
      expect(validateProfileField('name', '  John Doe  ')).toBeUndefined();
      expect(
        validateProfileField('email', '  test@example.com  '),
      ).toBeUndefined();
    });

    it('should handle boolean fields', () => {
      expect(validateProfileField('isPublic', true)).toBeUndefined();
      expect(validateProfileField('isPublic', false)).toBeUndefined();
    });

    it('should handle array fields', () => {
      expect(
        validateProfileField('skills', ['JavaScript', 'React']),
      ).toBeUndefined();
      expect(validateProfileField('skills', [])).toBe(
        'Please add at least 1 skill',
      );
    });
  });
});
