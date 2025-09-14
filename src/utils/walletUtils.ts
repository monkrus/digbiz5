/**
 * Wallet Utilities
 *
 * This utility provides functions for saving business cards to Apple Wallet
 * and Google Wallet (Google Pay), generating pass files and handling wallet integration.
 */

import { Platform, Alert, Linking } from 'react-native';
import RNFS from 'react-native-fs';

import { BusinessCard } from '../types/businessCard';
import { generateCardShareUrl } from './qrCodeGenerator';

export interface WalletPassData {
  formatVersion: number;
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;
  organizationName: string;
  description: string;
  logoText: string;
  foregroundColor: string;
  backgroundColor: string;
  generic: {
    primaryFields: Array<{
      key: string;
      label: string;
      value: string;
    }>;
    secondaryFields: Array<{
      key: string;
      label: string;
      value: string;
    }>;
    auxiliaryFields: Array<{
      key: string;
      label: string;
      value: string;
    }>;
    backFields: Array<{
      key: string;
      label: string;
      value: string;
    }>;
  };
  relevantDate?: string;
  barcode?: {
    message: string;
    format: string;
    messageEncoding: string;
  };
  locations?: Array<{
    latitude: number;
    longitude: number;
    relevantText?: string;
  }>;
}

export interface GoogleWalletObject {
  id: string;
  classId: string;
  title: string;
  subheader: {
    header: string;
    body: string;
  };
  header: {
    header: string;
    body: string;
  };
  body: {
    header: string;
    body: string;
  };
  barcode: {
    type: string;
    value: string;
    alternateText: string;
  };
  hexBackgroundColor: string;
  logo: {
    sourceUri: {
      uri: string;
    };
  };
}

/**
 * Generate Apple Wallet pass data
 */
export const generateAppleWalletPass = (card: BusinessCard): WalletPassData => {
  const shareUrl = generateCardShareUrl(card.id, card.shareCode);

  return {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.digbiz.businesscard', // Replace with your pass type ID
    serialNumber: card.id,
    teamIdentifier: 'YOURTEAMID', // Replace with your Apple Developer Team ID
    organizationName: 'DigBiz',
    description: `${card.basicInfo.name} - Business Card`,
    logoText: 'DigBiz',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(59, 130, 246)',
    generic: {
      primaryFields: [
        {
          key: 'name',
          label: 'Name',
          value: card.basicInfo.name,
        },
      ],
      secondaryFields: [
        {
          key: 'title',
          label: 'Title',
          value: card.basicInfo.title,
        },
        {
          key: 'company',
          label: 'Company',
          value: card.basicInfo.company,
        },
      ],
      auxiliaryFields: [
        ...(card.basicInfo.email
          ? [
              {
                key: 'email',
                label: 'Email',
                value: card.basicInfo.email,
              },
            ]
          : []),
        ...(card.basicInfo.phone
          ? [
              {
                key: 'phone',
                label: 'Phone',
                value: card.basicInfo.phone,
              },
            ]
          : []),
      ],
      backFields: [
        {
          key: 'bio',
          label: 'About',
          value: card.basicInfo.bio || 'Digital business card',
        },
        {
          key: 'website',
          label: 'Website',
          value: shareUrl,
        },
        ...(card.socialLinks.linkedin
          ? [
              {
                key: 'linkedin',
                label: 'LinkedIn',
                value: card.socialLinks.linkedin,
              },
            ]
          : []),
        ...(card.socialLinks.twitter
          ? [
              {
                key: 'twitter',
                label: 'Twitter',
                value: card.socialLinks.twitter,
              },
            ]
          : []),
        {
          key: 'powered',
          label: 'Powered by',
          value: 'DigBiz - Digital Business Cards',
        },
      ],
    },
    relevantDate: new Date().toISOString(),
    barcode: {
      message: shareUrl,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
    },
  };
};

/**
 * Generate Google Wallet object
 */
export const generateGoogleWalletObject = (
  card: BusinessCard,
): GoogleWalletObject => {
  const shareUrl = generateCardShareUrl(card.id, card.shareCode);

  return {
    id: `${card.id}_${Date.now()}`,
    classId: 'digbiz_business_card_class', // Replace with your class ID
    title: card.basicInfo.name,
    subheader: {
      header: card.basicInfo.title,
      body: card.basicInfo.company,
    },
    header: {
      header: 'Contact',
      body: card.basicInfo.email || card.basicInfo.phone || '',
    },
    body: {
      header: 'About',
      body: card.basicInfo.bio || 'Digital Business Card',
    },
    barcode: {
      type: 'QR_CODE',
      value: shareUrl,
      alternateText: 'Scan to view card',
    },
    hexBackgroundColor: '#3B82F6',
    logo: {
      sourceUri: {
        uri: 'https://your-app-domain.com/logo.png', // Replace with your logo URL
      },
    },
  };
};

/**
 * Save to Apple Wallet
 */
