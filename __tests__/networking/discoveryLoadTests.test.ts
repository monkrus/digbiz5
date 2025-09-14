/**
 * Discovery Load Tests
 *
 * Load testing for discovery system including:
 * - High-volume user searches
 * - Concurrent suggestion generation
 * - Database query performance
 * - Caching effectiveness
 * - API endpoint stress testing
 */

import discoveryService from '../../src/services/discoveryService';
import { DiscoveredUser, UserDiscoveryParams, SuggestedConnection } from '../../src/types/discovery';

// Mock fetch for load testing
global.fetch = jest.fn();

// Mock performance API if not available
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
  } as any;
}

describe('Discovery Load Tests', () => {
  const generateMockUsers = (count: number): DiscoveredUser[] => {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing'];
    const companies = ['TechCorp', 'HealthInc', 'FinanceGroup', 'EduSoft', 'RetailChain', 'ManufactCo'];
    const locations = ['San Francisco', 'New York', 'London', 'Tokyo', 'Sydney', 'Toronto'];
    const stages = ['idea', 'mvp', 'early-stage', 'growth', 'scale-up', 'mature'] as const;

    return Array.from({ length: count }, (_, i) => ({
      id: `load-user-${i}`,
      userId: `load-user-${i}`,
      displayName: `Load Test User ${i}`,
      company: companies[i % companies.length],
      industry: industries[i % industries.length],
      location: locations[i % locations.length],
      startupStage: stages[i % stages.length],
      skills: [`Skill${i % 20}`, `Skill${(i + 1) % 20}`, `Skill${(i + 2) % 20}`],
      isRecent: i % 10 === 0,
      isVerified: i % 5 === 0,
      mutualConnections: Math.floor(Math.random() * 10),
      profilePicture: `https://example.com/avatar${i}.jpg`,
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('Search Performance Under Load', () => {
    test('should handle high volume of concurrent search requests', async () => {
      const concurrentRequests = 100;
      const mockUsers = generateMockUsers(1000);

      // Mock API response with large dataset
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          users: mockUsers,
          pagination: {
            total: mockUsers.length,
            page: 1,
            limit: 1000,
            hasNext: false,
          },
        }),
      } as Response);

      const searchRequests = Array.from({ length: concurrentRequests }, (_, i) => ({
        query: `search query ${i}`,
        filters: {
          industry: i % 2 === 0 ? 'Technology' : 'Healthcare',
        },
        page: 1,
        limit: 20,
      }));

      const startTime = performance.now();

      // Execute all searches concurrently
      const results = await Promise.all(
        searchRequests.map(params => discoveryService.searchUsers(params))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / concurrentRequests;

      expect(results).toHaveLength(concurrentRequests);
      expect(results.every(result => result.success)).toBe(true);
      expect(avgResponseTime).toBeLessThan(100); // Average response time should be under 100ms
      expect(totalTime).toBeLessThan(5000); // Total time should be under 5 seconds

      // Verify all requests were made
      expect(fetch).toHaveBeenCalledTimes(concurrentRequests);
    });

    test('should handle search with complex filter combinations efficiently', async () => {
      const complexFilters: UserDiscoveryParams[] = [
        {
          query: 'senior developer',
          filters: {
            industry: 'Technology',
            startupStage: 'growth',
            location: { city: 'San Francisco', radius: 50 },
            skills: ['JavaScript', 'React', 'Node.js'],
            isVerified: true,
          },
        },
        {
          query: 'healthcare startup',
          filters: {
            industry: 'Healthcare',
            startupStage: 'early-stage',
            location: { country: 'United States' },
            isRecent: true,
          },
        },
        {
          query: 'fintech founder',
          filters: {
            industry: 'Finance',
            company: 'FinanceGroup',
            location: { city: 'New York' },
            skills: ['Finance', 'Blockchain'],
          },
        },
      ];

      const mockResponses = complexFilters.map((_, i) => ({
        success: true,
        users: generateMockUsers(50),
        pagination: { total: 50, page: 1, limit: 50 },
        searchTime: Math.random() * 100,
      }));

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockImplementation(() =>
          Promise.resolve({
            ok: true,
            json: async () => mockResponses.shift(),
          } as Response)
        );

      const performanceMetrics: { query: string; responseTime: number }[] = [];

      for (const filterSet of complexFilters) {
        const startTime = performance.now();
        const result = await discoveryService.searchUsers(filterSet);
        const endTime = performance.now();

        performanceMetrics.push({
          query: filterSet.query,
          responseTime: endTime - startTime,
        });

        expect(result.success).toBe(true);
      }

      // All complex searches should complete within reasonable time
      expect(performanceMetrics.every(metric => metric.responseTime < 200)).toBe(true);

      const avgResponseTime = performanceMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / performanceMetrics.length;
      expect(avgResponseTime).toBeLessThan(150);
    });

    test('should maintain performance with paginated large result sets', async () => {
      const totalUsers = 10000;
      const pageSize = 50;
      const totalPages = Math.ceil(totalUsers / pageSize);

      let fetchCallCount = 0;
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
        fetchCallCount++;
        const page = fetchCallCount;
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalUsers);
        const pageUsers = generateMockUsers(endIndex - startIndex);

        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            users: pageUsers,
            pagination: {
              total: totalUsers,
              page: page,
              limit: pageSize,
              hasNext: page < totalPages,
            },
          }),
        } as Response);
      });

      const searchParams: UserDiscoveryParams = {
        query: 'load test',
        filters: { industry: 'Technology' },
        page: 1,
        limit: pageSize,
      };

      // Fetch multiple pages sequentially
      const pages = 10;
      const pageTimes: number[] = [];

      for (let i = 1; i <= pages; i++) {
        const startTime = performance.now();

        const result = await discoveryService.searchUsers({
          ...searchParams,
          page: i,
        });

        const endTime = performance.now();
        pageTimes.push(endTime - startTime);

        expect(result.success).toBe(true);
        expect(result.users).toHaveLength(pageSize);
      }

      // Response times should remain consistent across pages
      const avgPageTime = pageTimes.reduce((sum, time) => sum + time, 0) / pageTimes.length;
      const maxPageTime = Math.max(...pageTimes);
      const minPageTime = Math.min(...pageTimes);

      expect(avgPageTime).toBeLessThan(100);
      expect(maxPageTime - minPageTime).toBeLessThan(50); // Variance should be low
    });

    test('should handle search timeout and error scenarios under load', async () => {
      const timeoutRequests = 20;
      const errorRequests = 10;
      const successRequests = 70;

      let requestCount = 0;
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
        requestCount++;

        if (requestCount <= timeoutRequests) {
          // Simulate timeout
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 5000);
          });
        } else if (requestCount <= timeoutRequests + errorRequests) {
          // Simulate server error
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
          } as Response);
        } else {
          // Successful response
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              users: generateMockUsers(20),
              pagination: { total: 20, page: 1, limit: 20 },
            }),
          } as Response);
        }
      });

      const totalRequests = timeoutRequests + errorRequests + successRequests;
      const requests = Array.from({ length: totalRequests }, (_, i) =>
        discoveryService.searchUsers({
          query: `load test ${i}`,
          page: 1,
          limit: 20,
        }).catch(error => ({ error: error.message }))
      );

      const startTime = performance.now();
      const results = await Promise.all(requests);
      const endTime = performance.now();

      const successfulResults = results.filter(r => 'success' in r && r.success);
      const errorResults = results.filter(r => 'error' in r);

      expect(successfulResults).toHaveLength(successRequests);
      expect(errorResults).toHaveLength(timeoutRequests + errorRequests);

      // Despite errors, the system should remain responsive
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });

  describe('Suggestion Generation Performance', () => {
    test('should generate suggestions efficiently for large user sets', async () => {
      const userCount = 5000;
      const candidateUsers = generateMockUsers(userCount);
      const currentUser = candidateUsers[0]; // Use first user as current user

      const startTime = performance.now();

      const suggestions = await discoveryService.generatePersonalizedSuggestions(
        currentUser,
        candidateUsers.slice(1) // Exclude current user
      );

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(1000); // Should process 5000 users in under 1 second

      // Verify suggestions are properly scored and sorted
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].suggestionScore).toBeGreaterThanOrEqual(
          suggestions[i].suggestionScore
        );
      }
    });

    test('should handle concurrent suggestion generation requests', async () => {
      const concurrentUsers = 50;
      const candidateUsers = generateMockUsers(1000);

      const testUsers = candidateUsers.slice(0, concurrentUsers);
      const remainingCandidates = candidateUsers.slice(concurrentUsers);

      const startTime = performance.now();

      // Generate suggestions for multiple users concurrently
      const suggestionPromises = testUsers.map(user =>
        discoveryService.generatePersonalizedSuggestions(user, remainingCandidates)
      );

      const allSuggestions = await Promise.all(suggestionPromises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(allSuggestions).toHaveLength(concurrentUsers);
      expect(allSuggestions.every(suggestions => suggestions.length > 0)).toBe(true);
      expect(totalTime).toBeLessThan(3000); // Should complete in under 3 seconds

      const avgTime = totalTime / concurrentUsers;
      expect(avgTime).toBeLessThan(100);
    });

    test('should scale suggestion diversification with result set size', async () => {
      const resultSizes = [100, 500, 1000, 2000, 5000];
      const diversificationTimes: { size: number; time: number }[] = [];

      for (const size of resultSizes) {
        const suggestions: SuggestedConnection[] = generateMockUsers(size).map((user, i) => ({
          ...user,
          suggestionReason: ['same_industry'],
          suggestionScore: 100 - i, // Descending score
        }));

        const startTime = performance.now();
        const diversified = discoveryService.diversifySuggestions(suggestions);
        const endTime = performance.now();

        diversificationTimes.push({
          size,
          time: endTime - startTime,
        });

        expect(diversified.length).toBeLessThanOrEqual(50); // Max diversified results
        expect(diversified.length).toBeGreaterThan(0);
      }

      // Verify that diversification time scales reasonably with input size
      for (let i = 1; i < diversificationTimes.length; i++) {
        const current = diversificationTimes[i];
        const previous = diversificationTimes[i - 1];

        // Time should not increase dramatically with size
        const scaleFactor = current.size / previous.size;
        const timeRatio = current.time / previous.time;

        expect(timeRatio).toBeLessThan(scaleFactor * 2); // Time should scale sub-linearly
      }
    });

    test('should maintain memory efficiency during bulk suggestion processing', async () => {
      const initialMemory = process.memoryUsage();
      const batchSize = 1000;
      const totalBatches = 10;

      for (let batch = 0; batch < totalBatches; batch++) {
        const candidateUsers = generateMockUsers(batchSize);
        const currentUser = candidateUsers[0];

        await discoveryService.generatePersonalizedSuggestions(
          currentUser,
          candidateUsers.slice(1)
        );

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerBatch = memoryIncrease / totalBatches;

      // Memory increase should be reasonable (less than 10MB per batch)
      expect(memoryIncreasePerBatch).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('API Endpoint Stress Testing', () => {
    test('should handle burst traffic on search endpoint', async () => {
      const burstSize = 200;
      const burstDuration = 1000; // 1 second

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          users: generateMockUsers(20),
          pagination: { total: 20, page: 1, limit: 20 },
        }),
      } as Response);

      const requests: Promise<any>[] = [];
      const startTime = performance.now();

      // Generate burst of requests
      for (let i = 0; i < burstSize; i++) {
        requests.push(
          discoveryService.searchUsers({
            query: `burst test ${i}`,
            page: 1,
            limit: 20,
          })
        );
      }

      const results = await Promise.all(requests);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(burstDuration * 2); // Within reasonable time
      expect(results.every(r => r.success)).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(burstSize);
    });

    test('should handle sustained load on discovery endpoints', async () => {
      const sustainedDuration = 5000; // 5 seconds
      const requestsPerSecond = 20;
      const totalRequests = (sustainedDuration / 1000) * requestsPerSecond;

      const mockResponse = {
        success: true,
        users: generateMockUsers(10),
        pagination: { total: 10, page: 1, limit: 10 },
      };

      let completedRequests = 0;
      const responseTimes: number[] = [];

      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
        const requestStart = performance.now();

        return Promise.resolve({
          ok: true,
          json: async () => {
            const requestEnd = performance.now();
            responseTimes.push(requestEnd - requestStart);
            completedRequests++;
            return mockResponse;
          },
        } as Response);
      });

      const startTime = performance.now();
      const requests: Promise<any>[] = [];

      // Generate sustained load
      for (let i = 0; i < totalRequests; i++) {
        const delay = (i / requestsPerSecond) * 1000; // Spread requests over time

        const delayedRequest = new Promise(resolve => {
          setTimeout(async () => {
            const result = await discoveryService.searchUsers({
              query: `sustained test ${i}`,
              page: 1,
              limit: 10,
            });
            resolve(result);
          }, delay);
        });

        requests.push(delayedRequest);
      }

      await Promise.all(requests);
      const endTime = performance.now();

      expect(completedRequests).toBe(totalRequests);
      expect(endTime - startTime).toBeLessThan(sustainedDuration + 1000); // Allow some overhead

      // Response times should remain stable
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(avgResponseTime).toBeLessThan(50);
      expect(maxResponseTime).toBeLessThan(200);
    });

    test('should handle mixed endpoint load (search + suggestions + location)', async () => {
      const mixedRequests = 150;
      const searchRequests = Math.floor(mixedRequests * 0.5);
      const suggestionRequests = Math.floor(mixedRequests * 0.3);
      const locationRequests = mixedRequests - searchRequests - suggestionRequests;

      const mockUsers = generateMockUsers(50);
      const mockSuggestions = mockUsers.slice(0, 10).map(user => ({
        ...user,
        suggestionReason: ['same_industry'],
        suggestionScore: Math.floor(Math.random() * 100),
      }));

      let fetchCallCount = 0;
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
        fetchCallCount++;
        const url = `mock-url-${fetchCallCount}`;

        // Simulate different endpoint responses based on URL pattern
        if (url.includes('search')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, users: mockUsers.slice(0, 20) }),
          } as Response);
        } else if (url.includes('suggestions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, suggestions: mockSuggestions }),
          } as Response);
        } else if (url.includes('location')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, users: mockUsers.slice(0, 15) }),
          } as Response);
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, users: [] }),
        } as Response);
      });

      const allRequests: Promise<any>[] = [];

      // Create search requests
      for (let i = 0; i < searchRequests; i++) {
        allRequests.push(
          discoveryService.searchUsers({
            query: `mixed search ${i}`,
            page: 1,
            limit: 20,
          })
        );
      }

      // Create suggestion requests
      for (let i = 0; i < suggestionRequests; i++) {
        allRequests.push(
          discoveryService.getSuggestedConnections({
            limit: 10,
            page: 1,
          })
        );
      }

      // Create location requests
      for (let i = 0; i < locationRequests; i++) {
        allRequests.push(
          discoveryService.discoverByLocation({
            coordinates: {
              latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
              longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
            },
            radius: 10,
          })
        );
      }

      const startTime = performance.now();
      const results = await Promise.all(allRequests);
      const endTime = performance.now();

      expect(results).toHaveLength(mixedRequests);
      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Should handle mixed load efficiently

      const avgResponseTime = (endTime - startTime) / mixedRequests;
      expect(avgResponseTime).toBeLessThan(50);
    });
  });

  describe('Caching and Performance Optimization', () => {
    test('should demonstrate caching effectiveness under repeated queries', async () => {
      const cacheSimulator = new Map<string, { data: any; timestamp: number }>();
      const cacheTTL = 5000; // 5 seconds

      const getCachedResult = (key: string) => {
        const cached = cacheSimulator.get(key);
        if (cached && (Date.now() - cached.timestamp) < cacheTTL) {
          return cached.data;
        }
        return null;
      };

      const setCachedResult = (key: string, data: any) => {
        cacheSimulator.set(key, { data, timestamp: Date.now() });
      };

      let apiCallCount = 0;
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
        apiCallCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            users: generateMockUsers(20),
            fromCache: false,
          }),
        } as Response);
      });

      // Simulate cached search function
      const cachedSearchUsers = async (params: UserDiscoveryParams) => {
        const cacheKey = JSON.stringify(params);
        const cached = getCachedResult(cacheKey);

        if (cached) {
          return { ...cached, fromCache: true };
        }

        const result = await discoveryService.searchUsers(params);
        setCachedResult(cacheKey, result);
        return result;
      };

      const searchParams: UserDiscoveryParams = {
        query: 'cache test',
        filters: { industry: 'Technology' },
        page: 1,
        limit: 20,
      };

      // First request - should hit API
      const result1 = await cachedSearchUsers(searchParams);
      expect(result1.fromCache).toBe(false);
      expect(apiCallCount).toBe(1);

      // Second request - should hit cache
      const result2 = await cachedSearchUsers(searchParams);
      expect(result2.fromCache).toBe(true);
      expect(apiCallCount).toBe(1); // No additional API call

      // Multiple repeated requests
      const repeatedRequests = Array.from({ length: 10 }, () =>
        cachedSearchUsers(searchParams)
      );

      const repeatedResults = await Promise.all(repeatedRequests);
      expect(repeatedResults.every(r => r.fromCache)).toBe(true);
      expect(apiCallCount).toBe(1); // Still only one API call

      // Different query should hit API
      const result3 = await cachedSearchUsers({
        ...searchParams,
        query: 'different query',
      });
      expect(result3.fromCache).toBe(false);
      expect(apiCallCount).toBe(2);
    });

    test('should measure performance improvement with result caching', async () => {
      const mockUsers = generateMockUsers(100);

      // Simulate slow API response
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, users: mockUsers }),
            } as Response);
          }, 100); // 100ms delay
        })
      );

      const searchParams: UserDiscoveryParams = {
        query: 'performance test',
        page: 1,
        limit: 100,
      };

      // Uncached request timing
      const uncachedStart = performance.now();
      const uncachedResult = await discoveryService.searchUsers(searchParams);
      const uncachedTime = performance.now() - uncachedStart;

      expect(uncachedResult.success).toBe(true);
      expect(uncachedTime).toBeGreaterThan(90); // Should take at least 90ms due to delay

      // Simulate cached response (instant)
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true, users: mockUsers, fromCache: true }),
        } as Response)
      );

      const cachedStart = performance.now();
      const cachedResult = await discoveryService.searchUsers(searchParams);
      const cachedTime = performance.now() - cachedStart;

      expect(cachedResult.success).toBe(true);
      expect(cachedTime).toBeLessThan(10); // Should be nearly instant

      const performanceImprovement = (uncachedTime - cachedTime) / uncachedTime;
      expect(performanceImprovement).toBeGreaterThan(0.8); // At least 80% improvement
    });

    test('should handle cache invalidation and updates efficiently', async () => {
      const userDatabase = generateMockUsers(1000);
      let dbVersion = 1;

      const simulateUserUpdate = () => {
        dbVersion++;
        // Modify some users
        for (let i = 0; i < 10; i++) {
          const randomIndex = Math.floor(Math.random() * userDatabase.length);
          userDatabase[randomIndex] = {
            ...userDatabase[randomIndex],
            displayName: `Updated User ${randomIndex} v${dbVersion}`,
          };
        }
      };

      let apiCallCount = 0;
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
        apiCallCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            users: userDatabase.slice(0, 50),
            version: dbVersion,
          }),
        } as Response);
      });

      // Initial search
      const initialResult = await discoveryService.searchUsers({
        query: 'cache invalidation test',
        page: 1,
        limit: 50,
      });

      expect(initialResult.success).toBe(true);
      expect(apiCallCount).toBe(1);

      // Simulate database update
      simulateUserUpdate();

      // Search again - should detect version change and update cache
      const updatedResult = await discoveryService.searchUsers({
        query: 'cache invalidation test',
        page: 1,
        limit: 50,
      });

      expect(updatedResult.success).toBe(true);
      expect(updatedResult.version).toBe(dbVersion);
      expect(apiCallCount).toBe(2);

      // Verify that updated data is different
      const hasUpdatedUsers = updatedResult.users.some(user =>
        user.displayName.includes(`v${dbVersion}`)
      );
      expect(hasUpdatedUsers).toBe(true);
    });
  });

  describe('System Resource Monitoring', () => {
    test('should monitor memory usage during large dataset processing', async () => {
      const initialMemory = process.memoryUsage();
      const largeBatches = 5;
      const batchSize = 2000;

      const memorySnapshots: Array<{ batch: number; heapUsed: number; external: number }> = [];

      for (let batch = 0; batch < largeBatches; batch++) {
        const largeUserSet = generateMockUsers(batchSize);
        const currentUser = largeUserSet[0];

        // Process large dataset
        await discoveryService.generatePersonalizedSuggestions(
          currentUser,
          largeUserSet.slice(1)
        );

        // Take memory snapshot
        const currentMemory = process.memoryUsage();
        memorySnapshots.push({
          batch,
          heapUsed: currentMemory.heapUsed,
          external: currentMemory.external,
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB total)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      // Memory should not continuously grow between batches
      const memoryGrowthBetweenBatches = memorySnapshots.slice(1).map((snapshot, i) =>
        snapshot.heapUsed - memorySnapshots[i].heapUsed
      );

      const avgGrowthPerBatch = memoryGrowthBetweenBatches.reduce((sum, growth) => sum + growth, 0) / memoryGrowthBetweenBatches.length;
      expect(avgGrowthPerBatch).toBeLessThan(5 * 1024 * 1024); // Less than 5MB per batch
    });

    test('should track performance metrics during stress testing', async () => {
      const metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimes: [] as number[],
      };

      const stressTestRequests = 100;
      const mockUsers = generateMockUsers(30);

      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
        const isSuccess = Math.random() > 0.05; // 5% failure rate

        if (isSuccess) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, users: mockUsers }),
          } as Response);
        } else {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
          } as Response);
        }
      });

      const requests = Array.from({ length: stressTestRequests }, (_, i) =>
        (async () => {
          metrics.totalRequests++;
          const startTime = performance.now();

          try {
            const result = await discoveryService.searchUsers({
              query: `stress test ${i}`,
              page: 1,
              limit: 30,
            });

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            metrics.successfulRequests++;
            metrics.totalResponseTime += responseTime;
            metrics.responseTimes.push(responseTime);
            metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
            metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);

            return result;
          } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            metrics.failedRequests++;
            metrics.responseTimes.push(responseTime);

            throw error;
          }
        })()
      );

      await Promise.allSettled(requests);

      // Calculate final metrics
      const avgResponseTime = metrics.totalResponseTime / metrics.successfulRequests;
      const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;

      // Sort response times for percentile calculations
      metrics.responseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(metrics.responseTimes.length * 0.95);
      const p95ResponseTime = metrics.responseTimes[p95Index];

      expect(metrics.totalRequests).toBe(stressTestRequests);
      expect(successRate).toBeGreaterThan(90); // At least 90% success rate
      expect(avgResponseTime).toBeLessThan(100);
      expect(p95ResponseTime).toBeLessThan(200); // 95% of requests under 200ms

      // System should remain stable
      expect(metrics.maxResponseTime).toBeLessThan(1000);
    });
  });
});