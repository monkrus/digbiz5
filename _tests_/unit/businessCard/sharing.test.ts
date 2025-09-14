/**
 * Share Functionality Tests for iOS/Android
 *
 * Comprehensive tests for business card sharing across different platforms,
 * including native share sheets, social media, messaging apps, and platform-specific features.
 */

import { Platform, Linking, Alert } from 'react-native';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

import {
  shareCard,
  shareCardNative,
  shareCardEmail,
  shareCardSMS,
  shareCardWhatsApp,
  shareCardLinkedIn,
  shareCardTwitter,
  copyCardUrl,
  saveVCard,
  getAvailableSharingMethods,
  trackSharingEvent,
  generateShareData,
} from '../../../src/utils/sharingUtils';

import { BusinessCard } from '../../../src/types/businessCard';

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(options => options.ios),
  },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock react-native-share
jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/mock/cache',
  DocumentDirectoryPath: '/mock/documents',
  DownloadDirectoryPath: '/mock/downloads',
  writeFile: jest.fn(),
  moveFile: jest.fn(),
}));

// Mock Clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  Clipboard: {
    setString: jest.fn(),
  },
}));

describe('Share Functionality', () => {
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
      bio: 'Building innovative tech solutions.',
      profilePhoto: 'https://example.com/profile.jpg',
      companyLogo: 'https://example.com/logo.png',
    },
    startupInfo: {
      fundingStage: 'seed',
      teamSize: '11-25',
      industry: ['Technology', 'SaaS'],
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
    customFields: [],
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

  describe('Share Data Generation', () => {
    test('should generate complete share data', async () => {
      const shareData = await generateShareData(mockBusinessCard);

      expect(shareData.title).toBe('John Smith - Business Card');
      expect(shareData.message).toContain('John Smith');
      expect(shareData.message).toContain('CEO & Founder');
      expect(shareData.message).toContain('TechStart Inc.');
      expect(shareData.url).toContain('card-123');
    });

    test('should generate share data with share code', async () => {
      const shareData = await generateShareData(mockBusinessCard);
      expect(shareData.url).toContain('abc123def456');
    });

    test('should create vCard file', async () => {
      const shareData = await generateShareData(mockBusinessCard);
      expect(RNFS.writeFile).toHaveBeenCalled();
      expect(shareData.vCardUri).toContain('John_Smith.vcf');
    });

    test('should handle vCard generation errors', async () => {
      (RNFS.writeFile as jest.Mock).mockRejectedValue(
        new Error('Write failed'),
      );
      const shareData = await generateShareData(mockBusinessCard);
      expect(shareData.vCardUri).toBeUndefined();
    });
  });

  describe('Native Share Sheet', () => {
    test('should open native share sheet on iOS', async () => {
      Platform.OS = 'ios';
      (Share.open as jest.Mock).mockResolvedValue({ success: true });

      const result = await shareCardNative(mockBusinessCard);

      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'John Smith - Business Card',
          message: expect.stringContaining('John Smith'),
          url: expect.stringContaining('card'),
        }),
      );
      expect(result).toBe(true);
    });

    test('should open native share sheet on Android', async () => {
      Platform.OS = 'android';
      (Share.open as jest.Mock).mockResolvedValue({ success: true });

      const result = await shareCardNative(mockBusinessCard);

      expect(Share.open).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle share cancellation', async () => {
      (Share.open as jest.Mock).mockRejectedValue(
        new Error('User did not share'),
      );

      const result = await shareCardNative(mockBusinessCard);

      expect(result).toBe(false);
      expect(Alert.alert).not.toHaveBeenCalled(); // Should not show error for user cancellation
    });

    test('should handle share errors', async () => {
      (Share.open as jest.Mock).mockRejectedValue(new Error('Share failed'));

      const result = await shareCardNative(mockBusinessCard);

      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Share Error',
        expect.any(String),
      );
    });

    test('should include custom message when provided', async () => {
      (Share.open as jest.Mock).mockResolvedValue({ success: true });
      const customMessage = 'Check out my updated business card!';

      await shareCardNative(mockBusinessCard, {
        message: customMessage,
        method: 'native',
      });

      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(customMessage),
        }),
      );
    });
  });

  describe('Email Sharing', () => {
    test('should open email with card details', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const result = await shareCardEmail(
        mockBusinessCard,
        'recipient@example.com',
      );

      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('mailto:recipient@example.com'),
      );
      expect(result).toBe(true);
    });

    test('should handle missing email app', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const result = await shareCardEmail(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Error',
        'No email app available',
      );
      expect(result).toBe(false);
    });

    test('should include custom message in email', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      const customMessage = 'Here is my business card!';

      await shareCardEmail(mockBusinessCard, undefined, customMessage);

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(customMessage)),
      );
    });

    test('should handle email sharing errors', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(
        new Error('Email failed'),
      );

      const result = await shareCardEmail(mockBusinessCard);

      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Error',
        expect.any(String),
      );
    });
  });

  describe('SMS Sharing', () => {
    test('should open SMS with card link on iOS', async () => {
      Platform.OS = 'ios';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await shareCardSMS(mockBusinessCard, '+1234567890');

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('sms:+1234567890&body='),
      );
      expect(result).toBe(true);
    });

    test('should open SMS with card link on Android', async () => {
      Platform.OS = 'android';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await shareCardSMS(mockBusinessCard, '+1234567890');

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('sms:+1234567890?body='),
      );
      expect(result).toBe(true);
    });

    test('should handle SMS not available', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const result = await shareCardSMS(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'SMS Error',
        'SMS not available',
      );
      expect(result).toBe(false);
    });

    test('should include custom message in SMS', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      const customMessage = 'My business card link';

      await shareCardSMS(mockBusinessCard, undefined, customMessage);

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(customMessage)),
      );
    });
  });

  describe('WhatsApp Sharing', () => {
    test('should open WhatsApp with card link', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await shareCardWhatsApp(mockBusinessCard);

      expect(Linking.canOpenURL).toHaveBeenCalledWith(
        expect.stringContaining('whatsapp://send?text='),
      );
      expect(Linking.openURL).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle WhatsApp not installed', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const result = await shareCardWhatsApp(mockBusinessCard);

      expect(Alert.alert).toHaveBeenCalledWith(
        'WhatsApp Error',
        'WhatsApp not installed',
      );
      expect(result).toBe(false);
    });

    test('should include custom message in WhatsApp', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      const customMessage = 'Check out my card';

      await shareCardWhatsApp(mockBusinessCard, customMessage);

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(customMessage)),
      );
    });
  });

  describe('Social Media Sharing', () => {
    test('should share to LinkedIn', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await shareCardLinkedIn(mockBusinessCard);

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing/share-offsite'),
      );
      expect(result).toBe(true);
    });

    test('should share to Twitter', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await shareCardTwitter(mockBusinessCard);

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
      );
      expect(result).toBe(true);
    });

    test('should handle social media app not available', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const linkedInResult = await shareCardLinkedIn(mockBusinessCard);
      const twitterResult = await shareCardTwitter(mockBusinessCard);

      expect(linkedInResult).toBe(false);
      expect(twitterResult).toBe(false);
      expect(Alert.alert).toHaveBeenCalledTimes(2);
    });

    test('should include custom messages for social media', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      const customMessage = 'New business card!';

      await shareCardLinkedIn(mockBusinessCard, customMessage);
      await shareCardTwitter(mockBusinessCard, customMessage);

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(customMessage)),
      );
    });
  });

  describe('Generic Share Method Routing', () => {
    test('should route to native share by default', async () => {
      (Share.open as jest.Mock).mockResolvedValue({ success: true });

      const result = await shareCard(mockBusinessCard, { method: 'native' });

      expect(Share.open).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should route to email share', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await shareCard(mockBusinessCard, { method: 'email' });

      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should route to SMS share', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await shareCard(mockBusinessCard, { method: 'sms' });

      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should route to WhatsApp share', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const result = await shareCard(mockBusinessCard, { method: 'whatsapp' });

      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should fall back to native share for unknown methods', async () => {
      (Share.open as jest.Mock).mockResolvedValue({ success: true });

      const result = await shareCard(mockBusinessCard, {
        method: 'unknown' as any,
      });

      expect(Share.open).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('URL Copying', () => {
    test('should copy card URL to clipboard', async () => {
      const { Clipboard } = require('@react-native-clipboard/clipboard');
      (Clipboard.setString as jest.Mock).mockResolvedValue(true);

      const result = await copyCardUrl(mockBusinessCard);

      expect(Clipboard.setString).toHaveBeenCalledWith(
        expect.stringContaining('abc123def456'),
      );
      expect(Alert.alert).toHaveBeenCalledWith('Copied!', expect.any(String));
      expect(result).toBe(true);
    });

    test('should handle clipboard copy failure', async () => {
      const { Clipboard } = require('@react-native-clipboard/clipboard');
      (Clipboard.setString as jest.Mock).mockRejectedValue(
        new Error('Copy failed'),
      );

      const result = await copyCardUrl(mockBusinessCard);

      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copy Error',
        expect.any(String),
      );
    });
  });

  describe('vCard Saving', () => {
    test('should save vCard on iOS', async () => {
      Platform.OS = 'ios';
      (RNFS.writeFile as jest.Mock).mockResolvedValue(true);
      (Share.open as jest.Mock).mockResolvedValue({ success: true });

      const result = await saveVCard(mockBusinessCard);

      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('John_Smith.vcf'),
        expect.stringContaining('BEGIN:VCARD'),
        'utf8',
      );
      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/vcard',
        }),
      );
      expect(result).toBe(true);
    });

    test('should save vCard on Android', async () => {
      Platform.OS = 'android';
      (RNFS.writeFile as jest.Mock).mockResolvedValue(true);

      const result = await saveVCard(mockBusinessCard);

      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('/mock/downloads/John_Smith.vcf'),
        expect.stringContaining('BEGIN:VCARD'),
        'utf8',
      );
      expect(Alert.alert).toHaveBeenCalledWith('Saved!', expect.any(String));
      expect(result).toBe(true);
    });

    test('should handle vCard save failure', async () => {
      (RNFS.writeFile as jest.Mock).mockRejectedValue(
        new Error('Write failed'),
      );

      const result = await saveVCard(mockBusinessCard);

      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Save Error',
        expect.any(String),
      );
    });

    test('should sanitize filename for vCard', async () => {
      const cardWithSpecialChars = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          name: 'José María / Aznar',
        },
      };

      await saveVCard(cardWithSpecialChars);

      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('José_María___Aznar.vcf'),
        expect.any(String),
        'utf8',
      );
    });
  });

  describe('Available Sharing Methods', () => {
    test('should return basic methods always available', async () => {
      const methods = await getAvailableSharingMethods();

      expect(methods).toContain('native');
      expect(methods).toContain('email');
      expect(methods).toContain('sms');
      expect(methods).toContain('linkedin');
      expect(methods).toContain('twitter');
    });

    test('should include WhatsApp when available', async () => {
      (Linking.canOpenURL as jest.Mock).mockImplementation((url: string) =>
        Promise.resolve(url.startsWith('whatsapp://')),
      );

      const methods = await getAvailableSharingMethods();

      expect(methods).toContain('whatsapp');
    });

    test('should exclude WhatsApp when not available', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const methods = await getAvailableSharingMethods();

      expect(methods).not.toContain('whatsapp');
    });

    test('should handle method detection errors gracefully', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(
        new Error('Detection failed'),
      );

      const methods = await getAvailableSharingMethods();

      // Should still return basic methods
      expect(methods).toContain('native');
      expect(methods).toContain('email');
      expect(methods).toContain('sms');
    });
  });

  describe('Analytics and Tracking', () => {
    test('should track sharing events', () => {
      const consoleSpy = jest.spyOn(console, 'log');

      trackSharingEvent('card-123', 'native', true);

      expect(consoleSpy).toHaveBeenCalledWith('Share event:', {
        cardId: 'card-123',
        method: 'native',
        success: true,
        timestamp: expect.any(Date),
      });

      consoleSpy.mockRestore();
    });

    test('should track failed sharing attempts', () => {
      const consoleSpy = jest.spyOn(console, 'log');

      trackSharingEvent('card-123', 'whatsapp', false);

      expect(consoleSpy).toHaveBeenCalledWith('Share event:', {
        cardId: 'card-123',
        method: 'whatsapp',
        success: false,
        timestamp: expect.any(Date),
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing card data gracefully', async () => {
      const minimalCard = {
        ...mockBusinessCard,
        basicInfo: {
          name: 'Test User',
          title: '',
          company: '',
          email: '',
        },
      } as BusinessCard;

      const result = await shareCardNative(minimalCard);

      expect(Share.open).toHaveBeenCalled();
    });

    test('should handle very long card data', async () => {
      const longCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          name: 'A'.repeat(1000),
          bio: 'B'.repeat(2000),
        },
      };

      expect(() => shareCardNative(longCard)).not.toThrow();
    });

    test('should handle special characters in sharing data', async () => {
      const specialCharsCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          name: 'José María Ñoño',
          company: 'Café & Tés™',
        },
      };

      const result = await shareCardNative(specialCharsCard);
      expect(Share.open).toHaveBeenCalled();
    });

    test('should handle network errors gracefully', async () => {
      (RNFS.writeFile as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      const shareData = await generateShareData(mockBusinessCard);
      expect(shareData.vCardUri).toBeUndefined(); // Should handle gracefully
    });
  });

  describe('Platform-Specific Behavior', () => {
    test('should use iOS-specific sharing options', async () => {
      Platform.OS = 'ios';
      (Share.open as jest.Mock).mockResolvedValue({ success: true });

      await shareCardNative(mockBusinessCard);

      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          message: expect.any(String),
          url: expect.any(String),
        }),
      );
    });

    test('should use Android-specific sharing options', async () => {
      Platform.OS = 'android';
      (Share.open as jest.Mock).mockResolvedValue({ success: true });

      await shareCardNative(mockBusinessCard);

      expect(Share.open).toHaveBeenCalled();
    });

    test('should handle platform selection for URLs', () => {
      Platform.OS = 'ios';
      Platform.select = jest.fn(options => options.ios);

      const result = Platform.select({
        ios: 'sms:123&body=test',
        android: 'sms:123?body=test',
      });

      expect(result).toBe('sms:123&body=test');
    });
  });

  describe('Advanced iOS/Android Sharing Features', () => {
    test('should handle iOS activity view controller sharing', async () => {
      Platform.OS = 'ios';
      const shareOptions = {
        title: 'Digital Business Card',
        message: 'Connect with me digitally',
        url: 'https://digbiz.app/card/abc123',
        filename: 'business-card.vcf',
        activityItemSources: [
          {
            placeholderItem: 'Business Card',
            item: {
              default: 'https://digbiz.app/card/abc123',
            },
          },
        ],
      };

      await shareCardNative(mockBusinessCard, shareOptions);

      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining(shareOptions),
      );
    });

    test('should handle Android intent sharing with MIME types', async () => {
      Platform.OS = 'android';
      const shareOptions = {
        title: 'Business Card',
        message: 'My digital business card',
        url: 'https://digbiz.app/card/abc123',
        type: 'text/x-vcard',
        filename: 'contact.vcf',
        showAppsToView: true,
      };

      await shareCardNative(mockBusinessCard, shareOptions);

      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/x-vcard',
          showAppsToView: true,
        }),
      );
    });

    test('should handle iOS AirDrop sharing', async () => {
      Platform.OS = 'ios';
      const result = await shareCardAirDrop(mockBusinessCard);

      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          excludedActivityTypes: expect.not.arrayContaining([
            'com.apple.UIKit.activity.AirDrop',
          ]),
        }),
      );
      expect(result).toBe(true);
    });

    test('should handle Android nearby sharing', async () => {
      Platform.OS = 'android';
      const result = await shareCardNearby(mockBusinessCard);

      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          showAppsToView: true,
          title: expect.stringContaining('Share via Nearby'),
        }),
      );
      expect(result).toBe(true);
    });

    test('should share to specific iOS apps', async () => {
      Platform.OS = 'ios';
      const iosApps = [
        { bundleId: 'com.apple.mobilemail', name: 'Mail' },
        { bundleId: 'com.apple.MobileSMS', name: 'Messages' },
        { bundleId: 'com.facebook.Facebook', name: 'Facebook' },
        { bundleId: 'com.linkedin.LinkedIn', name: 'LinkedIn' },
      ];

      for (const app of iosApps) {
        await shareCardToApp(mockBusinessCard, app.bundleId);
        expect(Share.open).toHaveBeenCalledWith(
          expect.objectContaining({
            activityTypes: [app.bundleId],
          }),
        );
      }
    });

    test('should share to specific Android apps', async () => {
      Platform.OS = 'android';
      const androidApps = [
        { packageName: 'com.google.android.gm', name: 'Gmail' },
        { packageName: 'com.whatsapp', name: 'WhatsApp' },
        { packageName: 'com.facebook.katana', name: 'Facebook' },
        { packageName: 'com.linkedin.android', name: 'LinkedIn' },
      ];

      for (const app of androidApps) {
        await shareCardToApp(mockBusinessCard, app.packageName);
        expect(Share.open).toHaveBeenCalledWith(
          expect.objectContaining({
            social: app.packageName,
          }),
        );
      }
    });
  });

  describe('Bulk Sharing Operations', () => {
    test('should share multiple cards at once', async () => {
      const cards = [
        { ...mockBusinessCard, id: 'card1' },
        { ...mockBusinessCard, id: 'card2' },
        { ...mockBusinessCard, id: 'card3' },
      ];

      const result = await shareMultipleCards(cards);

      expect(result.success).toBe(true);
      expect(result.sharedCount).toBe(3);
      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          urls: expect.arrayContaining([
            expect.stringContaining('card1'),
            expect.stringContaining('card2'),
            expect.stringContaining('card3'),
          ]),
        }),
      );
    });

    test('should handle team card sharing', async () => {
      const teamCards = [
        {
          ...mockBusinessCard,
          basicInfo: {
            ...mockBusinessCard.basicInfo,
            name: 'John Doe',
            title: 'CEO',
          },
        },
        {
          ...mockBusinessCard,
          basicInfo: {
            ...mockBusinessCard.basicInfo,
            name: 'Jane Smith',
            title: 'CTO',
          },
        },
        {
          ...mockBusinessCard,
          basicInfo: {
            ...mockBusinessCard.basicInfo,
            name: 'Bob Johnson',
            title: 'CFO',
          },
        },
      ];

      const result = await shareTeamCards(teamCards, {
        format: 'vcard-bundle',
        includeCompanyInfo: true,
        groupName: 'TechStart Leadership Team',
      });

      expect(result.success).toBe(true);
      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('team-cards.vcf'),
        expect.stringContaining('TechStart Leadership Team'),
        'utf8',
      );
    });
  });

  describe('Export Format Sharing', () => {
    test('should share as vCard format', async () => {
      const result = await shareCardAsVCard(mockBusinessCard);

      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.vcf'),
        expect.stringContaining('BEGIN:VCARD'),
        'utf8',
      );
      expect(result.format).toBe('vcard');
    });

    test('should share as PDF format', async () => {
      const result = await shareCardAsPDF(mockBusinessCard);

      expect(result.format).toBe('pdf');
      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('.pdf'),
          type: 'application/pdf',
        }),
      );
    });

    test('should share as image formats', async () => {
      const formats = ['png', 'jpg', 'svg'];

      for (const format of formats) {
        const result = await shareCardAsImage(mockBusinessCard, { format });
        expect(result.format).toBe(format);
        expect(Share.open).toHaveBeenCalledWith(
          expect.objectContaining({
            url: expect.stringContaining(`.${format}`),
          }),
        );
      }
    });

    test('should share as QR code image', async () => {
      const result = await shareCardQRCode(mockBusinessCard, {
        size: 512,
        format: 'png',
        includeText: true,
      });

      expect(result.success).toBe(true);
      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('qr-code.png'),
          type: 'image/png',
        }),
      );
    });
  });

  describe('Analytics and Tracking', () => {
    test('should track sharing events', async () => {
      const analyticsTracker = jest.fn();
      await shareCardNative(mockBusinessCard, { analytics: analyticsTracker });

      expect(analyticsTracker).toHaveBeenCalledWith('card_shared', {
        cardId: mockBusinessCard.id,
        method: 'native_share',
        platform: expect.any(String),
        timestamp: expect.any(Number),
      });
    });

    test('should track successful shares', async () => {
      (Share.open as jest.Mock).mockResolvedValue({
        success: true,
        activityType: 'com.apple.mobilemail',
      });

      const result = await shareCardEmail(mockBusinessCard);

      expect(mockAnalytics.track).toHaveBeenCalledWith('share_success', {
        cardId: mockBusinessCard.id,
        method: 'email',
        activityType: 'com.apple.mobilemail',
      });
    });

    test('should track failed shares', async () => {
      (Share.open as jest.Mock).mockRejectedValue(new Error('User cancelled'));

      const result = await shareCardNative(mockBusinessCard);

      expect(mockAnalytics.track).toHaveBeenCalledWith('share_failed', {
        cardId: mockBusinessCard.id,
        error: 'User cancelled',
      });
    });

    test('should generate share analytics report', () => {
      const shareEvents = [
        { method: 'email', success: true, timestamp: Date.now() },
        { method: 'sms', success: true, timestamp: Date.now() },
        { method: 'whatsapp', success: false, timestamp: Date.now() },
      ];

      const report = generateShareAnalytics(mockBusinessCard.id, shareEvents);

      expect(report.totalShares).toBe(3);
      expect(report.successRate).toBe(66.67);
      expect(report.topMethods).toEqual(['email', 'sms']);
    });
  });

  describe('Security and Privacy', () => {
    test('should handle private card sharing restrictions', async () => {
      const privateCard = {
        ...mockBusinessCard,
        isPublic: false,
        shareSettings: {
          requirePassword: true,
          allowedDomains: ['company.com'],
          expiresAfter: 24, // hours
        },
      };

      const result = await shareCardNative(privateCard);

      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('password-protected'),
        }),
      );
    });

    test('should sanitize sharing data', async () => {
      const unsafeCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          name: '<script>alert("xss")</script>John',
          bio: 'Bio with\nnewlines\tand\ttabs',
        },
      };

      const shareData = await generateShareData(unsafeCard);

      expect(shareData.message).not.toContain('<script>');
      expect(shareData.title).not.toContain('<script>');
    });

    test('should handle GDPR compliance for sharing', async () => {
      const gdprCard = {
        ...mockBusinessCard,
        privacy: {
          gdprCompliant: true,
          consentRequired: true,
          dataRetentionDays: 30,
        },
      };

      const result = await shareCardWithConsent(gdprCard, {
        userConsent: true,
        consentTimestamp: Date.now(),
      });

      expect(result.success).toBe(true);
      expect(mockAnalytics.track).toHaveBeenCalledWith('gdpr_share_consent', {
        cardId: gdprCard.id,
        consentGiven: true,
      });
    });
  });

  describe('Offline and Connectivity', () => {
    test('should handle offline sharing', async () => {
      // Mock offline state
      (
        require('@react-native-community/netinfo').NetInfo.fetch as jest.Mock
      ).mockResolvedValue({
        isConnected: false,
      });

      const result = await shareCardOffline(mockBusinessCard);

      expect(result.success).toBe(true);
      expect(result.method).toBe('local_storage');
      expect(RNFS.writeFile).toHaveBeenCalled();
    });

    test('should queue shares for when online', async () => {
      const queuedShare = {
        cardId: mockBusinessCard.id,
        method: 'email',
        recipient: 'test@example.com',
        timestamp: Date.now(),
      };

      await queueShareForLater(queuedShare);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_shares',
        expect.stringContaining(queuedShare.cardId),
      );
    });

    test('should process queued shares when online', async () => {
      const pendingShares = [
        { cardId: 'card1', method: 'email', recipient: 'test1@example.com' },
        { cardId: 'card2', method: 'sms', recipient: '+1234567890' },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(pendingShares),
      );

      const result = await processQueuedShares();

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
    });
  });
});
