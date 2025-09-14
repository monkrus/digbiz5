/**
 * Sharing Utilities
 *
 * This utility provides functions for sharing business cards through various methods
 * including native share sheets, social media, messaging apps, and file exports.
 */

import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { Platform, Alert, Linking } from 'react-native';

import { BusinessCard } from '../types/businessCard';
import { generateCardShareUrl, generateVCardString } from './qrCodeGenerator';

export interface ShareOptions {
  method:
    | 'native'
    | 'email'
    | 'sms'
    | 'whatsapp'
    | 'linkedin'
    | 'twitter'
    | 'facebook';
  includeQR?: boolean;
  message?: string;
  subject?: string;
}

export interface ShareData {
  title: string;
  message: string;
  url: string;
  qrCodeUri?: string;
  vCardUri?: string;
}

/**
 * Generate share data for a business card
 */
export const generateShareData = async (
  card: BusinessCard,
  qrCodeUri?: string,
): Promise<ShareData> => {
  const shareUrl = generateCardShareUrl(card.id, card.shareCode);

  const title = `${card.basicInfo.name} - Business Card`;
  const message = `Check out ${card.basicInfo.name}'s business card${
    card.basicInfo.title ? ` - ${card.basicInfo.title}` : ''
  }${card.basicInfo.company ? ` at ${card.basicInfo.company}` : ''}`;

  // Generate vCard file if needed
  let vCardUri: string | undefined;
  try {
    const vCardString = generateVCardString(card);
    const vCardPath = `${
      RNFS.CachesDirectoryPath
    }/${card.basicInfo.name.replace(/\s+/g, '_')}.vcf`;
    await RNFS.writeFile(vCardPath, vCardString, 'utf8');
    vCardUri = vCardPath;
  } catch (error) {
    console.error('Failed to generate vCard file:', error);
  }

  return {
    title,
    message,
    url: shareUrl,
    qrCodeUri,
    vCardUri,
  };
};

/**
 * Share business card using native share sheet
 */
export const shareCardNative = async (
  card: BusinessCard,
  options: Partial<ShareOptions> = {},
): Promise<boolean> => {
  try {
    const shareData = await generateShareData(
      card,
      options.includeQR ? undefined : undefined,
    );

    const shareOptions: any = {
      title: shareData.title,
      message: options.message || `${shareData.message}\n\n${shareData.url}`,
      url: shareData.url,
      subject: options.subject || shareData.title,
    };

    // Add files if available
    const urls: string[] = [shareData.url];
    if (shareData.qrCodeUri) {
      urls.push(`file://${shareData.qrCodeUri}`);
    }
    if (shareData.vCardUri) {
      urls.push(`file://${shareData.vCardUri}`);
    }

    if (urls.length > 1) {
      shareOptions.urls = urls;
    }

    const result = await Share.open(shareOptions);
    return result.success || false;
  } catch (error) {
    if (error.message !== 'User did not share') {
      console.error('Native share failed:', error);
      Alert.alert('Share Error', 'Failed to share business card');
    }
    return false;
  }
};

/**
 * Share via email
 */
export const shareCardEmail = async (
  card: BusinessCard,
  recipientEmail?: string,
  customMessage?: string,
): Promise<boolean> => {
  try {
    const shareData = await generateShareData(card);

    const subject = encodeURIComponent(
      `Business Card - ${card.basicInfo.name}`,
    );
    const body = encodeURIComponent(
      customMessage ||
        `Hi,\n\nI'd like to share my business card with you:\n\n${shareData.message}\n\nView my card: ${shareData.url}\n\nBest regards,\n${card.basicInfo.name}`,
    );

    let emailUrl = `mailto:${
      recipientEmail || ''
    }?subject=${subject}&body=${body}`;

    // Attach vCard if available
    if (shareData.vCardUri) {
      emailUrl += `&attachment=${shareData.vCardUri}`;
    }

    const canOpen = await Linking.canOpenURL(emailUrl);
    if (canOpen) {
      await Linking.openURL(emailUrl);
      return true;
    } else {
      Alert.alert('Email Error', 'No email app available');
      return false;
    }
  } catch (error) {
    console.error('Email share failed:', error);
    Alert.alert('Email Error', 'Failed to share via email');
    return false;
  }
};

/**
 * Share via SMS
 */
export const shareCardSMS = async (
  card: BusinessCard,
  phoneNumber?: string,
  customMessage?: string,
): Promise<boolean> => {
  try {
    const shareData = await generateShareData(card);

    const message = encodeURIComponent(
      customMessage || `Hi! Check out my business card: ${shareData.url}`,
    );

    const smsUrl = `sms:${phoneNumber || ''}${
      Platform.OS === 'ios' ? '&' : '?'
    }body=${message}`;

    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      await Linking.openURL(smsUrl);
      return true;
    } else {
      Alert.alert('SMS Error', 'SMS not available');
      return false;
    }
  } catch (error) {
    console.error('SMS share failed:', error);
    Alert.alert('SMS Error', 'Failed to share via SMS');
    return false;
  }
};

/**
 * Share via WhatsApp
 */
