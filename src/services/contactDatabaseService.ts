/**
 * Contact Database Service
 *
 * SQLite database management for contact storage and CRM functionality
 */

import SQLite from 'react-native-sqlite-storage';
import {
  Contact,
  ContactNote,
  ContactInteraction,
  ContactTag,
  ContactCategory,
  ContactSearchFilters,
  ContactSearchResult,
  DuplicateContact,
  ContactAnalytics,
  ContactTable,
  ContactNoteTable,
  ContactInteractionTable,
  ContactTagTable,
  ContactCategoryTable,
} from '../types/contacts';
import { trackEvent } from './analyticsService';

// SQLite.DEBUG(false); // Comment out for testing
SQLite.enablePromise(true);

export class ContactDatabaseService {
  private static instance: ContactDatabaseService;
  private database: SQLite.SQLiteDatabase | null = null;
  private readonly databaseName = 'contacts.db';
  private readonly databaseVersion = '1.0';
  private readonly databaseDisplayName = 'Contact Database';
  private readonly databaseSize = 200000;

  private constructor() {}

  static getInstance(): ContactDatabaseService {
    if (!ContactDatabaseService.instance) {
      ContactDatabaseService.instance = new ContactDatabaseService();
    }
    return ContactDatabaseService.instance;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<boolean> {
    try {
      this.database = await SQLite.openDatabase({
        name: this.databaseName,
        version: this.databaseVersion,
        displayName: this.databaseDisplayName,
        size: this.databaseSize,
      });

      await this.createTables();
      await this.createIndexes();

      trackEvent('contact_database_initialized');
      console.log('Contact database initialized successfully');

      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return false;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const createTableQueries = [
      // Contacts table
      `CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        fields_json TEXT NOT NULL,
        source TEXT NOT NULL,
        confidence REAL DEFAULT 0.0,
        raw_text TEXT,
        image_uri TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tags_json TEXT DEFAULT '[]',
        is_verified INTEGER DEFAULT 0,
        needs_review INTEGER DEFAULT 0,
        is_favorite INTEGER DEFAULT 0,
        last_interaction_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        conflict_data_json TEXT
      )`,

      // Contact notes table
      `CREATE TABLE IF NOT EXISTS contact_notes (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        type TEXT DEFAULT 'general',
        is_private INTEGER DEFAULT 0,
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
      )`,

      // Contact interactions table
      `CREATE TABLE IF NOT EXISTS contact_interactions (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata_json TEXT,
        duration INTEGER,
        participants_json TEXT,
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
      )`,

      // Contact tags table
      `CREATE TABLE IF NOT EXISTS contact_tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        contact_count INTEGER DEFAULT 0
      )`,

      // Contact categories table
      `CREATE TABLE IF NOT EXISTS contact_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        icon TEXT,
        parent_id TEXT,
        contact_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES contact_categories (id)
      )`,

      // Contact groups table
      `CREATE TABLE IF NOT EXISTS contact_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        contact_ids_json TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_shared INTEGER DEFAULT 0
      )`,

      // Duplicate contacts table
      `CREATE TABLE IF NOT EXISTS duplicate_contacts (
        id TEXT PRIMARY KEY,
        contact_ids_json TEXT NOT NULL,
        similarity REAL NOT NULL,
        suggested_action TEXT NOT NULL,
        matching_fields_json TEXT NOT NULL,
        confidence REAL NOT NULL,
        detected_at TEXT NOT NULL,
        resolved_at TEXT,
        resolution TEXT
      )`,

      // Contact sync queue table
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        last_attempt_at TEXT,
        error_message TEXT,
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
      )`,
    ];

    for (const query of createTableQueries) {
      await this.database.executeSql(query);
    }
  }

  /**
   * Create database indexes for better query performance
   */
  private async createIndexes(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const createIndexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_updated_at ON contacts(updated_at)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_is_verified ON contacts(is_verified)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_needs_review ON contacts(needs_review)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_is_favorite ON contacts(is_favorite)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_sync_status ON contacts(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id)',
      'CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact_id ON contact_interactions(contact_id)',
      'CREATE INDEX IF NOT EXISTS idx_contact_interactions_timestamp ON contact_interactions(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_duplicate_contacts_similarity ON duplicate_contacts(similarity)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_action ON sync_queue(action)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at)',
    ];

    for (const query of createIndexQueries) {
      await this.database.executeSql(query);
    }
  }

  /**
   * Save a contact to the database
   */
  async saveContact(contact: Contact): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const contactData: ContactTable = {
      id: contact.id,
      fields_json: JSON.stringify(contact.fields),
      source: contact.source,
      confidence: contact.confidence || 0.0,
      raw_text: contact.rawText,
      image_uri: contact.imageUri,
      created_at: contact.createdAt,
      updated_at: contact.updatedAt,
      tags_json: JSON.stringify(contact.tags),
      is_verified: contact.isVerified ? 1 : 0,
      needs_review: contact.needsReview ? 1 : 0,
      is_favorite: contact.isFavorite ? 1 : 0,
      last_interaction_at: contact.lastInteractionAt,
      sync_status: contact.syncStatus,
      conflict_data_json: contact.conflictData
        ? JSON.stringify(contact.conflictData)
        : undefined,
    };

    const query = `
      INSERT OR REPLACE INTO contacts (
        id, fields_json, source, confidence, raw_text, image_uri,
        created_at, updated_at, tags_json, is_verified, needs_review,
        is_favorite, last_interaction_at, sync_status, conflict_data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      contactData.id,
      contactData.fields_json,
      contactData.source,
      contactData.confidence,
      contactData.raw_text,
      contactData.image_uri,
      contactData.created_at,
      contactData.updated_at,
      contactData.tags_json,
      contactData.is_verified,
      contactData.needs_review,
      contactData.is_favorite,
      contactData.last_interaction_at,
      contactData.sync_status,
      contactData.conflict_data_json,
    ];

    await this.database.executeSql(query, values);

    // Update tag counts
    await this.updateTagCounts(contact.tags);

    trackEvent('contact_saved', {
      contactId: contact.id,
      source: contact.source,
      fieldsCount: contact.fields.length,
    });
  }

  /**
   * Get a contact by ID
   */
  async getContact(id: string): Promise<Contact | null> {
    if (!this.database) throw new Error('Database not initialized');

    const query = 'SELECT * FROM contacts WHERE id = ?';
    const [result] = await this.database.executeSql(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToContact(result.rows.item(0));
  }

  /**
   * Search contacts with filters
   */
  async searchContacts(
    filters: ContactSearchFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ContactSearchResult> {
    if (!this.database) throw new Error('Database not initialized');

    const { whereClause, params } = this.buildWhereClause(filters);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM contacts ${whereClause}`;
    const [countResult] = await this.database.executeSql(countQuery, params);
    const totalCount = countResult.rows.item(0).total;

    // Get contacts
    const contactsQuery = `
      SELECT * FROM contacts 
      ${whereClause}
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `;
    const [contactsResult] = await this.database.executeSql(contactsQuery, [
      ...params,
      limit,
      offset,
    ]);

    const contacts: Contact[] = [];
    for (let i = 0; i < contactsResult.rows.length; i++) {
      contacts.push(this.mapRowToContact(contactsResult.rows.item(i)));
    }

    // Get facets
    const facets = await this.getSearchFacets(filters);

    return {
      contacts,
      totalCount,
      facets,
    };
  }

  /**
   * Get all contacts
   */
  async getAllContacts(): Promise<Contact[]> {
    if (!this.database) throw new Error('Database not initialized');

    const query = 'SELECT * FROM contacts ORDER BY updated_at DESC';
    const [result] = await this.database.executeSql(query);

    const contacts: Contact[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      contacts.push(this.mapRowToContact(result.rows.item(i)));
    }

    return contacts;
  }

  /**
   * Update a contact
   */
  async updateContact(contact: Contact): Promise<void> {
    contact.updatedAt = new Date().toISOString();
    await this.saveContact(contact);
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    // Get contact to update tag counts
    const contact = await this.getContact(id);

    await this.database.executeSql('DELETE FROM contacts WHERE id = ?', [id]);

    if (contact) {
      await this.updateTagCounts(contact.tags, true);
    }

    trackEvent('contact_deleted', { contactId: id });
  }

  /**
   * Bulk save contacts
   */
  async bulkSaveContacts(contacts: Contact[]): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    await this.database.transaction(async tx => {
      for (const contact of contacts) {
        const contactData: ContactTable = {
          id: contact.id,
          fields_json: JSON.stringify(contact.fields),
          source: contact.source,
          confidence: contact.confidence || 0.0,
          raw_text: contact.rawText,
          image_uri: contact.imageUri,
          created_at: contact.createdAt,
          updated_at: contact.updatedAt,
          tags_json: JSON.stringify(contact.tags),
          is_verified: contact.isVerified ? 1 : 0,
          needs_review: contact.needsReview ? 1 : 0,
          is_favorite: contact.isFavorite ? 1 : 0,
          last_interaction_at: contact.lastInteractionAt,
          sync_status: contact.syncStatus,
          conflict_data_json: contact.conflictData
            ? JSON.stringify(contact.conflictData)
            : undefined,
        };

        const query = `
          INSERT OR REPLACE INTO contacts (
            id, fields_json, source, confidence, raw_text, image_uri,
            created_at, updated_at, tags_json, is_verified, needs_review,
            is_favorite, last_interaction_at, sync_status, conflict_data_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          contactData.id,
          contactData.fields_json,
          contactData.source,
          contactData.confidence,
          contactData.raw_text,
          contactData.image_uri,
          contactData.created_at,
          contactData.updated_at,
          contactData.tags_json,
          contactData.is_verified,
          contactData.needs_review,
          contactData.is_favorite,
          contactData.last_interaction_at,
          contactData.sync_status,
          contactData.conflict_data_json,
        ];

        await tx.executeSql(query, values);
      }
    });

    trackEvent('contacts_bulk_saved', { count: contacts.length });
  }

  /**
   * Save a contact note
   */
  async saveContactNote(note: ContactNote): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO contact_notes (
        id, contact_id, content, created_at, updated_at, type, is_private
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      note.id,
      note.contactId,
      note.content,
      note.createdAt,
      note.updatedAt,
      note.type,
      note.isPrivate ? 1 : 0,
    ];

    await this.database.executeSql(query, values);
  }

