/**
 * Contact Database Service Tests
 *
 * Tests for database CRUD operations and data integrity
 */

import { contactDatabaseService } from '../../src/services/contactDatabaseService';
import {
  Contact,
  ContactField,
  ContactNote,
  ContactInteraction,
} from '../../src/types/contacts';

// Mock data helpers
const createMockContact = (overrides?: Partial<Contact>): Contact => ({
  id:
    overrides?.id ||
    `test-contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  fields: [
    {
      id: 'field-1',
      type: 'name',
      label: 'Full Name',
      value: 'John Doe',
      isEditable: true,
      confidence: 0.9,
    },
    {
      id: 'field-2',
      type: 'email',
      label: 'Email',
      value: 'john@example.com',
      isEditable: true,
      confidence: 0.8,
    },
    {
      id: 'field-3',
      type: 'phone',
      label: 'Phone',
      value: '+1-555-0123',
      isEditable: true,
      confidence: 0.85,
    },
  ],
  source: 'manual',
  confidence: 0.85,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: ['business', 'client'],
  isVerified: true,
  needsReview: false,
  isFavorite: false,
  ...overrides,
});

const createMockNote = (
  contactId: string,
  overrides?: Partial<ContactNote>,
): ContactNote => ({
  id: 'note-1',
  contactId,
  content: 'This is a test note',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  type: 'general',
  isPrivate: false,
  ...overrides,
});

describe('ContactDatabaseService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Initialize database
    await contactDatabaseService.initialize();
  });

  afterEach(async () => {
    // Clean up database
    await contactDatabaseService.deleteAllContacts();
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      const isInitialized = await contactDatabaseService.initialize();
      expect(isInitialized).toBe(true);
    });

    it('should create required tables', async () => {
      await contactDatabaseService.initialize();

      // Verify tables exist by attempting operations
      const contacts = await contactDatabaseService.getAllContacts();
      expect(Array.isArray(contacts)).toBe(true);
    });

    it('should handle database initialization errors gracefully', async () => {
      // Mock database error
      const mockDb = require('react-native-sqlite-storage');
      mockDb.openDatabase.mockImplementationOnce(() => {
        throw new Error('Database initialization failed');
      });

      const result = await contactDatabaseService.initialize();
      expect(result).toBe(false);
    });
  });

  describe('Contact CRUD Operations', () => {
    describe('Create Contact', () => {
      it('should create a new contact successfully', async () => {
        const mockContact = createMockContact();

        await contactDatabaseService.saveContact(mockContact);
        const createdContact = await contactDatabaseService.getContact(
          mockContact.id,
        );

        expect(createdContact).toBeDefined();
        expect(createdContact.id).toBe(mockContact.id);
        expect(createdContact.fields).toHaveLength(3);
        expect(createdContact.source).toBe('manual');
      });

      it('should generate unique IDs for contacts', async () => {
        const contact1 = createMockContact();
        const contact2 = createMockContact();

        await contactDatabaseService.saveContact(contact1);
        await contactDatabaseService.saveContact(contact2);
        const created1 = await contactDatabaseService.getContact(contact1.id);
        const created2 = await contactDatabaseService.getContact(contact2.id);

        expect(created1.id).toBeDefined();
        expect(created2.id).toBeDefined();
        expect(created1.id).not.toBe(created2.id);
      });

      it('should handle duplicate contact creation', async () => {
        const mockContact = createMockContact();

        await contactDatabaseService.saveContact(mockContact);

        // Attempt to create the same contact again
        await expect(
          contactDatabaseService.saveContact(mockContact),
        ).rejects.toThrow();
      });

      it('should validate required fields', async () => {
        const invalidContact = createMockContact({
          fields: [], // No fields
        });

        await expect(
          contactDatabaseService.saveContact(invalidContact),
        ).rejects.toThrow('Contact must have at least one field');
      });
    });

    describe('Read Contact', () => {
      it('should retrieve contact by ID', async () => {
        const mockContact = createMockContact();
        await contactDatabaseService.saveContact(mockContact);

        const retrievedContact = await contactDatabaseService.getContact(
          mockContact.id,
        );

        expect(retrievedContact).toBeDefined();
        expect(retrievedContact?.id).toBe(mockContact.id);
        expect(retrievedContact?.fields).toHaveLength(3);
      });

      it('should return null for non-existent contact', async () => {
        const contact = await contactDatabaseService.getContact(
          'non-existent-id',
        );
        expect(contact).toBeNull();
      });

      it('should retrieve all contacts', async () => {
        const contact1 = createMockContact({ id: 'contact-1' });
        const contact2 = createMockContact({ id: 'contact-2' });

        await contactDatabaseService.saveContact(contact1);
        await contactDatabaseService.saveContact(contact2);

        const allContacts = await contactDatabaseService.getAllContacts();

        expect(allContacts).toHaveLength(2);
        expect(allContacts.map(c => c.id)).toContain('contact-1');
        expect(allContacts.map(c => c.id)).toContain('contact-2');
      });

      it('should paginate contacts correctly', async () => {
        // Create multiple contacts
        for (let i = 0; i < 10; i++) {
          await contactDatabaseService.saveContact(
            createMockContact({ id: `contact-${i}` }),
          );
        }

        const page1 = await contactDatabaseService.getAllContacts(0, 5);
        const page2 = await contactDatabaseService.getAllContacts(5, 5);

        expect(page1).toHaveLength(5);
        expect(page2).toHaveLength(5);

        // Ensure no duplicates between pages
        const page1Ids = page1.map(c => c.id);
        const page2Ids = page2.map(c => c.id);
        expect(page1Ids.some(id => page2Ids.includes(id))).toBe(false);
      });
    });

    describe('Update Contact', () => {
      it('should update contact successfully', async () => {
        const mockContact = createMockContact();
        await contactDatabaseService.saveContact(mockContact);

        const updatedContact = {
          ...mockContact,
          fields: [
            ...mockContact.fields,
            {
              id: 'field-4',
              type: 'company',
              label: 'Company',
              value: 'Acme Corp',
              isEditable: true,
              confidence: 0.9,
            },
          ],
          tags: [...mockContact.tags, 'updated'],
        };

        const result = await contactDatabaseService.updateContact(
          updatedContact,
        );

        expect(result).toBeDefined();
        expect(result.fields).toHaveLength(4);
        expect(result.tags).toContain('updated');
        expect(new Date(result.updatedAt)).toBeInstanceOf(Date);
      });

      it('should handle partial updates', async () => {
        const mockContact = createMockContact();
        await contactDatabaseService.saveContact(mockContact);

        const partialUpdate = {
          ...mockContact,
          tags: ['new-tag'],
          isFavorite: true,
        };

        const result = await contactDatabaseService.updateContact(
          partialUpdate,
        );

        expect(result.tags).toEqual(['new-tag']);
        expect(result.isFavorite).toBe(true);
        expect(result.fields).toHaveLength(3); // Should preserve existing fields
      });

      it('should fail to update non-existent contact', async () => {
        const nonExistentContact = createMockContact({ id: 'non-existent' });

        await expect(
          contactDatabaseService.updateContact(nonExistentContact),
        ).rejects.toThrow();
      });
    });

    describe('Delete Contact', () => {
      it('should delete contact successfully', async () => {
        const mockContact = createMockContact();
        await contactDatabaseService.saveContact(mockContact);

        const deleted = await contactDatabaseService.deleteContact(
          mockContact.id,
        );

        expect(deleted).toBe(true);

        const retrievedContact = await contactDatabaseService.getContact(
          mockContact.id,
        );
        expect(retrievedContact).toBeNull();
      });

      it('should delete contact with notes and interactions', async () => {
        const mockContact = createMockContact();
        await contactDatabaseService.saveContact(mockContact);

        // Add note and interaction
        const note = createMockNote(mockContact.id);
        await contactDatabaseService.addNote(note);

        const interaction = {
          id: 'interaction-1',
          contactId: mockContact.id,
          type: 'call' as const,
          description: 'Test call',
          timestamp: '2024-01-01T00:00:00.000Z',
        };
        await contactDatabaseService.addInteraction(interaction);

        const deleted = await contactDatabaseService.deleteContact(
          mockContact.id,
        );
        expect(deleted).toBe(true);

        // Verify related data is also deleted
        const notes = await contactDatabaseService.getNotesByContactId(
          mockContact.id,
        );
        const interactions =
          await contactDatabaseService.getInteractionsByContactId(
            mockContact.id,
          );

        expect(notes).toHaveLength(0);
        expect(interactions).toHaveLength(0);
      });

      it('should return false for non-existent contact deletion', async () => {
        const deleted = await contactDatabaseService.deleteContact(
          'non-existent',
        );
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Search Operations', () => {
    beforeEach(async () => {
      // Create test contacts for search
      const contacts = [
        createMockContact({
          id: 'contact-1',
          fields: [
            {
              id: 'f1',
              type: 'name',
              label: 'Name',
              value: 'John Doe',
              isEditable: true,
            },
            {
              id: 'f2',
              type: 'email',
              label: 'Email',
              value: 'john@acme.com',
              isEditable: true,
            },
            {
              id: 'f3',
              type: 'company',
              label: 'Company',
              value: 'Acme Corp',
              isEditable: true,
            },
          ],
          tags: ['client', 'business'],
        }),
        createMockContact({
          id: 'contact-2',
          fields: [
            {
              id: 'f4',
              type: 'name',
              label: 'Name',
              value: 'Jane Smith',
              isEditable: true,
            },
            {
              id: 'f5',
              type: 'email',
              label: 'Email',
              value: 'jane@example.com',
              isEditable: true,
            },
            {
              id: 'f6',
              type: 'company',
              label: 'Company',
              value: 'Example Inc',
              isEditable: true,
            },
          ],
          tags: ['prospect'],
        }),
      ];

      for (const contact of contacts) {
        await contactDatabaseService.saveContact(contact);
      }
    });

    it('should search contacts by name', async () => {
      const results = await contactDatabaseService.searchContacts({
        query: 'John',
      });

      expect(results.contacts).toHaveLength(1);
      expect(results.contacts[0].id).toBe('contact-1');
      expect(results.totalCount).toBe(1);
    });

    it('should search contacts by email', async () => {
      const results = await contactDatabaseService.searchContacts({
        query: 'jane@example.com',
      });

      expect(results.contacts).toHaveLength(1);
      expect(results.contacts[0].id).toBe('contact-2');
    });

    it('should search contacts by company', async () => {
      const results = await contactDatabaseService.searchContacts({
        query: 'Acme',
      });

      expect(results.contacts).toHaveLength(1);
      expect(results.contacts[0].id).toBe('contact-1');
    });

    it('should filter contacts by tags', async () => {
      const results = await contactDatabaseService.searchContacts({
        tags: ['client'],
      });

      expect(results.contacts).toHaveLength(1);
      expect(results.contacts[0].id).toBe('contact-1');
    });

    it('should combine query and filters', async () => {
      const results = await contactDatabaseService.searchContacts({
        query: 'John',
        tags: ['business'],
      });

      expect(results.contacts).toHaveLength(1);
      expect(results.contacts[0].id).toBe('contact-1');
    });

    it('should return empty results for non-matching search', async () => {
      const results = await contactDatabaseService.searchContacts({
        query: 'NonExistentName',
      });

      expect(results.contacts).toHaveLength(0);
      expect(results.totalCount).toBe(0);
    });

    it('should provide search facets', async () => {
      const results = await contactDatabaseService.searchContacts({});

      expect(results.facets).toBeDefined();
      expect(results.facets.tags).toContainEqual({ name: 'client', count: 1 });
      expect(results.facets.tags).toContainEqual({
        name: 'business',
        count: 1,
      });
      expect(results.facets.tags).toContainEqual({
        name: 'prospect',
        count: 1,
      });
    });
  });

  describe('Notes Management', () => {
    let testContactId: string;

    beforeEach(async () => {
      const contact = createMockContact();
      await contactDatabaseService.saveContact(contact);
      testContactId = contact.id;
    });

    it('should add note to contact', async () => {
      const note = createMockNote(testContactId);

      const addedNote = await contactDatabaseService.addNote(note);

      expect(addedNote).toBeDefined();
      expect(addedNote.id).toBe(note.id);
      expect(addedNote.contactId).toBe(testContactId);
      expect(addedNote.content).toBe(note.content);
    });

    it('should retrieve notes by contact ID', async () => {
      const note1 = createMockNote(testContactId, {
        id: 'note-1',
        content: 'First note',
      });
      const note2 = createMockNote(testContactId, {
        id: 'note-2',
        content: 'Second note',
      });

      await contactDatabaseService.addNote(note1);
      await contactDatabaseService.addNote(note2);

      const notes = await contactDatabaseService.getNotesByContactId(
        testContactId,
      );

      expect(notes).toHaveLength(2);
      expect(notes.map(n => n.id)).toContain('note-1');
      expect(notes.map(n => n.id)).toContain('note-2');
    });

    it('should update note', async () => {
      const note = createMockNote(testContactId);
      await contactDatabaseService.addNote(note);

      const updatedNote = {
        ...note,
        content: 'Updated note content',
        type: 'meeting' as const,
      };

      const result = await contactDatabaseService.updateNote(updatedNote);

      expect(result.content).toBe('Updated note content');
      expect(result.type).toBe('meeting');
    });

    it('should delete note', async () => {
      const note = createMockNote(testContactId);
      await contactDatabaseService.addNote(note);

      const deleted = await contactDatabaseService.deleteNote(note.id);
      expect(deleted).toBe(true);

      const notes = await contactDatabaseService.getNotesByContactId(
        testContactId,
      );
      expect(notes).toHaveLength(0);
    });
  });

  describe('Interactions Management', () => {
    let testContactId: string;

    beforeEach(async () => {
      const contact = createMockContact();
      await contactDatabaseService.saveContact(contact);
      testContactId = contact.id;
    });

    it('should add interaction to contact', async () => {
      const interaction: ContactInteraction = {
        id: 'interaction-1',
        contactId: testContactId,
        type: 'call',
        description: 'Business call about project',
        timestamp: '2024-01-01T10:00:00.000Z',
        duration: 1800, // 30 minutes
      };

      const addedInteraction = await contactDatabaseService.addInteraction(
        interaction,
      );

      expect(addedInteraction).toBeDefined();
      expect(addedInteraction.id).toBe(interaction.id);
      expect(addedInteraction.type).toBe('call');
      expect(addedInteraction.duration).toBe(1800);
    });

    it('should retrieve interactions by contact ID', async () => {
      const interaction1: ContactInteraction = {
        id: 'int-1',
        contactId: testContactId,
        type: 'email',
        description: 'Sent project proposal',
        timestamp: '2024-01-01T09:00:00.000Z',
      };

      const interaction2: ContactInteraction = {
        id: 'int-2',
        contactId: testContactId,
        type: 'meeting',
        description: 'Project kickoff meeting',
        timestamp: '2024-01-01T14:00:00.000Z',
        duration: 3600,
        participants: ['john@acme.com', 'jane@example.com'],
      };

      await contactDatabaseService.addInteraction(interaction1);
      await contactDatabaseService.addInteraction(interaction2);

      const interactions =
        await contactDatabaseService.getInteractionsByContactId(testContactId);

      expect(interactions).toHaveLength(2);
      expect(interactions.map(i => i.type)).toContain('email');
      expect(interactions.map(i => i.type)).toContain('meeting');
    });

    it('should delete interaction', async () => {
      const interaction: ContactInteraction = {
        id: 'interaction-1',
        contactId: testContactId,
        type: 'call',
        description: 'Test call',
        timestamp: '2024-01-01T10:00:00.000Z',
      };

      await contactDatabaseService.addInteraction(interaction);

      const deleted = await contactDatabaseService.deleteInteraction(
        interaction.id,
      );
      expect(deleted).toBe(true);

      const interactions =
        await contactDatabaseService.getInteractionsByContactId(testContactId);
      expect(interactions).toHaveLength(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of contacts efficiently', async () => {
      const startTime = Date.now();

      // Create 1000 contacts
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        const contact = createMockContact({
          id: `perf-contact-${i}`,
          fields: [
            {
              id: `field-${i}`,
              type: 'name',
              label: 'Name',
              value: `Test User ${i}`,
              isEditable: true,
            },
          ],
        });
        promises.push(contactDatabaseService.saveContact(contact));
      }

      await Promise.all(promises);

      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(30000); // Should complete within 30 seconds

      // Test retrieval performance
      const retrievalStart = Date.now();
      const allContacts = await contactDatabaseService.getAllContacts();
      const retrievalTime = Date.now() - retrievalStart;

      expect(allContacts).toHaveLength(1000);
      expect(retrievalTime).toBeLessThan(5000); // Should retrieve within 5 seconds
    });

    it('should perform search efficiently on large dataset', async () => {
      // Create contacts with searchable data
      for (let i = 0; i < 500; i++) {
        const contact = createMockContact({
          id: `search-contact-${i}`,
          fields: [
            {
              id: `name-${i}`,
              type: 'name',
              label: 'Name',
              value: i % 2 === 0 ? `John Smith ${i}` : `Jane Doe ${i}`,
              isEditable: true,
            },
          ],
        });
        await contactDatabaseService.saveContact(contact);
      }

      const searchStart = Date.now();
      const results = await contactDatabaseService.searchContacts({
        query: 'John',
      });
      const searchTime = Date.now() - searchStart;

      expect(results.contacts.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(2000); // Should search within 2 seconds
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      const contact = createMockContact();
      await contactDatabaseService.saveContact(contact);

      const note = createMockNote(contact.id);
      await contactDatabaseService.addNote(note);

      // Delete contact should cascade to notes
      await contactDatabaseService.deleteContact(contact.id);

      const orphanedNotes = await contactDatabaseService.getNotesByContactId(
        contact.id,
      );
      expect(orphanedNotes).toHaveLength(0);
    });

    it('should handle concurrent operations safely', async () => {
      const contact = createMockContact();
      await contactDatabaseService.saveContact(contact);

      // Simulate concurrent updates
      const updatePromises = [];
      for (let i = 0; i < 10; i++) {
        const updatedContact = {
          ...contact,
          tags: [...contact.tags, `tag-${i}`],
        };
        updatePromises.push(
          contactDatabaseService.updateContact(updatedContact),
        );
      }

      const results = await Promise.allSettled(updatePromises);

      // At least one update should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);

      // Final state should be consistent
      const finalContact = await contactDatabaseService.getContact(contact.id);
      expect(finalContact).toBeDefined();
      expect(Array.isArray(finalContact?.tags)).toBe(true);
    });

    it('should validate field constraints', async () => {
      const invalidContact = createMockContact({
        fields: [
          {
            id: '', // Invalid empty ID
            type: 'name',
            label: 'Name',
            value: 'John Doe',
            isEditable: true,
          },
        ],
      });

      await expect(
        contactDatabaseService.saveContact(invalidContact),
      ).rejects.toThrow();
    });
  });
});
