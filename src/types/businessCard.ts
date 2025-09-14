/**
 * Business Card Schema and Types
 *
 * This file contains all TypeScript types and interfaces for the business card system,
 * including basic info, startup-specific fields, social links, custom fields, and themes.
 */

// ====== CORE BUSINESS CARD DATA ======

export interface BusinessCard {
  id: string;
  userId: string;

  // Basic Information
  basicInfo: BasicInfo;

  // Startup-specific fields
  startupInfo?: StartupInfo;

  // Social links
  socialLinks: BusinessCardSocialLinks;

  // Custom fields for extensibility
  customFields: CustomField[];

  // Card presentation
  theme: CardTheme;
  template: CardTemplate;

  // Metadata
  isDefault: boolean;
  isPublic: boolean;
  isActive: boolean;
  shareCode?: string; // Unique code for sharing

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastSharedAt?: string;
}

// ====== BASIC INFORMATION ======

export interface BasicInfo {
  // Required fields
  name: string;
  title: string;
  company: string;
  email: string;

  // Optional fields
  phone?: string;
  location?: string;
  bio?: string;
  profilePhoto?: string;
  companyLogo?: string;
}

// ====== STARTUP-SPECIFIC FIELDS ======

export interface StartupInfo {
  // Funding information
  fundingStage: FundingStage;
  fundingAmount?: string;
  fundingRound?: string;

  // Team information
  teamSize: TeamSize;
  foundedYear?: number;

  // Business details
  industry: string[];
  businessModel?: BusinessModel;
  revenue?: RevenueStage;

  // Traction metrics
  customers?: string;
  growth?: string;

  // Looking for
  seekingFunding?: boolean;
  seekingTalent?: boolean;
  seekingPartners?: boolean;
  seekingMentors?: boolean;
}

export type FundingStage =
  | 'idea'
  | 'pre-seed'
  | 'seed'
  | 'series-a'
  | 'series-b'
  | 'series-c'
  | 'series-d+'
  | 'ipo'
  | 'acquired'
  | 'bootstrapped';

export type TeamSize =
  | 'solo'
  | '2-5'
  | '6-10'
  | '11-25'
  | '26-50'
  | '51-100'
  | '101-250'
  | '250+';

export type BusinessModel =
  | 'b2b'
  | 'b2c'
  | 'b2b2c'
  | 'marketplace'
  | 'saas'
  | 'subscription'
  | 'freemium'
  | 'advertising'
  | 'commission'
  | 'licensing'
  | 'hardware'
  | 'other';

export type RevenueStage =
  | 'pre-revenue'
  | '0-10k'
  | '10k-100k'
  | '100k-1m'
  | '1m-10m'
  | '10m-100m'
  | '100m+';

// ====== SOCIAL LINKS ======

export interface BusinessCardSocialLinks {
  // Professional networks
  linkedin?: string;
  twitter?: string;
  website?: string;

  // Development platforms
  github?: string;
  gitlab?: string;
  stackoverflow?: string;

  // Social media
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;

  // Messaging platforms
  telegram?: string;
  whatsapp?: string;
  discord?: string;
  slack?: string;

  // Other platforms
  medium?: string;
  behance?: string;
  dribbble?: string;
  producthunt?: string;
  angellist?: string;
  crunchbase?: string;
}

// ====== CUSTOM FIELDS ======

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: CustomFieldType;
  icon?: string;
  isPublic: boolean;
  order: number;
}

export type CustomFieldType =
  | 'text'
  | 'url'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiselect';

// ====== CARD THEMES & TEMPLATES ======

export interface CardTheme {
  id: string;
  name: string;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;

  // Typography
  fontFamily: string;
  headerFontSize: number;
  bodyFontSize: number;

  // Layout
  borderRadius: number;
  padding: number;
  spacing: number;

  // Effects
  shadow?: ShadowStyle;
  gradient?: GradientStyle;
  pattern?: PatternStyle;
}

export interface ShadowStyle {
  color: string;
  opacity: number;
  offsetX: number;
  offsetY: number;
  blur: number;
}

export interface GradientStyle {
  type: 'linear' | 'radial';
  colors: string[];
  direction?: number; // For linear gradients
  center?: { x: number; y: number }; // For radial gradients
}

export interface PatternStyle {
  type: 'dots' | 'lines' | 'grid' | 'waves';
  color: string;
  opacity: number;
  size: number;
}

