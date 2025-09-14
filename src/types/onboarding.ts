/**
 * Onboarding Types
 *
 * Type definitions for the onboarding flow including user types,
 * industries, locations, and permission configurations.
 */

// User types for business networking
export type UserType = 'founder' | 'investor' | 'employee';

export interface UserTypeOption {
  id: UserType;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

// Industry categories and options
export interface Industry {
  id: string;
  name: string;
  category: string;
  keywords: string[];
}

export interface IndustryCategory {
  id: string;
  name: string;
  industries: Industry[];
}

// Location and timezone data
export interface Location {
  id: string;
  city: string;
  country: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface TimeZone {
  id: string;
  name: string;
  offset: string;
  region: string;
}

// Permission types
export type PermissionType =
  | 'contacts'
  | 'notifications'
  | 'location'
  | 'camera'
  | 'microphone';

export interface PermissionRequest {
  type: PermissionType;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  granted?: boolean;
}

// Onboarding data structure
export interface OnboardingData {
  userType: UserType | null;
  industry: Industry | null;
  location: Location | null;
  timezone: TimeZone | null;
  permissions: Record<PermissionType, boolean>;
  completedSteps: number;
  isCompleted: boolean;
}

// Onboarding step configuration
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  required: boolean;
  order: number;
}

// App benefits for welcome screen
export interface AppBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// Onboarding navigation types
export type OnboardingStackParamList = {
  Welcome: undefined;
  UserTypeSelection: undefined;
  IndustrySelection: {
    userType: UserType;
  };
  LocationSetup: {
    userType: UserType;
    industry: Industry;
  };
  PermissionRequests: {
    userType: UserType;
    industry: Industry;
    location: Location;
    timezone: TimeZone;
  };
  OnboardingComplete: {
    onboardingData: OnboardingData;
  };
};

// Form validation
export interface OnboardingValidationErrors {
  userType?: string;
  industry?: string;
  location?: string;
  timezone?: string;
  permissions?: Record<PermissionType, string>;
}

// API response types
export interface OnboardingResponse {
  success: boolean;
  message?: string;
  data?: OnboardingData;
}

export interface IndustrySearchResponse {
  industries: Industry[];
  totalCount: number;
}

export interface LocationSearchResponse {
  locations: Location[];
  totalCount: number;
}
