/**
 * OCR Scanner Service Tests
 *
 * Tests for OCR scanning functionality with sample cards
 */

import { ocrScannerService } from '../../src/services/ocrScannerService';
import {
  ParsedCardData,
  ScanOptions,
} from '../../src/services/ocrScannerService';
import { Contact } from '../../src/types/contacts';

describe('OCRScannerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Business Card Scanning', () => {
    it('should scan business card and extract contact information', async () => {
      const options: ScanOptions = {
        enableAutoCorrection: true,
        minConfidence: 0.7,
      };

      const result = await ocrScannerService.scanBusinessCard(
        'file:///test-card.jpg',
        options,
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);

      const parsedData = result.results[0];
      expect(parsedData.name).toBe('John Doe');
      expect(parsedData.company).toBe('Acme Corp');
      expect(parsedData.email).toBe('john@example.com');
      expect(parsedData.phone).toBe('+1-555-0123');
      expect(parsedData.confidence).toBeGreaterThan(0.7);
    });

    it('should handle low quality images with reduced confidence', async () => {
      // Mock low confidence OCR result
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockResolvedValueOnce({
        text: 'John D\nSoft Eng\njhn@exam.com\n555-012',
        blocks: [
          { text: 'John D', frame: { x: 10, y: 10, width: 50, height: 20 } },
          { text: 'Soft Eng', frame: { x: 10, y: 35, width: 60, height: 15 } },
          {
            text: 'jhn@exam.com',
            frame: { x: 10, y: 55, width: 90, height: 15 },
          },
          { text: '555-012', frame: { x: 10, y: 75, width: 50, height: 15 } },
        ],
      });

      const result = await ocrScannerService.scanBusinessCard(
        'file:///low-quality-card.jpg',
      );

      expect(result.success).toBe(true);
      const parsedData = result.results[0];
      expect(parsedData.confidence).toBeLessThan(0.8);
      expect(parsedData.name).toBe('John D');
      expect(parsedData.email).toBe('jhn@exam.com');
    });

    it('should detect multiple contacts on single card', async () => {
      // Mock multi-contact card
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockResolvedValueOnce({
        text: 'John Doe\njohn@acme.com\n+1-555-0123\n\nJane Smith\njane@acme.com\n+1-555-0124',
        blocks: [
          { text: 'John Doe', frame: { x: 10, y: 10, width: 100, height: 20 } },
          {
            text: 'john@acme.com',
            frame: { x: 10, y: 35, width: 120, height: 15 },
          },
          {
            text: '+1-555-0123',
            frame: { x: 10, y: 55, width: 100, height: 15 },
          },
          {
            text: 'Jane Smith',
            frame: { x: 10, y: 90, width: 100, height: 20 },
          },
          {
            text: 'jane@acme.com',
            frame: { x: 10, y: 115, width: 120, height: 15 },
          },
          {
            text: '+1-555-0124',
            frame: { x: 10, y: 135, width: 100, height: 15 },
          },
        ],
      });

      const result = await ocrScannerService.scanBusinessCard(
        'file:///multi-contact-card.jpg',
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].name).toBe('John Doe');
      expect(result.results[1].name).toBe('Jane Smith');
    });

    it('should handle foreign language cards', async () => {
      // Mock foreign language text
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockResolvedValueOnce({
        text: '田中太郎\nソフトウェアエンジニア\ntanaka@example.jp\n+81-90-1234-5678',
        blocks: [
          { text: '田中太郎', frame: { x: 10, y: 10, width: 100, height: 20 } },
          {
            text: 'ソフトウェアエンジニア',
            frame: { x: 10, y: 35, width: 150, height: 15 },
          },
          {
            text: 'tanaka@example.jp',
            frame: { x: 10, y: 55, width: 130, height: 15 },
          },
          {
            text: '+81-90-1234-5678',
            frame: { x: 10, y: 75, width: 120, height: 15 },
          },
        ],
      });

      const result = await ocrScannerService.scanBusinessCard(
        'file:///japanese-card.jpg',
      );

      expect(result.success).toBe(true);
      const parsedData = result.results[0];
      expect(parsedData.name).toBe('田中太郎');
      expect(parsedData.email).toBe('tanaka@example.jp');
      expect(parsedData.phone).toBe('+81-90-1234-5678');
    });
  });

  describe('Field Extraction Accuracy', () => {
    it('should correctly identify email addresses', async () => {
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockResolvedValueOnce({
        text: 'Contact: test@domain.com, backup@company.org, invalid.email',
        blocks: [
          {
            text: 'Contact: test@domain.com, backup@company.org, invalid.email',
            frame: { x: 10, y: 10, width: 300, height: 20 },
          },
        ],
      });

      const result = await ocrScannerService.scanBusinessCard(
        'file:///email-test-card.jpg',
      );
      const parsedData = result.results[0];

      // Should extract valid emails
      expect(parsedData.email).toMatch(/@/);
    });

    it('should correctly identify phone numbers', async () => {
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockResolvedValueOnce({
        text: '+1-555-123-4567\n(555) 987-6543\n555.111.2222\n12345',
        blocks: [
          {
            text: '+1-555-123-4567',
            frame: { x: 10, y: 10, width: 120, height: 15 },
          },
          {
            text: '(555) 987-6543',
            frame: { x: 10, y: 30, width: 120, height: 15 },
          },
          {
            text: '555.111.2222',
            frame: { x: 10, y: 50, width: 100, height: 15 },
          },
          { text: '12345', frame: { x: 10, y: 70, width: 50, height: 15 } },
        ],
      });

      const result = await ocrScannerService.scanBusinessCard(
        'file:///phone-test-card.jpg',
      );
      const parsedData = result.results[0];

      // Should extract the first valid phone number
      expect(parsedData.phone).toBe('+1-555-123-4567');
    });

    it('should correctly identify websites', async () => {
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockResolvedValueOnce({
        text: 'Visit us at www.company.com or https://secure.site.org',
        blocks: [
          {
            text: 'Visit us at www.company.com or https://secure.site.org',
            frame: { x: 10, y: 10, width: 300, height: 20 },
          },
        ],
      });

      const result = await ocrScannerService.scanBusinessCard(
        'file:///website-test-card.jpg',
      );
      const parsedData = result.results[0];

      expect(parsedData.website).toMatch(/^(https?:\/\/)?(www\.)?/);
    });
  });

  describe('Performance Tests', () => {
    it('should process image within acceptable time limit', async () => {
      const startTime = Date.now();

      await ocrScannerService.scanBusinessCard(
        'file:///performance-test-card.jpg',
      );

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large images efficiently', async () => {
      const options: ScanOptions = {
        maxImageSize: 1024, // Resize large images
      };

      const result = await ocrScannerService.scanBusinessCard(
        'file:///large-card.jpg',
        options,
      );

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(10000);
    });

    it('should process batch of images concurrently', async () => {
      const imageUris = [
        'file:///card1.jpg',
        'file:///card2.jpg',
        'file:///card3.jpg',
      ];

      const startTime = Date.now();
      const promises = imageUris.map(uri =>
        ocrScannerService.scanBusinessCard(uri),
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(totalTime).toBeLessThan(15000); // Concurrent processing should be faster
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid image paths gracefully', async () => {
      const result = await ocrScannerService.scanBusinessCard(
        'invalid://path/to/image.jpg',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.results).toHaveLength(0);
    });

    it('should handle OCR service failures', async () => {
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockRejectedValueOnce(
        new Error('OCR Service unavailable'),
      );

      const result = await ocrScannerService.scanBusinessCard(
        'file:///test-card.jpg',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('OCR Service unavailable');
    });

    it('should handle corrupted image files', async () => {
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockRejectedValueOnce(
        new Error('Invalid image format'),
      );

      const result = await ocrScannerService.scanBusinessCard(
        'file:///corrupted.jpg',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Contact Conversion', () => {
    it('should convert parsed data to contact format correctly', () => {
      const parsedData: ParsedCardData = {
        name: 'John Doe',
        company: 'Acme Corp',
        title: 'Software Engineer',
        email: 'john@acme.com',
        phone: '+1-555-0123',
        website: 'www.acme.com',
        address: '123 Main St, Anytown, ST 12345',
        confidence: 0.85,
        rawText:
          'John Doe\nSoftware Engineer\nAcme Corp\njohn@acme.com\n+1-555-0123',
      };

      const contact: Contact = ocrScannerService.convertToContact(parsedData);

      expect(contact.id).toBeDefined();
      expect(contact.source).toBe('ocr_scan');
      expect(contact.confidence).toBe(0.85);
      expect(contact.rawText).toBe(parsedData.rawText);
      expect(contact.isVerified).toBe(false);
      expect(contact.needsReview).toBe(true);

      // Check fields mapping
      const nameField = contact.fields.find(f => f.type === 'name');
      expect(nameField?.value).toBe('John Doe');

      const emailField = contact.fields.find(f => f.type === 'email');
      expect(emailField?.value).toBe('john@acme.com');

      const phoneField = contact.fields.find(f => f.type === 'phone');
      expect(phoneField?.value).toBe('+1-555-0123');
    });

    it('should mark low confidence contacts for review', () => {
      const lowConfidenceData: ParsedCardData = {
        name: 'J. D.',
        email: 'unclear@text',
        confidence: 0.4,
        rawText: 'Blurry text...',
      };

      const contact = ocrScannerService.convertToContact(lowConfidenceData);

      expect(contact.needsReview).toBe(true);
      expect(contact.isVerified).toBe(false);
      expect(contact.confidence).toBe(0.4);
    });

    it('should handle partial data extraction', () => {
      const partialData: ParsedCardData = {
        name: 'Jane Smith',
        // Missing company, email, phone
        confidence: 0.6,
        rawText: 'Jane Smith\n[Illegible text]',
      };

      const contact = ocrScannerService.convertToContact(partialData);

      expect(contact.fields).toHaveLength(1); // Only name field
      expect(contact.needsReview).toBe(true);

      const nameField = contact.fields[0];
      expect(nameField.type).toBe('name');
      expect(nameField.value).toBe('Jane Smith');
    });
  });

  describe('Configuration and Options', () => {
    it('should respect minimum confidence threshold', async () => {
      const options: ScanOptions = {
        minConfidence: 0.9,
      };

      // Mock low confidence result
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockResolvedValueOnce({
        text: 'Blurry Name\nunclear@email',
        blocks: [
          {
            text: 'Blurry Name',
            frame: { x: 10, y: 10, width: 80, height: 20 },
          },
          {
            text: 'unclear@email',
            frame: { x: 10, y: 35, width: 90, height: 15 },
          },
        ],
      });

      const result = await ocrScannerService.scanBusinessCard(
        'file:///blurry-card.jpg',
        options,
      );

      // Should filter out results below threshold
      expect(result.results.length).toBeLessThanOrEqual(1);
      if (result.results.length > 0) {
        expect(result.results[0].confidence).toBeGreaterThanOrEqual(0.9);
      }
    });

    it('should apply auto-correction when enabled', async () => {
      const options: ScanOptions = {
        enableAutoCorrection: true,
      };

      // Mock text with common OCR errors
      const {
        TextRecognition,
      } = require('@react-native-ml-kit/text-recognition');
      TextRecognition.recognize.mockResolvedValueOnce({
        text: 'J0hn D0e\nS0ftware Eng1neer\nj0hn@exam1ple.c0m',
        blocks: [
          { text: 'J0hn D0e', frame: { x: 10, y: 10, width: 80, height: 20 } },
          {
            text: 'S0ftware Eng1neer',
            frame: { x: 10, y: 35, width: 120, height: 15 },
          },
          {
            text: 'j0hn@exam1ple.c0m',
            frame: { x: 10, y: 55, width: 130, height: 15 },
          },
        ],
      });

      const result = await ocrScannerService.scanBusinessCard(
        'file:///error-card.jpg',
        options,
      );

      expect(result.success).toBe(true);
      // Auto-correction should improve the text quality
      const parsedData = result.results[0];
      expect(parsedData.name).not.toContain('0'); // Should correct 0 to O
      expect(parsedData.email).not.toContain('1'); // Should correct 1 to l
    });
  });
});
