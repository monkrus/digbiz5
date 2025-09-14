/**
 * Search Algorithm Accuracy Tests
 *
 * Tests for the discovery service search algorithm including:
 * - Similarity scoring accuracy
 * - Search result relevance
 * - Filter effectiveness
 * - Suggestion algorithm performance
 */

import discoveryService from '../../src/services/discoveryService';
import { DiscoveredUser, SuggestedConnection } from '../../src/types/discovery';

// Mock users for testing
const mockUsers: DiscoveredUser[] = [
  {
    id: '1',
    userId: 'user1',
    displayName: 'John Smith',
    company: 'TechCorp',
    industry: 'Technology',
    location: 'San Francisco, CA',
    startupStage: 'growth',
    skills: ['JavaScript', 'React', 'Node.js'],
    isRecent: false,
    isVerified: true,
    mutualConnections: 5,
    profilePicture: 'https://example.com/john.jpg',
  },
  {
    id: '2',
    userId: 'user2',
    displayName: 'Jane Doe',
    company: 'TechCorp',
    industry: 'Technology',
    location: 'San Francisco, CA',
    startupStage: 'growth',
    skills: ['Python', 'AI', 'Machine Learning'],
    isRecent: true,
    isVerified: true,
    mutualConnections: 3,
    profilePicture: 'https://example.com/jane.jpg',
  },
  {
    id: '3',
    userId: 'user3',
    displayName: 'Bob Johnson',
    company: 'HealthTech Inc',
    industry: 'Healthcare',
    location: 'New York, NY',
    startupStage: 'early-stage',
    skills: ['JavaScript', 'React', 'Healthcare'],
    isRecent: false,
    isVerified: false,
    mutualConnections: 1,
    profilePicture: 'https://example.com/bob.jpg',
  },
  {
    id: '4',
    userId: 'user4',
    displayName: 'Alice Brown',
    company: 'FinanceApp',
    industry: 'Finance',
    location: 'London, UK',
    startupStage: 'mvp',
    skills: ['Java', 'Spring', 'Finance'],
    isRecent: true,
    isVerified: true,
    mutualConnections: 0,
    profilePicture: 'https://example.com/alice.jpg',
  },
];

const currentUser: DiscoveredUser = {
  id: 'current',
  userId: 'currentUser',
  displayName: 'Test User',
  company: 'TechCorp',
  industry: 'Technology',
  location: 'San Francisco, CA',
  startupStage: 'growth',
  skills: ['JavaScript', 'React', 'TypeScript'],
  isRecent: false,
  isVerified: true,
  mutualConnections: 0,
  profilePicture: 'https://example.com/current.jpg',
};

