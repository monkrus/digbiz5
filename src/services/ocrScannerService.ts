/**
 * OCR Scanner Service
 *
 * Implements ML Kit text recognition for physical business card scanning
 * with field mapping and parsing capabilities.
 */

import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import { TextRecognition } from '@react-native-ml-kit/text-recognition';
import {
  Contact,
  ContactField,
  ScanResult,
  OCRConfig,
} from '../types/contacts';
import { trackEvent } from './analyticsService';

export interface ScanOptions {
  useCamera?: boolean;
  multiple?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  includeBase64?: boolean;
}

export interface TextBlock {
  text: string;
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  cornerPoints: Array<{ x: number; y: number }>;
  confidence: number;
}

export interface ParsedCardData {
  name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  fax?: string;
  mobile?: string;
  confidence: number;
  rawText: string;
  textBlocks: TextBlock[];
}

class OCRScannerService {
  private config: OCRConfig = {
    minConfidence: 0.7,
    enableLanguageDetection: true,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
    fieldMappingRules: this.getDefaultMappingRules(),
    enableAutoCorrection: true,
    maxProcessingTime: 30000, // 30 seconds
  };

  constructor(config?: Partial<OCRConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Scan a business card using camera or image picker
   */
  async scanBusinessCard(
    imageUriOrOptions?: string | ScanOptions,
    options: ScanOptions = {},
  ): Promise<ScanResult> {
    const startTime = Date.now();

    try {
      // Handle both direct URI and options-based calls
      let imageUris: string[] = [];
      let scanOptions: ScanOptions = {};

      if (typeof imageUriOrOptions === 'string') {
        // Direct URI provided
        imageUris = [imageUriOrOptions];
        scanOptions = options;
      } else {
        // Options provided, need to get image
        scanOptions = imageUriOrOptions || {};
        const imageResponse = await this.getImage(scanOptions);

        if (!imageResponse.assets || imageResponse.assets.length === 0) {
          throw new Error('No image selected');
        }

        imageUris = imageResponse.assets
          .map(asset => asset.uri)
          .filter(Boolean) as string[];
      }

      trackEvent('ocr_scan_started', {
        useCamera: scanOptions.useCamera || false,
        multiple: scanOptions.multiple || false,
        imageCount: imageUris.length,
      });

      const results: ParsedCardData[] = [];

      // Process each image
      for (const uri of imageUris) {
        const parsedData = await this.processImage(uri);
        results.push(parsedData);
      }

      const duration = Date.now() - startTime;

      trackEvent('ocr_scan_completed', {
        imageCount: results.length,
        duration,
        averageConfidence:
          results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      });

      return {
        success: true,
        results,
        duration,
        metadata: {
          timestamp: new Date().toISOString(),
          imageCount: results.length,
          processingTime: duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      trackEvent('ocr_scan_failed', {
        error: error.message,
        duration,
      });

      return {
        success: false,
        error: error.message,
        duration,
        results: [],
      };
    }
  }

  /**
   * Get image from camera or gallery
   */
  private async getImage(options: ScanOptions): Promise<ImagePickerResponse> {
    const pickerOptions = {
      mediaType: 'photo' as MediaType,
      quality: options.quality || 0.8,
      maxWidth: options.maxWidth || 1920,
      maxHeight: options.maxHeight || 1080,
      includeBase64: options.includeBase64 || false,
      selectionLimit: options.multiple ? 10 : 1,
    };

    return new Promise((resolve, reject) => {
      const callback = (response: ImagePickerResponse) => {
        if (response.didCancel) {
          reject(new Error('User cancelled image selection'));
        } else if (response.errorMessage) {
          reject(new Error(response.errorMessage));
        } else {
          resolve(response);
        }
      };

      if (options.useCamera) {
        launchCamera(pickerOptions, callback);
      } else {
        launchImageLibrary(pickerOptions, callback);
      }
    });
  }

  /**
   * Process image with ML Kit text recognition (exposed for testing)
   */
  async processImage(imageUri: string): Promise<ParsedCardData> {
    try {
      // Perform text recognition
      const result = await TextRecognition.recognize(imageUri);

      // Extract text blocks with positioning
      const textBlocks: TextBlock[] = result.blocks.map(block => ({
        text: block.text,
        boundingBox: {
          left: block.frame?.x || block.frame?.left || 0,
          top: block.frame?.y || block.frame?.top || 0,
          width: block.frame?.width || 100,
          height: block.frame?.height || 20,
        },
        cornerPoints: block.cornerPoints || [],
        confidence: block.confidence || 0.5,
      }));

      // Parse and map fields
      const parsedData = await this.parseTextBlocks(textBlocks);

      return {
        ...parsedData,
        rawText: result.text,
        textBlocks,
        confidence: this.calculateOverallConfidence(textBlocks),
      };
    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Parse text blocks and extract contact information
   */
  private async parseTextBlocks(
    textBlocks: TextBlock[],
  ): Promise<Partial<ParsedCardData>> {
    const parsedData: Partial<ParsedCardData> = {};
    const allText = textBlocks.map(block => block.text).join('\n');

    // Parse different field types
    parsedData.email = this.extractEmails(allText)[0];
    parsedData.phone = this.extractPhones(allText)[0];
    parsedData.website = this.extractWebsites(allText)[0];

    // Parse name, company, and title using position-based heuristics
    const nameCompanyTitle = this.parseNameCompanyTitle(textBlocks);
    Object.assign(parsedData, nameCompanyTitle);

    // Parse address
    parsedData.address = this.extractAddress(textBlocks);

    return parsedData;
  }

  /**
   * Extract email addresses from text
   */
  private extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Extract phone numbers from text
   */
  private extractPhones(text: string): string[] {
    const phoneRegex =
      /(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
    const phones = text.match(phoneRegex) || [];
    return phones.map(phone => this.normalizePhone(phone));
  }

  /**
   * Extract websites from text
   */
  private extractWebsites(text: string): string[] {
    const websiteRegex =
      /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
    return text.match(websiteRegex) || [];
  }

  /**
   * Parse name, company, and title using position-based heuristics
   */
  private parseNameCompanyTitle(
    textBlocks: TextBlock[],
  ): Partial<ParsedCardData> {
    // Sort blocks by position (top to bottom, left to right)
    const sortedBlocks = textBlocks.sort((a, b) => {
      if (Math.abs(a.boundingBox.top - b.boundingBox.top) < 20) {
        return a.boundingBox.left - b.boundingBox.left;
      }
      return a.boundingBox.top - b.boundingBox.top;
    });

    const result: Partial<ParsedCardData> = {};

    // Look for patterns in the first few blocks
    for (let i = 0; i < Math.min(5, sortedBlocks.length); i++) {
      const block = sortedBlocks[i];
      const text = block.text.trim();

      if (!text) continue;

      // Check if it's a title (common title keywords)
      if (this.isTitleText(text)) {
        result.title = text;
        continue;
      }

      // Check if it's a company name (all caps, contains common company words)
      if (this.isCompanyText(text)) {
        result.company = text;
        continue;
      }

      // If no name found yet and this looks like a person's name
      if (!result.name && this.isPersonName(text)) {
        result.name = text;
        continue;
      }
    }

    return result;
  }

  /**
   * Extract address from text blocks
   */
  private extractAddress(textBlocks: TextBlock[]): string | undefined {
    // Look for address patterns in the lower part of the card
    const lowerBlocks = textBlocks.filter(
      block =>
        block.boundingBox.top >
        textBlocks.reduce((sum, b) => sum + b.boundingBox.top, 0) /
          textBlocks.length,
    );

    for (const block of lowerBlocks) {
      const text = block.text.trim();
      if (this.isAddressText(text)) {
        return text;
      }
    }

    return undefined;
  }

  /**
   * Check if text appears to be a job title
   */
  private isTitleText(text: string): boolean {
    const titleKeywords = [
      'ceo',
      'cto',
      'cfo',
      'president',
      'director',
      'manager',
      'lead',
      'senior',
      'junior',
      'associate',
      'specialist',
      'coordinator',
      'analyst',
      'engineer',
      'developer',
      'designer',
      'consultant',
      'advisor',
      'founder',
      'owner',
    ];

    const lowerText = text.toLowerCase();
    return titleKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Check if text appears to be a company name
   */
  private isCompanyText(text: string): boolean {
    const companyKeywords = [
      'inc',
      'llc',
      'corp',
      'ltd',
      'company',
      'group',
      'solutions',
      'services',
    ];
    const lowerText = text.toLowerCase();

    // All uppercase text is often company name
    if (text === text.toUpperCase() && text.length > 3) {
      return true;
    }

    return companyKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Check if text appears to be a person's name
   */
  private isPersonName(text: string): boolean {
    // Simple heuristic: 2-3 words, proper case, no special characters
    const words = text.split(/\s+/);
    if (words.length < 2 || words.length > 4) {
      return false;
    }

    // Check if each word starts with a capital letter
    return words.every(word => /^[A-Z][a-z]+$/.test(word));
  }

  /**
   * Check if text appears to be an address
   */
  private isAddressText(text: string): boolean {
    const addressKeywords = [
      'street',
      'st',
      'avenue',
      'ave',
      'road',
      'rd',
      'suite',
      'floor',
    ];
    const lowerText = text.toLowerCase();

    // Contains numbers and address keywords
    const hasNumbers = /\d/.test(text);
    const hasAddressKeywords = addressKeywords.some(keyword =>
      lowerText.includes(keyword),
    );

    return hasNumbers && (hasAddressKeywords || text.split(/\s+/).length >= 3);
  }

  /**
   * Normalize phone number format
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Format as +1-XXX-XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `+1-${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
      )}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(
        7,
      )}`;
    } else if (cleaned.startsWith('+1') && cleaned.length === 12) {
      return `+1-${cleaned.slice(2, 5)}-${cleaned.slice(5, 8)}-${cleaned.slice(
        8,
      )}`;
    }

    return phone; // Return original if can't normalize
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(textBlocks: TextBlock[]): number {
    if (textBlocks.length === 0) return 0;

    const totalConfidence = textBlocks.reduce(
      (sum, block) => sum + block.confidence,
      0,
    );
    return totalConfidence / textBlocks.length;
  }

  /**
   * Get default field mapping rules
   */
  private getDefaultMappingRules() {
    return {
      name: {
        patterns: [/^[A-Z][a-z]+ [A-Z][a-z]+$/],
        position: 'top',
        confidence: 0.8,
      },
      email: {
        patterns: [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/],
        position: 'any',
        confidence: 0.9,
      },
      phone: {
        patterns: [/\+?[\d\s\-().]{10,}/],
        position: 'any',
        confidence: 0.8,
      },
      company: {
        patterns: [/\b(Inc|LLC|Corp|Ltd)\b/i],
        position: 'top-middle',
        confidence: 0.7,
      },
    };
  }

  /**
   * Convert parsed data to Contact model
   */
  convertToContact(
    parsedData: ParsedCardData,
    customMapping?: Record<string, string>,
  ): Contact {
    const contactFields: ContactField[] = [];
    let fieldOrder = 0;

    // Map parsed data to contact fields
    const fieldMapping = customMapping || {
      name: 'name',
      company: 'company',
      title: 'title',
      email: 'email',
      phone: 'phone',
      website: 'website',
      address: 'address',
    };

    Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
      const value = parsedData[sourceField as keyof ParsedCardData];
      if (value && typeof value === 'string') {
        contactFields.push({
          id: `field_${fieldOrder++}`,
          type: targetField,
          label: this.capitalizeFirst(targetField),
          value: value.trim(),
          isEditable: true,
          confidence: parsedData.confidence || 0.7,
        });
      }
    });

    return {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fields: contactFields,
      source: 'ocr_scan',
      confidence: parsedData.confidence || 0.7,
      rawText: parsedData.rawText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['scanned'],
      isVerified: false,
      needsReview: parsedData.confidence < 0.8,
    };
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Batch process multiple images
   */
  async processBulkScans(imageUris: string[]): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const batchSize = 3; // Process 3 images at a time

    for (let i = 0; i < imageUris.length; i += batchSize) {
      const batch = imageUris.slice(i, i + batchSize);
      const batchPromises = batch.map(async uri => {
        try {
          const parsedData = await this.processImage(uri);
          return {
            success: true,
            results: [parsedData],
            duration: 0,
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            results: [],
            duration: 0,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}

export const ocrScannerService = new OCRScannerService();
export default OCRScannerService;
