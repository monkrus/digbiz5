/**
 * Profile Service Unit Tests
 * 
 * This test suite validates the ProfileService class including API client,
 * CRUD operations, photo uploads, search functionality, and error handling.
 */

import { ProfileService } from '../../../src/services/profileService';
import { ProfileFormData, ProfileUpdateData, ProfilePhotoData } from '../../../src/types/profile';

// Mock the fetch function
global.fetch = jest.fn();

// Mock AppConfig
jest.mock('../../../src/utils/config', () => ({
  AppConfig: {
    apiUrl: 'https://test-api.com',
    apiTimeout: 5000,
  }
}));

describe('ProfileService', () => {
  let profileService: ProfileService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    profileService = new ProfileService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockProfileData: ProfileFormData = {
    name: 'John Doe',
    title: 'Software Engineer',
    company: 'Tech Company',
    bio: 'Experienced developer',
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    website: 'https://johndoe.com',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: null,
      github: null,
      instagram: null,
      facebook: null,
    },
    skills: ['JavaScript', 'React', 'Node.js'],
    isPublic: true,
  };

  const mockResponse = {
    success: true,
    profile: {
      id: 'profile-123',
      userId: 'user-123',
      ...mockProfileData,
      profilePhoto: null,
      experience: [],
      education: [],
      isVerified: false,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    message: 'Profile created successfully'
  };

  describe('Authentication', () => {
    it('should set auth token correctly', () => {
      const token = 'test-token-123';
      profileService.setAuthToken(token);
      
      // Verify token is set by making a request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      profileService.getCurrentUserProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123'
          })
        })
      );
    });

    it('should remove auth token correctly', () => {
      profileService.setAuthToken('test-token');
      profileService.removeAuthToken();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      profileService.getCurrentUserProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/me',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('Profile CRUD Operations', () => {
    describe('createProfile', () => {
      it('should create profile successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await profileService.createProfile(mockProfileData);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-api.com/api/profiles/',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              name: 'John Doe',
              title: 'Software Engineer',
              company: 'Tech Company',
              bio: 'Experienced developer',
              email: 'john@example.com',
              phone: '+1234567890',
              location: 'San Francisco, CA',
              website: 'https://johndoe.com',
              socialLinks: mockProfileData.socialLinks,
              skills: ['JavaScript', 'React', 'Node.js'],
              isPublic: true,
            })
          })
        );

        expect(result).toEqual(mockResponse);
      });

      it('should sanitize input data', async () => {
        const dirtyData: ProfileFormData = {
          ...mockProfileData,
          name: '  John Doe  ',
          email: '  JOHN@EXAMPLE.COM  ',
          bio: '  Bio with spaces  ',
          skills: ['  JavaScript  ', '  React  '],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        await profileService.createProfile(dirtyData);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(expect.objectContaining({
              name: 'John Doe',
              email: 'john@example.com',
              bio: 'Bio with spaces',
              skills: ['JavaScript', 'React'],
            }))
          })
        );
      });

      it('should handle API errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Invalid data' }),
        } as Response);

        await expect(profileService.createProfile(mockProfileData))
          .rejects.toThrow('Invalid data');
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(profileService.createProfile(mockProfileData))
          .rejects.toThrow('Failed to create profile');
      });
    });

    describe('updateProfile', () => {
      it('should update profile successfully', async () => {
        const updateData: ProfileUpdateData = {
          name: 'Jane Doe',
          title: 'Senior Engineer',
        };

        const updatedResponse = {
          ...mockResponse,
          profile: { ...mockResponse.profile, ...updateData },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => updatedResponse,
        } as Response);

        const result = await profileService.updateProfile('profile-123', updateData);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-api.com/api/profiles/profile-123',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(updateData),
          })
        );

        expect(result).toEqual(updatedResponse);
      });

      it('should only include provided fields', async () => {
        const partialUpdate: ProfileUpdateData = {
          name: 'Updated Name',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        await profileService.updateProfile('profile-123', partialUpdate);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ name: 'Updated Name' }),
          })
        );
      });
    });

    describe('getProfile', () => {
      it('should fetch profile successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await profileService.getProfile('profile-123');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-api.com/api/profiles/profile-123',
          expect.objectContaining({ method: 'GET' })
        );

        expect(result).toEqual(mockResponse);
      });
    });

    describe('deleteProfile', () => {
      it('should delete profile successfully', async () => {
        const deleteResponse = { success: true, message: 'Profile deleted' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => deleteResponse,
        } as Response);

        const result = await profileService.deleteProfile('profile-123');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-api.com/api/profiles/profile-123',
          expect.objectContaining({ method: 'DELETE' })
        );

        expect(result).toEqual(deleteResponse);
      });
    });
  });

  describe('Photo Upload', () => {
    const mockPhotoData: ProfilePhotoData = {
      uri: 'file://photo.jpg',
      name: 'profile-photo.jpg',
      type: 'image/jpeg',
      size: 1024000,
    };

    it('should upload photo successfully', async () => {
      const uploadResponse = {
        success: true,
        photoUrl: 'https://example.com/photo.jpg',
        message: 'Photo uploaded successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => uploadResponse,
      } as Response);

      const result = await profileService.uploadProfilePhoto('profile-123', mockPhotoData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/profile-123/photo',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
          headers: expect.not.objectContaining({
            'Content-Type': expect.any(String)
          })
        })
      );

      expect(result).toEqual(uploadResponse);
    });

    it('should delete photo successfully', async () => {
      const deleteResponse = { success: true, message: 'Photo deleted' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => deleteResponse,
      } as Response);

      const result = await profileService.deleteProfilePhoto('profile-123');

      expect(result).toEqual(deleteResponse);
    });
  });

  describe('Search and Discovery', () => {
    it('should search profiles with query and filters', async () => {
      const searchParams = {
        query: 'software engineer',
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc' as const,
        filters: {
          isPublic: true,
          isVerified: true,
          skills: ['JavaScript', 'React'],
        },
      };

      const searchResponse = {
        profiles: [mockResponse.profile],
        totalCount: 1,
        page: 1,
        limit: 10,
        hasNext: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => searchResponse,
      } as Response);

      const result = await profileService.searchProfiles(searchParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?'),
        expect.objectContaining({ method: 'GET' })
      );

      const calledUrl = (mockFetch.mock.calls[0] as any)[0];
      expect(calledUrl).toContain('query=software%20engineer');
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('sortBy=name');
      expect(calledUrl).toContain('sortOrder=asc');

      expect(result).toEqual(searchResponse);
    });

    it('should handle empty search params', async () => {
      const searchResponse = {
        profiles: [],
        totalCount: 0,
        page: 1,
        limit: 10,
        hasNext: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => searchResponse,
      } as Response);

      await profileService.searchProfiles({});

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/search',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get profile suggestions', async () => {
      const suggestionsResponse = {
        profiles: [mockResponse.profile],
        totalCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => suggestionsResponse,
      } as Response);

      const result = await profileService.getProfileSuggestions(5);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/suggestions?limit=5',
        expect.objectContaining({ method: 'GET' })
      );

      expect(result).toEqual(suggestionsResponse);
    });
  });

  describe('Profile Analytics', () => {
    it('should get profile stats', async () => {
      const statsResponse = {
        totalProfiles: 100,
        publicProfiles: 80,
        verifiedProfiles: 50,
        averageCompletion: 75,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => statsResponse,
      } as Response);

      const result = await profileService.getProfileStats();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/stats',
        expect.objectContaining({ method: 'GET' })
      );

      expect(result).toEqual(statsResponse);
    });

    it('should get profile completion status', async () => {
      const completionResponse = {
        percentage: 85,
        missingFields: ['bio', 'website'],
        suggestions: ['Add a detailed bio', 'Add your website'],
        isComplete: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => completionResponse,
      } as Response);

      const result = await profileService.getProfileCompletion('profile-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/profile-123/completion',
        expect.objectContaining({ method: 'GET' })
      );

      expect(result).toEqual(completionResponse);
    });

    it('should record profile view', async () => {
      const viewResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => viewResponse,
      } as Response);

      const result = await profileService.recordProfileView('profile-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/profile-123/views',
        expect.objectContaining({ method: 'POST' })
      );

      expect(result).toEqual(viewResponse);
    });

    it('should not throw on view recording failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await profileService.recordProfileView('profile-123');

      expect(result).toEqual({ success: false });
    });
  });

  describe('Connection Management', () => {
    it('should send connection request', async () => {
      const requestResponse = {
        success: true,
        message: 'Connection request sent',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => requestResponse,
      } as Response);

      const result = await profileService.sendConnectionRequest('profile-123', 'Hello!');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/connections/request',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ profileId: 'profile-123', message: 'Hello!' }),
        })
      );

      expect(result).toEqual(requestResponse);
    });

    it('should respond to connection request', async () => {
      const responseData = {
        success: true,
        message: 'Connection request accepted',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await profileService.respondToConnectionRequest('request-123', true);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/connections/requests/request-123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'accepted' }),
        })
      );

      expect(result).toEqual(responseData);
    });
  });

  describe('Profile Settings', () => {
    it('should get profile settings', async () => {
      const settingsResponse = {
        privacy: {
          showEmail: true,
          showPhone: false,
          showLocation: true,
        },
        notifications: {
          connectionRequests: true,
          profileViews: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => settingsResponse,
      } as Response);

      const result = await profileService.getProfileSettings('profile-123');

      expect(result).toEqual(settingsResponse);
    });

    it('should update profile settings', async () => {
      const updatedSettings = {
        privacy: {
          showEmail: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedSettings,
      } as Response);

      const result = await profileService.updateProfileSettings('profile-123', updatedSettings);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/profile-123/settings',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updatedSettings),
        })
      );

      expect(result).toEqual(updatedSettings);
    });
  });

  describe('Data Export and Validation', () => {
    it('should validate profile data', async () => {
      const validationResponse = {
        isValid: true,
        errors: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validationResponse,
      } as Response);

      const result = await profileService.validateProfileData(mockProfileData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/api/profiles/validate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockProfileData),
        })
      );

      expect(result).toEqual(validationResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON'); },
      } as Response);

      await expect(profileService.getProfile('profile-123'))
        .rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      await expect(profileService.getProfile('profile-123'))
        .rejects.toThrow('Failed to fetch profile');
    });
  });
});