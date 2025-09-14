/**
 * Deep Linking Utilities
 *
 * This utility handles deep linking for business card viewing,
 * including URL scheme handling and universal links.
 */

import { Linking, Alert } from 'react-native';
import { businessCardService } from '../services/businessCardService';
import { BusinessCard } from '../types/businessCard';

export interface DeepLinkData {
  type: 'card' | 'profile' | 'exchange' | 'event' | 'unknown';
  params: Record<string, string>;
}

export interface CardDeepLinkParams {
  cardId?: string;
  shareCode?: string;
  action?: 'view' | 'exchange' | 'save';
}

/**
 * Parse deep link URL
 */
export const parseDeepLink = (url: string): DeepLinkData => {
  try {
    const parsedUrl = new URL(url);

    // Handle custom scheme (digbiz://)
    if (parsedUrl.protocol === 'digbiz:') {
      return parseCustomSchemeUrl(parsedUrl);
    }

    // Handle universal links (https://digbiz.app/)
    if (
      parsedUrl.hostname === 'digbiz.app' ||
      parsedUrl.hostname === 'www.digbiz.app'
    ) {
      return parseUniversalLink(parsedUrl);
    }

    return { type: 'unknown', params: {} };
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return { type: 'unknown', params: {} };
  }
};

/**
 * Parse custom scheme URL (digbiz://card/123)
 */
const parseCustomSchemeUrl = (url: URL): DeepLinkData => {
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts.length === 0) {
    return { type: 'unknown', params: {} };
  }

  const type = pathParts[0] as DeepLinkData['type'];
  const params: Record<string, string> = {};

  // Parse query parameters
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  switch (type) {
    case 'card':
      if (pathParts[1]) {
        params.cardId = pathParts[1];
      }
      break;
    case 'profile':
      if (pathParts[1]) {
        params.userId = pathParts[1];
      }
      break;
    case 'exchange':
      if (pathParts[1]) {
        params.exchangeId = pathParts[1];
      }
      break;
    case 'event':
      if (pathParts[1]) {
        params.eventId = pathParts[1];
      }
      break;
  }

  return { type, params };
};

/**
 * Parse universal link (https://digbiz.app/card/abc123)
 */
const parseUniversalLink = (url: URL): DeepLinkData => {
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts.length === 0) {
    return { type: 'unknown', params: {} };
  }

  // Handle /open/ prefix for universal links
  let startIndex = 0;
  if (pathParts[0] === 'open') {
    startIndex = 1;
  }

  if (pathParts.length <= startIndex) {
    return { type: 'unknown', params: {} };
  }

  const type = pathParts[startIndex] as DeepLinkData['type'];
  const params: Record<string, string> = {};

  // Parse query parameters
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  switch (type) {
    case 'card':
      if (pathParts[startIndex + 1]) {
        // Check if it's a share code or card ID
        const identifier = pathParts[startIndex + 1];
        if (identifier.length > 10) {
          params.cardId = identifier;
        } else {
          params.shareCode = identifier;
        }
      }
      break;
    case 'profile':
      if (pathParts[startIndex + 1]) {
        params.userId = pathParts[startIndex + 1];
      }
      break;
    case 'exchange':
      if (pathParts[startIndex + 1]) {
        params.exchangeId = pathParts[startIndex + 1];
      }
      break;
    case 'event':
      if (pathParts[startIndex + 1]) {
        params.eventId = pathParts[startIndex + 1];
      }
      break;
  }

  return { type, params };
};

/**
 * Handle card deep link
 */
export const handleCardDeepLink = async (
  params: CardDeepLinkParams,
  navigation: any,
): Promise<boolean> => {
  try {
    let card: BusinessCard | null = null;

    // Fetch card by share code or ID
    if (params.shareCode) {
      card = await businessCardService.getSharedCard(params.shareCode);
    } else if (params.cardId) {
      const response = await businessCardService.getCard(params.cardId);
      card = response.card || null;
    }

    if (!card) {
      Alert.alert(
        'Card Not Found',
        'The requested business card could not be found.',
      );
      return false;
    }

    // Handle different actions
    switch (params.action) {
      case 'view':
        navigation.navigate('CardView', { card });
        break;
      case 'exchange':
        navigation.navigate('CardExchange', { card });
        break;
      case 'save':
        navigation.navigate('SaveContact', { card });
        break;
      default:
        navigation.navigate('CardView', { card });
    }

    // Record view analytics
    await businessCardService.recordCardView(card.id);

    return true;
  } catch (error) {
    console.error('Failed to handle card deep link:', error);
    Alert.alert('Error', 'Failed to open business card.');
    return false;
  }
};

/**
 * Handle profile deep link
 */
