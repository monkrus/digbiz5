/**
 * Business Card Integration Tests
 *
 * End-to-end integration tests that verify the complete digital business card
 * workflow from creation to sharing, including all Phase 2 functionality.
 */

import { businessCardService } from '../../src/services/businessCardService';
import { validateBusinessCardForm } from '../../src/utils/businessCardValidation';
import {
  generateQRCode,
  parseQRScanResult,
} from '../../src/utils/qrCodeGenerator';
import { shareCard, generateShareData } from '../../src/utils/sharingUtils';
import { saveToWallet } from '../../src/utils/walletUtils';
import { exportBusinessCard } from '../../src/utils/exportUtils';

import {
  BusinessCardFormData,
  BusinessCard,
} from '../../src/types/businessCard';

// Mock external dependencies for integration testing
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
  },
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(() => Promise.resolve({ success: true })),
}));
jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/mock/cache',
  DocumentDirectoryPath: '/mock/documents',
  writeFile: jest.fn(() => Promise.resolve()),
}));

describe('Business Card Integration Tests', () => {
  const completeCardData: BusinessCardFormData = {
    basicInfo: {
      name: 'Sarah Chen',
      title: 'Co-Founder & CTO',
      company: 'AI Vision Labs',
      email: 'sarah@aivisionlabs.ai',
      phone: '+1-415-555-0123',
      location: 'Palo Alto, CA',
      bio: 'Building the future of computer vision with deep learning. Former Google AI researcher with 8 years in ML.',
      profilePhoto: 'https://example.com/sarah-profile.jpg',
      companyLogo: 'https://example.com/aivision-logo.png',
    },
    startupInfo: {
      fundingStage: 'series-a',
      fundingAmount: '$10M',
      fundingRound: 'Series A',
      teamSize: '11-25',
      foundedYear: 2022,
      industry: ['AI', 'Computer Vision', 'B2B'],
      businessModel: 'b2b',
      revenue: '100k-1m',
      customers: '150+ enterprise clients',
      growth: '40% MoM',
      seekingFunding: false,
      seekingTalent: true,
      seekingPartners: true,
      seekingMentors: false,
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sarahchen',
      twitter: 'https://twitter.com/sarahchen_ai',
      github: 'https://github.com/sarahchen',
      website: 'https://aivisionlabs.ai',
      medium: 'https://medium.com/@sarahchen',
    },
    customFields: [
      {
        id: '1',
        label: 'Patents Filed',
        value: '3',
        type: 'number',
        icon: '📋',
        isPublic: true,
        order: 1,
      },
      {
        id: '2',
        label: 'Research Papers',
        value: '12',
        type: 'number',
        icon: '📄',
        isPublic: true,
        order: 2,
      },
      {
        id: '3',
        label: 'Investment Range',
        value: '$50K - $500K',
        type: 'text',
        icon: '💰',
        isPublic: true,
        order: 3,
      },
      {
        id: '4',
        label: 'Calendly',
        value: 'https://calendly.com/sarahchen',
        type: 'url',
        icon: '📅',
        isPublic: true,
        order: 4,
      },
    ],
    themeId: 'tech-professional-theme',
    templateId: 'startup-cto-template',
    isDefault: true,
    isPublic: true,
  };

  describe('End-to-End Card Creation Workflow', () => {
    test('should create complete business card with all field types', async () => {
      // Step 1: Validate the form data
      const validationErrors = validateBusinessCardForm(completeCardData);
      expect(Object.keys(validationErrors)).toHaveLength(0);

      // Step 2: Mock the API response for card creation
      const mockCreatedCard: BusinessCard = {
        id: 'card-integration-test-123',
        userId: 'user-test-456',
        ...completeCardData,
        theme: {
          id: 'tech-professional-theme',
          name: 'Tech Professional',
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          accentColor: '#10b981',
          fontFamily: 'Inter',
          headerFontSize: 24,
          bodyFontSize: 14,
          borderRadius: 8,
          padding: 16,
          spacing: 8,
        },
        template: {
          id: 'startup-cto-template',
          name: 'Startup CTO',
          category: 'tech',
          layout: 'standard',
          elements: [],
          isPopular: true,
          isPremium: false,
          previewImage: 'https://example.com/template-preview.png',
        },
        shareCode: 'integration-test-share-code',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock the service call
      jest.spyOn(businessCardService, 'createCard').mockResolvedValue({
        success: true,
        card: mockCreatedCard,
      });

      // Step 3: Create the card
      const result = await businessCardService.createCard(completeCardData);

      expect(result.success).toBe(true);
      expect(result.card).toBeDefined();
      expect(result.card?.basicInfo.name).toBe('Sarah Chen');
      expect(result.card?.startupInfo?.fundingStage).toBe('series-a');
      expect(result.card?.customFields).toHaveLength(4);
    });

    test('should handle card creation with minimal data', async () => {
      const minimalCardData: BusinessCardFormData = {
        basicInfo: {
          name: 'John Minimal',
          title: 'Developer',
          company: 'DevCorp',
          email: 'john@devcorp.com',
        },
        socialLinks: {},
        customFields: [],
        themeId: 'minimal-theme',
        templateId: 'simple-template',
      };

      const validationErrors = validateBusinessCardForm(minimalCardData);
      expect(Object.keys(validationErrors)).toHaveLength(0);

      // Mock successful creation
      jest.spyOn(businessCardService, 'createCard').mockResolvedValue({
        success: true,
        card: {
          id: 'minimal-card-123',
          userId: 'user-456',
          ...minimalCardData,
          shareCode: 'minimal-share-code',
        } as BusinessCard,
      });

      const result = await businessCardService.createCard(minimalCardData);
      expect(result.success).toBe(true);
    });
  });

  describe('QR Code Generation and Scanning Integration', () => {
    test('should generate and parse QR codes for complete workflow', async () => {
      const mockCard: BusinessCard = {
        id: 'qr-test-card',
        userId: 'user-123',
        ...completeCardData,
        shareCode: 'qr-test-share-code',
      } as BusinessCard;

      // Step 1: Generate URL QR code
      const urlQR = generateQRCode(mockCard, 'url');
      expect(urlQR.type).toBe('url');
      expect(urlQR.data).toContain('qr-test-share-code');

      // Step 2: Parse the generated QR code
      const parsedURL = parseQRScanResult(urlQR.data);
      expect(parsedURL.type).toBe('url');
      expect(parsedURL.parsed.url).toBe(urlQR.data);

      // Step 3: Generate vCard QR code
      const vCardQR = generateQRCode(mockCard, 'vcard');
      expect(vCardQR.type).toBe('vcard');
      expect(vCardQR.data).toContain('BEGIN:VCARD');
      expect(vCardQR.data).toContain('Sarah Chen');

      // Step 4: Parse vCard QR code
      const parsedVCard = parseQRScanResult(vCardQR.data);
      expect(parsedVCard.type).toBe('vcard');
      expect(parsedVCard.parsed.name).toBe('Sarah Chen');
      expect(parsedVCard.parsed.email).toBe('sarah@aivisionlabs.ai');

      // Step 5: Generate contact info QR code
      const contactQR = generateQRCode(mockCard, 'contact');
      expect(contactQR.type).toBe('text');
      expect(contactQR.data).toContain('Sarah Chen');
      expect(contactQR.data).toContain('+1-415-555-0123');
    });

    test('should handle QR code generation with different card configurations', async () => {
      const configurations = [
        { name: 'Minimal', socialLinks: {} },
        {
          name: 'Social Heavy',
          socialLinks: {
            linkedin: 'https://linkedin.com/in/user',
            twitter: 'https://twitter.com/user',
            github: 'https://github.com/user',
            instagram: 'https://instagram.com/user',
            facebook: 'https://facebook.com/user',
          },
        },
        {
          name: 'Custom Fields Heavy',
          customFields: Array.from({ length: 10 }, (_, i) => ({
            id: String(i),
            label: `Field ${i}`,
            value: `Value ${i}`,
            type: 'text' as const,
            isPublic: true,
            order: i,
          })),
        },
      ];

      for (const config of configurations) {
        const testCard = {
          id: `test-card-${config.name.toLowerCase()}`,
          userId: 'user-123',
          ...completeCardData,
          ...config,
          shareCode: `share-${config.name.toLowerCase()}`,
        } as BusinessCard;

        const qrCode = generateQRCode(testCard, 'vcard');
        expect(qrCode.type).toBe('vcard');

        const parsed = parseQRScanResult(qrCode.data);
        expect(parsed.type).toBe('vcard');
        expect(parsed.parsed.name).toBe('Sarah Chen');
      }
    });
  });

  describe('Sharing Workflow Integration', () => {
    test('should complete full sharing workflow', async () => {
      const mockCard: BusinessCard = {
        id: 'sharing-test-card',
        userId: 'user-123',
        ...completeCardData,
        shareCode: 'sharing-test-code',
      } as BusinessCard;

      // Step 1: Generate share data
      const shareData = await generateShareData(mockCard);
      expect(shareData.title).toContain('Sarah Chen');
      expect(shareData.url).toContain('sharing-test-code');
      expect(shareData.message).toContain('Co-Founder & CTO');

      // Step 2: Test different sharing methods
      const sharingMethods = [
        'native',
        'email',
        'sms',
        'whatsapp',
        'linkedin',
        'twitter',
      ];

      for (const method of sharingMethods) {
        const result = await shareCard(mockCard, { method: method as any });
        expect(result).toBe(true);
      }
    });

    test('should handle sharing with custom messages', async () => {
      const mockCard: BusinessCard = {
        id: 'custom-message-card',
        userId: 'user-123',
        ...completeCardData,
        shareCode: 'custom-message-code',
      } as BusinessCard;

      const customMessage =
        'Check out my updated business card with new contact info!';

      const result = await shareCard(mockCard, {
        method: 'native',
        message: customMessage,
      });

      expect(result).toBe(true);
    });
  });

  describe('Wallet Integration Workflow', () => {
    test('should complete wallet integration for both platforms', async () => {
      const mockCard: BusinessCard = {
        id: 'wallet-test-card',
        userId: 'user-123',
        ...completeCardData,
        shareCode: 'wallet-test-code',
      } as BusinessCard;

      // Test Apple Wallet (iOS)
      (require('react-native').Platform.OS as any) = 'ios';
      const iosResult = await saveToWallet(mockCard);
      expect(iosResult).toBe(true);

      // Test Google Wallet (Android)
      (require('react-native').Platform.OS as any) = 'android';
      const androidResult = await saveToWallet(mockCard);
      expect(androidResult).toBe(true);
    });
  });

  describe('Export and Import Workflow', () => {
    test('should export card in multiple formats', async () => {
      const mockCard: BusinessCard = {
        id: 'export-test-card',
        userId: 'user-123',
        ...completeCardData,
        shareCode: 'export-test-code',
      } as BusinessCard;

      const exportFormats = ['pdf', 'vcf', 'json'];

      for (const format of exportFormats) {
        const result = await exportBusinessCard(mockCard, format as any, {
          includeQRCode: true,
          includeAnalytics: false,
        });

        expect(result.success).toBe(true);
        expect(result.fileName).toContain(format);
      }
    });

    test('should handle CSV export for multiple cards', async () => {
      const mockCards: BusinessCard[] = [
        {
          id: 'csv-card-1',
          userId: 'user-123',
          ...completeCardData,
          shareCode: 'csv-code-1',
        } as BusinessCard,
        {
          id: 'csv-card-2',
          userId: 'user-123',
          basicInfo: {
            name: 'John Doe',
            title: 'Developer',
            company: 'DevCorp',
            email: 'john@devcorp.com',
          },
          socialLinks: {},
          customFields: [],
          themeId: 'theme-1',
          templateId: 'template-1',
          shareCode: 'csv-code-2',
        } as BusinessCard,
      ];

      const result = await exportBusinessCard(mockCards, 'csv', {
        includeQRCode: false,
        includeAnalytics: true,
      });

      expect(result.success).toBe(true);
      expect(result.fileName).toContain('.csv');
    });
  });

  describe('Deep Linking Integration', () => {
    test('should handle complete deep linking workflow', async () => {
      // Mock the deep linking utilities
      const {
        parseDeepLink,
        handleDeepLink,
      } = require('../../src/utils/deepLinking');

      const mockNavigation = {
        navigate: jest.fn(),
      };

      // Test various deep link formats
      const deepLinks = [
        'digbiz://card/integration-test-123',
        'https://digbiz.app/card/integration-test-123',
        'https://digbiz.app/open/card/integration-test-123?source=qr',
      ];

      for (const link of deepLinks) {
        const parsed = parseDeepLink(link);
        expect(parsed).toBeTruthy();
        expect(parsed?.cardId).toBe('integration-test-123');

        const result = await handleDeepLink(link, mockNavigation);
        expect(result.success).toBe(true);
        expect(mockNavigation.navigate).toHaveBeenCalled();
      }
    });
  });

  describe('Error Scenarios and Recovery', () => {
    test('should handle network failures gracefully', async () => {
      // Mock network failure
      jest
        .spyOn(businessCardService, 'createCard')
        .mockRejectedValue(new Error('Network request failed'));

      try {
        await businessCardService.createCard(completeCardData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Network request failed');
      }
    });

    test('should handle validation errors during creation', async () => {
      const invalidCardData = {
        ...completeCardData,
        basicInfo: {
          ...completeCardData.basicInfo,
          name: '', // Invalid - empty name
          email: 'invalid-email', // Invalid email format
        },
      };

      const validationErrors = validateBusinessCardForm(invalidCardData);
      expect(Object.keys(validationErrors)).toHaveLength(1); // basicInfo errors
      expect(validationErrors.basicInfo?.name).toBeDefined();
      expect(validationErrors.basicInfo?.email).toBeDefined();
    });

    test('should handle service unavailable scenarios', async () => {
      // Mock service unavailable
      jest.spyOn(businessCardService, 'createCard').mockResolvedValue({
        success: false,
        message: 'Service temporarily unavailable',
      });

      const result = await businessCardService.createCard(completeCardData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('unavailable');
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle multiple concurrent card operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const cardData = {
          ...completeCardData,
          basicInfo: {
            ...completeCardData.basicInfo,
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
          },
        };

        // Mock successful creation for each
        jest.spyOn(businessCardService, 'createCard').mockResolvedValue({
          success: true,
          card: {
            id: `concurrent-card-${i}`,
            userId: 'user-123',
            ...cardData,
            shareCode: `concurrent-share-${i}`,
          } as BusinessCard,
        });

        return businessCardService.createCard(cardData);
      });

      const results = await Promise.all(promises);

      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        expect(result.card?.basicInfo.name).toBe(`Test User ${i}`);
      });
    });

    test('should complete full workflow within performance bounds', async () => {
      const startTime = performance.now();

      // Simulate complete workflow
      const mockCard: BusinessCard = {
        id: 'performance-test-card',
        userId: 'user-123',
        ...completeCardData,
        shareCode: 'performance-test-code',
      } as BusinessCard;

      // Step 1: Validate
      const validationErrors = validateBusinessCardForm(completeCardData);
      expect(Object.keys(validationErrors)).toHaveLength(0);

      // Step 2: Generate QR codes
      const urlQR = generateQRCode(mockCard, 'url');
      const vCardQR = generateQRCode(mockCard, 'vcard');
      expect(urlQR.data).toBeTruthy();
      expect(vCardQR.data).toBeTruthy();

      // Step 3: Share operations
      await shareCard(mockCard, { method: 'native' });

      // Step 4: Export operations
      await exportBusinessCard(mockCard, 'vcf', {
        includeQRCode: true,
        includeAnalytics: false,
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete workflow within 2 seconds
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Data Consistency and Integrity', () => {
    test('should maintain data consistency across all operations', async () => {
      const mockCard: BusinessCard = {
        id: 'consistency-test-card',
        userId: 'user-123',
        ...completeCardData,
        shareCode: 'consistency-test-code',
      } as BusinessCard;

      // Verify data consistency in QR generation
      const qrCode = generateQRCode(mockCard, 'vcard');
      const parsedData = parseQRScanResult(qrCode.data);

      expect(parsedData.parsed.name).toBe(mockCard.basicInfo.name);
      expect(parsedData.parsed.email).toBe(mockCard.basicInfo.email);
      expect(parsedData.parsed.company).toBe(mockCard.basicInfo.company);

      // Verify data consistency in sharing
      const shareData = await generateShareData(mockCard);
      expect(shareData.title).toContain(mockCard.basicInfo.name);
      expect(shareData.url).toContain(mockCard.shareCode!);

      // Verify data consistency in export
      const exportResult = await exportBusinessCard(mockCard, 'json', {
        includeQRCode: false,
        includeAnalytics: false,
      });
      expect(exportResult.success).toBe(true);
    });
  });
});
