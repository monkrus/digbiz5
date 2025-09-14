/**
 * Contact Sync Service Tests
 *
 * Tests for sync conflict scenarios and resolution strategies
 */

import { contactSyncService } from '../../../src/services/contactSyncService';
import { Contact, ContactSyncConfig } from '../../../src/types/contacts';
import { contactDatabaseService } from '../../../src/services/contactDatabaseService';

// Mock dependencies
jest.mock('../../../src/services/contactDatabaseService');
jest.mock('@react-native-async-storage/async-storage');

// Mock data helpers
const createMockContact = (overrides?: Partial<Contact>): Contact => ({
  id: `contact-${Math.random().toString(36).substr(2, 9)}`,
  fields: [
    {
      id: 'field-name',
      type: 'name',
      label: 'Full Name',
      value: 'John Doe',
      isEditable: true,
      confidence: 0.9,
    },
    {
      id: 'field-email',
      type: 'email',
      label: 'Email',
      value: 'john@example.com',
      isEditable: true,
      confidence: 0.8,
    },
  ],
  source: 'manual',
  confidence: 0.85,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: ['business'],
  isVerified: true,
  needsReview: false,
  isFavorite: false,
  syncStatus: 'synced',
  ...overrides,
});

describe('ContactSyncService - Conflict Resolution', () => {
  const mockDb = jest.mocked(contactDatabaseService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sync Conflict Detection', () => {
    it('should detect conflicts when local and remote contacts differ', async () => {
      const localContact = createMockContact({
        id: 'conflict-contact-1',
        updatedAt: '2024-01-01T10:00:00.000Z',
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'John Doe',
            isEditable: true,
          },
          {
            id: 'field-2',
            type: 'email',
            label: 'Email',
            value: 'john.doe@company.com',
            isEditable: true,
          },
        ],
      });

      const remoteContact = createMockContact({
        id: 'conflict-contact-1',
        updatedAt: '2024-01-01T11:00:00.000Z', // Updated later
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'John Doe',
            isEditable: true,
          },
          {
            id: 'field-2',
            type: 'email',
            label: 'Email',
            value: 'j.doe@newcompany.com', // Different email
            isEditable: true,
          },
        ],
      });

      mockDb.getContactById.mockResolvedValue(localContact);

      // Mock fetch to return remote contact
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ contact: remoteContact }),
      });

      const conflicts = await contactSyncService.detectConflicts([
        localContact.id,
      ]);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].contactId).toBe('conflict-contact-1');
      expect(conflicts[0].conflictType).toBe('field_mismatch');
      expect(conflicts[0].conflictingFields).toContain('email');
    });

    it('should not detect conflicts for identical contacts', async () => {
      const contact = createMockContact({
        id: 'identical-contact',
        updatedAt: '2024-01-01T10:00:00.000Z',
      });

      mockDb.getContactById.mockResolvedValue(contact);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ contact }),
      });

      const conflicts = await contactSyncService.detectConflicts([contact.id]);

      expect(conflicts).toHaveLength(0);
    });

    it('should detect timestamp-based conflicts', async () => {
      const localContact = createMockContact({
        id: 'timestamp-conflict',
        updatedAt: '2024-01-01T12:00:00.000Z', // Local newer
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'John Local Update',
            isEditable: true,
          },
        ],
      });

      const remoteContact = createMockContact({
        id: 'timestamp-conflict',
        updatedAt: '2024-01-01T11:00:00.000Z', // Remote older
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'John Remote Update',
            isEditable: true,
          },
        ],
      });

      mockDb.getContactById.mockResolvedValue(localContact);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ contact: remoteContact }),
      });

      const conflicts = await contactSyncService.detectConflicts([
        localContact.id,
      ]);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('timestamp_mismatch');
    });
  });

  describe('Conflict Resolution Strategies', () => {
    it('should resolve conflicts using server_wins strategy', async () => {
      const localContact = createMockContact({
        id: 'server-wins-test',
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'Local Name',
            isEditable: true,
          },
        ],
      });

      const remoteContact = createMockContact({
        id: 'server-wins-test',
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'Remote Name',
            isEditable: true,
          },
        ],
      });

      const config: ContactSyncConfig = {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        conflictResolution: 'server_wins',
        includePhotos: true,
        includeNotes: true,
        includeInteractions: true,
        deviceContactsEnabled: false,
        cloudBackupEnabled: true,
      };

      mockDb.getContactById.mockResolvedValue(localContact);
      mockDb.updateContact.mockResolvedValue(remoteContact);

      const resolvedContact = await contactSyncService.resolveConflict(
        localContact,
        remoteContact,
        config,
      );

      expect(resolvedContact.fields[0].value).toBe('Remote Name');
      expect(mockDb.updateContact).toHaveBeenCalledWith(remoteContact);
    });

    it('should resolve conflicts using local_wins strategy', async () => {
      const localContact = createMockContact({
        id: 'local-wins-test',
        fields: [
          {
            id: 'field-1',
            type: 'email',
            label: 'Email',
            value: 'local@example.com',
            isEditable: true,
          },
        ],
      });

      const remoteContact = createMockContact({
        id: 'local-wins-test',
        fields: [
          {
            id: 'field-1',
            type: 'email',
            label: 'Email',
            value: 'remote@example.com',
            isEditable: true,
          },
        ],
      });

      const config: ContactSyncConfig = {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        conflictResolution: 'local_wins',
        includePhotos: true,
        includeNotes: true,
        includeInteractions: true,
        deviceContactsEnabled: false,
        cloudBackupEnabled: true,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const resolvedContact = await contactSyncService.resolveConflict(
        localContact,
        remoteContact,
        config,
      );

      expect(resolvedContact.fields[0].value).toBe('local@example.com');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/contacts/local-wins-test'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('local@example.com'),
        }),
      );
    });

    it('should resolve conflicts using newest_wins strategy', async () => {
      const olderContact = createMockContact({
        id: 'newest-wins-test',
        updatedAt: '2024-01-01T10:00:00.000Z',
        fields: [
          {
            id: 'field-1',
            type: 'phone',
            label: 'Phone',
            value: '+1-555-0000',
            isEditable: true,
          },
        ],
      });

      const newerContact = createMockContact({
        id: 'newest-wins-test',
        updatedAt: '2024-01-01T12:00:00.000Z',
        fields: [
          {
            id: 'field-1',
            type: 'phone',
            label: 'Phone',
            value: '+1-555-9999',
            isEditable: true,
          },
        ],
      });

      const config: ContactSyncConfig = {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        conflictResolution: 'newest_wins',
        includePhotos: true,
        includeNotes: true,
        includeInteractions: true,
        deviceContactsEnabled: false,
        cloudBackupEnabled: true,
      };

      mockDb.updateContact.mockResolvedValue(newerContact);

      // Test with local newer
      let resolvedContact = await contactSyncService.resolveConflict(
        newerContact,
        olderContact,
        config,
      );
      expect(resolvedContact.fields[0].value).toBe('+1-555-9999');

      // Test with remote newer
      resolvedContact = await contactSyncService.resolveConflict(
        olderContact,
        newerContact,
        config,
      );
      expect(resolvedContact.fields[0].value).toBe('+1-555-9999');
    });

    it('should handle manual conflict resolution', async () => {
      const localContact = createMockContact({
        id: 'manual-resolution-test',
        syncStatus: 'conflict',
        conflictData: createMockContact({
          id: 'manual-resolution-test',
          fields: [
            {
              id: 'field-1',
              type: 'company',
              label: 'Company',
              value: 'Remote Company',
              isEditable: true,
            },
          ],
        }),
      });

      const config: ContactSyncConfig = {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        conflictResolution: 'manual',
        includePhotos: true,
        includeNotes: true,
        includeInteractions: true,
        deviceContactsEnabled: false,
        cloudBackupEnabled: true,
      };

      mockDb.updateContact.mockResolvedValue(localContact);

      const resolvedContact = await contactSyncService.resolveConflict(
        localContact,
        localContact.conflictData!,
        config,
      );

      // Manual resolution should mark contact for manual review
      expect(resolvedContact.syncStatus).toBe('conflict');
      expect(resolvedContact.needsReview).toBe(true);
    });
  });

  describe('Field-Level Conflict Resolution', () => {
    it('should merge non-conflicting fields automatically', async () => {
      const localContact = createMockContact({
        id: 'field-merge-test',
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'John Doe',
            isEditable: true,
          },
          {
            id: 'field-2',
            type: 'email',
            label: 'Email',
            value: 'john@local.com',
            isEditable: true,
          },
        ],
      });

      const remoteContact = createMockContact({
        id: 'field-merge-test',
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'John Doe', // Same value
            isEditable: true,
          },
          {
            id: 'field-3',
            type: 'phone',
            label: 'Phone',
            value: '+1-555-0123', // New field
            isEditable: true,
          },
        ],
      });

      const config: ContactSyncConfig = {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        conflictResolution: 'server_wins',
        includePhotos: true,
        includeNotes: true,
        includeInteractions: true,
        deviceContactsEnabled: false,
        cloudBackupEnabled: true,
      };

      const mergedContact = await contactSyncService.mergeContactFields(
        localContact,
        remoteContact,
        config,
      );

      expect(mergedContact.fields).toHaveLength(3);
      expect(mergedContact.fields.find(f => f.type === 'name')?.value).toBe(
        'John Doe',
      );
      expect(mergedContact.fields.find(f => f.type === 'phone')?.value).toBe(
        '+1-555-0123',
      );
    });

    it('should handle confidence-based field resolution', async () => {
      const localContact = createMockContact({
        id: 'confidence-test',
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'John Doe',
            isEditable: true,
            confidence: 0.9, // High confidence
          },
        ],
      });

      const remoteContact = createMockContact({
        id: 'confidence-test',
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'J. Doe',
            isEditable: true,
            confidence: 0.6, // Lower confidence
          },
        ],
      });

      const mergedContact = await contactSyncService.mergeByConfidence(
        localContact,
        remoteContact,
      );

      // Should prefer higher confidence value
      expect(mergedContact.fields[0].value).toBe('John Doe');
      expect(mergedContact.fields[0].confidence).toBe(0.9);
    });

    it('should preserve metadata during field merging', async () => {
      const localContact = createMockContact({
        id: 'metadata-test',
        fields: [
          {
            id: 'field-1',
            type: 'email',
            label: 'Email',
            value: 'john@example.com',
            isEditable: true,
            metadata: { source: 'business_card', verified: true },
          },
        ],
      });

      const remoteContact = createMockContact({
        id: 'metadata-test',
        fields: [
          {
            id: 'field-1',
            type: 'email',
            label: 'Email',
            value: 'john@example.com',
            isEditable: true,
            metadata: { lastVerified: '2024-01-01T00:00:00.000Z' },
          },
        ],
      });

      const config: ContactSyncConfig = {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        conflictResolution: 'server_wins',
        includePhotos: true,
        includeNotes: true,
        includeInteractions: true,
        deviceContactsEnabled: false,
        cloudBackupEnabled: true,
      };

      const mergedContact = await contactSyncService.mergeContactFields(
        localContact,
        remoteContact,
        config,
      );

      const mergedField = mergedContact.fields[0];
      expect(mergedField.metadata).toEqual({
        source: 'business_card',
        verified: true,
        lastVerified: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  describe('Bulk Conflict Resolution', () => {
    it('should resolve multiple conflicts efficiently', async () => {
      const conflictContacts = Array.from({ length: 100 }, (_, i) => ({
        local: createMockContact({
          id: `bulk-conflict-${i}`,
          fields: [
            {
              id: `field-${i}`,
              type: 'name',
              label: 'Name',
              value: `Local Name ${i}`,
              isEditable: true,
            },
          ],
        }),
        remote: createMockContact({
          id: `bulk-conflict-${i}`,
          fields: [
            {
              id: `field-${i}`,
              type: 'name',
              label: 'Name',
              value: `Remote Name ${i}`,
              isEditable: true,
            },
          ],
        }),
      }));

      const config: ContactSyncConfig = {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        conflictResolution: 'server_wins',
        includePhotos: true,
        includeNotes: true,
        includeInteractions: true,
        deviceContactsEnabled: false,
        cloudBackupEnabled: true,
      };

      mockDb.updateContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const startTime = Date.now();

      const resolvedContacts = await Promise.all(
        conflictContacts.map(({ local, remote }) =>
          contactSyncService.resolveConflict(local, remote, config),
        ),
      );

      const resolutionTime = Date.now() - startTime;

      expect(resolvedContacts).toHaveLength(100);
      expect(resolutionTime).toBeLessThan(5000); // Should resolve within 5 seconds
      expect(
        resolvedContacts.every(c =>
          c.fields[0].value.startsWith('Remote Name'),
        ),
      ).toBe(true);
    });

    it('should batch conflict resolution operations', async () => {
      const conflicts = Array.from({ length: 50 }, (_, i) => ({
        contactId: `batch-${i}`,
        conflictType: 'field_mismatch' as const,
        conflictingFields: ['name'],
        local: createMockContact({ id: `batch-${i}` }),
        remote: createMockContact({ id: `batch-${i}` }),
      }));

      const config: ContactSyncConfig = {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        conflictResolution: 'newest_wins',
        includePhotos: true,
        includeNotes: true,
        includeInteractions: true,
        deviceContactsEnabled: false,
        cloudBackupEnabled: true,
      };

      const batchSize = 10;
      let resolvedCount = 0;

      for (let i = 0; i < conflicts.length; i += batchSize) {
        const batch = conflicts.slice(i, i + batchSize);

        const batchPromises = batch.map(conflict =>
          contactSyncService.resolveConflict(
            conflict.local,
            conflict.remote,
            config,
          ),
        );

        const batchResults = await Promise.all(batchPromises);
        resolvedCount += batchResults.length;
      }

      expect(resolvedCount).toBe(conflicts.length);
    });
  });

  describe('Conflict Prevention', () => {
    it('should prevent conflicts with optimistic locking', async () => {
      const contact = createMockContact({
        id: 'optimistic-lock-test',
        updatedAt: '2024-01-01T10:00:00.000Z',
      });

      mockDb.getContactById.mockResolvedValue(contact);

      // Simulate concurrent updates
      const update1Promise = contactSyncService.updateContactWithLock(
        contact.id,
        {
          fields: [
            {
              id: 'field-1',
              type: 'name',
              label: 'Name',
              value: 'Update 1',
              isEditable: true,
            },
          ],
        },
      );

      const update2Promise = contactSyncService.updateContactWithLock(
        contact.id,
        {
          fields: [
            {
              id: 'field-1',
              type: 'name',
              label: 'Name',
              value: 'Update 2',
              isEditable: true,
            },
          ],
        },
      );

      const results = await Promise.allSettled([
        update1Promise,
        update2Promise,
      ]);

      // One should succeed, one should fail due to conflict
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(1);
    });

    it('should use version numbers for conflict detection', async () => {
      const contact = createMockContact({
        id: 'version-test',
        updatedAt: '2024-01-01T10:00:00.000Z',
        metadata: { version: 1 },
      });

      mockDb.getContactById.mockResolvedValue(contact);

      // Attempt update with wrong version
      await expect(
        contactSyncService.updateContactWithVersion(
          contact.id,
          {
            fields: contact.fields,
          },
          0,
        ), // Wrong version
      ).rejects.toThrow('Version conflict detected');

      // Attempt update with correct version
      mockDb.updateContact.mockResolvedValue({
        ...contact,
        metadata: { version: 2 },
      });

      const updatedContact = await contactSyncService.updateContactWithVersion(
        contact.id,
        { fields: contact.fields },
        1, // Correct version
      );

      expect(updatedContact.metadata?.version).toBe(2);
    });
  });

  describe('Sync Performance Under Conflicts', () => {
    it('should maintain sync performance with many conflicts', async () => {
      const conflictCount = 200;
      const conflicts = Array.from({ length: conflictCount }, (_, i) =>
        createMockContact({
          id: `perf-conflict-${i}`,
          syncStatus: 'conflict',
        }),
      );

      mockDb.searchContacts.mockResolvedValue({
        contacts: conflicts,
        totalCount: conflictCount,
        facets: { tags: [], categories: [], sources: [] },
      });

      const config: ContactSyncConfig = {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        conflictResolution: 'server_wins',
        includePhotos: true,
        includeNotes: true,
        includeInteractions: true,
        deviceContactsEnabled: false,
        cloudBackupEnabled: true,
      };

      const startTime = Date.now();

      const conflictSummary = await contactSyncService.resolveAllConflicts(
        config,
      );

      const resolutionTime = Date.now() - startTime;

      expect(conflictSummary.totalConflicts).toBe(conflictCount);
      expect(resolutionTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
