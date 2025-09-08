# Profile Features Documentation

## Overview

The Profile Features module provides comprehensive user profile management capabilities for React Native applications. It includes profile creation, editing, photo uploads, validation, and preview components with a clean, intuitive user experience.

## Features

### ✅ **Core Features**
- **Profile Creation** - Step-by-step profile creation with validation
- **Profile Editing** - Section-based editing with unsaved changes detection  
- **Photo Upload** - Image picker with cropping and validation
- **Form Validation** - Real-time validation with detailed error messages
- **Profile Preview** - Multiple display variants (card, detailed, compact)
- **Data Models** - Comprehensive TypeScript types and interfaces

### ✅ **Advanced Features**
- **Redux State Management** - Global profile state with caching
- **Error Handling** - Robust error classification and recovery
- **Image Processing** - Compression, cropping, and validation
- **Search & Discovery** - Profile search with filters
- **Connection Requests** - Social networking capabilities
- **Profile Analytics** - Completion tracking and suggestions

## Architecture

```
src/
├── components/profile/
│   └── ProfilePreview.tsx          # Profile display component
├── screens/profile/
│   ├── CreateProfileScreen.tsx     # Profile creation flow
│   └── EditProfileScreen.tsx       # Profile editing interface
├── services/
│   ├── profileService.ts           # API integration
│   └── imagePickerService.ts       # Image handling
├── store/
│   └── profileSlice.ts             # Redux state management
├── hooks/
│   └── useProfile.ts               # Profile operations hook
├── types/
│   └── profile.ts                  # TypeScript definitions
└── utils/
    ├── profileValidation.ts        # Form validation
    └── profileErrorHandling.ts     # Error management
```

## Data Model

### Core Profile Structure

```typescript
interface UserProfile {
  id: string;
  userId: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  profilePhoto: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  website: string | null;
  socialLinks: SocialLinks;
  skills: string[];
  experience: Experience[];
  education: Education[];
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Form Data Structure

```typescript
interface ProfileFormData {
  name: string;
  title: string;
  company: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  socialLinks: SocialLinks;
  skills: string[];
  isPublic: boolean;
}
```

## Components

### ProfilePreview Component

A versatile component for displaying user profiles in different formats.

```typescript
<ProfilePreview
  profile={userProfile}
  variant="card" // 'card' | 'detailed' | 'compact' | 'header'
  showActions={true}
  showSkills={true}
  showSocialLinks={true}
  editable={true}
  onEdit={handleEdit}
  onShare={handleShare}
  onConnect={handleConnect}
/>
```

**Props:**
- `profile`: UserProfile - The profile data to display
- `variant`: Display style variant
- `showActions`: Show action buttons
- `showSkills`: Display skills section
- `showSocialLinks`: Display social media links
- `editable`: Show edit controls
- Event handlers for various interactions

## Screens

### CreateProfileScreen

Step-by-step profile creation with form validation and photo upload.

**Features:**
- Multi-step form with progress indicator
- Real-time validation with error display
- Photo upload with cropping
- Completion percentage tracking
- Skip option for optional sections

**Navigation:**
```typescript
navigation.navigate('CreateProfile', {
  skipOnboarding: false
});
```

### EditProfileScreen

Comprehensive profile editing with section-based organization.

**Features:**
- Collapsible sections for organization
- Unsaved changes detection
- Photo upload/removal
- Real-time validation
- Auto-save capabilities

**Navigation:**
```typescript
navigation.navigate('EditProfile', {
  profile: userProfile,
  section: 'basic' // Optional focus section
});
```

## Services

### ProfileService

API integration service for all profile operations.

```typescript
const profileService = new ProfileService();

// Create profile
const result = await profileService.createProfile(formData);

// Update profile
const updated = await profileService.updateProfile(id, updateData);

// Upload photo
const photo = await profileService.uploadProfilePhoto(id, photoData);

// Search profiles
const results = await profileService.searchProfiles(params);
```

**Key Methods:**
- `createProfile(data)` - Create new profile
- `updateProfile(id, data)` - Update existing profile
- `getProfile(id)` - Fetch profile by ID
- `uploadProfilePhoto(id, photo)` - Upload profile image
- `searchProfiles(params)` - Search with filters
- `getProfileStats()` - Get analytics data

### ImagePickerService

Handles image selection, cropping, and processing.

```typescript
const imageService = new ImagePickerService();

// Pick image with options
const result = await imageService.pickImage('both', {
  quality: 0.8,
  maxWidth: 400,
  maxHeight: 400,
  cropping: true
});

// Validate image
const validation = imageService.validateImage(imageData);