  /**
   * Get notes for a contact
   */
  async getContactNotes(contactId: string): Promise<ContactNote[]> {
    if (!this.database) throw new Error('Database not initialized');

    const query =
      'SELECT * FROM contact_notes WHERE contact_id = ? ORDER BY created_at DESC';
    const [result] = await this.database.executeSql(query, [contactId]);

    const notes: ContactNote[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      notes.push({
        id: row.id,
        contactId: row.contact_id,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        type: row.type,
        isPrivate: row.is_private === 1,
      });
    }

    return notes;
  }

  /**
   * Save a contact interaction
   */
  async saveContactInteraction(interaction: ContactInteraction): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO contact_interactions (
        id, contact_id, type, description, timestamp, metadata_json, duration, participants_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      interaction.id,
      interaction.contactId,
      interaction.type,
      interaction.description,
      interaction.timestamp,
      interaction.metadata ? JSON.stringify(interaction.metadata) : null,
      interaction.duration,
      interaction.participants
        ? JSON.stringify(interaction.participants)
        : null,
    ];

    await this.database.executeSql(query, values);

    // Update last interaction timestamp
    await this.database.executeSql(
      'UPDATE contacts SET last_interaction_at = ? WHERE id = ?',
      [interaction.timestamp, interaction.contactId],
    );
  }

  /**
   * Get interactions for a contact
   */
  async getContactInteractions(
    contactId: string,
  ): Promise<ContactInteraction[]> {
    if (!this.database) throw new Error('Database not initialized');

    const query =
      'SELECT * FROM contact_interactions WHERE contact_id = ? ORDER BY timestamp DESC';
    const [result] = await this.database.executeSql(query, [contactId]);

    const interactions: ContactInteraction[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      interactions.push({
        id: row.id,
        contactId: row.contact_id,
        type: row.type,
        description: row.description,
        timestamp: row.timestamp,
        metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
        duration: row.duration,
        participants: row.participants_json
          ? JSON.parse(row.participants_json)
          : undefined,
      });
    }

    return interactions;
  }

  /**
   * Find duplicate contacts
   */
  async findDuplicateContacts(
    threshold: number = 0.8,
  ): Promise<DuplicateContact[]> {
    if (!this.database) throw new Error('Database not initialized');

    const contacts = await this.getAllContacts();
    const duplicates: DuplicateContact[] = [];

    // Simple duplicate detection based on email and phone
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const similarity = this.calculateContactSimilarity(
          contacts[i],
          contacts[j],
        );

        if (similarity >= threshold) {
          const matchingFields = this.getMatchingFields(
            contacts[i],
            contacts[j],
          );

          duplicates.push({
            id: `dup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contacts: [contacts[i], contacts[j]],
            similarity,
            suggestedAction: similarity > 0.9 ? 'merge' : 'manual_review',
            matchingFields,
            confidence: similarity,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Get contact analytics
   */
  async getContactAnalytics(): Promise<ContactAnalytics> {
    if (!this.database) throw new Error('Database not initialized');

    const [totalResult] = await this.database.executeSql(
      'SELECT COUNT(*) as total FROM contacts',
    );
    const [verifiedResult] = await this.database.executeSql(
      'SELECT COUNT(*) as verified FROM contacts WHERE is_verified = 1',
    );
    const [reviewResult] = await this.database.executeSql(
      'SELECT COUNT(*) as review FROM contacts WHERE needs_review = 1',
    );
    const [avgConfidenceResult] = await this.database.executeSql(
      'SELECT AVG(confidence) as avg_confidence FROM contacts',
    );

    // Get contacts by source
    const [sourceResult] = await this.database.executeSql(
      'SELECT source, COUNT(*) as count FROM contacts GROUP BY source',
    );
    const contactsBySource: Record<string, number> = {};
    for (let i = 0; i < sourceResult.rows.length; i++) {
      const row = sourceResult.rows.item(i);
      contactsBySource[row.source] = row.count;
    }

    // Get recent interactions
    const oneWeekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const [recentInteractionsResult] = await this.database.executeSql(
      'SELECT COUNT(*) as recent FROM contact_interactions WHERE timestamp > ?',
      [oneWeekAgo],
    );

    return {
      totalContacts: totalResult.rows.item(0).total,
      verifiedContacts: verifiedResult.rows.item(0).verified,
      contactsNeedingReview: reviewResult.rows.item(0).review,
      averageConfidence: avgConfidenceResult.rows.item(0).avg_confidence || 0,
      contactsBySource,
      contactsByTag: {}, // TODO: Implement tag counting
      contactsByCategory: {}, // TODO: Implement category counting
      recentInteractions: recentInteractionsResult.rows.item(0).recent,
      topTags: [], // TODO: Implement
      topCategories: [], // TODO: Implement
      growthStats: {
        thisWeek: 0, // TODO: Implement
        thisMonth: 0, // TODO: Implement
        thisYear: 0, // TODO: Implement
      },
    };
  }

  /**
   * Build WHERE clause for search filters
   */
  private buildWhereClause(filters: ContactSearchFilters): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.query) {
      conditions.push('(fields_json LIKE ? OR raw_text LIKE ?)');
      params.push(`%${filters.query}%`, `%${filters.query}%`);
    }

    if (filters.source && filters.source.length > 0) {
      const placeholders = filters.source.map(() => '?').join(',');
      conditions.push(`source IN (${placeholders})`);
      params.push(...filters.source);
    }

    if (filters.isVerified !== undefined) {
      conditions.push('is_verified = ?');
      params.push(filters.isVerified ? 1 : 0);
    }

    if (filters.needsReview !== undefined) {
      conditions.push('needs_review = ?');
      params.push(filters.needsReview ? 1 : 0);
    }

    if (filters.isFavorite !== undefined) {
      conditions.push('is_favorite = ?');
      params.push(filters.isFavorite ? 1 : 0);
    }

    if (filters.dateRange) {
      const field = filters.dateRange.field;
      conditions.push(`${field} BETWEEN ? AND ?`);
      params.push(filters.dateRange.start, filters.dateRange.end);
    }

    if (filters.confidenceRange) {
      conditions.push('confidence BETWEEN ? AND ?');
      params.push(filters.confidenceRange.min, filters.confidenceRange.max);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  /**
   * Get search facets
   */
  private async getSearchFacets(
    filters: ContactSearchFilters,
  ): Promise<ContactSearchResult['facets']> {
    // Simplified implementation - would need more complex logic for real facets
    return {
      tags: [],
      categories: [],
      sources: [],
    };
  }

  /**
   * Map database row to Contact object
   */
  private mapRowToContact(row: any): Contact {
    return {
      id: row.id,
      fields: JSON.parse(row.fields_json),
      source: row.source,
      confidence: row.confidence,
      rawText: row.raw_text,
      imageUri: row.image_uri,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: JSON.parse(row.tags_json),
      isVerified: row.is_verified === 1,
      needsReview: row.needs_review === 1,
      isFavorite: row.is_favorite === 1,
      lastInteractionAt: row.last_interaction_at,
      syncStatus: row.sync_status,
      conflictData: row.conflict_data_json
        ? JSON.parse(row.conflict_data_json)
        : undefined,
    };
  }

  /**
   * Update tag counts
   */
  private async updateTagCounts(
    tags: string[],
    isDelete: boolean = false,
  ): Promise<void> {
    if (!this.database || tags.length === 0) return;

    for (const tag of tags) {
      const increment = isDelete ? -1 : 1;
      await this.database.executeSql(
        `INSERT INTO contact_tags (id, name, color, created_at, contact_count) 
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(name) DO UPDATE SET contact_count = contact_count + ?`,
        [`tag_${tag}`, tag, '#007AFF', new Date().toISOString(), increment],
      );
    }
  }

  /**
   * Calculate similarity between two contacts
   */
  private calculateContactSimilarity(
    contact1: Contact,
    contact2: Contact,
  ): number {
    let matches = 0;
    let totalFields = 0;

    const getFieldValue = (contact: Contact, type: string): string => {
      const field = contact.fields.find(f => f.type === type);
      return field ? field.value.toLowerCase().trim() : '';
    };

    const fieldTypes = ['name', 'email', 'phone', 'company'];

    for (const fieldType of fieldTypes) {
      const value1 = getFieldValue(contact1, fieldType);
      const value2 = getFieldValue(contact2, fieldType);

      if (value1 && value2) {
        totalFields++;
        if (value1 === value2) {
          matches++;
        }
      }
    }

    return totalFields > 0 ? matches / totalFields : 0;
  }

  /**
   * Get matching fields between two contacts
   */
  private getMatchingFields(contact1: Contact, contact2: Contact): string[] {
    const matchingFields: string[] = [];

    const getFieldValue = (contact: Contact, type: string): string => {
      const field = contact.fields.find(f => f.type === type);
      return field ? field.value.toLowerCase().trim() : '';
    };

    const fieldTypes = ['name', 'email', 'phone', 'company'];

    for (const fieldType of fieldTypes) {
      const value1 = getFieldValue(contact1, fieldType);
      const value2 = getFieldValue(contact2, fieldType);

      if (value1 && value2 && value1 === value2) {
        matchingFields.push(fieldType);
      }
    }

    return matchingFields;
  }

  /**
   * Delete all contacts (for testing)
   */
  async deleteAllContacts(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      await this.database.executeSql('DELETE FROM contact_interactions');
      await this.database.executeSql('DELETE FROM contact_notes');
      await this.database.executeSql('DELETE FROM contacts');

      trackEvent('database_cleared', {
        operation: 'delete_all_contacts',
      });
    } catch (error) {
      console.error('Error deleting all contacts:', error);
      throw new Error(`Failed to delete all contacts: ${error.message}`);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }
}

export const contactDatabaseService = ContactDatabaseService.getInstance();
export default ContactDatabaseService;
