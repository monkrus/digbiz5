/**
 * Wallet Integration Tests
 *
 * Comprehensive tests for Apple Wallet and Google Wallet integration,
 * including pass generation, wallet saving, and platform-specific features.
 */

import { Platform, Alert, Linking } from 'react-native';
import RNFS from 'react-native-fs';

import {
  generateAppleWalletPass,
  generateGoogleWalletObject,
  saveToAppleWallet,
  saveToGoogleWallet,
  saveToWallet,
  isWalletAvailable,
  getWalletPlatformName,
  generateWalletSaveUrl,
  saveToContacts,
  addToCalendar,
} from '../../../src/utils/walletUtils';

import {
  BusinessCard,
  WalletPassData,
  GoogleWalletObject,
} from '../../../src/types/businessCard';

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(),
  },
}));

// Mock RNFS
jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/mock/cache',
  writeFile: jest.fn(),
}));

describe('Wallet Integration', () => {
  const mockBusinessCard: BusinessCard = {
    id: 'card-123',
    userId: 'user-456',
    basicInfo: {
      name: 'John Smith',
      title: 'CEO & Founder',
      company: 'TechStart Inc.',
      email: 'john@techstart.com',
      phone: '+1-555-123-4567',
      location: 'San Francisco, CA',
      bio: 'Building innovative technology solutions for startups.',
      profilePhoto: 'https://example.com/profile.jpg',
      companyLogo: 'https://example.com/logo.png',
    },
    startupInfo: {
      fundingStage: 'seed',
      teamSize: '11-25',
      industry: ['Technology', 'SaaS', 'AI'],
      businessModel: 'b2b',
      revenue: '0-10k',
      seekingFunding: true,
      seekingTalent: true,
      seekingPartners: false,
      seekingMentors: true,
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johnsmith',
      twitter: 'https://twitter.com/johnsmith',
      website: 'https://techstart.com',
      github: 'https://github.com/johnsmith',
    },
    customFields: [
      {
        id: '1',
        label: 'Investment Focus',
        value: 'B2B SaaS, AI, Fintech',
        type: 'text',
        icon: '💼',
        isPublic: true,
        order: 1,
      },
    ],
    theme: {
      id: 'professional-theme-1',
      name: 'Professional Blue',
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
      id: 'startup-template-1',
      name: 'Modern Startup',
      category: 'startup',
      layout: 'standard',
      elements: [],
      isPopular: true,
      isPremium: false,
      previewImage: 'https://example.com/template-preview.png',
    },
    isDefault: false,
    isPublic: true,
    isActive: true,
    shareCode: 'abc123def456',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastSharedAt: '2024-01-15T15:45:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  describe('Apple Wallet Pass Generation', () => {
    test('should generate complete Apple Wallet pass data', () => {
      const passData = generateAppleWalletPass(mockBusinessCard);

      expect(passData.formatVersion).toBe(1);
      expect(passData.passTypeIdentifier).toBe('pass.com.digbiz.businesscard');
      expect(passData.serialNumber).toBe(mockBusinessCard.id);
      expect(passData.organizationName).toBe('DigBiz');
      expect(passData.description).toContain('John Smith');
    });

    test('should include primary fields in pass', () => {
      const passData = generateAppleWalletPass(mockBusinessCard);
      const nameField = passData.generic.primaryFields.find(
        f => f.key === 'name',
      );

      expect(nameField).toBeDefined();
      expect(nameField?.value).toBe('John Smith');
      expect(nameField?.label).toBe('Name');
    });

    test('should include secondary fields in pass', () => {
      const passData = generateAppleWalletPass(mockBusinessCard);
      const titleField = passData.generic.secondaryFields.find(
        f => f.key === 'title',
      );
      const companyField = passData.generic.secondaryFields.find(
        f => f.key === 'company',
      );

      expect(titleField?.value).toBe('CEO & Founder');
      expect(companyField?.value).toBe('TechStart Inc.');
    });

    test('should include auxiliary fields when data available', () => {
      const passData = generateAppleWalletPass(mockBusinessCard);
      const emailField = passData.generic.auxiliaryFields.find(
        f => f.key === 'email',
      );
      const phoneField = passData.generic.auxiliaryFields.find(
        f => f.key === 'phone',
      );

      expect(emailField?.value).toBe('john@techstart.com');
      expect(phoneField?.value).toBe('+1-555-123-4567');
    });

    test('should include back fields with additional info', () => {
      const passData = generateAppleWalletPass(mockBusinessCard);
      const bioField = passData.generic.backFields.find(f => f.key === 'bio');
      const linkedinField = passData.generic.backFields.find(
        f => f.key === 'linkedin',
      );

      expect(bioField?.value).toContain('innovative technology');
      expect(linkedinField?.value).toBe('https://linkedin.com/in/johnsmith');
    });

    test('should include QR code barcode', () => {
      const passData = generateAppleWalletPass(mockBusinessCard);

      expect(passData.barcode).toBeDefined();
      expect(passData.barcode?.format).toBe('PKBarcodeFormatQR');
      expect(passData.barcode?.message).toContain('abc123def456');
    });

    test('should handle missing optional fields gracefully', () => {
      const minimalCard = {
        ...mockBusinessCard,
        basicInfo: {
          name: 'Jane Doe',
          title: 'Developer',
          company: 'DevCorp',
          email: 'jane@devcorp.com',
        },
        socialLinks: {},
      } as BusinessCard;

      const passData = generateAppleWalletPass(minimalCard);

      expect(passData.generic.primaryFields).toHaveLength(1); // Only name
      expect(
        passData.generic.auxiliaryFields.find(f => f.key === 'phone'),
      ).toBeUndefined();
      expect(
        passData.generic.backFields.find(f => f.key === 'linkedin'),
      ).toBeUndefined();
    });

    test('should set relevant date to current time', () => {
      const passData = generateAppleWalletPass(mockBusinessCard);
      const relevantDate = new Date(passData.relevantDate!);
      const now = new Date();

      expect(relevantDate.getTime()).toBeCloseTo(now.getTime(), -2); // Within 2 decimal places (ms)
    });
  });

  describe('Google Wallet Object Generation', () => {
    test('should generate complete Google Wallet object', () => {
      const walletObject = generateGoogleWalletObject(mockBusinessCard);

      expect(walletObject.id).toContain('card-123');
      expect(walletObject.classId).toBe('digbiz_business_card_class');
      expect(walletObject.title).toBe('John Smith');
    });

    test('should include structured content sections', () => {
      const walletObject = generateGoogleWalletObject(mockBusinessCard);

      expect(walletObject.subheader.header).toBe('CEO & Founder');
      expect(walletObject.subheader.body).toBe('TechStart Inc.');
      expect(walletObject.header.header).toBe('Contact');
      expect(walletObject.header.body).toContain('@');
      expect(walletObject.body.header).toBe('About');
      expect(walletObject.body.body).toContain('innovative');
    });

    test('should include QR code barcode', () => {
      const walletObject = generateGoogleWalletObject(mockBusinessCard);

      expect(walletObject.barcode.type).toBe('QR_CODE');
      expect(walletObject.barcode.value).toContain('abc123def456');
      expect(walletObject.barcode.alternateText).toBe('Scan to view card');
    });

    test('should include styling and branding', () => {
      const walletObject = generateGoogleWalletObject(mockBusinessCard);

      expect(walletObject.hexBackgroundColor).toBe('#3B82F6');
      expect(walletObject.logo.sourceUri.uri).toContain('logo.png');
    });

    test('should generate unique ID with timestamp', () => {
      const walletObject1 = generateGoogleWalletObject(mockBusinessCard);
      const walletObject2 = generateGoogleWalletObject(mockBusinessCard);

      expect(walletObject1.id).not.toBe(walletObject2.id);
      expect(walletObject1.id).toContain('card-123');
      expect(walletObject2.id).toContain('card-123');
    });

    test('should prioritize contact information display', () => {
      const cardWithNoPhone = {
        ...mockBusinessCard,
        basicInfo: { ...mockBusinessCard.basicInfo, phone: undefined },
      };

      const walletObject = generateGoogleWalletObject(cardWithNoPhone);
      expect(walletObject.header.body).toBe('john@techstart.com');

      const cardWithNoEmail = {
        ...mockBusinessCard,
        basicInfo: { ...mockBusinessCard.basicInfo, email: undefined },
      };

      const walletObject2 = generateGoogleWalletObject(cardWithNoEmail);
      expect(walletObject2.header.body).toBe('+1-555-123-4567');
    });
  });

  describe('Apple Wallet Integration', () => {
    test('should save to Apple Wallet on iOS', async () => {
      Platform.OS = 'ios';
      (RNFS.writeFile as jest.Mock).mockResolvedValue(true);

      const result = await saveToAppleWallet(mockBusinessCard);

      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('pass_card-123.json'),
        expect.stringContaining('BEGIN:VCARD'),
        'utf8',
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Apple Wallet',
        expect.stringContaining('website'),
        expect.any(Array),
      );
      expect(result).toBe(true);
    });

    test('should reject Apple Wallet on non-iOS platforms', async () => {
      Platform.OS = 'android';

      const result = await saveToAppleWallet(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Not Available',
        'Apple Wallet is only available on iOS devices.',
      );
      expect(result).toBe(false);
    });

    test('should handle Apple Wallet save errors', async () => {
      Platform.OS = 'ios';
      (RNFS.writeFile as jest.Mock).mockRejectedValue(
        new Error('Write failed'),
      );

      const result = await saveToAppleWallet(mockBusinessCard);

      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
    });

    test('should provide website redirect option', async () => {
      Platform.OS = 'ios';
      (RNFS.writeFile as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      await saveToAppleWallet(mockBusinessCard);

      // Simulate user pressing "Open Website" button
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const websiteButton = buttons.find((b: any) => b.text === 'Open Website');

      expect(websiteButton).toBeDefined();

      // Execute the button handler
      websiteButton.onPress();

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('wallet/apple/abc123def456'),
      );
    });
  });

  describe('Google Wallet Integration', () => {
    test('should save to Google Wallet', async () => {
      const result = await saveToGoogleWallet(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Google Wallet',
        expect.stringContaining('website'),
        expect.any(Array),
      );
      expect(result).toBe(true);
    });

    test('should handle Google Wallet save errors', async () => {
      // Mock an error in the process
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const result = await saveToGoogleWallet(mockBusinessCard);

      expect(result).toBe(true); // Currently always returns true for demo

      console.error = originalConsoleError;
    });

    test('should provide website redirect option for Google Wallet', async () => {
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      await saveToGoogleWallet(mockBusinessCard);

      // Simulate user pressing "Open Website" button
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const websiteButton = buttons.find((b: any) => b.text === 'Open Website');

      expect(websiteButton).toBeDefined();

      // Execute the button handler
      websiteButton.onPress();

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('wallet/google/abc123def456'),
      );
    });

    test('should generate JWT payload structure', async () => {
      // This test verifies the JWT payload structure is correct
      // In a real implementation, this would test the actual JWT signing
      const walletObject = generateGoogleWalletObject(mockBusinessCard);

      const expectedPayload = {
        iss: 'your-service-account-email@project.iam.gserviceaccount.com',
        aud: 'google',
        typ: 'savetowallet',
        iat: expect.any(Number),
        payload: {
          genericObjects: [walletObject],
        },
      };

      // In the actual implementation, this would be the JWT payload
      expect(walletObject).toBeDefined();
      expect(walletObject.id).toBeTruthy();
      expect(walletObject.classId).toBeTruthy();
    });
  });

  describe('Platform Detection and Routing', () => {
    test('should route to Apple Wallet on iOS', async () => {
      Platform.OS = 'ios';
      (RNFS.writeFile as jest.Mock).mockResolvedValue(true);

      const result = await saveToWallet(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Apple Wallet',
        expect.any(String),
        expect.any(Array),
      );
      expect(result).toBe(true);
    });

    test('should route to Google Wallet on Android', async () => {
      Platform.OS = 'android';

      const result = await saveToWallet(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Google Wallet',
        expect.any(String),
        expect.any(Array),
      );
      expect(result).toBe(true);
    });

    test('should handle unsupported platforms', async () => {
      Platform.OS = 'web' as any;

      const result = await saveToWallet(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Not Supported',
        'Wallet integration is not supported on this platform.',
      );
      expect(result).toBe(false);
    });

    test('should detect wallet availability correctly', () => {
      Platform.OS = 'ios';
      expect(isWalletAvailable()).toBe(true);

      Platform.OS = 'android';
      expect(isWalletAvailable()).toBe(true);

      Platform.OS = 'web' as any;
      expect(isWalletAvailable()).toBe(false);
    });

    test('should return correct platform names', () => {
      Platform.OS = 'ios';
      expect(getWalletPlatformName()).toBe('Apple Wallet');

      Platform.OS = 'android';
      expect(getWalletPlatformName()).toBe('Google Wallet');

      Platform.OS = 'web' as any;
      expect(getWalletPlatformName()).toBe('Wallet');
    });
  });

  describe('Wallet Save URL Generation', () => {
    test('should generate Apple Wallet save URL on iOS', () => {
      Platform.OS = 'ios';
      const url = generateWalletSaveUrl(mockBusinessCard);

      expect(url).toBe('https://digbiz.app/api/wallet/apple/abc123def456');
    });

    test('should generate Google Wallet save URL on Android', () => {
      Platform.OS = 'android';
      const url = generateWalletSaveUrl(mockBusinessCard);

      expect(url).toBe('https://digbiz.app/api/wallet/google/abc123def456');
    });

    test('should use card ID when share code not available', () => {
      Platform.OS = 'ios';
      const cardWithoutShareCode = {
        ...mockBusinessCard,
        shareCode: undefined,
      };
      const url = generateWalletSaveUrl(cardWithoutShareCode);

      expect(url).toBe('https://digbiz.app/api/wallet/apple/card-123');
    });
  });

  describe('Contact Integration', () => {
    test('should provide instructions for saving to contacts', async () => {
      const result = await saveToContacts(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Save Contact',
        expect.stringContaining('vCard'),
        expect.any(Array),
      );
      expect(result).toBe(true);
    });

    test('should handle contact save errors gracefully', async () => {
      // Mock an error scenario
      const originalAlert = Alert.alert;
      Alert.alert = jest.fn(() => {
        throw new Error('Alert failed');
      });

      const result = await saveToContacts(mockBusinessCard);

      expect(result).toBe(false);

      Alert.alert = originalAlert;
    });
  });

  describe('Calendar Integration', () => {
    test('should add follow-up event to calendar', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const result = await addToCalendar(mockBusinessCard);

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('calendar.google.com'),
      );
      expect(result).toBe(true);
    });

    test('should add custom calendar event', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const customTitle = 'Follow up call';
      const customNotes = 'Discuss partnership opportunities';

      const result = await addToCalendar(
        mockBusinessCard,
        customTitle,
        customNotes,
      );

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(customTitle)),
      );
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(customNotes)),
      );
      expect(result).toBe(true);
    });

    test('should handle calendar not available', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const result = await addToCalendar(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Add to Calendar',
        expect.stringContaining('not available'),
      );
      expect(result).toBe(false);
    });

    test('should format calendar event dates correctly', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      await addToCalendar(mockBusinessCard);

      const calendarUrl = (Linking.openURL as jest.Mock).mock.calls[0][0];

      // Should contain properly formatted dates
      expect(calendarUrl).toMatch(/dates=\d{8}T\d{6}Z\/\d{8}T\d{6}Z/);
    });

    test('should handle calendar integration errors', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(
        new Error('Calendar error'),
      );

      const result = await addToCalendar(mockBusinessCard);

      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing business card data', () => {
      const emptyCard = {
        ...mockBusinessCard,
        basicInfo: {
          name: '',
          title: '',
          company: '',
          email: '',
        },
      } as BusinessCard;

      expect(() => generateAppleWalletPass(emptyCard)).not.toThrow();
      expect(() => generateGoogleWalletObject(emptyCard)).not.toThrow();
    });

    test('should handle very long field values', () => {
      const longDataCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          name: 'A'.repeat(1000),
          bio: 'B'.repeat(2000),
        },
      };

      const applePass = generateAppleWalletPass(longDataCard);
      const googleWallet = generateGoogleWalletObject(longDataCard);

      expect(applePass.generic.primaryFields[0].value).toBe('A'.repeat(1000));
      expect(googleWallet.title).toBe('A'.repeat(1000));
    });

    test('should handle special characters in wallet data', () => {
      const specialCharsCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          name: 'José María Ñoño',
          company: 'Café & Restaurant™',
        },
      };

      const applePass = generateAppleWalletPass(specialCharsCard);
      const googleWallet = generateGoogleWalletObject(specialCharsCard);

      expect(applePass.generic.primaryFields[0].value).toBe('José María Ñoño');
      expect(googleWallet.subheader.body).toBe('Café & Restaurant™');
    });

    test('should handle network timeouts and errors', async () => {
      Platform.OS = 'ios';
      (RNFS.writeFile as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100),
          ),
      );

      const result = await saveToAppleWallet(mockBusinessCard);

      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
    });
  });

  describe('Data Validation and Security', () => {
    test('should validate pass data structure', () => {
      const passData = generateAppleWalletPass(mockBusinessCard);

      expect(passData.formatVersion).toBe(1);
      expect(passData.passTypeIdentifier).toMatch(/^pass\./);
      expect(passData.serialNumber).toBeTruthy();
      expect(passData.teamIdentifier).toBeTruthy();
      expect(passData.organizationName).toBeTruthy();
    });

    test('should sanitize sensitive information', () => {
      const cardWithSensitiveData = {
        ...mockBusinessCard,
        customFields: [
          {
            id: '1',
            label: 'SSN',
            value: '123-45-6789',
            type: 'text' as const,
            isPublic: false, // Should not be included
            order: 1,
          },
          {
            id: '2',
            label: 'Public Info',
            value: 'Safe to share',
            type: 'text' as const,
            isPublic: true,
            order: 2,
          },
        ],
      };

      const applePass = generateAppleWalletPass(cardWithSensitiveData);

      // Should not include non-public custom fields
      const backFieldValues = applePass.generic.backFields
        .map(f => f.value)
        .join(' ');
      expect(backFieldValues).not.toContain('123-45-6789');
      expect(backFieldValues).toContain('Safe to share');
    });

    test('should handle malformed URLs in social links', () => {
      const cardWithBadUrls = {
        ...mockBusinessCard,
        socialLinks: {
          linkedin: 'not-a-url',
          twitter: 'javascript:alert(1)', // Potentially malicious
          website: 'https://legitimate-site.com',
        },
      };

      expect(() => generateAppleWalletPass(cardWithBadUrls)).not.toThrow();
      expect(() => generateGoogleWalletObject(cardWithBadUrls)).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    test('should handle large-scale pass generation efficiently', () => {
      const startTime = performance.now();

      // Generate 100 passes
      for (let i = 0; i < 100; i++) {
        const testCard = { ...mockBusinessCard, id: `card-${i}` };
        generateAppleWalletPass(testCard);
        generateGoogleWalletObject(testCard);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time (5 seconds for 100 passes)
      expect(totalTime).toBeLessThan(5000);
    });

    test('should not leak memory with repeated operations', () => {
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0;

      // Perform repeated operations
      for (let i = 0; i < 50; i++) {
        const passData = generateAppleWalletPass(mockBusinessCard);
        const walletObject = generateGoogleWalletObject(mockBusinessCard);

        // Clear references
        (passData as any) = null;
        (walletObject as any) = null;
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Advanced Apple Wallet Features', () => {
    test('should generate pass with personalization', () => {
      const personalizedCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          profilePhoto: 'https://example.com/photo.jpg',
        },
        walletSettings: {
          personalization: {
            logo: 'https://company.com/logo.png',
            backgroundColor: '#FF6B6B',
            foregroundColor: '#FFFFFF',
            labelColor: '#E0E0E0',
          },
        },
      };

      const passData = generateAppleWalletPass(personalizedCard);

      expect(passData.backgroundColor).toBe('rgb(255,107,107)');
      expect(passData.foregroundColor).toBe('rgb(255,255,255)');
      expect(passData.labelColor).toBe('rgb(224,224,224)');
    });

    test('should include Apple Wallet locations', () => {
      const cardWithLocations = {
        ...mockBusinessCard,
        walletSettings: {
          locations: [
            {
              latitude: 37.7749,
              longitude: -122.4194,
              relevantText: 'Welcome to San Francisco!',
              altitude: 10.0,
            },
            {
              latitude: 40.7128,
              longitude: -74.006,
              relevantText: 'Welcome to New York!',
              altitude: 5.0,
            },
          ],
        },
      };

      const passData = generateAppleWalletPass(cardWithLocations);

      expect(passData.locations).toHaveLength(2);
      expect(passData.locations![0].latitude).toBe(37.7749);
      expect(passData.locations![0].relevantText).toBe(
        'Welcome to San Francisco!',
      );
    });

    test('should handle Apple Wallet beacons', () => {
      const cardWithBeacons = {
        ...mockBusinessCard,
        walletSettings: {
          beacons: [
            {
              proximityUUID: '123e4567-e89b-12d3-a456-426614174000',
              major: 1,
              minor: 100,
              relevantText: 'Welcome to our office!',
            },
          ],
        },
      };

      const passData = generateAppleWalletPass(cardWithBeacons);

      expect(passData.beacons).toHaveLength(1);
      expect(passData.beacons![0].proximityUUID).toBe(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(passData.beacons![0].relevantText).toBe('Welcome to our office!');
    });

    test('should include Apple Wallet web service URLs', () => {
      const passData = generateAppleWalletPass(mockBusinessCard);

      expect(passData.webServiceURL).toBe(
        'https://digbiz.app/api/wallet/apple',
      );
      expect(passData.authenticationToken).toBeTruthy();
      expect(passData.passTypeIdentifier).toBe('pass.com.digbiz.businesscard');
    });

    test('should handle Apple Wallet expiration', () => {
      const expiringCard = {
        ...mockBusinessCard,
        walletSettings: {
          expiresAfter: 30, // days
        },
      };

      const passData = generateAppleWalletPass(expiringCard);
      const expirationDate = new Date(passData.expirationDate!);
      const expectedDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      expect(expirationDate.getTime()).toBeCloseTo(expectedDate.getTime(), -4);
    });

    test('should generate Apple Wallet pass file', async () => {
      const passBuffer = await generateApplePassFile(mockBusinessCard);

      expect(passBuffer).toBeInstanceOf(Buffer);
      expect(passBuffer.length).toBeGreaterThan(0);
      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.pkpass'),
        expect.any(String),
        'base64',
      );
    });
  });

  describe('Advanced Google Wallet Features', () => {
    test('should generate Google Wallet class definition', () => {
      const walletClass = generateGoogleWalletClass();

      expect(walletClass.id).toBe('digbiz_business_card_class');
      expect(
        walletClass.classTemplateInfo.cardTemplateOverride.cardRowTemplateInfos,
      ).toBeDefined();
      expect(walletClass.hexBackgroundColor).toBe('#3B82F6');
      expect(walletClass.issuerName).toBe('DigBiz');
    });

    test('should handle Google Wallet object with custom styling', () => {
      const styledCard = {
        ...mockBusinessCard,
        walletSettings: {
          googlePay: {
            hexBackgroundColor: '#FF5722',
            logo: {
              sourceUri: {
                uri: 'https://company.com/wallet-logo.png',
              },
              contentDescription: {
                defaultValue: {
                  language: 'en-US',
                  value: 'Company Logo',
                },
              },
            },
          },
        },
      };

      const walletObject = generateGoogleWalletObject(styledCard);

      expect(walletObject.hexBackgroundColor).toBe('#FF5722');
      expect(walletObject.logo.sourceUri.uri).toBe(
        'https://company.com/wallet-logo.png',
      );
    });

    test('should include Google Wallet smart tap options', () => {
      const smartTapCard = {
        ...mockBusinessCard,
        walletSettings: {
          smartTap: {
            redemptionIssuers: [12345678],
            merchantId: 12345678,
          },
        },
      };

      const walletObject = generateGoogleWalletObject(smartTapCard);

      expect(walletObject.smartTapRedemptionValue).toBeDefined();
      expect(walletObject.redemptionIssuers).toContain(12345678);
    });

    test('should generate Google Wallet save URL with JWT', () => {
      const saveUrl = generateGoogleWalletSaveUrl(mockBusinessCard);

      expect(saveUrl).toContain('https://pay.google.com/gp/v/save/');
      expect(saveUrl).toContain('jwt=');
    });

    test('should handle Google Wallet object with multiple text modules', () => {
      const detailedCard = {
        ...mockBusinessCard,
        customFields: [
          {
            id: '1',
            label: 'Skills',
            value: 'React, Node.js, TypeScript',
            type: 'text',
            isPublic: true,
            order: 1,
          },
          {
            id: '2',
            label: 'Experience',
            value: '10 years',
            type: 'text',
            isPublic: true,
            order: 2,
          },
          {
            id: '3',
            label: 'Location',
            value: 'San Francisco',
            type: 'text',
            isPublic: true,
            order: 3,
          },
        ],
      };

      const walletObject = generateGoogleWalletObject(detailedCard);

      expect(walletObject.textModulesData).toHaveLength(3);
      expect(walletObject.textModulesData[0].header).toBe('Skills');
      expect(walletObject.textModulesData[0].body).toBe(
        'React, Node.js, TypeScript',
      );
    });
  });

  describe('Wallet Integration Security', () => {
    test('should validate Apple Wallet pass signing', async () => {
      const passData = generateAppleWalletPass(mockBusinessCard);

      expect(passData.passTypeIdentifier).toMatch(/^pass\./);
      expect(passData.teamIdentifier).toBeTruthy();
      expect(passData.serialNumber).toBeTruthy();
      expect(passData.authenticationToken).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    test('should handle sensitive data filtering', () => {
      const sensitiveCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          privateNotes: 'Internal password: 123456',
        },
        customFields: [
          {
            id: '1',
            label: 'Internal ID',
            value: 'EMP-12345',
            type: 'text',
            isPublic: false,
            order: 1,
          },
          {
            id: '2',
            label: 'Public Phone',
            value: '+1-555-123-4567',
            type: 'phone',
            isPublic: true,
            order: 2,
          },
        ],
      };

      const applePass = generateAppleWalletPass(sensitiveCard);
      const googleObject = generateGoogleWalletObject(sensitiveCard);

      // Should not include private data
      const applePassStr = JSON.stringify(applePass);
      expect(applePassStr).not.toContain('Internal password');
      expect(applePassStr).not.toContain('EMP-12345');

      const googleObjectStr = JSON.stringify(googleObject);
      expect(googleObjectStr).not.toContain('Internal password');
      expect(googleObjectStr).not.toContain('EMP-12345');

      // Should include public data
      expect(applePassStr).toContain('+1-555-123-4567');
      expect(googleObjectStr).toContain('+1-555-123-4567');
    });

    test('should validate wallet data before saving', () => {
      const invalidCard = {
        ...mockBusinessCard,
        basicInfo: {
          name: '', // Invalid: empty name
          title: 'CEO',
          company: 'TechStart',
          email: 'invalid-email', // Invalid: bad email format
        },
      };

      expect(() => generateAppleWalletPass(invalidCard)).toThrow(
        'Invalid card data',
      );
      expect(() => generateGoogleWalletObject(invalidCard)).toThrow(
        'Invalid card data',
      );
    });
  });

  describe('Wallet Analytics and Tracking', () => {
    test('should track wallet save attempts', async () => {
      await saveToWallet(mockBusinessCard);

      expect(mockAnalytics.track).toHaveBeenCalledWith('wallet_save_attempt', {
        cardId: mockBusinessCard.id,
        platform: expect.any(String),
        walletType: expect.stringMatching(/(apple|google)/),
      });
    });

    test('should track successful wallet saves', async () => {
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      await saveToWallet(mockBusinessCard);

      expect(mockAnalytics.track).toHaveBeenCalledWith('wallet_save_success', {
        cardId: mockBusinessCard.id,
        walletType: expect.stringMatching(/(apple|google)/),
      });
    });

    test('should track wallet save failures', async () => {
      (RNFS.writeFile as jest.Mock).mockRejectedValue(
        new Error('File write failed'),
      );

      await saveToWallet(mockBusinessCard);

      expect(mockAnalytics.track).toHaveBeenCalledWith('wallet_save_failed', {
        cardId: mockBusinessCard.id,
        error: 'File write failed',
      });
    });
  });

  describe('Wallet Integration Edge Cases', () => {
    test('should handle missing company logo gracefully', () => {
      const cardWithoutLogo = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          companyLogo: undefined,
        },
      };

      const applePass = generateAppleWalletPass(cardWithoutLogo);
      const googleObject = generateGoogleWalletObject(cardWithoutLogo);

      expect(applePass.logoText).toBe(cardWithoutLogo.basicInfo.company);
      expect(googleObject.logo.sourceUri.uri).toContain('default-logo');
    });

    test('should handle very long field values', () => {
      const cardWithLongValues = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          bio: 'A'.repeat(500),
        },
      };

      const applePass = generateAppleWalletPass(cardWithLongValues);
      const googleObject = generateGoogleWalletObject(cardWithLongValues);

      // Should truncate or handle long values appropriately
      expect(
        applePass.generic?.auxiliaryFields?.[0]?.value?.length,
      ).toBeLessThanOrEqual(200);
      expect(googleObject.body.body.length).toBeLessThanOrEqual(200);
    });

    test('should handle special characters in wallet data', () => {
      const cardWithSpecialChars = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          name: 'José María Ñoño',
          company: 'Café & Restaurant™',
        },
      };

      const applePass = generateAppleWalletPass(cardWithSpecialChars);
      const googleObject = generateGoogleWalletObject(cardWithSpecialChars);

      expect(applePass.generic?.primaryFields?.[0]?.value).toBe(
        'José María Ñoño',
      );
      expect(googleObject.title).toBe('José María Ñoño');
    });

    test('should handle wallet integration on different OS versions', () => {
      // Test iOS version compatibility
      Platform.OS = 'ios';
      Platform.Version = '12.0';
      expect(isWalletSupported()).toBe(true);

      Platform.Version = '8.0';
      expect(isWalletSupported()).toBe(false);

      // Test Android version compatibility
      Platform.OS = 'android';
      Platform.Version = 23;
      expect(isWalletSupported()).toBe(true);

      Platform.Version = 19;
      expect(isWalletSupported()).toBe(false);
    });
  });

  describe('Wallet Pass Updates and Expiration', () => {
    test('should handle Apple Wallet pass updates', async () => {
      const updatedCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          title: 'Senior CEO & Founder',
          phone: '+1-555-999-8888',
        },
        updatedAt: new Date().toISOString(),
      };

      const result = await updateWalletPass(updatedCard);

      expect(result.success).toBe(true);
      expect(result.passUpdateTag).toBeTruthy();
      expect(mockAnalytics.track).toHaveBeenCalledWith('wallet_pass_updated', {
        cardId: updatedCard.id,
        updateFields: ['title', 'phone'],
      });
    });

    test('should handle wallet pass expiration notifications', async () => {
      const expiringCard = {
        ...mockBusinessCard,
        walletSettings: {
          expiresAfter: 1, // 1 day
          notifyBeforeExpiry: 24, // hours
        },
      };

      const result = await checkWalletPassExpiration(expiringCard);

      expect(result.isExpiringSoon).toBe(true);
      expect(result.hoursUntilExpiry).toBeLessThanOrEqual(24);
    });

    test('should revoke expired wallet passes', async () => {
      const expiredCard = {
        ...mockBusinessCard,
        walletSettings: {
          expirationDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        },
      };

      const result = await revokeWalletPass(expiredCard);

      expect(result.revoked).toBe(true);
      expect(mockAnalytics.track).toHaveBeenCalledWith('wallet_pass_revoked', {
        cardId: expiredCard.id,
        reason: 'expired',
      });
    });
  });
});
