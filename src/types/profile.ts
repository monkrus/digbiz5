/**
 * Profile Types and Interfaces
 *
 * This file contains all TypeScript types and interfaces related to user profiles,
 * including profile data models, form validation, and API response types.
 */

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  profilePhoto: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  website: string | null;
  socialLinks: SocialLinks;
  skills: string[];
  experience: Experience[];
  education: Education[];
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinks {
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  instagram: string | null;
  facebook: string | null;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface ProfileFormData {
  name: string;
  title: string;
  company: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  socialLinks: SocialLinks;
  skills: string[];
  isPublic: boolean;
}

export interface ProfilePhotoData {
  uri: string;
  type: string;
  name: string;
  size: number;
}

export interface ProfileValidationErrors {
  name?: string;
  title?: string;
  company?: string;
  bio?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  skills?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
    facebook?: string;
  };
}

export interface ProfileUpdateData {
  name?: string;
  title?: string;
  company?: string;
  bio?: string;
  email?: string;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  socialLinks?: Partial<SocialLinks>;
  skills?: string[];
  isPublic?: boolean;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  profile: UserProfile;
}

export interface ProfileListResponse {
  success: boolean;
  message: string;
  profiles: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProfilePhotoUploadResponse {
  success: boolean;
  message: string;
  photoUrl: string;
}

export interface ProfileSearchFilters {
  name?: string;
  company?: string;
  title?: string;
  location?: string;
  skills?: string[];
  isVerified?: boolean;
  isPublic?: boolean;
}

export interface ProfileSearchParams {
  query?: string;
  filters?: ProfileSearchFilters;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'title' | 'company' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProfileStats {
  totalProfiles: number;
  verifiedProfiles: number;
  publicProfiles: number;
  recentProfiles: number;
}

// Profile form field types for validation
export type ProfileFormField = keyof ProfileFormData;

// Profile privacy settings
export interface ProfilePrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showSocialLinks: boolean;
  allowMessaging: boolean;
  allowConnectionRequests: boolean;
}

// Profile notification preferences
export interface ProfileNotificationSettings {
  profileViews: boolean;
  connectionRequests: boolean;
  messages: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

// Complete profile settings
export interface ProfileSettings {
  privacy: ProfilePrivacySettings;
  notifications: ProfileNotificationSettings;
}

// Profile completion status
export interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: ProfileFormField[];
  recommendations: string[];
}

// Profile activity
export interface ProfileActivity {
  id: string;
  type:
    | 'profile_update'
    | 'photo_update'
    | 'skill_added'
    | 'experience_added'
    | 'education_added';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Profile connection request
export interface ProfileConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromProfile: Pick<
    UserProfile,
    'id' | 'name' | 'title' | 'company' | 'profilePhoto'
  >;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
}

// Profile view tracking
export interface ProfileView {
  id: string;
  profileId: string;
  viewerUserId: string | null; // null for anonymous views
  viewerProfile?: Pick<
    UserProfile,
    'id' | 'name' | 'title' | 'company' | 'profilePhoto'
  >;
  timestamp: string;
  metadata?: {
    source?: string;
    duration?: number;
  };
}

export default UserProfile;