// Compress if needed
const compressed = await imageService.compressImage(imageData);
```

**Features:**
- Camera and gallery selection
- Image cropping with circular overlay
- Size and format validation
- Compression and optimization
- Permission handling

## State Management

### Redux Slice

Profile state management with Redux Toolkit.

```typescript
// State structure
interface ProfileState {
  currentProfile: UserProfile | null;
  profiles: Record<string, UserProfile>;
  loading: boolean;
  error: string | null;
  searchResults: UserProfile[];
  // ... additional state
}

// Actions
dispatch(createProfile(formData));
dispatch(updateProfile({ profileId, updateData }));
dispatch(uploadProfilePhoto({ profileId, photo }));
dispatch(searchProfiles(params));
```

### Profile Hook

React hook providing easy access to profile functionality.

```typescript
const {
  // State
  currentProfile,
  loading,
  error,
  searchResults,
  
  // Actions
  createUserProfile,
  updateUserProfile,
  uploadPhoto,
  searchUserProfiles,
  
  // Helpers
  isProfileComplete,
  getProfileCompletionPercentage,
  formatProfileForDisplay
} = useProfile();
```

## Validation

### Form Validation

Comprehensive validation with real-time feedback.

```typescript
import { validateProfileForm, validateProfileField } from '../utils/profileValidation';

// Validate entire form
const errors = validateProfileForm(formData);

// Validate single field
const fieldError = validateProfileField('email', 'test@example.com');

// Check form validity
const isValid = isProfileFormValid(formData, errors);

// Get completion percentage
const completion = getProfileCompletionPercentage(formData);
```

**Validation Rules:**
- **Name**: 2-100 characters, letters/spaces/hyphens only
- **Email**: Valid email format, required
- **Phone**: International format, optional
- **Website**: Valid URL format, optional
- **Skills**: 1-20 skills, max 50 characters each
- **Social Links**: Platform-specific URL validation

### Error Handling

Robust error handling with user-friendly messages.

```typescript
import { ProfileErrorHandler, retryWithBackoff } from '../utils/profileErrorHandling';

// Handle errors
const profileError = ProfileErrorHandler.handleError(error, context);

// Get user message
const message = ProfileErrorHandler.getUserFriendlyMessage(profileError);

// Retry with backoff
const result = await retryWithBackoff(() => apiCall(), context);
```

## Usage Examples

### Basic Profile Creation

```typescript
import { useProfile } from '../hooks/useProfile';
import { validateProfileForm } from '../utils/profileValidation';

const CreateProfile = () => {
  const { createUserProfile, loading, error } = useProfile();
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    const validationErrors = validateProfileForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = await createUserProfile(formData);
    if (result.success) {
      navigation.navigate('ProfileComplete');
    }
  };

  return (
    <ProfileForm
      data={formData}
      errors={errors}
      loading={loading}
      onSubmit={handleSubmit}
      onChange={setFormData}
    />
  );
};
```

### Profile Display

```typescript
import ProfilePreview from '../components/ProfilePreview';

const ProfileScreen = ({ route }) => {
  const { profile } = route.params;
  const { updateUserProfile } = useProfile();

  const handleEdit = () => {
    navigation.navigate('EditProfile', { profile });
  };

  const handleShare = async () => {
    await Share.share({
      message: `Check out ${profile.name}'s profile`,
      title: profile.name
    });
  };

  return (
    <ProfilePreview
      profile={profile}
      variant="detailed"
      showActions={true}
      editable={isOwner}
      onEdit={handleEdit}
      onShare={handleShare}
    />
  );
};
```

### Profile Search

```typescript
import { useProfile } from '../hooks/useProfile';

const ProfileSearch = () => {
  const { searchUserProfiles, searchResults, searchLoading } = useProfile();
  const [query, setQuery] = useState('');

  const handleSearch = async (searchQuery: string) => {
    const results = await searchUserProfiles({
      query: searchQuery,
      limit: 20,
      filters: {
        isPublic: true,
        isVerified: true
      }
    });
  };

  return (
    <View>
      <SearchInput
        value={query}
        onChangeText={setQuery}
        onSubmit={handleSearch}
      />
      <ProfileList
        profiles={searchResults}
        loading={searchLoading}
        onProfilePress={handleProfilePress}
      />
    </View>
  );
};
```

### Photo Upload

```typescript
import { imagePickerService } from '../services/imagePickerService';