export interface CardTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  layout: LayoutStyle;

  // Element positioning
  elements: TemplateElement[];

  // Template metadata
  isPopular: boolean;
  isPremium: boolean;
  previewImage: string;
}

export type TemplateCategory =
  | 'minimalist'
  | 'professional'
  | 'creative'
  | 'startup'
  | 'tech'
  | 'corporate'
  | 'artistic'
  | 'modern';

export type LayoutStyle =
  | 'standard'
  | 'compact'
  | 'expanded'
  | 'split'
  | 'card-stack'
  | 'magazine';

export interface TemplateElement {
  id: string;
  type: ElementType;
  position: Position;
  size: Size;
  style: ElementStyle;
  isVisible: boolean;
  isRequired: boolean;
}

export type ElementType =
  | 'name'
  | 'title'
  | 'company'
  | 'email'
  | 'phone'
  | 'location'
  | 'bio'
  | 'profile-photo'
  | 'company-logo'
  | 'social-links'
  | 'custom-field'
  | 'qr-code'
  | 'background'
  | 'divider'
  | 'icon';

export interface Position {
  x: number;
  y: number;
  z?: number; // For layering
}

export interface Size {
  width: number;
  height: number;
}

export interface ElementStyle {
  color?: string;
  fontSize?: number;
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  opacity?: number;
}

// ====== BUSINESS CARD OPERATIONS ======

export interface BusinessCardFormData {
  basicInfo: Partial<BasicInfo>;
  startupInfo?: Partial<StartupInfo>;
  socialLinks: Partial<BusinessCardSocialLinks>;
  customFields: CustomField[];
  themeId: string;
  templateId: string;
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface BusinessCardResponse {
  success: boolean;
  message?: string;
  card?: BusinessCard;
}

export interface BusinessCardListResponse {
  success: boolean;
  message?: string;
  cards: BusinessCard[];
  total: number;
  page: number;
  limit: number;
}

export interface ShareableCard {
  card: BusinessCard;
  shareUrl: string;
  qrCodeUrl: string;
  analytics?: ShareAnalytics;
}

export interface ShareAnalytics {
  totalViews: number;
  uniqueViews: number;
  lastViewedAt?: string;
  viewHistory: ViewRecord[];
}

export interface ViewRecord {
  id: string;
  viewerLocation?: string;
  viewerDevice?: string;
  timestamp: string;
  duration?: number;
}

// ====== VALIDATION & FORMS ======

export interface BusinessCardValidationErrors {
  basicInfo?: {
    name?: string;
    title?: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  startupInfo?: {
    fundingStage?: string;
    teamSize?: string;
    industry?: string;
  };
  socialLinks?: {
    [key in keyof BusinessCardSocialLinks]?: string;
  };
  customFields?: {
    [key: string]: string;
  };
  theme?: string;
  template?: string;
}

// ====== CARD SHARING & NETWORKING ======

export interface CardExchange {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromCard: BusinessCard;
  toCard?: BusinessCard;
  method: ExchangeMethod;
  location?: GeolocationData;
  notes?: string;
  timestamp: string;
  isConfirmed: boolean;
}

export type ExchangeMethod =
  | 'qr-scan'
  | 'nfc-tap'
  | 'bluetooth'
  | 'airdrop'
  | 'email'
  | 'text-message'
  | 'social-share'
  | 'manual-entry';

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  venue?: string;
}

// ====== NETWORKING FEATURES ======

export interface NetworkingEvent {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  organizer: string;
  attendeeCount: number;
  cardExchanges: CardExchange[];
  isActive: boolean;
}

export interface ContactList {
  id: string;
  userId: string;
  name: string;
  contacts: BusinessCard[];
  tags: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ====== PREMIUM FEATURES ======

export interface PremiumFeatures {
  unlimitedCards: boolean;
  customBranding: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customDomains: boolean;
  teamCollaboration: boolean;
  apiAccess: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PremiumFeatures;
  isPopular: boolean;
  trialDays?: number;
}

// ====== EXPORT TYPES ======

export interface ExportOptions {
  format: ExportFormat;
  includeQRCode: boolean;
  includeAnalytics: boolean;
  compression?: 'none' | 'low' | 'medium' | 'high';
}

export type ExportFormat =
  | 'pdf'
  | 'png'
  | 'jpg'
  | 'svg'
  | 'vcf' // vCard format
  | 'json'
  | 'csv';

// ====== DEFAULT EXPORTS ======

export default BusinessCard;
