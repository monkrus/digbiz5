/**
 * Contact Import/Export Service Tests
 *
 * Tests for data integrity during import/export operations
 */

import { contactManagementService } from '../../src/services/contactManagementService';
import {
  Contact,
  ContactImportJob,
  ContactExportJob,
  ContactImportMapping,
} from '../../src/types/contacts';
import { contactDatabaseService } from '../../src/services/contactDatabaseService';

// Mock dependencies
jest.mock('../../src/services/contactDatabaseService');
jest.mock('react-native-fs', () => ({
  writeFile: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('')),
  exists: jest.fn(() => Promise.resolve(true)),
  unlink: jest.fn(() => Promise.resolve()),
  DocumentDirectoryPath: '/mock/documents',
  TemporaryDirectoryPath: '/mock/temp',
}));

// Mock document picker
jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(() =>
    Promise.resolve([
      {
        uri: 'file:///mock/contacts.csv',
        name: 'contacts.csv',
        type: 'text/csv',
        size: 1024,
      },
    ]),
  ),
  types: {
    csv: 'text/csv',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
}));

// Mock share
jest.mock('react-native-share', () => ({
  open: jest.fn(() => Promise.resolve()),
}));

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
    },
    {
      id: 'field-email',
      type: 'email',
      label: 'Email',
      value: 'john@example.com',
      isEditable: true,
    },
    {
      id: 'field-phone',
      type: 'phone',
      label: 'Phone',
      value: '+1-555-0123',
      isEditable: true,
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
  ...overrides,
});

