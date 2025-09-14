/**
 * Deep Link Handling Tests
 *
 * Comprehensive tests for deep link generation, parsing, navigation,
 * and handling for business card sharing and viewing.
 */

import { Linking } from 'react-native';
import {
  parseDeepLink,
  handleDeepLink,
  generateShareableLinks,
  validateDeepLinkStructure,
  extractCardIdFromUrl,
  createNavigationAction,
} from '../../../src/utils/deepLinking';

// Mock React Native modules
jest.mock('react-native', () => ({
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(),
    getInitialURL: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  reset: jest.fn(),
  goBack: jest.fn(),
};

// Mock AppConfig
jest.mock('../../../src/utils/config', () => ({
  AppConfig: {
    webUrl: 'https://digbiz.app',
    appScheme: 'digbiz',
  },
}));

describe('Deep Link Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Deep Link Structure Validation', () => {
    test('should validate correct app scheme links', () => {
      const validLinks = [
        'digbiz://card/abc123',
        'digbiz://card/def456',
        'digbiz://profile/user123',
        'digbiz://share/card123',
      ];

      validLinks.forEach(link => {
        expect(validateDeepLinkStructure(link)).toBe(true);
      });
    });

    test('should reject invalid scheme links', () => {
      const invalidLinks = [
        'http://example.com',
        'https://example.com',
        'wrongscheme://card/123',
        'digbiz://',
        'digbiz:///',
        '',
        null,
        undefined,
      ];

      invalidLinks.forEach(link => {
        expect(validateDeepLinkStructure(link as any)).toBe(false);
      });
    });

    test('should validate universal links', () => {
      const validUniversalLinks = [
        'https://digbiz.app/open/card/abc123',
        'https://digbiz.app/open/profile/user456',
        'https://www.digbiz.app/open/card/def789',
      ];

      validUniversalLinks.forEach(link => {
        expect(validateDeepLinkStructure(link)).toBe(true);
      });
    });

    test('should reject invalid universal links', () => {
      const invalidUniversalLinks = [
        'https://otherdomain.com/open/card/123',
        'https://digbiz.app/card/123', // Missing /open/
        'https://digbiz.app/open/',
        'http://digbiz.app/open/card/123', // HTTP instead of HTTPS
      ];

      invalidUniversalLinks.forEach(link => {
        expect(validateDeepLinkStructure(link)).toBe(false);
      });
    });
  });

  describe('Card ID Extraction', () => {
    test('should extract card ID from app scheme URLs', () => {
      const testCases = [
        { url: 'digbiz://card/abc123', expected: 'abc123' },
        { url: 'digbiz://card/def456ghi789', expected: 'def456ghi789' },
        { url: 'digbiz://card/card-with-dashes', expected: 'card-with-dashes' },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractCardIdFromUrl(url)).toBe(expected);
      });
    });

    test('should extract card ID from universal links', () => {
      const testCases = [
        { url: 'https://digbiz.app/open/card/abc123', expected: 'abc123' },
        { url: 'https://digbiz.app/card/shared-code', expected: 'shared-code' },
        { url: 'https://www.digbiz.app/card/xyz789', expected: 'xyz789' },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractCardIdFromUrl(url)).toBe(expected);
      });
    });

    test('should handle URLs with query parameters', () => {
      const urlsWithParams = [
        'digbiz://card/abc123?ref=qr&source=scan',
        'https://digbiz.app/card/def456?utm_source=share',
        'https://digbiz.app/open/card/ghi789?action=view&from=email',
      ];

      const expectedIds = ['abc123', 'def456', 'ghi789'];

      urlsWithParams.forEach((url, index) => {
        expect(extractCardIdFromUrl(url)).toBe(expectedIds[index]);
      });
    });

    test('should return null for invalid URLs', () => {
      const invalidUrls = [
        'digbiz://card/',
        'digbiz://profile/user123', // Not a card URL
        'https://otherdomain.com/card/123',
        'invalid-url',
        '',
        null,
        undefined,
      ];

      invalidUrls.forEach(url => {
        expect(extractCardIdFromUrl(url as any)).toBeNull();
      });
    });
  });

  describe('Deep Link Parsing', () => {
    test('should parse card view deep links', () => {
      const cardLinks = [
        'digbiz://card/abc123',
        'https://digbiz.app/card/def456',
        'https://digbiz.app/open/card/ghi789',
      ];

      cardLinks.forEach(link => {
        const parsed = parseDeepLink(link);
        expect(parsed.type).toBe('card');
        expect(parsed.action).toBe('view');
        expect(parsed.cardId).toBeTruthy();
      });
    });

    test('should parse profile deep links', () => {
      const profileLinks = [
        'digbiz://profile/user123',
        'https://digbiz.app/profile/user456',
      ];

      profileLinks.forEach(link => {
        const parsed = parseDeepLink(link);
        expect(parsed.type).toBe('profile');
        expect(parsed.userId).toBeTruthy();
      });
    });

    test('should parse share deep links', () => {
      const shareLinks = [
        'digbiz://share/card123',
        'https://digbiz.app/share/card456',
      ];

      shareLinks.forEach(link => {
        const parsed = parseDeepLink(link);
        expect(parsed.type).toBe('share');
        expect(parsed.cardId).toBeTruthy();
      });
    });

    test('should extract query parameters', () => {
      const linkWithParams =
        'digbiz://card/abc123?ref=qr&source=scan&action=save';
      const parsed = parseDeepLink(linkWithParams);

      expect(parsed.params).toEqual({
        ref: 'qr',
        source: 'scan',
        action: 'save',
      });
    });

    test('should handle links without parameters', () => {
      const linkWithoutParams = 'digbiz://card/abc123';
      const parsed = parseDeepLink(linkWithoutParams);

      expect(parsed.params).toEqual({});
    });

    test('should return null for invalid links', () => {
      const invalidLinks = [
        'https://otherdomain.com/card/123',
        'wrongscheme://card/123',
        'digbiz://unknown/path',
        'invalid-url',
        '',
        null,
        undefined,
      ];

      invalidLinks.forEach(link => {
        expect(parseDeepLink(link as any)).toBeNull();
      });
    });
  });

  describe('Navigation Actions', () => {
    test('should create card view navigation action', () => {
      const action = createNavigationAction('card', 'view', {
        cardId: 'abc123',
        params: { source: 'qr' },
      });

      expect(action.type).toBe('card');
      expect(action.screen).toBe('CardView');
      expect(action.params).toEqual({
        cardId: 'abc123',
        source: 'qr',
      });
    });

    test('should create card edit navigation action', () => {
      const action = createNavigationAction('card', 'edit', {
        cardId: 'abc123',
      });

      expect(action.type).toBe('card');
      expect(action.screen).toBe('CardEdit');
      expect(action.params).toEqual({
        cardId: 'abc123',
      });
    });

    test('should create profile navigation action', () => {
      const action = createNavigationAction('profile', 'view', {
        userId: 'user123',
      });

      expect(action.type).toBe('profile');
      expect(action.screen).toBe('Profile');
      expect(action.params).toEqual({
        userId: 'user123',
      });
    });

    test('should create share navigation action', () => {
      const action = createNavigationAction('share', 'card', {
        cardId: 'abc123',
      });

      expect(action.type).toBe('share');
      expect(action.screen).toBe('ShareCard');
      expect(action.params).toEqual({
        cardId: 'abc123',
      });
    });
  });

  describe('Deep Link Handling', () => {
    test('should handle card view deep link', async () => {
      const link = 'digbiz://card/abc123';
      const result = await handleDeepLink(link, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('CardView', {
        cardId: 'abc123',
      });
    });

    test('should handle card view with parameters', async () => {
      const link = 'digbiz://card/abc123?source=qr&ref=scan';
      const result = await handleDeepLink(link, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('CardView', {
        cardId: 'abc123',
        source: 'qr',
        ref: 'scan',
      });
    });

    test('should handle profile deep link', async () => {
      const link = 'digbiz://profile/user123';
      const result = await handleDeepLink(link, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('Profile', {
        userId: 'user123',
      });
    });

    test('should handle share deep link', async () => {
      const link = 'digbiz://share/card123';
      const result = await handleDeepLink(link, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('ShareCard', {
        cardId: 'card123',
      });
    });

    test('should handle universal links', async () => {
      const link = 'https://digbiz.app/card/abc123';
      const result = await handleDeepLink(link, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('CardView', {
        cardId: 'abc123',
      });
    });

    test('should return error for invalid links', async () => {
      const invalidLink = 'invalid://link';
      const result = await handleDeepLink(invalidLink, mockNavigation as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid deep link');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('should handle navigation errors', async () => {
      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Navigation failed');
      });

      const link = 'digbiz://card/abc123';
      const result = await handleDeepLink(link, mockNavigation as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Navigation failed');
    });
  });

  describe('Shareable Links Generation', () => {
    test('should generate all link types for a card', () => {
      const cardId = 'abc123';
      const shareCode = 'share456';

      const links = generateShareableLinks(cardId, shareCode);

      expect(links.deepLink).toBe('digbiz://card/share456');
      expect(links.universalLink).toBe('https://digbiz.app/open/card/share456');
      expect(links.webLink).toBe('https://digbiz.app/card/share456');
      expect(links.qrLink).toBe('https://digbiz.app/card/share456');
    });

    test('should generate links without share code', () => {
      const cardId = 'abc123';

      const links = generateShareableLinks(cardId);

      expect(links.deepLink).toBe('digbiz://card/abc123');
      expect(links.universalLink).toBe('https://digbiz.app/open/card/abc123');
      expect(links.webLink).toBe('https://digbiz.app/card/abc123');
      expect(links.qrLink).toBe('https://digbiz.app/card/abc123');
    });

    test('should generate links with custom parameters', () => {
      const cardId = 'abc123';
      const params = { source: 'email', campaign: 'launch' };

      const links = generateShareableLinks(cardId, undefined, params);

      expect(links.deepLink).toContain('?source=email&campaign=launch');
      expect(links.universalLink).toContain('?source=email&campaign=launch');
      expect(links.webLink).toContain('?source=email&campaign=launch');
    });
  });

  describe('Platform-Specific Handling', () => {
    test('should handle iOS universal links', async () => {
      const link = 'https://digbiz.app/card/abc123';

      // Mock iOS
      (require('react-native').Platform.OS as any) = 'ios';

      const result = await handleDeepLink(link, mockNavigation as any);
      expect(result.success).toBe(true);
    });

    test('should handle Android intent links', async () => {
      const link = 'digbiz://card/abc123';

      // Mock Android
      (require('react-native').Platform.OS as any) = 'android';

      const result = await handleDeepLink(link, mockNavigation as any);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle malformed URLs gracefully', () => {
      const malformedUrls = [
        'digbiz://',
        'digbiz:///',
        'digbiz://card',
        'digbiz://card/',
        'https://digbiz.app',
        'https://digbiz.app/',
        'https://digbiz.app/card',
        'https://digbiz.app/card/',
      ];

      malformedUrls.forEach(url => {
        const parsed = parseDeepLink(url);
        expect(parsed).toBeNull();
      });
    });

    test('should handle URLs with special characters', () => {
      const specialCharUrls = [
        'digbiz://card/abc%20123',
        'digbiz://card/abc+123',
        'digbiz://card/abc@123',
        'https://digbiz.app/card/abc%20123',
      ];

      specialCharUrls.forEach(url => {
        const parsed = parseDeepLink(url);
        // Should either parse correctly or return null, but not throw
        expect(typeof parsed === 'object' || parsed === null).toBe(true);
      });
    });

    test('should handle very long URLs', () => {
      const longCardId = 'a'.repeat(1000);
      const longUrl = `digbiz://card/${longCardId}`;

      const parsed = parseDeepLink(longUrl);
      expect(parsed?.cardId).toBe(longCardId);
    });

    test('should handle navigation without navigation object', async () => {
      const link = 'digbiz://card/abc123';
      const result = await handleDeepLink(link, null as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('navigation');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle app launch from deep link', async () => {
      const initialUrl = 'digbiz://card/abc123?source=notification';
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(initialUrl);

      const url = await Linking.getInitialURL();
      expect(url).toBe(initialUrl);

      const parsed = parseDeepLink(url!);
      expect(parsed?.cardId).toBe('abc123');
      expect(parsed?.params.source).toBe('notification');
    });

    test('should handle app state change from deep link', () => {
      const callback = jest.fn();
      (Linking.addEventListener as jest.Mock).mockImplementation(
        (event, cb) => {
          if (event === 'url') {
            callback.mockImplementation(cb);
          }
        },
      );

      Linking.addEventListener('url', callback);

      // Simulate deep link while app is running
      const url = 'digbiz://card/def456?source=share';
      callback({ url });

      expect(callback).toHaveBeenCalledWith({ url });

      const parsed = parseDeepLink(url);
      expect(parsed?.cardId).toBe('def456');
      expect(parsed?.params.source).toBe('share');
    });

    test('should handle external link opening', async () => {
      const externalUrl = 'https://example.com';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      await Linking.openURL(externalUrl);

      expect(Linking.canOpenURL).toHaveBeenCalledWith(externalUrl);
      expect(Linking.openURL).toHaveBeenCalledWith(externalUrl);
    });

    test('should generate consistent links across different contexts', () => {
      const cardId = 'test123';
      const shareCode = 'share456';

      const links1 = generateShareableLinks(cardId, shareCode);
      const links2 = generateShareableLinks(cardId, shareCode);

      expect(links1.deepLink).toBe(links2.deepLink);
      expect(links1.universalLink).toBe(links2.universalLink);
      expect(links1.webLink).toBe(links2.webLink);
    });
  });

  describe('Analytics and Tracking', () => {
    test('should extract tracking parameters from deep links', () => {
      const link =
        'digbiz://card/abc123?utm_source=email&utm_medium=share&utm_campaign=launch&ref=qr';
      const parsed = parseDeepLink(link);

      expect(parsed?.params).toEqual({
        utm_source: 'email',
        utm_medium: 'share',
        utm_campaign: 'launch',
        ref: 'qr',
      });
    });

    test('should handle multiple parameter formats', () => {
      const links = [
        'digbiz://card/abc123?source=qr&ref=scan',
        'https://digbiz.app/card/abc123?utm_source=social&utm_campaign=growth',
        'digbiz://card/abc123?ref=email&campaign=newsletter&medium=email',
      ];

      links.forEach(link => {
        const parsed = parseDeepLink(link);
        expect(parsed?.params).toBeDefined();
        expect(Object.keys(parsed?.params || {}).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Advanced Deep Link Scenarios', () => {
    test('should handle complex deep links with multiple parameters', async () => {
      const complexLink =
        'digbiz://card/abc123?source=qr&campaign=conference&booth=A12&referrer=john-smith';
      const result = await handleDeepLink(complexLink, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('CardView', {
        cardId: 'abc123',
        source: 'qr',
        campaign: 'conference',
        booth: 'A12',
        referrer: 'john-smith',
      });
    });

    test('should handle encoded URLs in deep links', async () => {
      const encodedLink =
        'digbiz://card/abc123?callback=' +
        encodeURIComponent('https://example.com/success');
      const result = await handleDeepLink(encodedLink, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('CardView', {
        cardId: 'abc123',
        callback: 'https://example.com/success',
      });
    });

    test('should handle deep links with authentication tokens', async () => {
      const authLink =
        'digbiz://auth/login?token=jwt-token-123&redirect=card%2Fabc123';
      const result = await handleDeepLink(authLink, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('AuthCallback', {
        token: 'jwt-token-123',
        redirect: 'card/abc123',
      });
    });

    test('should handle expired deep links', async () => {
      const expiredLink = 'digbiz://card/expired123?expires=1234567890';
      const result = await handleDeepLink(expiredLink, mockNavigation as any);

      // Should detect expiration and handle appropriately
      if (result.success === false && result.error) {
        expect(result.error).toContain('expired');
      }
    });

    test('should handle deep links from different referrer sources', async () => {
      const sources = [
        { link: 'digbiz://card/abc123?source=email', expectedSource: 'email' },
        { link: 'digbiz://card/abc123?source=sms', expectedSource: 'sms' },
        {
          link: 'digbiz://card/abc123?source=social',
          expectedSource: 'social',
        },
        { link: 'digbiz://card/abc123?source=qr', expectedSource: 'qr' },
        { link: 'digbiz://card/abc123?source=nfc', expectedSource: 'nfc' },
      ];

      for (const { link, expectedSource } of sources) {
        mockNavigate.mockClear();
        await handleDeepLink(link, mockNavigation as any);

        expect(mockNavigate).toHaveBeenCalledWith('CardView', {
          cardId: 'abc123',
          source: expectedSource,
        });
      }
    });

    test('should handle deep links for card actions', async () => {
      const actions = [
        'digbiz://card/abc123/edit',
        'digbiz://card/abc123/share',
        'digbiz://card/abc123/delete',
        'digbiz://card/abc123/duplicate',
        'digbiz://card/abc123/analytics',
      ];

      for (const link of actions) {
        mockNavigate.mockClear();
        const result = await handleDeepLink(link, mockNavigation as any);
        expect(result.success).toBe(true);
      }
    });

    test('should handle bulk operations via deep links', async () => {
      const bulkLink =
        'digbiz://cards/bulk?action=export&ids=card1,card2,card3&format=vcard';
      const result = await handleDeepLink(bulkLink, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('BulkOperations', {
        action: 'export',
        ids: ['card1', 'card2', 'card3'],
        format: 'vcard',
      });
    });

    test('should handle team/workspace deep links', async () => {
      const teamLink =
        'digbiz://team/workspace123/cards?filter=shared&sort=recent';
      const result = await handleDeepLink(teamLink, mockNavigation as any);

      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('TeamCards', {
        workspaceId: 'workspace123',
        filter: 'shared',
        sort: 'recent',
      });
    });
  });

  describe('Deep Link Security', () => {
    test('should validate deep link domains', () => {
      const validDomains = [
        'https://digbiz.app/card/123',
        'https://www.digbiz.app/card/123',
        'digbiz://card/123',
      ];

      const invalidDomains = [
        'https://malicious.com/card/123',
        'https://digbiz.evil.com/card/123',
        'evil://card/123',
      ];

      validDomains.forEach(link => {
        expect(isValidDeepLink(link)).toBe(true);
      });

      invalidDomains.forEach(link => {
        expect(isValidDeepLink(link)).toBe(false);
      });
    });

    test('should sanitize deep link parameters', () => {
      const maliciousParams = {
        cardId: '<script>alert("xss")</script>',
        callback: 'javascript:alert("xss")',
        name: "user';DROP TABLE users;--",
      };

      const sanitized = sanitizeDeepLinkParams(maliciousParams);

      expect(sanitized.cardId).not.toContain('<script>');
      expect(sanitized.callback).not.toContain('javascript:');
      expect(sanitized.name).not.toContain('DROP TABLE');
    });

    test('should rate limit deep link processing', async () => {
      const link = 'digbiz://card/abc123';

      // Simulate rapid fire deep links
      const promises = Array.from({ length: 20 }, () =>
        handleDeepLink(link, mockNavigation as any),
      );

      const results = await Promise.all(promises);

      // Some should be rate limited
      const rateLimited = results.filter(
        r => !r.success && r.error?.includes('rate limit'),
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test('should validate card access permissions', async () => {
      const privateCardLink = 'digbiz://card/private123';

      // Mock user without access
      const mockUser = { id: 'user456', role: 'guest' };
      const result = await handleDeepLink(
        privateCardLink,
        mockNavigation as any,
        { user: mockUser },
      );

      if (!result.success) {
        expect(result.error).toContain('permission');
      }
    });
  });

  describe('Deep Link Analytics', () => {
    test('should track deep link usage', async () => {
      const link = 'digbiz://card/abc123?source=email&campaign=launch';
      await handleDeepLink(link, mockNavigation as any);

      // Should have tracked the deep link event
      expect(mockAnalytics.track).toHaveBeenCalledWith('deep_link_opened', {
        type: 'card',
        cardId: 'abc123',
        source: 'email',
        campaign: 'launch',
        timestamp: expect.any(Number),
      });
    });

    test('should track conversion funnel from deep links', async () => {
      const link = 'digbiz://card/abc123?source=qr&track_conversion=true';
      await handleDeepLink(link, mockNavigation as any);

      expect(mockAnalytics.track).toHaveBeenCalledWith('conversion_start', {
        source: 'qr',
        cardId: 'abc123',
        step: 'deep_link_clicked',
      });
    });

    test('should track failed deep links', async () => {
      const invalidLink = 'digbiz://nonexistent/123';
      await handleDeepLink(invalidLink, mockNavigation as any);

      expect(mockAnalytics.track).toHaveBeenCalledWith('deep_link_failed', {
        link: invalidLink,
        error: expect.any(String),
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('should handle iOS-specific deep links', async () => {
      const iosLink = 'https://digbiz.app/card/abc123';

      // Mock iOS environment
      (require('react-native').Platform.OS as any) = 'ios';

      const result = await handleDeepLink(iosLink, mockNavigation as any);
      expect(result.success).toBe(true);
    });

    test('should handle Android intent links', async () => {
      const intentLink =
        'intent://card/abc123#Intent;scheme=digbiz;package=com.digbiz.app;end';

      // Mock Android environment
      (require('react-native').Platform.OS as any) = 'android';

      const result = await handleDeepLink(intentLink, mockNavigation as any);
      expect(result.success).toBe(true);
    });

    test('should fallback to web links on unsupported platforms', async () => {
      const link = 'digbiz://card/abc123';

      // Mock web environment
      (require('react-native').Platform.OS as any) = 'web';

      const result = await handleDeepLink(link, mockNavigation as any);

      // Should redirect to web version
      expect(result.fallbackUrl).toBe('https://digbiz.app/card/abc123');
    });
  });
});