describe('Search Algorithm Accuracy Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Similarity Scoring Algorithm', () => {
    test('should give highest score to same company match', () => {
      const { score, reasons } = discoveryService.calculateSimilarityScore(
        currentUser,
        mockUsers[0] // Same company (TechCorp)
      );

      expect(score).toBeGreaterThan(30);
      expect(reasons).toContain('same_company');
    });

    test('should score industry match appropriately', () => {
      const { score, reasons } = discoveryService.calculateSimilarityScore(
        currentUser,
        mockUsers[1] // Same industry (Technology)
      );

      expect(score).toBeGreaterThan(25);
      expect(reasons).toContain('same_industry');
    });

    test('should score location proximity correctly', () => {
      const { score, reasons } = discoveryService.calculateSimilarityScore(
        currentUser,
        mockUsers[0] // Same location (San Francisco, CA)
      );

      expect(score).toBeGreaterThan(20);
      expect(reasons).toContain('same_location');
    });

    test('should score startup stage match', () => {
      const { score, reasons } = discoveryService.calculateSimilarityScore(
        currentUser,
        mockUsers[1] // Same startup stage (growth)
      );

      expect(score).toBeGreaterThan(15);
      expect(reasons).toContain('startup_stage');
    });

    test('should score skills overlap correctly', () => {
      const { score, reasons } = discoveryService.calculateSimilarityScore(
        currentUser,
        mockUsers[2] // Overlapping skills (JavaScript, React)
      );

      expect(reasons).toContain('similar_skills');
      expect(score).toBeGreaterThan(0);
    });

    test('should apply mutual connections boost', () => {
      const { score, reasons } = discoveryService.calculateSimilarityScore(
        currentUser,
        mockUsers[0] // Has 5 mutual connections
      );

      expect(reasons).toContain('mutual_connections');
      expect(score).toBeGreaterThan(0);
    });

    test('should apply recent activity boost', () => {
      const { score, reasons } = discoveryService.calculateSimilarityScore(
        currentUser,
        mockUsers[1] // Is recent user
      );

      expect(reasons).toContain('recent_activity');
      expect(score).toBeGreaterThan(0);
    });

    test('should cap maximum score at 100', () => {
      // Create a user with perfect matches
      const perfectMatch: DiscoveredUser = {
        ...currentUser,
        id: 'perfect',
        userId: 'perfect',
        mutualConnections: 50,
        isRecent: true,
      };

      const { score } = discoveryService.calculateSimilarityScore(
        currentUser,
        perfectMatch
      );

      expect(score).toBeLessThanOrEqual(100);
    });

    test('should return zero score for no matches', () => {
      const noMatch: DiscoveredUser = {
        id: 'nomatch',
        userId: 'nomatch',
        displayName: 'No Match',
        company: 'Different Corp',
        industry: 'Different Industry',
        location: 'Different City',
        startupStage: 'idea',
        skills: ['PHP', 'Laravel'],
        isRecent: false,
        isVerified: false,
        mutualConnections: 0,
        profilePicture: 'https://example.com/nomatch.jpg',
      };

      const { score } = discoveryService.calculateSimilarityScore(
        currentUser,
        noMatch
      );

      expect(score).toBe(0);
    });
  });

  describe('Personalized Suggestions Generation', () => {
    test('should generate suggestions based on similarity scores', async () => {
      const suggestions = await discoveryService.generatePersonalizedSuggestions(
        currentUser,
        mockUsers
      );

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('suggestionScore');
      expect(suggestions[0]).toHaveProperty('suggestionReason');
    });

    test('should sort suggestions by score in descending order', async () => {
      const suggestions = await discoveryService.generatePersonalizedSuggestions(
        currentUser,
        mockUsers
      );

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].suggestionScore).toBeGreaterThanOrEqual(
          suggestions[i].suggestionScore
        );
      }
    });

    test('should filter out users with low similarity scores', async () => {
      // Create users with very low similarity
      const lowSimilarityUsers: DiscoveredUser[] = [
        {
          id: 'low1',
          userId: 'low1',
          displayName: 'Low Similarity',
          company: 'Unknown Corp',
          industry: 'Unknown',
          location: 'Unknown',
          startupStage: 'idea',
          skills: [],
          isRecent: false,
          isVerified: false,
          mutualConnections: 0,
          profilePicture: 'https://example.com/low.jpg',
        },
      ];

      const suggestions = await discoveryService.generatePersonalizedSuggestions(
        currentUser,
        lowSimilarityUsers
      );

      // Should filter out users with score < 15
      expect(suggestions).toHaveLength(0);
    });

    test('should exclude current user from suggestions', async () => {
      const usersIncludingSelf = [...mockUsers, currentUser];

      const suggestions = await discoveryService.generatePersonalizedSuggestions(
        currentUser,
        usersIncludingSelf
      );

      const selfSuggestion = suggestions.find(s => s.userId === currentUser.userId);
      expect(selfSuggestion).toBeUndefined();
    });
  });

  describe('Diversity Filter', () => {
    test('should diversify suggestions to avoid too many from same company', () => {
      // Create multiple users from same company
      const sameCompanyUsers: SuggestedConnection[] = Array.from({ length: 10 }, (_, i) => ({
        id: `same${i}`,
        userId: `same${i}`,
        displayName: `User ${i}`,
        company: 'SameCompany',
        industry: 'Technology',
        location: 'San Francisco',
        startupStage: 'growth',
        skills: ['JavaScript'],
        isRecent: false,
        isVerified: true,
        mutualConnections: 1,
        profilePicture: `https://example.com/same${i}.jpg`,
        suggestionReason: ['same_company'],
        suggestionScore: 90,
      }));

      const diversified = discoveryService.diversifySuggestions(sameCompanyUsers);

      // Should limit suggestions from same company
      expect(diversified.length).toBeLessThan(sameCompanyUsers.length);
    });

    test('should limit total suggestions to 50', () => {
      const manyUsers: SuggestedConnection[] = Array.from({ length: 100 }, (_, i) => ({
        id: `user${i}`,
        userId: `user${i}`,
        displayName: `User ${i}`,
        company: `Company${i}`,
        industry: `Industry${i % 10}`,
        location: 'Various',
        startupStage: 'growth',
        skills: ['JavaScript'],
        isRecent: false,
        isVerified: true,
        mutualConnections: 1,
        profilePicture: `https://example.com/user${i}.jpg`,
        suggestionReason: ['same_industry'],
        suggestionScore: 50,
      }));

      const diversified = discoveryService.diversifySuggestions(manyUsers);

      expect(diversified.length).toBeLessThanOrEqual(50);
    });

    test('should maintain variety in industries', () => {
      const diverseUsers: SuggestedConnection[] = [
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `tech${i}`,
          userId: `tech${i}`,
          displayName: `Tech User ${i}`,
          company: `TechCompany${i}`,
          industry: 'Technology',
          location: 'San Francisco',
          startupStage: 'growth',
          skills: ['JavaScript'],
          isRecent: false,
          isVerified: true,
          mutualConnections: 1,
          profilePicture: `https://example.com/tech${i}.jpg`,
          suggestionReason: ['same_industry'],
          suggestionScore: 80,
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `health${i}`,
          userId: `health${i}`,
          displayName: `Health User ${i}`,
          company: `HealthCompany${i}`,
          industry: 'Healthcare',
          location: 'New York',
          startupStage: 'early-stage',
          skills: ['Healthcare'],
          isRecent: false,
          isVerified: true,
          mutualConnections: 1,
          profilePicture: `https://example.com/health${i}.jpg`,
          suggestionReason: ['same_location'],
          suggestionScore: 70,
        })),
      ];

      const diversified = discoveryService.diversifySuggestions(diverseUsers);

      const techCount = diversified.filter(u => u.industry === 'Technology').length;
      const healthCount = diversified.filter(u => u.industry === 'Healthcare').length;

      // Should include users from both industries
      expect(techCount).toBeGreaterThan(0);
      expect(healthCount).toBeGreaterThan(0);
    });
  });

  describe('Distance Calculation', () => {
    test('should calculate distance accurately using Haversine formula', () => {
      // San Francisco to New York (approximately 2572 miles / 4139 km)
      const sfLat = 37.7749;
      const sfLon = -122.4194;
      const nyLat = 40.7128;
      const nyLon = -74.0060;

      const distance = discoveryService.calculateDistance(sfLat, sfLon, nyLat, nyLon);

      // Should be approximately 4139 km (allow 10% tolerance)
      expect(distance).toBeGreaterThan(3700);
      expect(distance).toBeLessThan(4600);
    });

    test('should return zero distance for same location', () => {
      const lat = 37.7749;
      const lon = -122.4194;

      const distance = discoveryService.calculateDistance(lat, lon, lat, lon);

      expect(distance).toBe(0);
    });

    test('should calculate short distances accurately', () => {
      // Two points in San Francisco (approximately 5 km apart)
      const lat1 = 37.7749; // Downtown SF
      const lon1 = -122.4194;
      const lat2 = 37.8044; // North Beach
      const lon2 = -122.4078;

      const distance = discoveryService.calculateDistance(lat1, lon1, lat2, lon2);

      // Should be approximately 3-4 km
      expect(distance).toBeGreaterThan(2);
      expect(distance).toBeLessThan(6);
    });
  });

  describe('Search Performance', () => {
    test('should complete similarity calculation within performance threshold', () => {
      const startTime = performance.now();

      // Run similarity calculation multiple times
      for (let i = 0; i < 100; i++) {
        discoveryService.calculateSimilarityScore(currentUser, mockUsers[0]);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;

      // Should complete in less than 1ms on average
      expect(avgTime).toBeLessThan(1);
    });

    test('should handle large suggestion generation efficiently', async () => {
      // Create 1000 mock users
      const largeUserSet: DiscoveredUser[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `bulk${i}`,
        userId: `bulk${i}`,
        displayName: `Bulk User ${i}`,
        company: `Company${i % 100}`,
        industry: `Industry${i % 20}`,
        location: `City${i % 50}`,
        startupStage: 'growth',
        skills: ['JavaScript', 'React'],
        isRecent: i % 10 === 0,
        isVerified: i % 5 === 0,
        mutualConnections: i % 10,
        profilePicture: `https://example.com/bulk${i}.jpg`,
      }));

      const startTime = performance.now();

      const suggestions = await discoveryService.generatePersonalizedSuggestions(
        currentUser,
        largeUserSet
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete in less than 100ms for 1000 users
      expect(executionTime).toBeLessThan(100);
      expect(suggestions).toBeInstanceOf(Array);
    });

    test('should handle diversification of large result sets efficiently', () => {
      // Create 500 suggestions
      const largeSuggestions: SuggestedConnection[] = Array.from({ length: 500 }, (_, i) => ({
        id: `large${i}`,
        userId: `large${i}`,
        displayName: `Large User ${i}`,
        company: `Company${i % 20}`,
        industry: `Industry${i % 10}`,
        location: `City${i % 30}`,
        startupStage: 'growth',
        skills: ['JavaScript'],
        isRecent: false,
        isVerified: true,
        mutualConnections: 1,
        profilePicture: `https://example.com/large${i}.jpg`,
        suggestionReason: ['same_industry'],
        suggestionScore: 50 + (i % 50),
      }));

      const startTime = performance.now();

      const diversified = discoveryService.diversifySuggestions(largeSuggestions);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete in less than 50ms for 500 suggestions
      expect(executionTime).toBeLessThan(50);
      expect(diversified).toBeInstanceOf(Array);
      expect(diversified.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty user arrays', async () => {
      const suggestions = await discoveryService.generatePersonalizedSuggestions(
        currentUser,
        []
      );

      expect(suggestions).toEqual([]);
    });

    test('should handle users with missing or null fields', () => {
      const incompleteUser: DiscoveredUser = {
        id: 'incomplete',
        userId: 'incomplete',
        displayName: 'Incomplete User',
        company: undefined,
        industry: undefined,
        location: undefined,
        startupStage: undefined,
        skills: undefined,
        isRecent: false,
        isVerified: false,
        mutualConnections: undefined,
        profilePicture: undefined,
      };

      const { score } = discoveryService.calculateSimilarityScore(
        currentUser,
        incompleteUser
      );

      // Should not throw error and return valid score
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test('should handle extreme coordinates for distance calculation', () => {
      // Test with extreme latitude/longitude values
      const distance1 = discoveryService.calculateDistance(90, 180, -90, -180);
      const distance2 = discoveryService.calculateDistance(0, 0, 0, 180);

      expect(typeof distance1).toBe('number');
      expect(typeof distance2).toBe('number');
      expect(distance1).toBeGreaterThan(0);
      expect(distance2).toBeGreaterThan(0);
    });

    test('should handle case-insensitive matching', () => {
      const userWithDifferentCase: DiscoveredUser = {
        ...mockUsers[0],
        company: 'techcorp', // lowercase
        industry: 'TECHNOLOGY', // uppercase
        location: 'san francisco, ca', // mixed case
      };

      const { score, reasons } = discoveryService.calculateSimilarityScore(
        currentUser,
        userWithDifferentCase
      );

      expect(reasons).toContain('same_company');
      expect(reasons).toContain('same_industry');
      expect(score).toBeGreaterThan(50);
    });
  });
});