describe('Contact Import/Export - Data Integrity', () => {
  const mockDb = contactDatabaseService as jest.Mocked<
    typeof contactDatabaseService
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CSV Import', () => {
    it('should import CSV data with correct field mapping', async () => {
      const csvData = `Name,Email,Phone,Company
John Doe,john@example.com,+1-555-0123,Acme Corp
Jane Smith,jane@example.com,+1-555-0456,Example Inc
Bob Johnson,bob@example.com,+1-555-0789,Test LLC`;

      const mapping: ContactImportMapping[] = [
        { sourceField: 'Name', targetField: 'name', isRequired: true },
        { sourceField: 'Email', targetField: 'email', isRequired: false },
        { sourceField: 'Phone', targetField: 'phone', isRequired: false },
        { sourceField: 'Company', targetField: 'company', isRequired: false },
      ];

      const RNFS = require('react-native-fs');
      RNFS.readFile.mockResolvedValue(csvData);

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'csv-import-test',
        filename: 'contacts.csv',
        format: 'csv',
        status: 'pending',
        mapping,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.importContacts(importJob);

      expect(result.results?.successfulImports).toBe(3);
      expect(result.results?.failedImports).toBe(0);
      expect(result.results?.totalRecords).toBe(3);
      expect(mockDb.createContact).toHaveBeenCalledTimes(3);

      // Verify first contact mapping
      const firstContactCall = mockDb.createContact.mock.calls[0][0];
      expect(firstContactCall.fields.find(f => f.type === 'name')?.value).toBe(
        'John Doe',
      );
      expect(firstContactCall.fields.find(f => f.type === 'email')?.value).toBe(
        'john@example.com',
      );
      expect(firstContactCall.fields.find(f => f.type === 'phone')?.value).toBe(
        '+1-555-0123',
      );
      expect(
        firstContactCall.fields.find(f => f.type === 'company')?.value,
      ).toBe('Acme Corp');
    });

    it('should handle malformed CSV data gracefully', async () => {
      const malformedCsv = `Name,Email,Phone
John Doe,john@example.com,+1-555-0123
Jane Smith,jane@example.com
"Bob Johnson","bob@example.com","incomplete row`;

      const mapping: ContactImportMapping[] = [
        { sourceField: 'Name', targetField: 'name', isRequired: true },
        { sourceField: 'Email', targetField: 'email', isRequired: true },
        { sourceField: 'Phone', targetField: 'phone', isRequired: false },
      ];

      const RNFS = require('react-native-fs');
      RNFS.readFile.mockResolvedValue(malformedCsv);

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'malformed-csv-test',
        filename: 'malformed.csv',
        format: 'csv',
        status: 'pending',
        mapping,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.importContacts(importJob);

      expect(result.results?.successfulImports).toBe(1); // Only first row is complete
      expect(result.results?.failedImports).toBe(2);
      expect(result.results?.errors).toContain('Missing required field: email');
    });

    it('should apply field transformations during import', async () => {
      const csvData = `name,email,phone
john doe,JOHN@EXAMPLE.COM,555.123.4567`;

      const mapping: ContactImportMapping[] = [
        {
          sourceField: 'name',
          targetField: 'name',
          transformation: 'capitalize',
          isRequired: true,
        },
        {
          sourceField: 'email',
          targetField: 'email',
          transformation: 'email_normalize',
          isRequired: false,
        },
        {
          sourceField: 'phone',
          targetField: 'phone',
          transformation: 'phone_format',
          isRequired: false,
        },
      ];

      const RNFS = require('react-native-fs');
      RNFS.readFile.mockResolvedValue(csvData);

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'transformation-test',
        filename: 'transform.csv',
        format: 'csv',
        status: 'pending',
        mapping,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.importContacts(importJob);

      expect(result.results?.successfulImports).toBe(1);

      const createdContact = mockDb.createContact.mock.calls[0][0];
      expect(createdContact.fields.find(f => f.type === 'name')?.value).toBe(
        'John Doe',
      );
      expect(createdContact.fields.find(f => f.type === 'email')?.value).toBe(
        'john@example.com',
      );
      expect(createdContact.fields.find(f => f.type === 'phone')?.value).toBe(
        '+1-555-123-4567',
      );
    });

    it('should handle duplicate detection during import', async () => {
      const csvData = `Name,Email
John Doe,john@example.com
John Doe,john@example.com
Jane Smith,jane@example.com`;

      const mapping: ContactImportMapping[] = [
        { sourceField: 'Name', targetField: 'name', isRequired: true },
        { sourceField: 'Email', targetField: 'email', isRequired: true },
      ];

      const RNFS = require('react-native-fs');
      RNFS.readFile.mockResolvedValue(csvData);

      // Mock existing contact check
      mockDb.searchContacts.mockImplementation(filters => {
        if (filters.query === 'john@example.com') {
          return Promise.resolve({
            contacts: [createMockContact({ id: 'existing-john' })],
            totalCount: 1,
            facets: { tags: [], categories: [], sources: [] },
          });
        }
        return Promise.resolve({
          contacts: [],
          totalCount: 0,
          facets: { tags: [], categories: [], sources: [] },
        });
      });

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'duplicate-test',
        filename: 'duplicates.csv',
        format: 'csv',
        status: 'pending',
        mapping,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.importContacts(importJob);

      expect(result.results?.successfulImports).toBe(1); // Only Jane Smith
      expect(result.results?.duplicatesFound).toBe(2); // Both John Doe entries
      expect(mockDb.createContact).toHaveBeenCalledTimes(1);
    });
  });

  describe('vCard Import', () => {
    it('should import vCard data correctly', async () => {
      const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
EMAIL:john@example.com
TEL:+1-555-0123
ORG:Acme Corp
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Jane Smith
EMAIL:jane@example.com
TEL:+1-555-0456
END:VCARD`;

      const RNFS = require('react-native-fs');
      RNFS.readFile.mockResolvedValue(vCardData);

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'vcard-import-test',
        filename: 'contacts.vcf',
        format: 'vcard',
        status: 'pending',
        mapping: [], // vCard uses standard mapping
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.importContacts(importJob);

      expect(result.results?.successfulImports).toBe(2);
      expect(result.results?.failedImports).toBe(0);
      expect(mockDb.createContact).toHaveBeenCalledTimes(2);

      // Verify vCard parsing
      const firstContact = mockDb.createContact.mock.calls[0][0];
      expect(firstContact.fields.find(f => f.type === 'name')?.value).toBe(
        'John Doe',
      );
      expect(firstContact.fields.find(f => f.type === 'email')?.value).toBe(
        'john@example.com',
      );
      expect(firstContact.fields.find(f => f.type === 'company')?.value).toBe(
        'Acme Corp',
      );
    });

    it('should handle complex vCard properties', async () => {
      const complexVCard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
N:Doe;John;James;Mr.;Jr.
EMAIL;TYPE=work:john.work@example.com
EMAIL;TYPE=home:john.home@example.com
TEL;TYPE=work:+1-555-0123
TEL;TYPE=mobile:+1-555-0456
ADR;TYPE=work:;;123 Main St;Anytown;CA;12345;USA
ORG:Acme Corp;Engineering
TITLE:Senior Developer
URL:https://johndoe.example.com
PHOTO:data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...
NOTE:Important client contact
END:VCARD`;

      const RNFS = require('react-native-fs');
      RNFS.readFile.mockResolvedValue(complexVCard);

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'complex-vcard-test',
        filename: 'complex.vcf',
        format: 'vcard',
        status: 'pending',
        mapping: [],
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.importContacts(importJob);

      expect(result.results?.successfulImports).toBe(1);

      const contact = mockDb.createContact.mock.calls[0][0];
      expect(contact.fields.find(f => f.type === 'name')?.value).toBe(
        'John Doe',
      );
      expect(contact.fields.filter(f => f.type === 'email')).toHaveLength(2);
      expect(contact.fields.filter(f => f.type === 'phone')).toHaveLength(2);
      expect(contact.fields.find(f => f.type === 'address')?.value).toContain(
        '123 Main St',
      );
      expect(contact.fields.find(f => f.type === 'title')?.value).toBe(
        'Senior Developer',
      );
      expect(contact.fields.find(f => f.type === 'website')?.value).toBe(
        'https://johndoe.example.com',
      );
      expect(contact.notes?.[0]?.content).toBe('Important client contact');
    });
  });

  describe('Excel Import', () => {
    it('should import Excel data with multiple sheets', async () => {
      // Mock Excel parsing library
      jest.mock('xlsx', () => ({
        read: jest.fn(() => ({
          SheetNames: ['Contacts', 'Companies'],
          Sheets: {
            Contacts: {
              A1: { v: 'Name' },
              B1: { v: 'Email' },
              C1: { v: 'Phone' },
              A2: { v: 'John Doe' },
              B2: { v: 'john@example.com' },
              C2: { v: '+1-555-0123' },
              A3: { v: 'Jane Smith' },
              B3: { v: 'jane@example.com' },
              C3: { v: '+1-555-0456' },
              '!ref': 'A1:C3',
            },
          },
        })),
        utils: {
          sheet_to_json: jest.fn(() => [
            {
              Name: 'John Doe',
              Email: 'john@example.com',
              Phone: '+1-555-0123',
            },
            {
              Name: 'Jane Smith',
              Email: 'jane@example.com',
              Phone: '+1-555-0456',
            },
          ]),
        },
      }));

      const mapping: ContactImportMapping[] = [
        { sourceField: 'Name', targetField: 'name', isRequired: true },
        { sourceField: 'Email', targetField: 'email', isRequired: false },
        { sourceField: 'Phone', targetField: 'phone', isRequired: false },
      ];

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'excel-import-test',
        filename: 'contacts.xlsx',
        format: 'excel',
        status: 'pending',
        mapping,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.importContacts(importJob);

      expect(result.results?.successfulImports).toBe(2);
      expect(result.results?.failedImports).toBe(0);
    });
  });

  describe('CSV Export', () => {
    it('should export contacts to CSV with correct formatting', async () => {
      const contactsToExport = [
        createMockContact({
          id: 'export-1',
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
              value: 'john@example.com',
              isEditable: true,
            },
            {
              id: 'f3',
              type: 'phone',
              label: 'Phone',
              value: '+1-555-0123',
              isEditable: true,
            },
            {
              id: 'f4',
              type: 'company',
              label: 'Company',
              value: 'Acme Corp',
              isEditable: true,
            },
          ],
          tags: ['business', 'client'],
        }),
        createMockContact({
          id: 'export-2',
          fields: [
            {
              id: 'f5',
              type: 'name',
              label: 'Name',
              value: 'Jane Smith',
              isEditable: true,
            },
            {
              id: 'f6',
              type: 'email',
              label: 'Email',
              value: 'jane@example.com',
              isEditable: true,
            },
            {
              id: 'f7',
              type: 'phone',
              label: 'Phone',
              value: '+1-555-0456',
              isEditable: true,
            },
          ],
          tags: ['prospect'],
        }),
      ];

      mockDb.searchContacts.mockResolvedValue({
        contacts: contactsToExport,
        totalCount: 2,
        facets: { tags: [], categories: [], sources: [] },
      });

      const RNFS = require('react-native-fs');
      let writtenContent = '';
      RNFS.writeFile.mockImplementation((path: string, content: string) => {
        writtenContent = content;
        return Promise.resolve();
      });

      const exportJob: ContactExportJob = {
        id: 'csv-export-test',
        name: 'Business Contacts Export',
        format: 'csv',
        filters: { tags: ['business'] },
        fields: ['name', 'email', 'phone', 'company', 'tags'],
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.exportContacts(exportJob);

      expect(result.status).toBe('completed');
      expect(result.results?.exportedContacts).toBe(2);

      // Verify CSV content
      const lines = writtenContent.split('\n');
      expect(lines[0]).toBe('Name,Email,Phone,Company,Tags'); // Header
      expect(lines[1]).toContain('John Doe');
      expect(lines[1]).toContain('john@example.com');
      expect(lines[1]).toContain('Acme Corp');
      expect(lines[1]).toContain('business;client');
      expect(lines[2]).toContain('Jane Smith');
    });

    it('should handle special characters in CSV export', async () => {
      const contactWithSpecialChars = createMockContact({
        id: 'special-chars',
        fields: [
          {
            id: 'f1',
            type: 'name',
            label: 'Name',
            value: 'John "Johnny" Doe',
            isEditable: true,
          },
          {
            id: 'f2',
            type: 'email',
            label: 'Email',
            value: 'john@example.com',
            isEditable: true,
          },
          {
            id: 'f3',
            type: 'company',
            label: 'Company',
            value: 'Doe, Smith & Associates',
            isEditable: true,
          },
          {
            id: 'f4',
            type: 'notes',
            label: 'Notes',
            value: 'Line 1\nLine 2\nLine 3',
            isEditable: true,
          },
        ],
      });

      mockDb.searchContacts.mockResolvedValue({
        contacts: [contactWithSpecialChars],
        totalCount: 1,
        facets: { tags: [], categories: [], sources: [] },
      });

      const RNFS = require('react-native-fs');
      let writtenContent = '';
      RNFS.writeFile.mockImplementation((path: string, content: string) => {
        writtenContent = content;
        return Promise.resolve();
      });

      const exportJob: ContactExportJob = {
        id: 'special-chars-test',
        name: 'Special Characters Export',
        format: 'csv',
        filters: {},
        fields: ['name', 'email', 'company', 'notes'],
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      await contactManagementService.exportContacts(exportJob);

      // Verify proper CSV escaping
      expect(writtenContent).toContain('"John ""Johnny"" Doe"'); // Escaped quotes
      expect(writtenContent).toContain('"Doe, Smith & Associates"'); // Escaped commas
      expect(writtenContent).toContain('"Line 1\nLine 2\nLine 3"'); // Preserved newlines
    });
  });

  describe('vCard Export', () => {
    it('should export contacts to vCard format', async () => {
      const contactsToExport = [
        createMockContact({
          id: 'vcard-export-1',
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
              value: 'john@example.com',
              isEditable: true,
            },
            {
              id: 'f3',
              type: 'phone',
              label: 'Phone',
              value: '+1-555-0123',
              isEditable: true,
            },
            {
              id: 'f4',
              type: 'company',
              label: 'Company',
              value: 'Acme Corp',
              isEditable: true,
            },
            {
              id: 'f5',
              type: 'title',
              label: 'Title',
              value: 'Software Engineer',
              isEditable: true,
            },
            {
              id: 'f6',
              type: 'website',
              label: 'Website',
              value: 'https://johndoe.com',
              isEditable: true,
            },
          ],
          notes: [
            {
              id: 'note-1',
              contactId: 'vcard-export-1',
              content: 'Important client contact',
              type: 'general',
              isPrivate: false,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        }),
      ];

      mockDb.searchContacts.mockResolvedValue({
        contacts: contactsToExport,
        totalCount: 1,
        facets: { tags: [], categories: [], sources: [] },
      });

      const RNFS = require('react-native-fs');
      let writtenContent = '';
      RNFS.writeFile.mockImplementation((path: string, content: string) => {
        writtenContent = content;
        return Promise.resolve();
      });

      const exportJob: ContactExportJob = {
        id: 'vcard-export-test',
        name: 'vCard Export',
        format: 'vcard',
        filters: {},
        fields: ['name', 'email', 'phone', 'company', 'title', 'website'],
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.exportContacts(exportJob);

      expect(result.status).toBe('completed');

      // Verify vCard format
      expect(writtenContent).toContain('BEGIN:VCARD');
      expect(writtenContent).toContain('VERSION:3.0');
      expect(writtenContent).toContain('FN:John Doe');
      expect(writtenContent).toContain('EMAIL:john@example.com');
      expect(writtenContent).toContain('TEL:+1-555-0123');
      expect(writtenContent).toContain('ORG:Acme Corp');
      expect(writtenContent).toContain('TITLE:Software Engineer');
      expect(writtenContent).toContain('URL:https://johndoe.com');
      expect(writtenContent).toContain('NOTE:Important client contact');
      expect(writtenContent).toContain('END:VCARD');
    });
  });

  describe('Excel Export', () => {
    it('should export contacts to Excel with multiple sheets', async () => {
      const contactsToExport = Array.from({ length: 50 }, (_, i) =>
        createMockContact({
          id: `excel-export-${i}`,
          fields: [
            {
              id: `f1-${i}`,
              type: 'name',
              label: 'Name',
              value: `Contact ${i}`,
              isEditable: true,
            },
            {
              id: `f2-${i}`,
              type: 'email',
              label: 'Email',
              value: `contact${i}@example.com`,
              isEditable: true,
            },
          ],
          tags: i % 2 === 0 ? ['business'] : ['personal'],
        }),
      );

      mockDb.searchContacts.mockResolvedValue({
        contacts: contactsToExport,
        totalCount: 50,
        facets: { tags: [], categories: [], sources: [] },
      });

      // Mock Excel writing
      const mockXLSX = {
        utils: {
          json_to_sheet: jest.fn(() => ({})),
          book_new: jest.fn(() => ({ SheetNames: [], Sheets: {} })),
          book_append_sheet: jest.fn(),
        },
        write: jest.fn(() => 'mock-binary-data'),
      };
      jest.doMock('xlsx', () => mockXLSX);

      const RNFS = require('react-native-fs');
      RNFS.writeFile.mockResolvedValue(undefined);

      const exportJob: ContactExportJob = {
        id: 'excel-export-test',
        name: 'Excel Export',
        format: 'excel',
        filters: {},
        fields: ['name', 'email', 'tags'],
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.exportContacts(exportJob);

      expect(result.status).toBe('completed');
      expect(result.results?.exportedContacts).toBe(50);
    });
  });

  describe('Large Dataset Handling', () => {
    it('should handle large import operations efficiently', async () => {
      // Generate large CSV data
      const largeCSVData = [
        'Name,Email,Phone,Company',
        ...Array.from(
          { length: 10000 },
          (_, i) =>
            `Contact ${i},contact${i}@example.com,+1-555-${String(i).padStart(
              4,
              '0',
            )},Company ${i % 100}`,
        ),
      ].join('\n');

      const mapping: ContactImportMapping[] = [
        { sourceField: 'Name', targetField: 'name', isRequired: true },
        { sourceField: 'Email', targetField: 'email', isRequired: false },
        { sourceField: 'Phone', targetField: 'phone', isRequired: false },
        { sourceField: 'Company', targetField: 'company', isRequired: false },
      ];

      const RNFS = require('react-native-fs');
      RNFS.readFile.mockResolvedValue(largeCSVData);

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'large-import-test',
        filename: 'large-contacts.csv',
        format: 'csv',
        status: 'pending',
        mapping,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const startTime = Date.now();
      const result = await contactManagementService.importContacts(importJob);
      const duration = Date.now() - startTime;

      expect(result.results?.successfulImports).toBe(10000);
      expect(result.results?.failedImports).toBe(0);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should handle large export operations with streaming', async () => {
      const largeContactSet = Array.from({ length: 5000 }, (_, i) =>
        createMockContact({
          id: `large-export-${i}`,
          fields: [
            {
              id: `f1-${i}`,
              type: 'name',
              label: 'Name',
              value: `Contact ${i}`,
              isEditable: true,
            },
            {
              id: `f2-${i}`,
              type: 'email',
              label: 'Email',
              value: `contact${i}@example.com`,
              isEditable: true,
            },
            {
              id: `f3-${i}`,
              type: 'phone',
              label: 'Phone',
              value: `+1-555-${String(i).padStart(4, '0')}`,
              isEditable: true,
            },
          ],
        }),
      );

      // Mock paginated search results
      mockDb.searchContacts.mockImplementation(filters => {
        const offset = filters.offset || 0;
        const limit = filters.limit || 100;
        const pageContacts = largeContactSet.slice(offset, offset + limit);

        return Promise.resolve({
          contacts: pageContacts,
          totalCount: 5000,
          facets: { tags: [], categories: [], sources: [] },
        });
      });

      const RNFS = require('react-native-fs');
      let totalWriteCalls = 0;
      RNFS.writeFile.mockImplementation(() => {
        totalWriteCalls++;
        return Promise.resolve();
      });

      const exportJob: ContactExportJob = {
        id: 'large-export-test',
        name: 'Large Export',
        format: 'csv',
        filters: {},
        fields: ['name', 'email', 'phone'],
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const startTime = Date.now();
      const result = await contactManagementService.exportContacts(exportJob);
      const duration = Date.now() - startTime;

      expect(result.status).toBe('completed');
      expect(result.results?.exportedContacts).toBe(5000);
      expect(duration).toBeLessThan(20000); // Should complete within 20 seconds
    });
  });

  describe('Data Validation and Integrity', () => {
    it('should validate imported data for corruption', async () => {
      const csvWithCorruption = `Name,Email,Phone
John Doe,john@example.com,+1-555-0123
Jane Smith,corrupted-email,invalid-phone
Bob Johnson,bob@example.com,+1-555-0789`;

      const mapping: ContactImportMapping[] = [
        { sourceField: 'Name', targetField: 'name', isRequired: true },
        { sourceField: 'Email', targetField: 'email', isRequired: false },
        { sourceField: 'Phone', targetField: 'phone', isRequired: false },
      ];

      const RNFS = require('react-native-fs');
      RNFS.readFile.mockResolvedValue(csvWithCorruption);

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'validation-test',
        filename: 'validation.csv',
        format: 'csv',
        status: 'pending',
        mapping,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.importContacts(importJob);

      expect(result.results?.successfulImports).toBe(2); // John and Bob
      expect(result.results?.failedImports).toBe(1); // Jane with corrupted data
      expect(result.results?.errors).toContain(
        'Invalid email format: corrupted-email',
      );
    });

    it('should verify exported data integrity', async () => {
      const originalContacts = [
        createMockContact({
          id: 'integrity-1',
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
              value: 'john@example.com',
              isEditable: true,
            },
          ],
        }),
        createMockContact({
          id: 'integrity-2',
          fields: [
            {
              id: 'f3',
              type: 'name',
              label: 'Name',
              value: 'Jane Smith',
              isEditable: true,
            },
            {
              id: 'f4',
              type: 'email',
              label: 'Email',
              value: 'jane@example.com',
              isEditable: true,
            },
          ],
        }),
      ];

      mockDb.searchContacts.mockResolvedValue({
        contacts: originalContacts,
        totalCount: 2,
        facets: { tags: [], categories: [], sources: [] },
      });

      const RNFS = require('react-native-fs');
      let exportedContent = '';
      RNFS.writeFile.mockImplementation((path: string, content: string) => {
        exportedContent = content;
        return Promise.resolve();
      });

      const exportJob: ContactExportJob = {
        id: 'integrity-check-test',
        name: 'Integrity Check Export',
        format: 'csv',
        filters: {},
        fields: ['name', 'email'],
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      await contactManagementService.exportContacts(exportJob);

      // Verify all data is present in export
      expect(exportedContent).toContain('John Doe');
      expect(exportedContent).toContain('john@example.com');
      expect(exportedContent).toContain('Jane Smith');
      expect(exportedContent).toContain('jane@example.com');

      // Count records
      const lines = exportedContent.split('\n').filter(line => line.trim());
      expect(lines.length).toBe(3); // Header + 2 data rows
    });

    it('should handle encoding issues during import/export', async () => {
      // Test with special characters and different encodings
      const unicodeData = `Name,Email,Notes
José García,josé@example.com,"Café meeting notes with émojis 🎉"
李小明,ming@example.com,"中文备注信息"
Müller,mueller@example.com,"Umlauts: ä ö ü ß"`;

      const mapping: ContactImportMapping[] = [
        { sourceField: 'Name', targetField: 'name', isRequired: true },
        { sourceField: 'Email', targetField: 'email', isRequired: false },
        { sourceField: 'Notes', targetField: 'notes', isRequired: false },
      ];

      const RNFS = require('react-native-fs');
      RNFS.readFile.mockResolvedValue(unicodeData);

      mockDb.createContact.mockImplementation(contact =>
        Promise.resolve(contact),
      );

      const importJob: ContactImportJob = {
        id: 'unicode-test',
        filename: 'unicode.csv',
        format: 'csv',
        status: 'pending',
        mapping,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = await contactManagementService.importContacts(importJob);

      expect(result.results?.successfulImports).toBe(3);

      // Verify unicode characters are preserved
      const firstContact = mockDb.createContact.mock.calls[0][0];
      expect(firstContact.fields.find(f => f.type === 'name')?.value).toBe(
        'José García',
      );

      const secondContact = mockDb.createContact.mock.calls[1][0];
      expect(secondContact.fields.find(f => f.type === 'name')?.value).toBe(
        '李小明',
      );

      const thirdContact = mockDb.createContact.mock.calls[2][0];
      expect(thirdContact.fields.find(f => f.type === 'name')?.value).toBe(
        'Müller',
      );
    });
  });
});
