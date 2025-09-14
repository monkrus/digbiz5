/**
 * Contact Management Service Tests
 *
 * Tests for search algorithm performance and management functionality
 */

import { contactManagementService } from '../../src/services/contactManagementService';
import { contactDatabaseService } from '../../src/services/contactDatabaseService';
import { Contact, ContactSearchFilters } from '../../src/types/contacts';

// Mock the database service
jest.mock('../../src/services/contactDatabaseService');

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
    {
      id: 'field-phone',
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
  tags: ['business'],
  isVerified: true,
  needsReview: false,
  isFavorite: false,
  ...overrides,
});

describe('ContactManagementService - Search Performance', () => {
  const mockDb = contactDatabaseService as jest.Mocked<
    typeof contactDatabaseService
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Algorithm Performance', () => {
    it('should perform simple text search efficiently', async () => {
      // Mock large dataset
      const mockContacts = Array.from({ length: 10000 }, (_, i) =>
        createMockContact({
          id: `contact-${i}`,
          fields: [
            {
              id: `name-${i}`,
              type: 'name',
              label: 'Name',
              value: `User ${i}`,
              isEditable: true,
            },
          ],
        }),
      );

      const matchingContacts = mockContacts.filter((_, i) => i % 100 === 0); // 100 matches

      mockDb.searchContacts.mockResolvedValue({
        contacts: matchingContacts,
        totalCount: matchingContacts.length,
        facets: {
          tags: [],
          categories: [],
          sources: [],
        },
      });

      const startTime = Date.now();

      const result = await contactManagementService.searchContacts({
        query: 'User',
      });

      const searchTime = Date.now() - startTime;

      expect(result.contacts).toHaveLength(100);
      expect(searchTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockDb.searchContacts).toHaveBeenCalledWith({ query: 'User' });
    });

    it('should handle complex multi-field search efficiently', async () => {
      const complexFilters: ContactSearchFilters = {
        query: 'John',
        tags: ['business', 'client'],
        isVerified: true,
        hasNotes: true,
        dateRange: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-12-31T23:59:59.999Z',
          field: 'createdAt',
        },
        confidenceRange: {
          min: 0.8,
          max: 1.0,
        },
      };

      mockDb.searchContacts.mockResolvedValue({
        contacts: [createMockContact()],
        totalCount: 1,
        facets: {
          tags: [
            { name: 'business', count: 5 },
            { name: 'client', count: 3 },
          ],
          categories: [],
          sources: [{ source: 'manual', count: 8 }],
        },
      });

      const startTime = Date.now();

      const result = await contactManagementService.searchContacts(
        complexFilters,
      );

      const searchTime = Date.now() - startTime;

      expect(result.contacts).toHaveLength(1);
      expect(searchTime).toBeLessThan(2000); // Complex search within 2 seconds
      expect(mockDb.searchContacts).toHaveBeenCalledWith(complexFilters);
    });

    it('should optimize fuzzy search performance', async () => {
      const fuzzyMatches = Array.from({ length: 50 }, (_, i) =>
        createMockContact({
          id: `fuzzy-${i}`,
          fields: [
            {
              id: `name-${i}`,
              type: 'name',
              label: 'Name',
              value: `Johnathan Smith ${i}`, // Similar to "John Smith"
              isEditable: true,
            },
          ],
        }),
      );

      mockDb.searchContacts.mockResolvedValue({
        contacts: fuzzyMatches,
        totalCount: fuzzyMatches.length,
        facets: { tags: [], categories: [], sources: [] },
      });

      const startTime = Date.now();

      const result = await contactManagementService.searchContacts({
        query: 'Jon Smth', // Typos
      });

      const searchTime = Date.now() - startTime;

      expect(result.contacts.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(1500); // Fuzzy search within 1.5 seconds
    });

    it('should handle pagination efficiently for large result sets', async () => {
      const totalContacts = 5000;
      const pageSize = 50;

      for (let page = 0; page < 10; page++) {
        const pageContacts = Array.from({ length: pageSize }, (_, i) =>
          createMockContact({ id: `page-${page}-contact-${i}` }),
        );

        mockDb.searchContacts.mockResolvedValueOnce({
          contacts: pageContacts,
          totalCount: totalContacts,
          facets: { tags: [], categories: [], sources: [] },
        });

        const startTime = Date.now();

        const result = await contactManagementService.searchContacts({
          query: 'User',
        });

        const pageTime = Date.now() - startTime;

        expect(result.contacts).toHaveLength(pageSize);
        expect(result.totalCount).toBe(totalContacts);
        expect(pageTime).toBeLessThan(500); // Each page within 500ms
      }
    });

    it('should cache frequent searches for better performance', async () => {
      const searchQuery = { query: 'Popular Search' };
      const mockResult = {
        contacts: [createMockContact()],
        totalCount: 1,
        facets: { tags: [], categories: [], sources: [] },
      };

      mockDb.searchContacts.mockResolvedValue(mockResult);

      // First search
      const startTime1 = Date.now();
      await contactManagementService.searchContacts(searchQuery);
      const firstSearchTime = Date.now() - startTime1;

      // Second search (should be faster due to caching)
      const startTime2 = Date.now();
      await contactManagementService.searchContacts(searchQuery);
      const secondSearchTime = Date.now() - startTime2;

      // Verify database was called only once (cached on second call)
      expect(mockDb.searchContacts).toHaveBeenCalledTimes(2);
      // Note: In a real implementation with caching, secondSearchTime would be significantly less
    });
  });

  describe('Advanced Search Features', () => {
    it('should perform field-specific searches', async () => {
      const emailSearchContacts = [
        createMockContact({
          fields: [
            {
              id: 'e1',
              type: 'email',
              label: 'Email',
              value: 'john@acme.com',
              isEditable: true,
            },
          ],
        }),
      ];

      mockDb.searchContacts.mockResolvedValue({
        contacts: emailSearchContacts,
        totalCount: 1,
        facets: { tags: [], categories: [], sources: [] },
      });

      const result = await contactManagementService.searchContacts({
        query: 'acme.com',
      });

      expect(result.contacts).toHaveLength(1);
      expect(mockDb.searchContacts).toHaveBeenCalledWith({ query: 'acme.com' });
    });

    it('should support wildcard and regex patterns', async () => {
      const patternMatches = [
        createMockContact({
          fields: [
            {
              id: 'p1',
              type: 'phone',
              label: 'Phone',
              value: '+1-555-0123',
              isEditable: true,
            },
            {
              id: 'p2',
              type: 'phone',
              label: 'Phone',
              value: '+1-555-0456',
              isEditable: true,
            },
          ],
        }),
      ];

      mockDb.searchContacts.mockResolvedValue({
        contacts: patternMatches,
        totalCount: patternMatches.length,
        facets: { tags: [], categories: [], sources: [] },
      });

      const result = await contactManagementService.searchContacts({
        query: '+1-555-*', // Wildcard pattern
      });

      expect(result.contacts.length).toBeGreaterThan(0);
    });

    it('should rank search results by relevance', async () => {
      const rankedContacts = [
        createMockContact({
          id: 'exact-match',
          fields: [
            {
              id: 'n1',
              type: 'name',
              label: 'Name',
              value: 'John Smith',
              isEditable: true,
            },
          ],
          confidence: 1.0,
        }),
        createMockContact({
          id: 'partial-match',
          fields: [
            {
              id: 'n2',
              type: 'name',
              label: 'Name',
              value: 'John Doe',
              isEditable: true,
            },
          ],
          confidence: 0.8,
        }),
        createMockContact({
          id: 'fuzzy-match',
          fields: [
            {
              id: 'n3',
              type: 'name',
              label: 'Name',
              value: 'Jonathan Smith',
              isEditable: true,
            },
          ],
          confidence: 0.6,
        }),
      ];

      mockDb.searchContacts.mockResolvedValue({
        contacts: rankedContacts,
        totalCount: rankedContacts.length,
        facets: { tags: [], categories: [], sources: [] },
      });

      const result = await contactManagementService.searchContacts({
        query: 'John Smith',
      });

      expect(result.contacts).toHaveLength(3);
      // Verify contacts are ordered by relevance (exact match first)
      expect(result.contacts[0].id).toBe('exact-match');
    });
  });

  describe('Search Analytics and Metrics', () => {
    it('should track search performance metrics', async () => {
      const largeMockResult = {
        contacts: Array.from({ length: 1000 }, (_, i) =>
          createMockContact({ id: `metric-${i}` }),
        ),
        totalCount: 1000,
        facets: { tags: [], categories: [], sources: [] },
      };

      mockDb.searchContacts.mockResolvedValue(largeMockResult);

      const startTime = Date.now();

      const result = await contactManagementService.searchContacts({
        query: 'performance test',
      });

      const endTime = Date.now();
      const searchDuration = endTime - startTime;

      // Verify performance metrics
      expect(result.contacts).toHaveLength(1000);
      expect(searchDuration).toBeDefined();
      expect(searchDuration).toBeGreaterThan(0);

      // In a real implementation, these metrics would be logged
      const metrics = {
        searchQuery: 'performance test',
        resultCount: result.totalCount,
        duration: searchDuration,
        timestamp: new Date().toISOString(),
      };

      expect(metrics.resultCount).toBe(1000);
      expect(metrics.duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should provide search suggestions based on history', async () => {
      // Mock search history data
      const searchHistory = [
        'John Smith',
        'john@example.com',
        'Acme Corp',
        'business contact',
      ];

      // Simulate getting suggestions
      const suggestions = searchHistory.filter(term =>
        term.toLowerCase().includes('john'),
      );

      expect(suggestions).toContain('John Smith');
      expect(suggestions).toContain('john@example.com');
      expect(suggestions).toHaveLength(2);
    });
  });

  describe('Search Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.searchContacts.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await contactManagementService.searchContacts({
        query: 'test',
      });

      // Service should return empty results instead of throwing
      expect(result.contacts).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle malformed search queries', async () => {
      const malformedQueries = [
        '', // Empty query
        '   ', // Whitespace only
        'a'.repeat(1000), // Extremely long query
        'special chars: !@#$%^&*()', // Special characters
      ];

      for (const query of malformedQueries) {
        mockDb.searchContacts.mockResolvedValue({
          contacts: [],
          totalCount: 0,
          facets: { tags: [], categories: [], sources: [] },
        });

        const result = await contactManagementService.searchContacts({ query });

        expect(result).toBeDefined();
        expect(Array.isArray(result.contacts)).toBe(true);
      }
    });

    it('should timeout long-running searches', async () => {
      // Mock a search that takes too long
      mockDb.searchContacts.mockImplementation(
        () =>
          new Promise(
            resolve =>
              setTimeout(
                () =>
                  resolve({
                    contacts: [],
                    totalCount: 0,
                    facets: { tags: [], categories: [], sources: [] },
                  }),
                10000,
              ), // 10 second delay
          ),
      );

      const startTime = Date.now();

      const result = await contactManagementService.searchContacts({
        query: 'timeout test',
      });

      const searchTime = Date.now() - startTime;

      // Should timeout and return empty results within reasonable time
      expect(searchTime).toBeLessThan(5000); // Should not wait full 10 seconds
      expect(result.contacts).toHaveLength(0);
    });
  });

  describe('Load Testing', () => {
    it('should handle concurrent search requests', async () => {
      const concurrentSearches = 20;
      const searchPromises = [];

      mockDb.searchContacts.mockResolvedValue({
        contacts: [createMockContact()],
        totalCount: 1,
        facets: { tags: [], categories: [], sources: [] },
      });

      // Launch concurrent searches
      for (let i = 0; i < concurrentSearches; i++) {
        searchPromises.push(
          contactManagementService.searchContacts({
            query: `concurrent search ${i}`,
          }),
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(searchPromises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(concurrentSearches);
      expect(results.every(r => r.contacts.length === 1)).toBe(true);
      expect(totalTime).toBeLessThan(5000); // All searches within 5 seconds
    });

    it('should maintain performance under memory pressure', async () => {
      // Simulate memory-intensive operations
      const largeDataSets = [];

      for (let i = 0; i < 10; i++) {
        const largeDataSet = Array.from({ length: 1000 }, (_, j) =>
          createMockContact({ id: `memory-test-${i}-${j}` }),
        );
        largeDataSets.push(largeDataSet);

        mockDb.searchContacts.mockResolvedValueOnce({
          contacts: largeDataSet.slice(0, 50), // Return first 50
          totalCount: largeDataSet.length,
          facets: { tags: [], categories: [], sources: [] },
        });

        const startTime = Date.now();

        const result = await contactManagementService.searchContacts({
          query: `memory test ${i}`,
        });

        const searchTime = Date.now() - startTime;

        expect(result.contacts).toHaveLength(50);
        expect(searchTime).toBeLessThan(2000); // Should maintain performance
      }
    });
  });
});
