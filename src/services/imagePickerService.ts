/**
 * Image Picker Service
 *
 * This service handles image selection, cropping, and processing for profile photos.
 * It provides a unified interface for camera, gallery, and image manipulation operations.
 */

import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import {
  openPicker,
  openCamera,
  Image as CropperImage,
  Options as CropperOptions,
} from 'react-native-image-crop-picker';
import { Alert, Platform } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';
import { ProfilePhotoData } from '../types/profile';

export interface ImagePickerResult {
  success: boolean;
  image?: ProfilePhotoData;
  error?: string;
  cancelled?: boolean;
}

export interface ImagePickerServiceOptions {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  allowsEditing: boolean;
  mediaType: MediaType;
  includeBase64: boolean;
  cropping: boolean;
  cropperOptions?: CropperOptions;
}

export type ImageSource = 'camera' | 'gallery' | 'both';

export class ImagePickerService {
  private defaultOptions: ImagePickerServiceOptions = {
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    allowsEditing: true,
    mediaType: 'photo' as MediaType,
    includeBase64: false,
    cropping: true,
    cropperOptions: {
      width: 400,
      height: 400,
      cropping: true,
      cropperCircleOverlay: true,
      sortOrder: 'none',
      compressImageMaxWidth: 1024,
      compressImageMaxHeight: 1024,
      compressImageQuality: 0.8,
      compressVideoPreset: 'MediumQuality',
      includeExif: false,
      cropperStatusBarColor: 'white',
      cropperToolbarColor: 'white',
      cropperActiveWidgetColor: '#3498db',
      cropperToolbarWidgetColor: '#3498db',
    },
  };

  /**
   * Shows image picker options to the user
   */
  async pickImage(
    source: ImageSource = 'both',
    options?: Partial<ImagePickerServiceOptions>,
  ): Promise<ImagePickerResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      // Check permissions first
      const hasPermissions = await this.checkPermissions(source);
      if (!hasPermissions) {
        return {
          success: false,
          error: 'Camera and photo library permissions are required',
        };
      }