export const shareCardWhatsApp = async (
  card: BusinessCard,
  customMessage?: string,
): Promise<boolean> => {
  try {
    const shareData = await generateShareData(card);

    const message = encodeURIComponent(
      customMessage || `Hi! Check out my business card: ${shareData.url}`,
    );

    const whatsappUrl = `whatsapp://send?text=${message}`;

    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return true;
    } else {
      Alert.alert('WhatsApp Error', 'WhatsApp not installed');
      return false;
    }
  } catch (error) {
    console.error('WhatsApp share failed:', error);
    Alert.alert('WhatsApp Error', 'Failed to share via WhatsApp');
    return false;
  }
};

/**
 * Share via LinkedIn
 */
export const shareCardLinkedIn = async (
  card: BusinessCard,
  customMessage?: string,
): Promise<boolean> => {
  try {
    const shareData = await generateShareData(card);

    const message = encodeURIComponent(
      customMessage || `Check out ${card.basicInfo.name}'s business card`,
    );

    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareData.url,
    )}&mini=true&title=${encodeURIComponent(
      shareData.title,
    )}&summary=${message}`;

    const canOpen = await Linking.canOpenURL(linkedinUrl);
    if (canOpen) {
      await Linking.openURL(linkedinUrl);
      return true;
    } else {
      Alert.alert('LinkedIn Error', 'Cannot open LinkedIn');
      return false;
    }
  } catch (error) {
    console.error('LinkedIn share failed:', error);
    Alert.alert('LinkedIn Error', 'Failed to share via LinkedIn');
    return false;
  }
};

/**
 * Share via Twitter
 */
export const shareCardTwitter = async (
  card: BusinessCard,
  customMessage?: string,
): Promise<boolean> => {
  try {
    const shareData = await generateShareData(card);

    const message = encodeURIComponent(
      customMessage ||
        `Check out ${card.basicInfo.name}'s business card! ${shareData.url}`,
    );

    const twitterUrl = `https://twitter.com/intent/tweet?text=${message}`;

    const canOpen = await Linking.canOpenURL(twitterUrl);
    if (canOpen) {
      await Linking.openURL(twitterUrl);
      return true;
    } else {
      Alert.alert('Twitter Error', 'Cannot open Twitter');
      return false;
    }
  } catch (error) {
    console.error('Twitter share failed:', error);
    Alert.alert('Twitter Error', 'Failed to share via Twitter');
    return false;
  }
};

/**
 * Share business card with specified method
 */
export const shareCard = async (
  card: BusinessCard,
  options: ShareOptions,
): Promise<boolean> => {
  switch (options.method) {
    case 'native':
      return shareCardNative(card, options);
    case 'email':
      return shareCardEmail(card, undefined, options.message);
    case 'sms':
      return shareCardSMS(card, undefined, options.message);
    case 'whatsapp':
      return shareCardWhatsApp(card, options.message);
    case 'linkedin':
      return shareCardLinkedIn(card, options.message);
    case 'twitter':
      return shareCardTwitter(card, options.message);
    default:
      return shareCardNative(card, options);
  }
};

/**
 * Copy card URL to clipboard
 */
export const copyCardUrl = async (card: BusinessCard): Promise<boolean> => {
  try {
    const { Clipboard } = require('@react-native-clipboard/clipboard');
    const shareUrl = generateCardShareUrl(card.id, card.shareCode);
    await Clipboard.setString(shareUrl);
    Alert.alert('Copied!', 'Card link copied to clipboard');
    return true;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    Alert.alert('Copy Error', 'Failed to copy link');
    return false;
  }
};

/**
 * Save vCard to device
 */
export const saveVCard = async (card: BusinessCard): Promise<boolean> => {
  try {
    const vCardString = generateVCardString(card);
    const fileName = `${card.basicInfo.name.replace(/\s+/g, '_')}.vcf`;

    if (Platform.OS === 'ios') {
      const DocumentPicker = require('react-native-document-picker');
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.writeFile(path, vCardString, 'utf8');

      // Share the file so user can save it
      await Share.open({
        url: `file://${path}`,
        type: 'text/vcard',
        title: 'Save Contact',
      });
    } else {
      // Android - save to downloads
      const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.writeFile(path, vCardString, 'utf8');
      Alert.alert('Saved!', `Contact saved to Downloads/${fileName}`);
    }

    return true;
  } catch (error) {
    console.error('Save vCard failed:', error);
    Alert.alert('Save Error', 'Failed to save contact');
    return false;
  }
};

/**
 * Get available sharing methods
 */
export const getAvailableSharingMethods = async (): Promise<string[]> => {
  const methods = ['native', 'email', 'sms'];

  try {
    // Check WhatsApp
    const whatsappAvailable = await Linking.canOpenURL(
      'whatsapp://send?text=test',
    );
    if (whatsappAvailable) methods.push('whatsapp');

    // LinkedIn and Twitter are web-based, so always available
    methods.push('linkedin', 'twitter');
  } catch (error) {
    console.error('Error checking available methods:', error);
  }

  return methods;
};

/**
 * Analytics for sharing
 */
export const trackSharingEvent = (
  cardId: string,
  method: string,
  success: boolean,
): void => {
  // Implementation would depend on your analytics service
  console.log('Share event:', {
    cardId,
    method,
    success,
    timestamp: new Date(),
  });
};
