/**
 * Contact Management Service
 *
 * High-level service for contact management, search, filtering, and CRM functionality
 */

import { contactDatabaseService } from './contactDatabaseService';
import {
  Contact,
  ContactNote,
  ContactInteraction,
  ContactTag,
  ContactCategory,
  ContactSearchFilters,
  ContactSearchResult,
  ContactImportJob,
  ContactExportJob,
  DuplicateContact,
  ContactMergePreview,
  ContactFieldResolution,
  ContactAnalytics,
} from '../types/contacts';
import { trackEvent } from './analyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class ContactManagementService {
  private static instance: ContactManagementService;

  private constructor() {}

  static getInstance(): ContactManagementService {
    if (!ContactManagementService.instance) {
      ContactManagementService.instance = new ContactManagementService();
    }
    return ContactManagementService.instance;
  }

  /**
   * Initialize the contact management service
   */
  async initialize(): Promise<void> {
    await contactDatabaseService.initialize();
    await this.initializeDefaultTags();
    await this.initializeDefaultCategories();
  }

  /**
   * Search contacts with advanced filtering
   */
  async searchContacts(
    filters: ContactSearchFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ContactSearchResult> {
    const startTime = Date.now();

    try {
      const result = await contactDatabaseService.searchContacts(
        filters,
        limit,
        offset,
      );

      trackEvent('contacts_searched', {
        query: filters.query || '',
        filtersCount: Object.keys(filters).length,
        resultCount: result.contacts.length,
        totalCount: result.totalCount,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      trackEvent('contacts_search_failed', {
        error: error.message,
        filters: JSON.stringify(filters),
      });
      throw error;
    }
  }

  /**
   * Get all contacts
   */
  async getAllContacts(): Promise<Contact[]> {
    return await contactDatabaseService.getAllContacts();
  }

  /**
   * Get a contact by ID with related data
   */
  async getContactById(
    id: string,
    includeRelated: boolean = true,
  ): Promise<Contact | null> {
    const contact = await contactDatabaseService.getContact(id);

    if (!contact) {
      return null;
    }

    if (includeRelated) {
      // Load notes and interactions
      contact.notes = await contactDatabaseService.getContactNotes(id);
      contact.interactions =
        await contactDatabaseService.getContactInteractions(id);
    }

    return contact;
  }

  /**
   * Save or update a contact
   */
  async saveContact(contact: Contact): Promise<void> {
    const isUpdate =
      (await contactDatabaseService.getContact(contact.id)) !== null;

    await contactDatabaseService.saveContact(contact);

    trackEvent(isUpdate ? 'contact_updated' : 'contact_created', {
      contactId: contact.id,
      source: contact.source,
      fieldsCount: contact.fields.length,
      tags: contact.tags,
    });
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<void> {
    await contactDatabaseService.deleteContact(id);

    trackEvent('contact_deleted', { contactId: id });
  }

  /**
   * Bulk save contacts
   */
  async bulkSaveContacts(contacts: Contact[]): Promise<void> {
    await contactDatabaseService.bulkSaveContacts(contacts);

    trackEvent('contacts_bulk_saved', {
      count: contacts.length,
      sources: [...new Set(contacts.map(c => c.source))],
    });
  }

  /**
   * Add a note to a contact
   */
  async addContactNote(
    contactId: string,
    content: string,
    type: ContactNote['type'] = 'general',
  ): Promise<ContactNote> {
    const note: ContactNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type,
      isPrivate: false,
    };

    await contactDatabaseService.saveContactNote(note);

    trackEvent('contact_note_added', {
      contactId,
      noteType: type,
      contentLength: content.length,
    });

    return note;
  }

  /**
   * Get notes for a contact
   */
  async getContactNotes(contactId: string): Promise<ContactNote[]> {
    return await contactDatabaseService.getContactNotes(contactId);
  }

  /**
   * Add an interaction to a contact
   */
  async addContactInteraction(
    contactId: string,
    type: ContactInteraction['type'],
    description: string,
    metadata?: Record<string, any>,
  ): Promise<ContactInteraction> {
    const interaction: ContactInteraction = {
      id: `interaction_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      contactId,
      type,
      description,
      timestamp: new Date().toISOString(),
      metadata,
    };

    await contactDatabaseService.saveContactInteraction(interaction);

    trackEvent('contact_interaction_added', {
      contactId,
      interactionType: type,
    });

    return interaction;
  }

  /**
   * Get interactions for a contact
   */
  async getContactInteractions(
    contactId: string,
  ): Promise<ContactInteraction[]> {
    return await contactDatabaseService.getContactInteractions(contactId);
  }

  /**
   * Find and detect duplicate contacts
   */
  async findDuplicateContacts(
    threshold: number = 0.8,
  ): Promise<DuplicateContact[]> {
    const startTime = Date.now();

    try {
      const duplicates = await contactDatabaseService.findDuplicateContacts(
        threshold,
      );

      trackEvent('duplicate_contacts_detected', {
        duplicateCount: duplicates.length,
        threshold,
        duration: Date.now() - startTime,
      });

      return duplicates;
    } catch (error) {
      trackEvent('duplicate_detection_failed', {
        error: error.message,
        threshold,
      });
      throw error;
    }
  }

  /**
   * Merge duplicate contacts
   */
  async mergeContacts(
    primaryContactId: string,
    secondaryContactIds: string[],
    resolutions: ContactFieldResolution[],
  ): Promise<Contact> {
    const primaryContact = await this.getContactById(primaryContactId);
    if (!primaryContact) {
      throw new Error('Primary contact not found');
    }

    const secondaryContacts = await Promise.all(
      secondaryContactIds.map(id => this.getContactById(id)),
    );

    // Merge contacts based on resolutions
    const mergedContact = this.performContactMerge(
      primaryContact,
      secondaryContacts.filter(Boolean) as Contact[],
      resolutions,
    );

    // Save merged contact
    await this.saveContact(mergedContact);

    // Delete secondary contacts
    for (const id of secondaryContactIds) {
      await this.deleteContact(id);
    }

    trackEvent('contacts_merged', {
      primaryContactId,
      secondaryContactIds,
      mergedFieldsCount: mergedContact.fields.length,
    });

    return mergedContact;
  }

  /**
   * Generate merge preview for contacts
   */
  async generateMergePreview(
    primaryContactId: string,
    secondaryContactIds: string[],
  ): Promise<ContactMergePreview> {
    const primaryContact = await this.getContactById(primaryContactId);
    if (!primaryContact) {
      throw new Error('Primary contact not found');
    }

    const secondaryContacts = await Promise.all(
      secondaryContactIds.map(id => this.getContactById(id)),
    );

    const validSecondaryContacts = secondaryContacts.filter(
      Boolean,
    ) as Contact[];

    // Analyze conflicts and generate suggestions
    const conflicts = this.analyzeContactConflicts(
      primaryContact,
      validSecondaryContacts,
    );
    const suggestedResolutions = this.generateMergeResolutions(conflicts);
    const mergedContact = this.performContactMerge(
      primaryContact,
      validSecondaryContacts,
      suggestedResolutions,
    );

    return {
      primaryContact,
      secondaryContacts: validSecondaryContacts,
      mergedContact,
      conflicts,
      suggestedResolutions,
    };
  }

  /**
   * Import contacts from various formats
   */
  async importContacts(
    data: string,
    format: 'csv' | 'vcard' | 'json',
    mapping?: Record<string, string>,
  ): Promise<ContactImportJob> {
    const job: ContactImportJob = {
      id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename: `import_${new Date().toISOString()}.${format}`,
      format,
      status: 'processing',
      mapping: this.generateDefaultMapping(format),
      createdAt: new Date().toISOString(),
    };

    try {
      const importedContacts = await this.parseContactData(
        data,
        format,
        mapping,
      );
      const duplicateCheck = await this.checkForDuplicates(importedContacts);

      const contactsToSave = duplicateCheck.uniqueContacts;
      await this.bulkSaveContacts(contactsToSave);

      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.results = {
        totalRecords: importedContacts.length,
        successfulImports: contactsToSave.length,
        failedImports: 0,
        duplicatesFound: duplicateCheck.duplicates.length,
        errors: [],
      };

      trackEvent('contacts_imported', {
        jobId: job.id,
        format,
        totalRecords: importedContacts.length,
        successfulImports: contactsToSave.length,
        duplicatesFound: duplicateCheck.duplicates.length,
      });
    } catch (error) {
      job.status = 'failed';
      job.results = {
        totalRecords: 0,
        successfulImports: 0,
        failedImports: 0,
        duplicatesFound: 0,
        errors: [error.message],
      };

      trackEvent('contacts_import_failed', {
        jobId: job.id,
        format,
        error: error.message,
      });
    }

    return job;
  }

  /**
   * Export contacts to various formats
   */
  async exportContacts(
    filters: ContactSearchFilters,
    format: 'csv' | 'vcard' | 'json' | 'excel',
    fields?: string[],
  ): Promise<ContactExportJob> {
    const job: ContactExportJob = {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `contacts_export_${new Date().toISOString()}`,
      format,
      filters,
      fields: fields || this.getDefaultExportFields(),
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    try {
      const searchResult = await this.searchContacts(filters, 10000, 0); // Export all matching
      const exportData = await this.generateExportData(
        searchResult.contacts,
        format,
        job.fields,
      );

      // Save export file (implementation depends on your file storage solution)
      const fileUrl = await this.saveExportFile(exportData, format, job.id);

      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.fileUrl = fileUrl;
      job.results = {
        totalContacts: searchResult.totalCount,
        exportedContacts: searchResult.contacts.length,
        fileSize: Buffer.byteLength(exportData, 'utf8'),
      };

      trackEvent('contacts_exported', {
        jobId: job.id,
        format,
        contactCount: searchResult.contacts.length,
        fileSize: job.results.fileSize,
      });
    } catch (error) {
      job.status = 'failed';

      trackEvent('contacts_export_failed', {
        jobId: job.id,
        format,
        error: error.message,
      });
    }

    return job;
  }

  /**
   * Get contact analytics
   */
  async getContactAnalytics(): Promise<ContactAnalytics> {
    return await contactDatabaseService.getContactAnalytics();
  }

  /**
   * Tag a contact
   */
  async tagContact(contactId: string, tags: string[]): Promise<void> {
    const contact = await this.getContactById(contactId, false);
    if (!contact) {
      throw new Error('Contact not found');
    }

    const uniqueTags = [...new Set([...contact.tags, ...tags])];
    contact.tags = uniqueTags;
    contact.updatedAt = new Date().toISOString();

    await this.saveContact(contact);

    trackEvent('contact_tagged', {
      contactId,
      addedTags: tags,
      totalTags: uniqueTags.length,
    });
  }

  /**
   * Remove tags from a contact
   */
  async removeContactTags(contactId: string, tags: string[]): Promise<void> {
    const contact = await this.getContactById(contactId, false);
    if (!contact) {
      throw new Error('Contact not found');
    }

    contact.tags = contact.tags.filter(tag => !tags.includes(tag));
    contact.updatedAt = new Date().toISOString();

    await this.saveContact(contact);

    trackEvent('contact_tags_removed', {
      contactId,
      removedTags: tags,
      remainingTags: contact.tags.length,
    });
  }

  /**
   * Mark contact as favorite
   */
  async toggleContactFavorite(contactId: string): Promise<boolean> {
    const contact = await this.getContactById(contactId, false);
    if (!contact) {
      throw new Error('Contact not found');
    }

    contact.isFavorite = !contact.isFavorite;
    contact.updatedAt = new Date().toISOString();

    await this.saveContact(contact);

    trackEvent('contact_favorite_toggled', {
      contactId,
      isFavorite: contact.isFavorite,
    });

    return contact.isFavorite;
  }

  /**
   * Verify a contact
   */
  async verifyContact(contactId: string): Promise<void> {
    const contact = await this.getContactById(contactId, false);
    if (!contact) {
      throw new Error('Contact not found');
    }

    contact.isVerified = true;
    contact.needsReview = false;
    contact.updatedAt = new Date().toISOString();

    await this.saveContact(contact);

    trackEvent('contact_verified', { contactId });
  }

  // Private helper methods

  private async initializeDefaultTags(): Promise<void> {
    const defaultTags = [
      { name: 'work', color: '#007AFF' },
      { name: 'personal', color: '#34C759' },
      { name: 'client', color: '#FF9500' },
      { name: 'prospect', color: '#FF3B30' },
      { name: 'partner', color: '#5856D6' },
      { name: 'vendor', color: '#AF52DE' },
      { name: 'scanned', color: '#FF2D92' },
      { name: 'imported', color: '#5AC8FA' },
    ];

    // Implementation would check if tags exist and create them if not
    // This is simplified for brevity
  }

  private async initializeDefaultCategories(): Promise<void> {
    const defaultCategories = [
      { name: 'Business', color: '#007AFF', icon: '💼' },
      { name: 'Personal', color: '#34C759', icon: '👤' },
      { name: 'Technology', color: '#5856D6', icon: '💻' },
      { name: 'Healthcare', color: '#FF3B30', icon: '🏥' },
      { name: 'Education', color: '#FF9500', icon: '🎓' },
      { name: 'Finance', color: '#AF52DE', icon: '💰' },
    ];

    // Implementation would check if categories exist and create them if not
    // This is simplified for brevity
  }

  private performContactMerge(
    primary: Contact,
    secondary: Contact[],
    resolutions: ContactFieldResolution[],
  ): Contact {
    const merged: Contact = {
      ...primary,
      updatedAt: new Date().toISOString(),
    };

    // Apply field resolutions
    resolutions.forEach(resolution => {
      const existingField = merged.fields.find(
        f => f.type === resolution.fieldType,
      );

      switch (resolution.action) {
        case 'use_primary':
          // Keep existing field
          break;
        case 'use_secondary':
          // Find secondary value and use it
          for (const secondaryContact of secondary) {
            const secondaryField = secondaryContact.fields.find(
              f => f.type === resolution.fieldType,
            );
            if (secondaryField) {
              if (existingField) {
                existingField.value = secondaryField.value;
              } else {
                merged.fields.push(secondaryField);
              }
              break;
            }
          }
          break;
        case 'combine':
          // Combine values
          const values = [existingField?.value || ''];
          secondary.forEach(contact => {
            const field = contact.fields.find(
              f => f.type === resolution.fieldType,
            );
            if (field && !values.includes(field.value)) {
              values.push(field.value);
            }
          });
          if (existingField) {
            existingField.value = values.filter(Boolean).join(', ');
          }
          break;
        case 'custom':
          if (existingField && resolution.customValue) {
            existingField.value = resolution.customValue;
          }
          break;
      }
    });

    // Merge tags
    const allTags = [primary.tags];
    secondary.forEach(contact => allTags.push(contact.tags));
    merged.tags = [...new Set(allTags.flat())];

    // Merge notes and interactions would be handled here
    // This is simplified for brevity

    return merged;
  }

  private analyzeContactConflicts(
    primary: Contact,
    secondary: Contact[],
  ): any[] {
    // Simplified conflict analysis
    // Real implementation would compare all fields and identify conflicts
    return [];
  }

  private generateMergeResolutions(conflicts: any[]): ContactFieldResolution[] {
    // Simplified resolution generation
    // Real implementation would provide intelligent suggestions
    return [];
  }

  private generateDefaultMapping(format: string): any[] {
    // Generate default field mapping based on format
    const commonMappings = [
      { sourceField: 'name', targetField: 'name', isRequired: true },
      { sourceField: 'email', targetField: 'email', isRequired: false },
      { sourceField: 'phone', targetField: 'phone', isRequired: false },
      { sourceField: 'company', targetField: 'company', isRequired: false },
    ];

    return commonMappings;
  }

  private async parseContactData(
    data: string,
    format: string,
    mapping?: Record<string, string>,
  ): Promise<Contact[]> {
    // Simplified parsing - real implementation would handle CSV, vCard, JSON parsing
    // This would use libraries like papaparse for CSV, vcard-parser for vCard, etc.

    if (format === 'json') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        throw new Error('Invalid JSON format');
      }
    }

    // Other format parsing would be implemented here
    return [];
  }

  private async checkForDuplicates(
    contacts: Contact[],
  ): Promise<{ uniqueContacts: Contact[]; duplicates: Contact[] }> {
    // Simplified duplicate checking
    // Real implementation would use more sophisticated algorithms
    return {
      uniqueContacts: contacts,
      duplicates: [],
    };
  }

  private getDefaultExportFields(): string[] {
    return ['name', 'email', 'phone', 'company', 'title', 'address'];
  }

  private async generateExportData(
    contacts: Contact[],
    format: string,
    fields: string[],
  ): Promise<string> {
    // Simplified export generation
    // Real implementation would generate proper CSV, vCard, etc.

    if (format === 'json') {
      return JSON.stringify(contacts, null, 2);
    }

    if (format === 'csv') {
      const headers = fields.join(',');
      const rows = contacts.map(contact => {
        return fields
          .map(field => {
            const contactField = contact.fields.find(f => f.type === field);
            return contactField ? `"${contactField.value}"` : '';
          })
          .join(',');
      });

      return [headers, ...rows].join('\n');
    }

    return '';
  }

  private async saveExportFile(
    data: string,
    format: string,
    jobId: string,
  ): Promise<string> {
    // Implementation would save file to device storage or cloud
    // Return file URL or path
    return `exports/${jobId}.${format}`;
  }
}

export const contactManagementService = ContactManagementService.getInstance();
export default ContactManagementService;