      if (source === 'both') {
        return await this.showImageSourceSelection(mergedOptions);
      } else if (source === 'camera') {
        return await this.pickFromCamera(mergedOptions);
      } else {
        return await this.pickFromGallery(mergedOptions);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pick image',
      };
    }
  }

  /**
   * Pick image from camera
   */
  private async pickFromCamera(
    options: ImagePickerServiceOptions,
  ): Promise<ImagePickerResult> {
    try {
      if (options.cropping) {
        const image = await openCamera(options.cropperOptions!);
        return this.processCroppedImage(image);
      } else {
        return new Promise(resolve => {
          const imagePickerOptions: ImagePickerOptions = {
            mediaType: options.mediaType,
            quality: options.quality,
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
            includeBase64: options.includeBase64,
          };

          launchCamera(imagePickerOptions, response => {
            resolve(this.processImagePickerResponse(response));
          });
        });
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'User cancelled image selection'
      ) {
        return { success: false, cancelled: true };
      }
      throw error;
    }
  }

  /**
   * Pick image from gallery
   */
  private async pickFromGallery(
    options: ImagePickerServiceOptions,
  ): Promise<ImagePickerResult> {
    try {
      if (options.cropping) {
        const image = await openPicker(options.cropperOptions!);
        return this.processCroppedImage(image);
      } else {
        return new Promise(resolve => {
          const imagePickerOptions: ImagePickerOptions = {
            mediaType: options.mediaType,
            quality: options.quality,
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
            includeBase64: options.includeBase64,
          };

          launchImageLibrary(imagePickerOptions, response => {
            resolve(this.processImagePickerResponse(response));
          });
        });
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'User cancelled image selection'
      ) {
        return { success: false, cancelled: true };
      }
      throw error;
    }
  }

  /**
   * Show image source selection dialog
   */
  private async showImageSourceSelection(
    options: ImagePickerServiceOptions,
  ): Promise<ImagePickerResult> {
    return new Promise(resolve => {
      Alert.alert(
        'Select Image',
        'Choose how you want to select your profile photo',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ success: false, cancelled: true }),
          },
          {
            text: 'Camera',
            onPress: async () => {
              const result = await this.pickFromCamera(options);
              resolve(result);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await this.pickFromGallery(options);
              resolve(result);
            },
          },
        ],
      );
    });
  }

  /**
   * Process response from react-native-image-picker
   */
  private processImagePickerResponse(
    response: ImagePickerResponse,
  ): ImagePickerResult {
    if (response.didCancel) {
      return { success: false, cancelled: true };
    }

    if (response.errorMessage) {
      return { success: false, error: response.errorMessage };
    }

    if (!response.assets || response.assets.length === 0) {
      return { success: false, error: 'No image selected' };
    }

    const asset = response.assets[0];
    if (!asset.uri) {
      return { success: false, error: 'Invalid image selected' };
    }

    const profilePhoto: ProfilePhotoData = {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || `profile_photo_${Date.now()}.jpg`,
      size: asset.fileSize || 0,
    };

    return { success: true, image: profilePhoto };
  }

  /**
   * Process response from react-native-image-crop-picker
   */
  private processCroppedImage(image: CropperImage): ImagePickerResult {
    const profilePhoto: ProfilePhotoData = {
      uri: image.path,
      type: image.mime,
      name: `profile_photo_${Date.now()}.jpg`,
      size: image.size,
    };

    return { success: true, image: profilePhoto };
  }

  /**
   * Check and request necessary permissions
   */
  private async checkPermissions(source: ImageSource): Promise<boolean> {
    try {
      const permissions: Permission[] = [];

      if (source === 'camera' || source === 'both') {
        permissions.push(
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.CAMERA
            : PERMISSIONS.ANDROID.CAMERA,
        );
      }

      if (source === 'gallery' || source === 'both') {
        permissions.push(
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.PHOTO_LIBRARY
            : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        );
      }

      // Check permissions
      const results = await Promise.all(
        permissions.map(permission => check(permission)),
      );

      // Request permissions if not granted
      const needsPermission = results.some(
        result => result !== RESULTS.GRANTED,
      );
      if (needsPermission) {
        const requestResults = await Promise.all(
          permissions.map(permission => request(permission)),
        );

        return requestResults.every(result => result === RESULTS.GRANTED);
      }

      return true;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Validate image file
   */
  validateImage(image: ProfilePhotoData): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (image.size > maxSize) {
      return { valid: false, error: 'Image size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type.toLowerCase())) {
      return {
        valid: false,
        error: 'Please select a JPEG, PNG, or WebP image',
      };
    }

    return { valid: true };
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(
    uri: string,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const Image = require('react-native').Image;
      Image.getSize(
        uri,
        (width: number, height: number) => resolve({ width, height }),
        (error: any) => reject(error),
      );
    });
  }

  /**
   * Compress image if needed
   */
  async compressImage(
    image: ProfilePhotoData,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.8,
  ): Promise<ProfilePhotoData> {
    try {
      const compressedImage = await openPicker({
        path: image.uri,
        width: maxWidth,
        height: maxHeight,
        cropping: false,
        compressImageQuality: quality,
      });

      return {
        uri: compressedImage.path,
        type: compressedImage.mime,
        name: image.name,
        size: compressedImage.size,
      };
    } catch (error) {
      console.error('Image compression error:', error);
      return image; // Return original if compression fails
    }
  }

  /**
   * Delete temporary image file
   */
  async cleanupTempImage(uri: string): Promise<void> {
    try {
      const RNFS = require('react-native-fs');
      const exists = await RNFS.exists(uri);
      if (exists) {
        await RNFS.unlink(uri);
      }
    } catch (error) {
      console.error('Cleanup temp image error:', error);
    }
  }

  /**
   * Get image file info
   */
  async getImageInfo(uri: string): Promise<{
    size: number;
    type: string;
    dimensions: { width: number; height: number };
  }> {
    try {
      const [dimensions, stats] = await Promise.all([
        this.getImageDimensions(uri),
        new Promise<any>((resolve, reject) => {
          const RNFS = require('react-native-fs');
          RNFS.stat(uri).then(resolve).catch(reject);
        }),
      ]);

      return {
        size: stats.size,
        type: this.getImageTypeFromUri(uri),
        dimensions,
      };
    } catch (error) {
      console.error('Get image info error:', error);
      throw error;
    }
  }

  /**
   * Helper to get image type from URI
   */
  private getImageTypeFromUri(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Create image picker options for specific use cases
   */
  static createOptions(
    preset: 'profile' | 'cover' | 'document' | 'custom',
    customOptions?: Partial<ImagePickerServiceOptions>,
  ): ImagePickerServiceOptions {
    const baseOptions: Record<string, Partial<ImagePickerServiceOptions>> = {
      profile: {
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400,
        cropping: true,
        cropperOptions: {
          width: 400,
          height: 400,
          cropperCircleOverlay: true,
        },
      },
      cover: {
        quality: 0.9,
        maxWidth: 1200,
        maxHeight: 600,
        cropping: true,
        cropperOptions: {
          width: 1200,
          height: 600,
          cropperCircleOverlay: false,
        },
      },
      document: {
        quality: 1.0,
        maxWidth: 2048,
        maxHeight: 2048,
        cropping: false,
      },
    };

    const service = new ImagePickerService();
    const presetOptions = preset === 'custom' ? {} : baseOptions[preset];

    return {
      ...service.defaultOptions,
      ...presetOptions,
      ...customOptions,
    };
  }
}

// Default instance
export const imagePickerService = new ImagePickerService();