export const saveToAppleWallet = async (
  card: BusinessCard,
): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    Alert.alert(
      'Not Available',
      'Apple Wallet is only available on iOS devices.',
    );
    return false;
  }

  try {
    // Generate pass data
    const passData = generateAppleWalletPass(card);

    // Create pass.json file
    const passJson = JSON.stringify(passData, null, 2);
    const passPath = `${RNFS.CachesDirectoryPath}/pass_${card.id}.json`;
    await RNFS.writeFile(passPath, passJson, 'utf8');

    // Note: In a real implementation, you would need to:
    // 1. Create a complete .pkpass bundle with manifest.json, signature, and assets
    // 2. Sign the pass with your certificate
    // 3. Host the pass on your server
    // 4. Open the hosted pass URL

    // For now, we'll show instructions to the user
    Alert.alert(
      'Apple Wallet',
      'To add this card to Apple Wallet:\n\n1. Visit our website\n2. Log in to your account\n3. Select "Add to Apple Wallet"\n\nThis feature requires server-side pass generation and signing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Website',
          onPress: () => {
            const websiteUrl = `https://digbiz.app/wallet/apple/${
              card.shareCode || card.id
            }`;
            Linking.openURL(websiteUrl);
          },
        },
      ],
    );

    return true;
  } catch (error) {
    console.error('Failed to save to Apple Wallet:', error);
    Alert.alert('Error', 'Failed to save to Apple Wallet.');
    return false;
  }
};

/**
 * Save to Google Wallet
 */
export const saveToGoogleWallet = async (
  card: BusinessCard,
): Promise<boolean> => {
  try {
    // Generate Google Wallet object
    const walletObject = generateGoogleWalletObject(card);

    // Create JWT payload for Google Wallet
    const payload = {
      iss: 'your-service-account-email@project.iam.gserviceaccount.com', // Replace with your service account
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: {
        genericObjects: [walletObject],
      },
    };

    // Note: In a real implementation, you would need to:
    // 1. Sign the JWT with your private key
    // 2. Create a proper Google Wallet save URL
    // 3. Open the URL to add to wallet

    // For now, we'll show instructions to the user
    Alert.alert(
      'Google Wallet',
      'To add this card to Google Wallet:\n\n1. Visit our website\n2. Log in to your account\n3. Select "Add to Google Wallet"\n\nThis feature requires server-side JWT signing and Google Wallet API integration.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Website',
          onPress: () => {
            const websiteUrl = `https://digbiz.app/wallet/google/${
              card.shareCode || card.id
            }`;
            Linking.openURL(websiteUrl);
          },
        },
      ],
    );

    return true;
  } catch (error) {
    console.error('Failed to save to Google Wallet:', error);
    Alert.alert('Error', 'Failed to save to Google Wallet.');
    return false;
  }
};

/**
 * Save to device wallet (platform-specific)
 */
export const saveToWallet = async (card: BusinessCard): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return saveToAppleWallet(card);
  } else if (Platform.OS === 'android') {
    return saveToGoogleWallet(card);
  } else {
    Alert.alert(
      'Not Supported',
      'Wallet integration is not supported on this platform.',
    );
    return false;
  }
};

/**
 * Check if wallet is available
 */
export const isWalletAvailable = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Get wallet platform name
 */
export const getWalletPlatformName = (): string => {
  if (Platform.OS === 'ios') {
    return 'Apple Wallet';
  } else if (Platform.OS === 'android') {
    return 'Google Wallet';
  }
  return 'Wallet';
};

/**
 * Generate wallet save URL (server-generated)
 */
export const generateWalletSaveUrl = (card: BusinessCard): string => {
  const platform = Platform.OS === 'ios' ? 'apple' : 'google';
  return `https://digbiz.app/api/wallet/${platform}/${
    card.shareCode || card.id
  }`;
};

/**
 * Create contact for device contacts app
 */
export const saveToContacts = async (card: BusinessCard): Promise<boolean> => {
  try {
    // This would require additional permissions and native modules
    // For now, we'll guide users to save the vCard manually

    Alert.alert(
      'Save Contact',
      'To save this contact to your device:\n\n1. Use the "Share" button\n2. Select "Save vCard"\n3. Import to your contacts app',
      [{ text: 'OK' }],
    );

    return true;
  } catch (error) {
    console.error('Failed to save to contacts:', error);
    Alert.alert('Error', 'Failed to save contact.');
    return false;
  }
};

/**
 * Generate calendar event for networking
 */
export const addToCalendar = async (
  card: BusinessCard,
  eventTitle: string = 'Follow up',
  notes?: string,
): Promise<boolean> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Tomorrow
    startDate.setHours(9, 0, 0, 0); // 9 AM

    const endDate = new Date(startDate);
    endDate.setHours(10, 0, 0, 0); // 10 AM

    const eventNotes =
      notes ||
      `Follow up with ${card.basicInfo.name} from ${card.basicInfo.company}`;

    // Create calendar URL (works on most platforms)
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      eventTitle,
    )}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${
      endDate.toISOString().replace(/[-:]/g, '').split('.')[0]
    }Z&details=${encodeURIComponent(eventNotes)}`;

    const canOpen = await Linking.canOpenURL(calendarUrl);
    if (canOpen) {
      await Linking.openURL(calendarUrl);
      return true;
    }

    Alert.alert(
      'Add to Calendar',
      'Calendar integration is not available. Please manually add a follow-up reminder.',
    );

    return false;
  } catch (error) {
    console.error('Failed to add to calendar:', error);
    Alert.alert('Error', 'Failed to add calendar event.');
    return false;
  }
};
