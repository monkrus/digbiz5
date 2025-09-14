/**
 * QR Code Generation Utilities
 *
 * This utility provides functions for generating QR codes for business cards,
 * including URLs, vCard data, and contact information.
 */

import { BusinessCard } from '../types/businessCard';
import { AppConfig } from './config';

export interface QRCodeData {
  type: 'url' | 'vcard' | 'wifi' | 'text';
  data: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export interface VCardData {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  note?: string;
}

/**
 * Generate a shareable URL for a business card
 */
export const generateCardShareUrl = (
  cardId: string,
  shareCode?: string,
): string => {
  const baseUrl = AppConfig.webUrl || 'https://digbiz.app';
  if (shareCode) {
    return `${baseUrl}/card/${shareCode}`;
  }
  return `${baseUrl}/card/${cardId}`;
};

/**
 * Generate QR code data for a business card URL
 */
export const generateCardUrlQR = (card: BusinessCard): QRCodeData => {
  const shareUrl = generateCardShareUrl(card.id, card.shareCode);

  return {
    type: 'url',
    data: shareUrl,
    size: 200,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  };
};

/**
 * Generate vCard format string from business card data
 */
export const generateVCardString = (card: BusinessCard): string => {
  const { basicInfo, socialLinks } = card;

  let vcard = 'BEGIN:VCARD\n';
  vcard += 'VERSION:3.0\n';

  // Name (required)
  vcard += `FN:${basicInfo.name}\n`;
  vcard += `N:${basicInfo.name};;;;\n`;

  // Title and Organization
  if (basicInfo.title) {
    vcard += `TITLE:${basicInfo.title}\n`;
  }
  if (basicInfo.company) {
    vcard += `ORG:${basicInfo.company}\n`;
  }

  // Contact Information
  if (basicInfo.email) {
    vcard += `EMAIL;TYPE=WORK:${basicInfo.email}\n`;
  }
  if (basicInfo.phone) {
    vcard += `TEL;TYPE=WORK:${basicInfo.phone}\n`;
  }

  // Address
  if (basicInfo.location) {
    vcard += `ADR;TYPE=WORK:;;${basicInfo.location};;;;\n`;
  }

  // Website
  if (socialLinks.website) {
    vcard += `URL:${socialLinks.website}\n`;
  }

  // Social Media URLs
  if (socialLinks.linkedin) {
    vcard += `URL;TYPE=LinkedIn:${socialLinks.linkedin}\n`;
  }
  if (socialLinks.twitter) {
    vcard += `URL;TYPE=Twitter:${socialLinks.twitter}\n`;
  }
  if (socialLinks.github) {
    vcard += `URL;TYPE=GitHub:${socialLinks.github}\n`;
  }

  // Note/Bio
  if (basicInfo.bio) {
    vcard += `NOTE:${basicInfo.bio.replace(/\n/g, '\\n')}\n`;
  }

  // Profile photo URL
  if (basicInfo.profilePhoto) {
    vcard += `PHOTO;TYPE=JPEG:${basicInfo.profilePhoto}\n`;
  }

  // Card share URL
  const shareUrl = generateCardShareUrl(card.id, card.shareCode);
  vcard += `URL;TYPE=DigitalCard:${shareUrl}\n`;

  vcard += 'END:VCARD';

  return vcard;
};

/**
 * Generate QR code data for vCard
 */
export const generateVCardQR = (card: BusinessCard): QRCodeData => {
  const vCardString = generateVCardString(card);

  return {
    type: 'vcard',
    data: vCardString,
    size: 200,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  };
};

/**
 * Generate QR code data for contact info text
 */
export const generateContactInfoQR = (card: BusinessCard): QRCodeData => {
  const { basicInfo } = card;

  let contactInfo = `${basicInfo.name}\n`;
  if (basicInfo.title) contactInfo += `${basicInfo.title}\n`;
  if (basicInfo.company) contactInfo += `${basicInfo.company}\n`;
  if (basicInfo.email) contactInfo += `📧 ${basicInfo.email}\n`;
  if (basicInfo.phone) contactInfo += `📞 ${basicInfo.phone}\n`;

  const shareUrl = generateCardShareUrl(card.id, card.shareCode);
  contactInfo += `🔗 ${shareUrl}`;

  return {
    type: 'text',
    data: contactInfo,
    size: 200,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  };
};

/**
 * Generate QR code data based on preferred type
 */
export const generateQRCode = (
  card: BusinessCard,
  type: 'url' | 'vcard' | 'contact' = 'url',
): QRCodeData => {
  switch (type) {
    case 'vcard':
      return generateVCardQR(card);
    case 'contact':
      return generateContactInfoQR(card);
    case 'url':
    default:
      return generateCardUrlQR(card);
  }
};

/**
 * Generate WiFi QR code data
 */
export const generateWiFiQR = (
  ssid: string,
  password: string,
  security: 'WPA' | 'WEP' | 'nopass' = 'WPA',
): QRCodeData => {
  const wifiString = `WIFI:T:${security};S:${ssid};P:${password};;`;

  return {
    type: 'wifi',
    data: wifiString,
    size: 200,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  };
};

/**
 * Validate QR code data size
 */
export const validateQRData = (
  data: string,
): { isValid: boolean; message?: string } => {
  // QR code capacity limits (approximate)
  const maxLength = 2000; // Conservative limit for mobile scanning

  if (data.length > maxLength) {
    return {
      isValid: false,
      message: `QR code data too long (${data.length} characters). Maximum recommended: ${maxLength}`,
    };
  }

  return { isValid: true };
};

/**
 * Generate shareable deep link
 */
export const generateDeepLink = (card: BusinessCard): string => {
  const scheme = 'digbiz'; // Your app's URL scheme
  return `${scheme}://card/${card.shareCode || card.id}`;
};

/**
 * Generate universal link (iOS/Android)
 */
export const generateUniversalLink = (card: BusinessCard): string => {
  const baseUrl = AppConfig.webUrl || 'https://digbiz.app';
  return `${baseUrl}/open/card/${card.shareCode || card.id}`;
};

/**
 * Parse QR code scan result
 */
export const parseQRScanResult = (
  data: string,
): {
  type: 'url' | 'vcard' | 'wifi' | 'text' | 'unknown';
  parsed: any;
} => {
  // URL detection
  if (data.startsWith('http://') || data.startsWith('https://')) {
    return {
      type: 'url',
      parsed: { url: data },
    };
  }

  // vCard detection
  if (data.startsWith('BEGIN:VCARD')) {
    return {
      type: 'vcard',
      parsed: parseVCard(data),
    };
  }

  // WiFi detection
  if (data.startsWith('WIFI:')) {
    return {
      type: 'wifi',
      parsed: parseWiFiQR(data),
    };
  }

  // Default to text
  return {
    type: 'text',
    parsed: { text: data },
  };
};

/**
 * Parse vCard string
 */
const parseVCard = (vCardString: string): VCardData => {
  const lines = vCardString.split('\n');
  const data: VCardData = { name: '' };

  lines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const key = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);
    if (!key || !value) return;

    switch (key.split(';')[0]) {
      case 'FN':
        data.name = value;
        break;
      case 'TITLE':
        data.title = value;
        break;
      case 'ORG':
        data.company = value;
        break;
      case 'EMAIL':
        data.email = value;
        break;
      case 'TEL':
        data.phone = value;
        break;
      case 'URL':
        if (!data.website) data.website = value;
        break;
      case 'NOTE':
        data.note = value.replace(/\\n/g, '\n');
        break;
    }
  });

  return data;
};

/**
 * Parse WiFi QR code
 */
const parseWiFiQR = (
  wifiString: string,
): { ssid: string; password: string; security: string } => {
  const params = wifiString.replace('WIFI:', '').split(';');
  const result = { ssid: '', password: '', security: '' };

  params.forEach(param => {
    const [key, value] = param.split(':');
    switch (key) {
      case 'S':
        result.ssid = value;
        break;
      case 'P':
        result.password = value;
        break;
      case 'T':
        result.security = value;
        break;
    }
  });

  return result;
};
