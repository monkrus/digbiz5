/**
 * Contact Management Types
 *
 * Type definitions for contact management, OCR, and CRM functionality
 */

export interface ContactField {
  id: string;
  type: string;
  label: string;
  value: string;
  isEditable: boolean;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface Contact {
  id: string;
  fields: ContactField[];
  source: 'manual' | 'ocr_scan' | 'import' | 'sync' | 'business_card';
  confidence?: number;
  rawText?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isVerified: boolean;
  needsReview: boolean;
  isFavorite?: boolean;
  lastInteractionAt?: string;
  notes?: ContactNote[];
  interactions?: ContactInteraction[];
  syncStatus?: 'pending' | 'synced' | 'conflict' | 'error';
  conflictData?: Contact;
}

export interface ContactNote {
  id: string;
  contactId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  type: 'general' | 'meeting' | 'call' | 'email' | 'reminder';
  isPrivate: boolean;
}

export interface ContactInteraction {
  id: string;
  contactId: string;
  type:
    | 'call'
    | 'email'
    | 'meeting'
    | 'message'
    | 'card_shared'
    | 'card_received';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
  duration?: number; // for calls and meetings
  participants?: string[]; // for meetings
}

export interface ContactTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
  contactCount: number;
}

export interface ContactCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parentId?: string;
  children?: ContactCategory[];
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  contactIds: string[];
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  permissions?: GroupPermission[];
}

export interface GroupPermission {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  grantedAt: string;
}

export interface ContactSearchFilters {
  query?: string;
  tags?: string[];
  categories?: string[];
  groups?: string[];
  source?: Contact['source'][];
  isVerified?: boolean;
  needsReview?: boolean;
  isFavorite?: boolean;
  hasNotes?: boolean;
  dateRange?: {
    start: string;
    end: string;
    field: 'createdAt' | 'updatedAt' | 'lastInteractionAt';
  };
  confidenceRange?: {
    min: number;
    max: number;
  };
}

export interface ContactSearchResult {
  contacts: Contact[];
  totalCount: number;
  facets: {
    tags: { name: string; count: number }[];
    categories: { name: string; count: number }[];
    sources: { source: string; count: number }[];
  };
}

export interface ScanResult {
  success: boolean;
  results: ParsedCardData[];
  error?: string;
  duration: number;
  metadata?: {
    timestamp: string;
    imageCount: number;
    processingTime: number;
  };
}

export interface ParsedCardData {
  name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  fax?: string;
  confidence: number;
  rawText: string;
  textBlocks?: any[];
}

export interface OCRConfig {
  minConfidence: number;
  enableLanguageDetection: boolean;
  supportedLanguages: string[];
  fieldMappingRules: Record<string, any>;
  enableAutoCorrection: boolean;
  maxProcessingTime: number;
}

export interface ContactImportMapping {
  sourceField: string;
  targetField: string;
  transformation?:
    | 'uppercase'
    | 'lowercase'
    | 'capitalize'
    | 'phone_format'
    | 'email_normalize';
  isRequired: boolean;
  defaultValue?: string;
}

export interface ContactImportJob {
  id: string;
  filename: string;
  format: 'csv' | 'vcard' | 'json' | 'excel';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mapping: ContactImportMapping[];
  results?: {
    totalRecords: number;
    successfulImports: number;
    failedImports: number;
    duplicatesFound: number;
    errors: string[];
  };
  createdAt: string;
  completedAt?: string;
}

export interface ContactExportJob {
  id: string;
  name: string;
  format: 'csv' | 'vcard' | 'json' | 'excel' | 'pdf';
  filters: ContactSearchFilters;
  fields: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  results?: {
    totalContacts: number;
    exportedContacts: number;
    fileSize: number;
  };
  createdAt: string;
  completedAt?: string;
}

export interface DuplicateContact {
  id: string;
  contacts: Contact[];
  similarity: number;
  suggestedAction: 'merge' | 'keep_separate' | 'manual_review';
  matchingFields: string[];
  confidence: number;
  detectedAt: string;
  resolvedAt?: string;
  resolution?: 'merged' | 'kept_separate' | 'ignored';
}

export interface ContactMergePreview {
  primaryContact: Contact;
  secondaryContacts: Contact[];
  mergedContact: Contact;
  conflicts: ContactFieldConflict[];
  suggestedResolutions: ContactFieldResolution[];
}

export interface ContactFieldConflict {
  fieldType: string;
  primaryValue: string;
  secondaryValues: string[];
  suggestedResolution: 'use_primary' | 'use_secondary' | 'combine' | 'manual';
}

export interface ContactFieldResolution {
  fieldType: string;
  action: 'use_primary' | 'use_secondary' | 'combine' | 'custom';
  customValue?: string;
}

export interface ContactSyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  conflictResolution: 'server_wins' | 'local_wins' | 'manual' | 'newest_wins';
  includePhotos: boolean;
  includeNotes: boolean;
  includeInteractions: boolean;
  lastSyncAt?: string;
  deviceContactsEnabled: boolean;
  cloudBackupEnabled: boolean;
}

export interface ContactSyncStatus {
  isOnline: boolean;
  lastSyncAt?: string;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: number;
  errors: string[];
  syncInProgress: boolean;
  estimatedSyncTime?: number;
}

export interface ContactAnalytics {
  totalContacts: number;
  verifiedContacts: number;
  contactsNeedingReview: number;
  averageConfidence: number;
  contactsBySource: Record<string, number>;
  contactsByTag: Record<string, number>;
  contactsByCategory: Record<string, number>;
  recentInteractions: number;
  topTags: { name: string; count: number }[];
  topCategories: { name: string; count: number }[];
  growthStats: {
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
}

export interface ContactBackup {
  id: string;
  name: string;
  contactCount: number;
  size: number; // bytes
  createdAt: string;
  type: 'manual' | 'automatic' | 'scheduled';
  format: 'json' | 'sqlite' | 'zip';
  encryptionEnabled: boolean;
  cloudProvider?: 'icloud' | 'google_drive' | 'dropbox' | 'onedrive';
  localPath?: string;
  cloudUrl?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export interface ContactRestoreJob {
  id: string;
  backupId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    totalContacts: number;
    processedContacts: number;
    errors: number;
  };
  options: {
    mergeExisting: boolean;
    updateExisting: boolean;
    preserveIds: boolean;
  };
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// Database Schema Types
export interface ContactTable {
  id: string;
  fields_json: string; // JSON serialized ContactField[]
  source: string;
  confidence: number;
  raw_text?: string;
  image_uri?: string;
  created_at: string;
  updated_at: string;
  tags_json: string; // JSON serialized string[]
  is_verified: number; // SQLite boolean
  needs_review: number; // SQLite boolean
  is_favorite: number; // SQLite boolean
  last_interaction_at?: string;
  sync_status?: string;
  conflict_data_json?: string; // JSON serialized Contact
}

export interface ContactNoteTable {
  id: string;
  contact_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  type: string;
  is_private: number; // SQLite boolean
}

export interface ContactInteractionTable {
  id: string;
  contact_id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata_json?: string;
  duration?: number;
  participants_json?: string; // JSON serialized string[]
}

export interface ContactTagTable {
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at: string;
  contact_count: number;
}

export interface ContactCategoryTable {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parent_id?: string;
  contact_count: number;
  created_at: string;
  updated_at: string;
}
