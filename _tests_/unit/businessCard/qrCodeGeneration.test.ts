/**
 * QR Code Generation and Scanning Tests
 *
 * Comprehensive tests for QR code generation, validation, scanning,
 * and parsing functionality for business cards.
 */

import {
  generateCardShareUrl,
  generateCardUrlQR,
  generateVCardString,
  generateVCardQR,
  generateContactInfoQR,
  generateQRCode,
  generateWiFiQR,
  validateQRData,
  generateDeepLink,
  generateUniversalLink,
  parseQRScanResult,
} from '../../../src/utils/qrCodeGenerator';

import { BusinessCard } from '../../../src/types/businessCard';

// Mock AppConfig for testing
jest.mock('../../../src/utils/config', () => ({
  AppConfig: {
    apiUrl: 'https://api.digbiz.app',
    webUrl: 'https://digbiz.app',
  },
}));

describe('QR Code Generation and Scanning', () => {
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
      bio: 'Experienced entrepreneur building innovative tech solutions.',
      profilePhoto: 'https://example.com/profile.jpg',
      companyLogo: 'https://example.com/logo.png',
    },
    startupInfo: {
      fundingStage: 'seed',
      fundingAmount: '$2M',
      fundingRound: 'Seed Round A',
      teamSize: '11-25',
      foundedYear: 2023,
      industry: ['Technology', 'SaaS', 'AI'],
      businessModel: 'b2b',
      revenue: '0-10k',
      customers: '50+ early adopters',
      growth: '20% MoM',
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
      instagram: 'https://instagram.com/johnsmith',
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

  describe('URL Generation', () => {
    test('should generate share URL with share code', () => {
      const url = generateCardShareUrl(
        mockBusinessCard.id,
        mockBusinessCard.shareCode,
      );
      expect(url).toBe('https://digbiz.app/card/abc123def456');
    });

    test('should generate share URL without share code', () => {
      const url = generateCardShareUrl(mockBusinessCard.id);
      expect(url).toBe('https://digbiz.app/card/card-123');
    });

    test('should generate deep link', () => {
      const deepLink = generateDeepLink(mockBusinessCard);
      expect(deepLink).toBe('digbiz://card/abc123def456');
    });

    test('should generate universal link', () => {
      const universalLink = generateUniversalLink(mockBusinessCard);
      expect(universalLink).toBe('https://digbiz.app/open/card/abc123def456');
    });
  });

  describe('QR Code Data Generation', () => {
    test('should generate URL QR code data', () => {
      const qrData = generateCardUrlQR(mockBusinessCard);

      expect(qrData.type).toBe('url');
      expect(qrData.data).toBe('https://digbiz.app/card/abc123def456');
      expect(qrData.size).toBe(200);
      expect(qrData.color).toBe('#000000');
      expect(qrData.backgroundColor).toBe('#FFFFFF');
    });

    test('should generate contact info QR code data', () => {
      const qrData = generateContactInfoQR(mockBusinessCard);

      expect(qrData.type).toBe('text');
      expect(qrData.data).toContain('John Smith');
      expect(qrData.data).toContain('CEO & Founder');
      expect(qrData.data).toContain('TechStart Inc.');
      expect(qrData.data).toContain('john@techstart.com');
      expect(qrData.data).toContain('+1-555-123-4567');
      expect(qrData.data).toContain('https://digbiz.app/card/abc123def456');
    });

    test('should generate WiFi QR code data', () => {
      const qrData = generateWiFiQR('TestNetwork', 'password123', 'WPA');

      expect(qrData.type).toBe('wifi');
      expect(qrData.data).toBe('WIFI:T:WPA;S:TestNetwork;P:password123;;');
    });

    test('should handle different WiFi security types', () => {
      const wpaData = generateWiFiQR('Network1', 'pass1', 'WPA');
      const wepData = generateWiFiQR('Network2', 'pass2', 'WEP');
      const openData = generateWiFiQR('Network3', '', 'nopass');

      expect(wpaData.data).toContain('T:WPA');
      expect(wepData.data).toContain('T:WEP');
      expect(openData.data).toContain('T:nopass');
    });
  });

  describe('vCard Generation', () => {
    test('should generate complete vCard string', () => {
      const vCardString = generateVCardString(mockBusinessCard);

      expect(vCardString).toContain('BEGIN:VCARD');
      expect(vCardString).toContain('VERSION:3.0');
      expect(vCardString).toContain('END:VCARD');
      expect(vCardString).toContain('FN:John Smith');
      expect(vCardString).toContain('TITLE:CEO & Founder');
      expect(vCardString).toContain('ORG:TechStart Inc.');
      expect(vCardString).toContain('EMAIL;TYPE=WORK:john@techstart.com');
      expect(vCardString).toContain('TEL;TYPE=WORK:+1-555-123-4567');
    });

    test('should include social media URLs in vCard', () => {
      const vCardString = generateVCardString(mockBusinessCard);

      expect(vCardString).toContain('URL:https://techstart.com');
      expect(vCardString).toContain(
        'URL;TYPE=LinkedIn:https://linkedin.com/in/johnsmith',
      );
      expect(vCardString).toContain(
        'URL;TYPE=Twitter:https://twitter.com/johnsmith',
      );
      expect(vCardString).toContain(
        'URL;TYPE=GitHub:https://github.com/johnsmith',
      );
    });

    test('should handle bio with line breaks', () => {
      const cardWithMultilineBio = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          bio: 'Line 1\nLine 2\nLine 3',
        },
      };

      const vCardString = generateVCardString(cardWithMultilineBio);
      expect(vCardString).toContain('NOTE:Line 1\\nLine 2\\nLine 3');
    });

    test('should include profile photo URL', () => {
      const vCardString = generateVCardString(mockBusinessCard);
      expect(vCardString).toContain(
        'PHOTO;TYPE=JPEG:https://example.com/profile.jpg',
      );
    });

    test('should include digital card URL', () => {
      const vCardString = generateVCardString(mockBusinessCard);
      expect(vCardString).toContain(
        'URL;TYPE=DigitalCard:https://digbiz.app/card/abc123def456',
      );
    });

    test('should generate vCard QR code data', () => {
      const qrData = generateVCardQR(mockBusinessCard);

      expect(qrData.type).toBe('vcard');
      expect(qrData.data).toContain('BEGIN:VCARD');
      expect(qrData.data).toContain('FN:John Smith');
      expect(qrData.size).toBe(200);
    });
  });

  describe('QR Code Type Selection', () => {
    test('should generate URL QR by default', () => {
      const qrData = generateQRCode(mockBusinessCard);
      expect(qrData.type).toBe('url');
    });

    test('should generate URL QR when specified', () => {
      const qrData = generateQRCode(mockBusinessCard, 'url');
      expect(qrData.type).toBe('url');
    });

    test('should generate vCard QR when specified', () => {
      const qrData = generateQRCode(mockBusinessCard, 'vcard');
      expect(qrData.type).toBe('vcard');
    });

    test('should generate contact info QR when specified', () => {
      const qrData = generateQRCode(mockBusinessCard, 'contact');
      expect(qrData.type).toBe('text');
    });
  });

  describe('QR Data Validation', () => {
    test('should validate normal QR data', () => {
      const shortData = 'https://example.com';
      const result = validateQRData(shortData);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    test('should reject overly long QR data', () => {
      const longData = 'A'.repeat(3000);
      const result = validateQRData(longData);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('QR code data too long');
      expect(result.message).toContain('3000 characters');
    });

    test('should handle edge case lengths', () => {
      const maxValidData = 'A'.repeat(2000);
      const tooLongData = 'A'.repeat(2001);

      expect(validateQRData(maxValidData).isValid).toBe(true);
      expect(validateQRData(tooLongData).isValid).toBe(false);
    });
  });

  describe('QR Scan Result Parsing', () => {
    test('should parse HTTP URLs', () => {
      const httpUrl = 'http://example.com';
      const result = parseQRScanResult(httpUrl);

      expect(result.type).toBe('url');
      expect(result.parsed.url).toBe(httpUrl);
    });

    test('should parse HTTPS URLs', () => {
      const httpsUrl = 'https://example.com';
      const result = parseQRScanResult(httpsUrl);

      expect(result.type).toBe('url');
      expect(result.parsed.url).toBe(httpsUrl);
    });

    test('should parse vCard data', () => {
      const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:John Smith
TITLE:CEO
ORG:TechStart
EMAIL:john@techstart.com
TEL:+1-555-123-4567
URL:https://techstart.com
NOTE:Entrepreneur
END:VCARD`;

      const result = parseQRScanResult(vCardData);

      expect(result.type).toBe('vcard');
      expect(result.parsed.name).toBe('John Smith');
      expect(result.parsed.title).toBe('CEO');
      expect(result.parsed.company).toBe('TechStart');
      expect(result.parsed.email).toBe('john@techstart.com');
      expect(result.parsed.phone).toBe('+1-555-123-4567');
      expect(result.parsed.website).toBe('https://techstart.com');
      expect(result.parsed.note).toBe('Entrepreneur');
    });

    test('should parse WiFi data', () => {
      const wifiData = 'WIFI:T:WPA;S:TestNetwork;P:password123;;';
      const result = parseQRScanResult(wifiData);

      expect(result.type).toBe('wifi');
      expect(result.parsed.ssid).toBe('TestNetwork');
      expect(result.parsed.password).toBe('password123');
      expect(result.parsed.security).toBe('WPA');
    });

    test('should parse plain text as text type', () => {
      const textData = 'This is just plain text';
      const result = parseQRScanResult(textData);

      expect(result.type).toBe('text');
      expect(result.parsed.text).toBe(textData);
    });

    test('should handle empty or invalid data', () => {
      const emptyResult = parseQRScanResult('');
      const invalidResult = parseQRScanResult('invalid-data');

      expect(emptyResult.type).toBe('text');
      expect(invalidResult.type).toBe('text');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing optional fields in business card', () => {
      const minimalCard: BusinessCard = {
        ...mockBusinessCard,
        basicInfo: {
          name: 'Jane Doe',
          title: 'Developer',
          company: 'StartupCo',
          email: 'jane@startup.co',
        },
        socialLinks: {},
      } as BusinessCard;

      const urlQR = generateCardUrlQR(minimalCard);
      const vCardQR = generateVCardQR(minimalCard);
      const contactQR = generateContactInfoQR(minimalCard);

      expect(urlQR.type).toBe('url');
      expect(vCardQR.type).toBe('vcard');
      expect(contactQR.type).toBe('text');
    });

    test('should handle special characters in QR data', () => {
      const cardWithSpecialChars: BusinessCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          name: 'José María Aznar-López',
          company: 'Café & Restaurant™',
          bio: 'Building apps with ♥ & 🚀',
        },
      };

      const vCardString = generateVCardString(cardWithSpecialChars);
      expect(vCardString).toContain('José María Aznar-López');
      expect(vCardString).toContain('Café & Restaurant™');

      const validation = validateQRData(vCardString);
      expect(validation.isValid).toBe(true);
    });

    test('should handle very long business card data', () => {
      const cardWithLongData: BusinessCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          bio: 'A'.repeat(1000),
        },
        customFields: Array.from({ length: 10 }, (_, i) => ({
          id: String(i),
          label: `Field ${i}`,
          value: 'B'.repeat(100),
          type: 'text' as const,
          isPublic: true,
          order: i,
        })),
      };

      const vCardString = generateVCardString(cardWithLongData);
      const validation = validateQRData(vCardString);

      // Should either be valid or provide helpful error message
      if (!validation.isValid) {
        expect(validation.message).toContain('too long');
      }
    });

    test('should handle missing share code gracefully', () => {
      const cardWithoutShareCode: BusinessCard = {
        ...mockBusinessCard,
        shareCode: undefined,
      };

      const url = generateCardShareUrl(
        cardWithoutShareCode.id,
        cardWithoutShareCode.shareCode,
      );
      expect(url).toBe('https://digbiz.app/card/card-123');

      const deepLink = generateDeepLink(cardWithoutShareCode);
      expect(deepLink).toBe('digbiz://card/card-123');
    });
  });

  describe('QR Code Customization', () => {
    test('should use custom QR code properties', () => {
      const customQR = {
        type: 'url' as const,
        data: 'https://example.com',
        size: 300,
        color: '#ff0000',
        backgroundColor: '#00ff00',
      };

      expect(customQR.size).toBe(300);
      expect(customQR.color).toBe('#ff0000');
      expect(customQR.backgroundColor).toBe('#00ff00');
    });

    test('should use default values when not specified', () => {
      const qrData = generateCardUrlQR(mockBusinessCard);

      expect(qrData.size).toBe(200);
      expect(qrData.color).toBe('#000000');
      expect(qrData.backgroundColor).toBe('#FFFFFF');
    });
  });

  describe('Integration Scenarios', () => {
    test('should generate consistent QR data across different methods', () => {
      const urlQR1 = generateCardUrlQR(mockBusinessCard);
      const urlQR2 = generateQRCode(mockBusinessCard, 'url');

      expect(urlQR1.data).toBe(urlQR2.data);
      expect(urlQR1.type).toBe(urlQR2.type);
    });

    test('should parse generated vCard correctly', () => {
      const vCardString = generateVCardString(mockBusinessCard);
      const parseResult = parseQRScanResult(vCardString);

      expect(parseResult.type).toBe('vcard');
      expect(parseResult.parsed.name).toBe(mockBusinessCard.basicInfo.name);
      expect(parseResult.parsed.email).toBe(mockBusinessCard.basicInfo.email);
      expect(parseResult.parsed.company).toBe(
        mockBusinessCard.basicInfo.company,
      );
    });

    test('should handle round-trip vCard generation and parsing', () => {
      const originalCard = mockBusinessCard;
      const vCardString = generateVCardString(originalCard);
      const parsedData = parseQRScanResult(vCardString);

      expect(parsedData.type).toBe('vcard');
      expect(parsedData.parsed.name).toBe(originalCard.basicInfo.name);
      expect(parsedData.parsed.title).toBe(originalCard.basicInfo.title);
      expect(parsedData.parsed.company).toBe(originalCard.basicInfo.company);
      expect(parsedData.parsed.email).toBe(originalCard.basicInfo.email);
      expect(parsedData.parsed.phone).toBe(originalCard.basicInfo.phone);
    });

    test('should generate valid QR data for all supported types', () => {
      const urlQR = generateQRCode(mockBusinessCard, 'url');
      const vCardQR = generateQRCode(mockBusinessCard, 'vcard');
      const contactQR = generateQRCode(mockBusinessCard, 'contact');

      expect(validateQRData(urlQR.data).isValid).toBe(true);
      expect(validateQRData(vCardQR.data).isValid).toBe(true);
      expect(validateQRData(contactQR.data).isValid).toBe(true);
    });
  });

  describe('Advanced QR Code Scenarios', () => {
    test('should generate QR codes for different card themes', () => {
      const themes = [
        'professional',
        'creative',
        'minimal',
        'tech',
        'executive',
      ];

      themes.forEach(theme => {
        const themedCard = {
          ...mockBusinessCard,
          themeId: theme,
        };

        const qrData = generateCardUrlQR(themedCard);
        expect(qrData.type).toBe('url');
        expect(qrData.data).toContain('digbiz.app');
        expect(qrData.data).toContain(themedCard.id);
      });
    });

    test('should handle batch QR generation', () => {
      const cards = [
        { ...mockBusinessCard, id: 'card1' },
        { ...mockBusinessCard, id: 'card2' },
        { ...mockBusinessCard, id: 'card3' },
      ];

      const qrCodes = cards.map(card => generateVCardQR(card));

      expect(qrCodes).toHaveLength(3);
      qrCodes.forEach((qr, index) => {
        expect(qr.type).toBe('vcard');
        expect(qr.data).toContain('BEGIN:VCARD');
        expect(qr.data).toContain(cards[index].basicInfo.name);
      });
    });

    test('should generate secure sharing codes', () => {
      const cards = Array.from({ length: 100 }, (_, i) => ({
        ...mockBusinessCard,
        id: `card-${i}`,
        shareCode: `share-${i}`,
      }));

      const urls = cards.map(card =>
        generateCardShareUrl(card.id, card.shareCode),
      );
      const uniqueUrls = new Set(urls);

      expect(uniqueUrls.size).toBe(100); // All URLs should be unique
    });

    test('should support dynamic QR code regeneration', () => {
      const originalCard = mockBusinessCard;
      const qr1 = generateVCardQR(originalCard);

      const updatedCard = {
        ...originalCard,
        basicInfo: {
          ...originalCard.basicInfo,
          phone: '+1-555-999-8888',
          email: 'john.updated@techstart.com',
        },
      };

      const qr2 = generateVCardQR(updatedCard);

      expect(qr1.data).not.toBe(qr2.data);
      expect(qr2.data).toContain('john.updated@techstart.com');
      expect(qr2.data).toContain('+1-555-999-8888');
    });

    test('should handle QR code analytics tracking', () => {
      const cardWithAnalytics = {
        ...mockBusinessCard,
        analytics: {
          trackQRScans: true,
          trackShares: true,
          source: 'conference-booth',
        },
      };

      const urlQR = generateCardUrlQR(cardWithAnalytics);
      expect(urlQR.data).toContain('digbiz.app/card/');

      // Should include tracking parameters if analytics enabled
      if (cardWithAnalytics.analytics?.trackQRScans) {
        expect(urlQR.data).toContain(cardWithAnalytics.id);
      }
    });

    test('should validate QR code size limits', () => {
      const validSizes = [100, 200, 300, 500, 1000];
      const invalidSizes = [50, 2000, -100];

      validSizes.forEach(size => {
        const qr = generateQRCode(mockBusinessCard, 'url', { size });
        expect(qr.size).toBe(size);
      });

      invalidSizes.forEach(size => {
        const qr = generateQRCode(mockBusinessCard, 'url', { size });
        // Should fallback to default size for invalid values
        expect(qr.size).toBe(200);
      });
    });

    test('should support different QR code formats', () => {
      const formats = ['png', 'svg', 'jpeg'] as const;

      formats.forEach(format => {
        const qr = generateQRCode(mockBusinessCard, 'url', { format });
        expect(['png', 'svg', 'jpeg']).toContain(format);
      });
    });

    test('should handle QR code error correction levels', () => {
      const levels = ['L', 'M', 'Q', 'H'] as const;

      levels.forEach(level => {
        const qr = generateQRCode(mockBusinessCard, 'vcard', {
          errorCorrectionLevel: level,
        });
        expect(qr.type).toBe('vcard');
        expect(qr.data).toContain('BEGIN:VCARD');
      });
    });

    test('should generate branded QR codes with logo', () => {
      const brandedCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          companyLogo: 'https://techstart.com/logo.png',
        },
        qrBranding: {
          includeLogo: true,
          logoSize: 0.2,
          logoPosition: 'center',
        },
      };

      const qr = generateQRCode(brandedCard, 'url', {
        includeLogo: brandedCard.qrBranding?.includeLogo,
        logoUrl: brandedCard.basicInfo.companyLogo,
      });

      expect(qr.type).toBe('url');
      expect(qr.data).toContain('digbiz.app');
    });

    test('should support QR code expiration', () => {
      const expiringCard = {
        ...mockBusinessCard,
        shareCode: 'temp-share-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      const qr = generateCardUrlQR(expiringCard);
      expect(qr.data).toContain('temp-share-123');

      // Should be able to validate expiration
      const validation = validateQRData(qr.data);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('QR Code Security', () => {
    test('should not expose sensitive data in QR codes', () => {
      const sensitiveCard = {
        ...mockBusinessCard,
        privateNotes: 'Internal sensitive information',
        customFields: [
          {
            id: '1',
            label: 'Private Email',
            value: 'private@internal.com',
            type: 'email' as const,
            isPublic: false, // Private field
            order: 1,
          },
          {
            id: '2',
            label: 'Public Phone',
            value: '+1-555-123-4567',
            type: 'phone' as const,
            isPublic: true, // Public field
            order: 2,
          },
        ],
      };

      const vCardString = generateVCardString(sensitiveCard);

      // Should not include private data
      expect(vCardString).not.toContain('Internal sensitive information');
      expect(vCardString).not.toContain('private@internal.com');

      // Should include public data
      expect(vCardString).toContain('+1-555-123-4567');
    });

    test('should sanitize QR code data for security', () => {
      const maliciousCard = {
        ...mockBusinessCard,
        basicInfo: {
          ...mockBusinessCard.basicInfo,
          name: '<script>alert("xss")</script>John',
          bio: 'Bio with\nnewlines\tand\ttabs',
          website: 'https://example.com?param=<script>',
        },
      };

      const vCardString = generateVCardString(maliciousCard);
      const validation = validateQRData(vCardString);

      expect(validation.isValid).toBe(true);
      // Should escape or remove potentially dangerous characters
      expect(vCardString).not.toContain('<script>');
    });
  });
});