const PhotoUpload = ({ profileId, onUploadComplete }) => {
  const { uploadPhoto, uploadingPhoto } = useProfile();

  const handlePhotoSelect = async () => {
    try {
      const result = await imagePickerService.pickImage('both', {
        quality: 0.8,
        cropping: true,
        cropperCircleOverlay: true
      });

      if (result.success && result.image) {
        const uploadResult = await uploadPhoto(profileId, result.image);
        if (uploadResult.success) {
          onUploadComplete(uploadResult.photoUrl);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  return (
    <TouchableOpacity onPress={handlePhotoSelect}>
      {uploadingPhoto ? (
        <ActivityIndicator />
      ) : (
        <Text>Select Photo</Text>
      )}
    </TouchableOpacity>
  );
};
```

## Configuration

### Required Dependencies

```json
{
  "dependencies": {
    "react-native-image-picker": "^5.0.0",
    "react-native-image-crop-picker": "^0.38.0",
    "react-native-permissions": "^3.8.0",
    "react-native-mmkv": "^2.8.0",
    "react-native-vector-icons": "^9.2.0",
    "@reduxjs/toolkit": "^1.9.0",
    "react-redux": "^8.1.0"
  }
}
```

### Environment Variables

```typescript
// .env
API_URL=https://your-api.com
PROFILE_PHOTO_MAX_SIZE=10485760  // 10MB
PROFILE_PHOTO_QUALITY=0.8
IMAGE_CACHE_SIZE=100
```

### Permissions Setup

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

**iOS (ios/YourApp/Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take profile photos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select profile photos</string>
```

## Best Practices

### Performance

1. **Image Optimization**
   - Compress images before upload
   - Use appropriate image sizes
   - Implement progressive loading

2. **State Management**
   - Cache profile data efficiently  
   - Use pagination for search results
   - Implement optimistic updates

3. **Validation**
   - Use debounced validation for real-time feedback
   - Validate on both client and server
   - Provide clear error messages

### User Experience

1. **Form Design**
   - Break complex forms into steps
   - Show progress indicators
   - Provide helpful suggestions

2. **Error Handling**
   - Show user-friendly error messages
   - Provide recovery suggestions
   - Implement retry logic

3. **Accessibility**
   - Add proper labels and hints
   - Support screen readers
   - Ensure sufficient color contrast

### Security

1. **Data Validation**
   - Always validate on server-side
   - Sanitize user input
   - Validate file uploads

2. **Privacy**
   - Respect user privacy settings
   - Implement data export/deletion
   - Follow GDPR compliance

## Testing

### Test Coverage

The profile features module includes comprehensive test coverage:

#### Unit Tests
- **`profileValidation.test.ts`** - Form validation logic and rules
- **`profileService.test.ts`** - API service integration and error handling
- **`profileErrorHandling.test.ts`** - Error classification and recovery logic
- **`useProfile.test.ts`** - React hook functionality and state management

#### Integration Tests
- **`profileScreens.test.tsx`** - Screen interactions and user workflows

### Running Tests

Run all profile tests:
```bash
npm test -- --testPathPattern="profile"
```

Run specific test suites:
```bash
# Validation tests only
npm test -- --testPathPattern="profile.*validation"

# Service tests only
npm test -- --testPathPattern="profile.*service"

# Integration tests only
npm test -- --testPathPattern="profile.*integration"

# Error handling tests only
npm test -- --testPathPattern="profile.*error"
```

### Test Coverage Report

Generate coverage report:
```bash
npm test -- --coverage --testPathPattern="profile"
```

### Manual Testing Checklist

- [ ] Profile creation flow
- [ ] Photo upload and cropping
- [ ] Form validation and errors
- [ ] Profile editing and saving
- [ ] Search and filtering
- [ ] Responsive design
- [ ] Accessibility features

## Troubleshooting

### Common Issues

1. **Photo Upload Fails**
   - Check file size limits
   - Verify image format support
   - Test network connectivity

2. **Validation Errors**
   - Review field requirements
   - Check regex patterns
   - Verify error message display

3. **State Not Updating**
   - Check Redux store connection
   - Verify action dispatching
   - Review component re-rendering

### Debug Mode

Enable debug logging:
```typescript
if (__DEV__) {
  console.log('Profile state:', profileState);
  console.log('Validation errors:', errors);
}
```

## API Endpoints

The profile features expect these API endpoints:

- `POST /api/profiles` - Create profile
- `GET /api/profiles/:id` - Get profile
- `PATCH /api/profiles/:id` - Update profile  
- `DELETE /api/profiles/:id` - Delete profile
- `POST /api/profiles/:id/photo` - Upload photo
- `GET /api/profiles/search` - Search profiles
- `GET /api/profiles/stats` - Get statistics

## Future Enhancements

- [ ] Profile templates
- [ ] Bulk profile operations
- [ ] Advanced analytics
- [ ] Profile verification system
- [ ] Social media integration
- [ ] Profile backup/restore
- [ ] Multi-language support

## Support

For issues and feature requests, please check:
- Review the troubleshooting guide
- Check the API documentation
- Verify configuration settings
- Test with different devices/platforms