export const handleProfileDeepLink = async (
  userId: string,
  navigation: any,
): Promise<boolean> => {
  try {
    navigation.navigate('Profile', { userId });
    return true;
  } catch (error) {
    console.error('Failed to handle profile deep link:', error);
    Alert.alert('Error', 'Failed to open profile.');
    return false;
  }
};

/**
 * Handle exchange deep link
 */
export const handleExchangeDeepLink = async (
  exchangeId: string,
  navigation: any,
): Promise<boolean> => {
  try {
    navigation.navigate('Exchange', { exchangeId });
    return true;
  } catch (error) {
    console.error('Failed to handle exchange deep link:', error);
    Alert.alert('Error', 'Failed to open exchange.');
    return false;
  }
};

/**
 * Handle event deep link
 */
export const handleEventDeepLink = async (
  eventId: string,
  navigation: any,
): Promise<boolean> => {
  try {
    navigation.navigate('Event', { eventId });
    return true;
  } catch (error) {
    console.error('Failed to handle event deep link:', error);
    Alert.alert('Error', 'Failed to open event.');
    return false;
  }
};

/**
 * Main deep link handler
 */
export const handleDeepLink = async (
  url: string,
  navigation: any,
): Promise<boolean> => {
  const deepLinkData = parseDeepLink(url);

  switch (deepLinkData.type) {
    case 'card':
      return handleCardDeepLink(
        {
          cardId: deepLinkData.params.cardId,
          shareCode: deepLinkData.params.shareCode,
          action: deepLinkData.params.action as 'view' | 'exchange' | 'save',
        },
        navigation,
      );

    case 'profile':
      return handleProfileDeepLink(deepLinkData.params.userId, navigation);

    case 'exchange':
      return handleExchangeDeepLink(deepLinkData.params.exchangeId, navigation);

    case 'event':
      return handleEventDeepLink(deepLinkData.params.eventId, navigation);

    default:
      console.log('Unknown deep link type:', deepLinkData);
      return false;
  }
};

/**
 * Initialize deep link handling
 */
export const initializeDeepLinking = (navigation: any): (() => void) => {
  // Handle initial URL when app is launched
  const handleInitialURL = async () => {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleDeepLink(initialUrl, navigation);
      }
    } catch (error) {
      console.error('Failed to handle initial URL:', error);
    }
  };

  // Handle URLs when app is already running
  const handleURL = (event: { url: string }) => {
    handleDeepLink(event.url, navigation);
  };

  // Set up listeners
  handleInitialURL();
  const subscription = Linking.addEventListener('url', handleURL);

  // Return cleanup function
  return () => {
    subscription?.remove();
  };
};

/**
 * Generate deep link URL
 */
export const generateDeepLinkUrl = (
  type: 'card' | 'profile' | 'exchange' | 'event',
  params: Record<string, string>,
): string => {
  const baseUrl = 'digbiz://';
  const queryString = new URLSearchParams(params).toString();

  let path = type;

  switch (type) {
    case 'card':
      if (params.cardId) path += `/${params.cardId}`;
      else if (params.shareCode) path += `/${params.shareCode}`;
      break;
    case 'profile':
      if (params.userId) path += `/${params.userId}`;
      break;
    case 'exchange':
      if (params.exchangeId) path += `/${params.exchangeId}`;
      break;
    case 'event':
      if (params.eventId) path += `/${params.eventId}`;
      break;
  }

  return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
};

/**
 * Generate universal link URL
 */
export const generateUniversalLinkUrl = (
  type: 'card' | 'profile' | 'exchange' | 'event',
  params: Record<string, string>,
): string => {
  const baseUrl = 'https://digbiz.app/open/';
  const queryString = new URLSearchParams(params).toString();

  let path = type;

  switch (type) {
    case 'card':
      if (params.cardId) path += `/${params.cardId}`;
      else if (params.shareCode) path += `/${params.shareCode}`;
      break;
    case 'profile':
      if (params.userId) path += `/${params.userId}`;
      break;
    case 'exchange':
      if (params.exchangeId) path += `/${params.exchangeId}`;
      break;
    case 'event':
      if (params.eventId) path += `/${params.eventId}`;
      break;
  }

  return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
};

/**
 * Check if URL can be opened
 */
export const canOpenDeepLink = async (url: string): Promise<boolean> => {
  try {
    return await Linking.canOpenURL(url);
  } catch (error) {
    console.error('Failed to check if URL can be opened:', error);
    return false;
  }
};

/**
 * Open deep link URL
 */
export const openDeepLink = async (url: string): Promise<boolean> => {
  try {
    const canOpen = await canOpenDeepLink(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to open deep link:', error);
    return false;
  }
};
