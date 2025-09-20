/**
 * Export Utilities
 *
 * This utility provides functions for exporting business cards to various formats
 * including PDF, PNG, JPG, SVG, vCard, JSON, and CSV.
 */

import { Platform, Alert, PermissionsAndroid } from 'react-native';
import * as RNHTMLtoPDF from 'react-native-html-to-pdf';
// import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import {
  BusinessCard,
  ExportFormat,
  ExportOptions,
} from '../types/businessCard';
import { generateVCardString, generateCardShareUrl } from './qrCodeGenerator';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

/**
 * Request storage permissions on Android
 */
const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'App needs access to storage to save exported files.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};

/**
 * Generate HTML template for PDF export
 */
const generateCardHTML = (
  card: BusinessCard,
  includeQR: boolean = false,
): string => {
  const shareUrl = generateCardShareUrl(card.id, card.shareCode);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Helvetica', Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f8fafc;
            }
            .card {
                width: 350px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                padding: 24px;
                margin: 0 auto;
            }
            .header {
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 16px;
                margin-bottom: 16px;
            }
            .name {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 4px;
            }
            .title {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 4px;
            }
            .company {
                font-size: 14px;
                color: #374151;
                font-weight: 500;
            }
            .contact-info {
                margin-bottom: 16px;
            }
            .contact-item {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                font-size: 14px;
                color: #4b5563;
            }
            .contact-label {
                font-weight: 500;
                width: 80px;
                color: #374151;
            }
            .bio {
                margin-bottom: 16px;
                padding: 12px;
                background-color: #f9fafb;
                border-radius: 8px;
                font-size: 14px;
                color: #374151;
                line-height: 1.5;
            }
            .social-links {
                margin-bottom: 16px;
            }
            .social-title {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
            .social-item {
                display: block;
                margin-bottom: 4px;
                font-size: 12px;
                color: #3b82f6;
                text-decoration: none;
            }
            .qr-section {
                text-align: center;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
            }
            .qr-placeholder {
                width: 120px;
                height: 120px;
                background-color: #f3f4f6;
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                font-size: 12px;
                margin-bottom: 8px;
            }
            .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
            }
            .startup-info {
                background-color: #f0f9ff;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
            }
            .startup-title {
                font-size: 14px;
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 8px;
            }
            .startup-item {
                font-size: 12px;
                color: #1e40af;
                margin-bottom: 4px;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <div class="name">${card.basicInfo.name}</div>
                <div class="title">${card.basicInfo.title}</div>
                <div class="company">${card.basicInfo.company}</div>
            </div>
            
            <div class="contact-info">
                <div class="contact-item">
                    <span class="contact-label">Email:</span>
                    ${card.basicInfo.email}
                </div>
                ${
                  card.basicInfo.phone
                    ? `
                <div class="contact-item">
                    <span class="contact-label">Phone:</span>
                    ${card.basicInfo.phone}
                </div>
                `
                    : ''
                }
                ${
                  card.basicInfo.location
                    ? `
                <div class="contact-item">
                    <span class="contact-label">Location:</span>
                    ${card.basicInfo.location}
                </div>
                `
                    : ''
                }
            </div>
            
            ${
              card.basicInfo.bio
                ? `
            <div class="bio">
                ${card.basicInfo.bio}
            </div>
            `
                : ''
            }
            
            ${
              card.startupInfo
                ? `
            <div class="startup-info">
                <div class="startup-title">Startup Information</div>
                <div class="startup-item">Funding Stage: ${
                  card.startupInfo.fundingStage
                }</div>
                <div class="startup-item">Team Size: ${
                  card.startupInfo.teamSize
                }</div>
                ${
                  card.startupInfo.industry.length > 0
                    ? `<div class="startup-item">Industry: ${card.startupInfo.industry.join(
                        ', ',
                      )}</div>`
                    : ''
                }
                ${
                  card.startupInfo.businessModel
                    ? `<div class="startup-item">Business Model: ${card.startupInfo.businessModel}</div>`
                    : ''
                }
            </div>
            `
                : ''
            }
            
            <div class="social-links">
                <div class="social-title">Connect With Me</div>
                ${
                  card.socialLinks.website
                    ? `<a href="${card.socialLinks.website}" class="social-item">🌐 Website: ${card.socialLinks.website}</a>`
                    : ''
                }
                ${
                  card.socialLinks.linkedin
                    ? `<a href="${card.socialLinks.linkedin}" class="social-item">💼 LinkedIn: ${card.socialLinks.linkedin}</a>`
                    : ''
                }
                ${
                  card.socialLinks.twitter
                    ? `<a href="${card.socialLinks.twitter}" class="social-item">🐦 Twitter: ${card.socialLinks.twitter}</a>`
                    : ''
                }
                ${
                  card.socialLinks.github
                    ? `<a href="${card.socialLinks.github}" class="social-item">💻 GitHub: ${card.socialLinks.github}</a>`
                    : ''
                }
                ${
                  card.socialLinks.instagram
                    ? `<a href="${card.socialLinks.instagram}" class="social-item">📸 Instagram: ${card.socialLinks.instagram}</a>`
                    : ''
                }
            </div>
            
            ${
              includeQR
                ? `
            <div class="qr-section">
                <div class="qr-placeholder">
                    QR Code
                    <br>
                    (Scan to view card)
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                    ${shareUrl}
                </div>
            </div>
            `
                : ''
            }
            
            <div class="footer">
                Generated by DigBiz - Digital Business Cards
                <br>
                ${new Date().toLocaleDateString()}
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Export business card as PDF
 */
export const exportToPDF = async (
  card: BusinessCard,
  options: ExportOptions,
): Promise<ExportResult> => {
  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return { success: false, error: 'Storage permission denied' };
    }

    const html = generateCardHTML(card, options.includeQRCode);
    const fileName = `${card.basicInfo.name.replace(
      /\s+/g,
      '_',
    )}_BusinessCard.pdf`;

    const pdfOptions = {
      html,
      fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
      width: 612, // Letter size width in points
      height: 792, // Letter size height in points
      padding: 20,
    };

    const file = await RNHTMLtoPDF.convert(pdfOptions);

    if (file.filePath) {
      return {
        success: true,
        filePath: file.filePath,
        fileName,
      };
    } else {
      return { success: false, error: 'Failed to generate PDF' };
    }
  } catch (error) {
    console.error('PDF export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export business card as image (using ViewShot)
 */
export const exportToImage = async (
  viewRef: any,
  card: BusinessCard,
  format: 'png' | 'jpg' = 'png',
  quality: number = 1.0,
): Promise<ExportResult> => {
  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return { success: false, error: 'Storage permission denied' };
    }

    if (!viewRef) {
      return { success: false, error: 'View reference not provided' };
    }

    const fileName = `${card.basicInfo.name.replace(
      /\s+/g,
      '_',
    )}_BusinessCard.${format}`;
    const directory =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.DownloadDirectoryPath;
    const filePath = `${directory}/${fileName}`;

    const uri = await viewRef.capture({
      format,
      quality,
      result: 'tmpfile',
    });

    // Move from temp to permanent location
    await RNFS.moveFile(uri, filePath);

    return {
      success: true,
      filePath,
      fileName,
    };
  } catch (error) {
    console.error('Image export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export business card as vCard
 */
export const exportToVCard = async (
  card: BusinessCard,
): Promise<ExportResult> => {
  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return { success: false, error: 'Storage permission denied' };
    }

    const vCardString = generateVCardString(card);
    const fileName = `${card.basicInfo.name.replace(/\s+/g, '_')}.vcf`;
    const directory =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.DownloadDirectoryPath;
    const filePath = `${directory}/${fileName}`;

    await RNFS.writeFile(filePath, vCardString, 'utf8');

    return {
      success: true,
      filePath,
      fileName,
    };
  } catch (error) {
    console.error('vCard export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export business card as JSON
 */
export const exportToJSON = async (
  card: BusinessCard,
  includeAnalytics: boolean = false,
): Promise<ExportResult> => {
  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return { success: false, error: 'Storage permission denied' };
    }

    // Create export data
    const exportData = {
      card,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      ...(includeAnalytics && {
        analytics: {
          // Add analytics data here if available
          note: 'Analytics data would be included here',
        },
      }),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const fileName = `${card.basicInfo.name.replace(
      /\s+/g,
      '_',
    )}_BusinessCard.json`;
    const directory =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.DownloadDirectoryPath;
    const filePath = `${directory}/${fileName}`;

    await RNFS.writeFile(filePath, jsonString, 'utf8');

    return {
      success: true,
      filePath,
      fileName,
    };
  } catch (error) {
    console.error('JSON export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export business card as CSV
 */
export const exportToCSV = async (
  cards: BusinessCard[],
): Promise<ExportResult> => {
  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return { success: false, error: 'Storage permission denied' };
    }

    // CSV headers
    const headers = [
      'Name',
      'Title',
      'Company',
      'Email',
      'Phone',
      'Location',
      'Bio',
      'Website',
      'LinkedIn',
      'Twitter',
      'GitHub',
      'Funding Stage',
      'Team Size',
      'Industry',
      'Created At',
    ];

    // Convert cards to CSV rows
    const rows = cards.map(card => [
      card.basicInfo.name,
      card.basicInfo.title,
      card.basicInfo.company,
      card.basicInfo.email,
      card.basicInfo.phone || '',
      card.basicInfo.location || '',
      (card.basicInfo.bio || '').replace(/"/g, '""'), // Escape quotes
      card.socialLinks.website || '',
      card.socialLinks.linkedin || '',
      card.socialLinks.twitter || '',
      card.socialLinks.github || '',
      card.startupInfo?.fundingStage || '',
      card.startupInfo?.teamSize || '',
      card.startupInfo?.industry.join('; ') || '',
      card.createdAt,
    ]);

    // Create CSV content
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const fileName = `BusinessCards_Export_${new Date().getTime()}.csv`;
    const directory =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.DownloadDirectoryPath;
    const filePath = `${directory}/${fileName}`;

    await RNFS.writeFile(filePath, csvContent, 'utf8');

    return {
      success: true,
      filePath,
      fileName,
    };
  } catch (error) {
    console.error('CSV export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Main export function
 */
export const exportBusinessCard = async (
  card: BusinessCard | BusinessCard[],
  format: ExportFormat,
  options: ExportOptions,
  viewRef?: any,
): Promise<ExportResult> => {
  switch (format) {
    case 'pdf':
      if (Array.isArray(card)) {
        return {
          success: false,
          error: 'PDF export supports single card only',
        };
      }
      return exportToPDF(card, options);

    case 'png':
      if (Array.isArray(card)) {
        return {
          success: false,
          error: 'PNG export supports single card only',
        };
      }
      return exportToImage(viewRef, card, 'png', 1.0);

    case 'jpg':
      if (Array.isArray(card)) {
        return {
          success: false,
          error: 'JPG export supports single card only',
        };
      }
      return exportToImage(viewRef, card, 'jpg', 0.9);

    case 'vcf':
      if (Array.isArray(card)) {
        return {
          success: false,
          error: 'vCard export supports single card only',
        };
      }
      return exportToVCard(card);

    case 'json':
      if (Array.isArray(card)) {
        return {
          success: false,
          error: 'JSON export supports single card only',
        };
      }
      return exportToJSON(card, options.includeAnalytics);

    case 'csv':
      const cards = Array.isArray(card) ? card : [card];
      return exportToCSV(cards);

    default:
      return { success: false, error: `Unsupported format: ${format}` };
  }
};

/**
 * Share exported file
 */
export const shareExportedFile = async (
  result: ExportResult,
): Promise<boolean> => {
  if (!result.success || !result.filePath) {
    Alert.alert('Export Error', 'No file to share');
    return false;
  }

  try {
    await Share.open({
      url: `file://${result.filePath}`,
      title: result.fileName,
      message: `Exported business card: ${result.fileName}`,
    });
    return true;
  } catch (error) {
    if (error.message !== 'User did not share') {
      console.error('Share failed:', error);
      Alert.alert('Share Error', 'Failed to share exported file');
    }
    return false;
  }
};

/**
 * Get export directory path
 */
export const getExportDirectory = (): string => {
  return Platform.OS === 'ios'
    ? RNFS.DocumentDirectoryPath
    : RNFS.DownloadDirectoryPath;
};

/**
 * Clean up temporary export files
 */
export const cleanupExportFiles = async (): Promise<void> => {
  try {
    const cacheDir = RNFS.CachesDirectoryPath;
    const files = await RNFS.readDir(cacheDir);

    // Clean up files older than 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (
        file.name.includes('BusinessCard') &&
        file.mtime &&
        new Date(file.mtime).getTime() < oneDayAgo
      ) {
        await RNFS.unlink(file.path);
      }
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
};
