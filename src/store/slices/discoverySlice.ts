/**
 * Discovery Redux Slice
 *
 * Manages user discovery state including search results, filters,
 * suggestions, and recent joins.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  DiscoveredUser,
  UserDiscoveryParams,
  UserDiscoveryResponse,
  SuggestedConnection,
  SuggestedConnectionsResponse,
  RecentJoinsResponse,
  StartupStage,
  UserDiscoveryFilters,
  SearchHistoryResponse,
  SavedSearchResponse,
  DiscoveryPreferences,
} from '../../types/discovery';
import discoveryService from '../../services/discoveryService';

interface DiscoveryState {
  // Search results
  searchResults: DiscoveredUser[];
  searchLoading: boolean;
  searchError: string | null;
  searchMeta: {
    query?: string;
    totalResults: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    searchTime: number;
  } | null;

  // Current search filters
  searchFilters: UserDiscoveryFilters;
  searchQuery: string;

  // Suggested connections
  suggestedConnections: SuggestedConnection[];
  suggestionsLoading: boolean;
  suggestionsError: string | null;

  // Recent joins
  recentJoins: DiscoveredUser[];
  recentJoinsLoading: boolean;
  recentJoinsError: string | null;

  // Location-based discovery
  locationResults: DiscoveredUser[];
  locationLoading: boolean;
  locationError: string | null;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;

  // Search history
  searchHistory: SearchHistoryResponse['history'];
  searchHistoryLoading: boolean;
  searchHistoryError: string | null;

  // Saved searches
  savedSearches: SavedSearchResponse['searches'];
  savedSearchesLoading: boolean;
  savedSearchesError: string | null;

  // Discovery preferences
  preferences: DiscoveryPreferences | null;
  preferencesLoading: boolean;
  preferencesError: string | null;

  // UI state
  selectedUser: DiscoveredUser | null;
  viewMode: 'grid' | 'list';
  activeTab: 'search' | 'suggestions' | 'recent' | 'location';
}

const initialState: DiscoveryState = {
  searchResults: [],
  searchLoading: false,
  searchError: null,
  searchMeta: null,
  searchFilters: {},
  searchQuery: '',
  suggestedConnections: [],
  suggestionsLoading: false,
  suggestionsError: null,
  recentJoins: [],
  recentJoinsLoading: false,
  recentJoinsError: null,
  locationResults: [],
  locationLoading: false,
  locationError: null,
  currentLocation: null,
  searchHistory: [],
  searchHistoryLoading: false,
  searchHistoryError: null,
  savedSearches: [],
  savedSearchesLoading: false,
  savedSearchesError: null,
  preferences: null,
  preferencesLoading: false,
  preferencesError: null,
  selectedUser: null,
  viewMode: 'list',
  activeTab: 'search',
};

// Async thunks
export const searchUsers = createAsyncThunk(
  'discovery/searchUsers',
  async (params: UserDiscoveryParams, { rejectWithValue }) => {
    try {
      const response = await discoveryService.searchUsers(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const loadMoreSearchResults = createAsyncThunk(
  'discovery/loadMoreSearchResults',
  async (params: UserDiscoveryParams, { rejectWithValue }) => {
    try {
      const response = await discoveryService.searchUsers(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getSuggestedConnections = createAsyncThunk(
  'discovery/getSuggestedConnections',
  async (params: { limit?: number; page?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await discoveryService.getSuggestedConnections(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getRecentJoins = createAsyncThunk(
  'discovery/getRecentJoins',
  async (params: { days?: number; limit?: number; page?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await discoveryService.getRecentJoins(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const discoverByLocation = createAsyncThunk(
  'discovery/discoverByLocation',
  async (params: {
    coordinates?: { latitude: number; longitude: number };
    city?: string;
    radius?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await discoveryService.discoverByLocation(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getSearchHistory = createAsyncThunk(
  'discovery/getSearchHistory',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await discoveryService.getSearchHistory(params.page, params.limit);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const clearSearchHistory = createAsyncThunk(
  'discovery/clearSearchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await discoveryService.clearSearchHistory();
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getSavedSearches = createAsyncThunk(
  'discovery/getSavedSearches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await discoveryService.getSavedSearches();
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const saveSearch = createAsyncThunk(
  'discovery/saveSearch',
  async (searchData: { name: string; query?: string; filters: UserDiscoveryFilters; isActive?: boolean }, { rejectWithValue }) => {
    try {
      const response = await discoveryService.saveSearch(searchData);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteSavedSearch = createAsyncThunk(
  'discovery/deleteSavedSearch',
  async (searchId: string, { rejectWithValue }) => {
    try {
      const response = await discoveryService.deleteSavedSearch(searchId);
      return { searchId, ...response };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getDiscoveryPreferences = createAsyncThunk(
  'discovery/getDiscoveryPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await discoveryService.getDiscoveryPreferences();
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateDiscoveryPreferences = createAsyncThunk(
  'discovery/updateDiscoveryPreferences',
  async (preferences: Partial<DiscoveryPreferences>, { rejectWithValue }) => {
    try {
      const response = await discoveryService.updateDiscoveryPreferences(preferences);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'discovery/getCurrentLocation',
  async (_, { rejectWithValue }) => {
    try {
      const location = await discoveryService.getCurrentLocation();
      return location;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchFilters: (state, action: PayloadAction<UserDiscoveryFilters>) => {
      state.searchFilters = action.payload;
    },
    updateSearchFilters: (state, action: PayloadAction<Partial<UserDiscoveryFilters>>) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    clearSearchFilters: (state) => {
      state.searchFilters = {};
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchMeta = null;
      state.searchError = null;
    },
    setSelectedUser: (state, action: PayloadAction<DiscoveredUser | null>) => {
      state.selectedUser = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewMode = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<'search' | 'suggestions' | 'recent' | 'location'>) => {
      state.activeTab = action.payload;
    },
    updateUserConnectionStatus: (state, action: PayloadAction<{ userId: string; status: DiscoveredUser['connectionStatus'] }>) => {
      // Update connection status in search results
      const searchUser = state.searchResults.find(user => user.userId === action.payload.userId);
      if (searchUser) {
        searchUser.connectionStatus = action.payload.status;
      }

      // Update connection status in suggestions
      const suggestedUser = state.suggestedConnections.find(user => user.userId === action.payload.userId);
      if (suggestedUser) {
        suggestedUser.connectionStatus = action.payload.status;
      }

      // Update connection status in recent joins
      const recentUser = state.recentJoins.find(user => user.userId === action.payload.userId);
      if (recentUser) {
        recentUser.connectionStatus = action.payload.status;
      }

      // Update connection status in location results
      const locationUser = state.locationResults.find(user => user.userId === action.payload.userId);
      if (locationUser) {
        locationUser.connectionStatus = action.payload.status;
      }

      // Update selected user if it matches
      if (state.selectedUser && state.selectedUser.userId === action.payload.userId) {
        state.selectedUser.connectionStatus = action.payload.status;
      }
    },
    resetDiscoveryState: () => initialState,
  },
  extraReducers: (builder) => {
    // Search users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.users;
        state.searchMeta = {
          query: action.payload.searchMeta?.query,
          totalResults: action.payload.searchMeta?.totalResults || 0,
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.totalPages,
          hasNextPage: action.payload.pagination.page < action.payload.pagination.totalPages,
          searchTime: action.payload.searchMeta?.searchTime || 0,
        };
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload as string;
      });

    // Load more search results
    builder
      .addCase(loadMoreSearchResults.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(loadMoreSearchResults.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = [...state.searchResults, ...action.payload.users];
        state.searchMeta = {
          query: action.payload.searchMeta?.query,
          totalResults: action.payload.searchMeta?.totalResults || 0,
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.totalPages,
          hasNextPage: action.payload.pagination.page < action.payload.pagination.totalPages,
          searchTime: action.payload.searchMeta?.searchTime || 0,
        };
      })
      .addCase(loadMoreSearchResults.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload as string;
      });

    // Get suggested connections
    builder
      .addCase(getSuggestedConnections.pending, (state) => {
        state.suggestionsLoading = true;
        state.suggestionsError = null;
      })
      .addCase(getSuggestedConnections.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestedConnections = action.payload.suggestions;
      })
      .addCase(getSuggestedConnections.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestionsError = action.payload as string;
      });

    // Get recent joins
    builder
      .addCase(getRecentJoins.pending, (state) => {
        state.recentJoinsLoading = true;
        state.recentJoinsError = null;
      })
      .addCase(getRecentJoins.fulfilled, (state, action) => {
        state.recentJoinsLoading = false;
        state.recentJoins = action.payload.users;
      })
      .addCase(getRecentJoins.rejected, (state, action) => {
        state.recentJoinsLoading = false;
        state.recentJoinsError = action.payload as string;
      });

    // Discover by location
    builder
      .addCase(discoverByLocation.pending, (state) => {
        state.locationLoading = true;
        state.locationError = null;
      })
      .addCase(discoverByLocation.fulfilled, (state, action) => {
        state.locationLoading = false;
        state.locationResults = action.payload.users;
      })
      .addCase(discoverByLocation.rejected, (state, action) => {
        state.locationLoading = false;
        state.locationError = action.payload as string;
      });

    // Get current location
    builder
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.currentLocation = action.payload;
      });

    // Search history
    builder
      .addCase(getSearchHistory.pending, (state) => {
        state.searchHistoryLoading = true;
        state.searchHistoryError = null;
      })
      .addCase(getSearchHistory.fulfilled, (state, action) => {
        state.searchHistoryLoading = false;
        state.searchHistory = action.payload.history;
      })
      .addCase(getSearchHistory.rejected, (state, action) => {
        state.searchHistoryLoading = false;
        state.searchHistoryError = action.payload as string;
      })
      .addCase(clearSearchHistory.fulfilled, (state) => {
        state.searchHistory = [];
      });

    // Saved searches
    builder
      .addCase(getSavedSearches.pending, (state) => {
        state.savedSearchesLoading = true;
        state.savedSearchesError = null;
      })
      .addCase(getSavedSearches.fulfilled, (state, action) => {
        state.savedSearchesLoading = false;
        state.savedSearches = action.payload.searches;
      })
      .addCase(getSavedSearches.rejected, (state, action) => {
        state.savedSearchesLoading = false;
        state.savedSearchesError = action.payload as string;
      })
      .addCase(saveSearch.fulfilled, (state, action) => {
        state.savedSearches = [action.payload.search, ...state.savedSearches];
      })
      .addCase(deleteSavedSearch.fulfilled, (state, action) => {
        state.savedSearches = state.savedSearches.filter(search => search.id !== action.payload.searchId);
      });

    // Discovery preferences
    builder
      .addCase(getDiscoveryPreferences.pending, (state) => {
        state.preferencesLoading = true;
        state.preferencesError = null;
      })
      .addCase(getDiscoveryPreferences.fulfilled, (state, action) => {
        state.preferencesLoading = false;
        state.preferences = action.payload.preferences;
      })
      .addCase(getDiscoveryPreferences.rejected, (state, action) => {
        state.preferencesLoading = false;
        state.preferencesError = action.payload as string;
      })
      .addCase(updateDiscoveryPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload.preferences;
      });
  },
});

export const {
  setSearchQuery,
  setSearchFilters,
  updateSearchFilters,
  clearSearchFilters,
  clearSearchResults,
  setSelectedUser,
  setViewMode,
  setActiveTab,
  updateUserConnectionStatus,
  resetDiscoveryState,
} = discoverySlice.actions;

export default discoverySlice.reducer;