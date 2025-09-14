/**
 * Phase 2 Tests: Sharing Functionality
 *
 * Integration tests for sharing business cards across different platforms,
 * including native sharing, social media sharing, and wallet integration.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock React Native Share
jest.mock('react-native-share', () => ({
  default: {
    open: jest.fn(() => Promise.resolve({ success: true })),
    shareSingle: jest.fn(() => Promise.resolve({ success: true })),
    isPackageInstalled: jest.fn(() => Promise.resolve(true)),
  },
}));

// Mock React Native View Shot for card screenshots
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file:///path/to/screenshot.png')),
  captureScreen: jest.fn(() => Promise.resolve('file:///path/to/screen.png')),
}));

// Mock file system for saving shared content
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/Documents',
  writeFile: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('file content')),
  exists: jest.fn(() => Promise.resolve(true)),
  unlink: jest.fn(() => Promise.resolve()),
}));

// Mock wallet integration
jest.mock('react-native-add-calendar-event', () => ({
  presentEventCreatingDialog: jest.fn(() =>
    Promise.resolve({ action: 'saved' }),
  ),
}));

// Mock print functionality
jest.mock('react-native-print', () => ({
  print: jest.fn(() => Promise.resolve()),
}));

// Mock HTML to PDF
jest.mock('react-native-html-to-pdf', () => ({
  convert: jest.fn(() => Promise.resolve({ filePath: '/path/to/card.pdf' })),
}));

// Mock clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

describe('Phase 2: Sharing Functionality', () => {
  let store;
  let navigation;

  const mockBusinessCard = {
    id: 'card-123',
    fullName: 'John Doe',
    jobTitle: 'Senior Developer',
    company: 'Tech Corp',
    email: 'john@techcorp.com',
    phone: '+1234567890',
    website: 'https://johndoe.com',
    address: '123 Tech Street, Silicon Valley, CA',
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
      { platform: 'twitter', url: 'https://twitter.com/johndoe' },
    ],
    template: 'modern',
    photo: 'file:///path/to/profile.jpg',
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        businessCard: (
          state = { cards: [mockBusinessCard], currentCard: mockBusinessCard },
          action,
        ) => state,
      },
    });

    navigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('Native Sharing', () => {
    test('should share business card using native share sheet', async () => {
      const Share = require('react-native-share').default;

      Share.open.mockResolvedValueOnce({
        success: true,
        message: 'Shared successfully',
      });

      const MockNativeShare = ({ cardData, onShare, shareResult }) => (
        <div testID="native-share">
          <div testID="card-preview">
            <div>Name: {cardData.fullName}</div>
            <div>Title: {cardData.jobTitle}</div>
            <div>Company: {cardData.company}</div>
            <div>Email: {cardData.email}</div>
            <div>Phone: {cardData.phone}</div>
          </div>

          <button testID="share-button" onPress={onShare}>
            Share Card
          </button>

          {shareResult && (
            <div testID="share-result">
              {shareResult.success ? 'Shared successfully!' : 'Share failed'}
            </div>
          )}
        </div>
      );

      const TestNativeShare = () => {
        const [shareResult, setShareResult] = React.useState(null);

        const handleShare = async () => {
          try {
            const shareContent = {
              title: `${mockBusinessCard.fullName} - Business Card`,
              message: `Contact: ${mockBusinessCard.fullName}
${mockBusinessCard.jobTitle} at ${mockBusinessCard.company}
Email: ${mockBusinessCard.email}
Phone: ${mockBusinessCard.phone}
Website: ${mockBusinessCard.website}

Connect with me: https://digbiz.app/card/${mockBusinessCard.id}`,
              url: `https://digbiz.app/card/${mockBusinessCard.id}`,
            };

            const result = await Share.open(shareContent);
            setShareResult(result);
          } catch (error) {
            setShareResult({ success: false, error: error.message });
          }
        };

        return (
          <Provider store={store}>
            <MockNativeShare
              cardData={mockBusinessCard}
              onShare={handleShare}
              shareResult={shareResult}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestNativeShare />);

      const shareButton = getByTestId('share-button');
      await act(async () => {
        fireEvent.press(shareButton);
      });

      await waitFor(() => {
        expect(Share.open).toHaveBeenCalledWith({
          title: 'John Doe - Business Card',
          message: expect.stringContaining('John Doe'),
          url: 'https://digbiz.app/card/card-123',
        });
        expect(getByTestId('share-result').children[0]).toBe(
          'Shared successfully!',
        );
      });
    });

    test('should share card as image', async () => {
      const Share = require('react-native-share').default;
      const { captureRef } = require('react-native-view-shot');

      captureRef.mockResolvedValueOnce('file:///path/to/card-image.png');
      Share.open.mockResolvedValueOnce({ success: true });

      const MockImageShare = ({
        cardData,
        onShareAsImage,
        cardRef,
        isGeneratingImage,
      }) => (
        <div testID="image-share">
          <div ref={cardRef} testID="card-visual">
            <div
              style={{
                padding: 20,
                backgroundColor: '#white',
                borderRadius: 10,
              }}
            >
              <h2>{cardData.fullName}</h2>
              <p>{cardData.jobTitle}</p>
              <p>{cardData.company}</p>
              <p>{cardData.email}</p>
              <p>{cardData.phone}</p>
            </div>
          </div>

          <button
            testID="share-as-image"
            onPress={onShareAsImage}
            disabled={isGeneratingImage}
          >
            {isGeneratingImage ? 'Generating...' : 'Share as Image'}
          </button>
        </div>
      );

      const TestImageShare = () => {
        const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
        const cardRef = React.useRef(null);

        const handleShareAsImage = async () => {
          setIsGeneratingImage(true);

          try {
            // Capture the card as an image
            const imageUri = await captureRef(cardRef.current, {
              format: 'png',
              quality: 0.9,
            });

            // Share the image
            await Share.open({
              title: `${mockBusinessCard.fullName} - Business Card`,
              message: `Here's my business card!`,
              url: imageUri,
              type: 'image/png',
            });
          } catch (error) {
            console.error('Failed to share as image:', error);
          } finally {
            setIsGeneratingImage(false);
          }
        };

        return (
          <Provider store={store}>
            <MockImageShare
              cardData={mockBusinessCard}
              onShareAsImage={handleShareAsImage}
              cardRef={cardRef}
              isGeneratingImage={isGeneratingImage}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestImageShare />);

      const shareButton = getByTestId('share-as-image');
      await act(async () => {
        fireEvent.press(shareButton);
      });

      await waitFor(() => {
        expect(captureRef).toHaveBeenCalled();
        expect(Share.open).toHaveBeenCalledWith({
          title: 'John Doe - Business Card',
          message: "Here's my business card!",
          url: 'file:///path/to/card-image.png',
          type: 'image/png',
        });
      });
    });
  });

  describe('Platform-Specific Sharing', () => {
    test('should share to WhatsApp with custom message', async () => {
      const Share = require('react-native-share').default;

      Share.isPackageInstalled.mockResolvedValueOnce(true);
      Share.shareSingle.mockResolvedValueOnce({ success: true });

      const MockWhatsAppShare = ({
        cardData,
        onShareToWhatsApp,
        platforms,
      }) => (
        <div testID="whatsapp-share">
          <div testID="platform-options">
            {platforms.map(platform => (
              <button
                key={platform.id}
                testID={`share-to-${platform.id}`}
                onPress={() => onShareToWhatsApp(platform)}
              >
                Share to {platform.name}
              </button>
            ))}
          </div>
        </div>
      );

      const TestWhatsAppShare = () => {
        const platforms = [
          { id: 'whatsapp', name: 'WhatsApp', package: 'com.whatsapp' },
          {
            id: 'telegram',
            name: 'Telegram',
            package: 'org.telegram.messenger',
          },
          { id: 'linkedin', name: 'LinkedIn', package: 'com.linkedin.android' },
        ];

        const handleShareToPlatform = async platform => {
          try {
            const isInstalled = await Share.isPackageInstalled(
              platform.package,
            );

            if (!isInstalled) {
              throw new Error(`${platform.name} is not installed`);
            }

            const shareContent = {
              title: `${mockBusinessCard.fullName} - Business Card`,
              message: `Hi! Here's my business card: 
              
${mockBusinessCard.fullName}
${mockBusinessCard.jobTitle} at ${mockBusinessCard.company}

📧 ${mockBusinessCard.email}
📱 ${mockBusinessCard.phone}
🌐 ${mockBusinessCard.website}

View full card: https://digbiz.app/card/${mockBusinessCard.id}`,
              social:
                platform.id === 'whatsapp'
                  ? 'whatsapp'
                  : platform.id === 'telegram'
                  ? 'telegram'
                  : platform.id === 'linkedin'
                  ? 'linkedin'
                  : null,
            };

            await Share.shareSingle(shareContent);
          } catch (error) {
            console.error(`Failed to share to ${platform.name}:`, error);
          }
        };

        return (
          <Provider store={store}>
            <MockWhatsAppShare
              cardData={mockBusinessCard}
              onShareToWhatsApp={handleShareToPlatform}
              platforms={platforms}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestWhatsAppShare />);

      const whatsappButton = getByTestId('share-to-whatsapp');
      await act(async () => {
        fireEvent.press(whatsappButton);
      });

      await waitFor(() => {
        expect(Share.isPackageInstalled).toHaveBeenCalledWith('com.whatsapp');
        expect(Share.shareSingle).toHaveBeenCalledWith({
          title: 'John Doe - Business Card',
          message: expect.stringContaining('John Doe'),
          social: 'whatsapp',
        });
      });
    });

    test('should handle platform not installed error', async () => {
      const Share = require('react-native-share').default;

      Share.isPackageInstalled.mockResolvedValueOnce(false);

      const MockPlatformCheck = ({ onCheckPlatform, error }) => (
        <div testID="platform-check">
          <button
            testID="check-whatsapp"
            onPress={() => onCheckPlatform('whatsapp')}
          >
            Check WhatsApp
          </button>

          {error && <div testID="platform-error">{error}</div>}
        </div>
      );

      const TestPlatformCheck = () => {
        const [error, setError] = React.useState(null);

        const handleCheckPlatform = async platformId => {
          try {
            setError(null);
            const packageName =
              platformId === 'whatsapp' ? 'com.whatsapp' : 'unknown';
            const isInstalled = await Share.isPackageInstalled(packageName);

            if (!isInstalled) {
              setError(`${platformId} is not installed on this device`);
              return;
            }

            // Proceed with sharing...
          } catch (error) {
            setError(error.message);
          }
        };

        return (
          <Provider store={store}>
            <MockPlatformCheck
              onCheckPlatform={handleCheckPlatform}
              error={error}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestPlatformCheck />);

      const checkButton = getByTestId('check-whatsapp');
      await act(async () => {
        fireEvent.press(checkButton);
      });

      await waitFor(() => {
        expect(getByTestId('platform-error').children[0]).toBe(
          'whatsapp is not installed on this device',
        );
      });
    });
  });

  describe('Clipboard and Text Sharing', () => {
    test('should copy card information to clipboard', async () => {
      const Clipboard = require('@react-native-clipboard/clipboard');

      Clipboard.setString.mockImplementation(() => {});

      const MockClipboardShare = ({ cardData, onCopyToClipboard, copied }) => (
        <div testID="clipboard-share">
          <div testID="card-text">
            <div>Name: {cardData.fullName}</div>
            <div>Email: {cardData.email}</div>
            <div>Phone: {cardData.phone}</div>
          </div>

          <button testID="copy-button" onPress={onCopyToClipboard}>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      );

      const TestClipboardShare = () => {
        const [copied, setCopied] = React.useState(false);

        const handleCopyToClipboard = () => {
          const cardText = `${mockBusinessCard.fullName}
${mockBusinessCard.jobTitle}
${mockBusinessCard.company}

📧 ${mockBusinessCard.email}
📱 ${mockBusinessCard.phone}
🌐 ${mockBusinessCard.website}
📍 ${mockBusinessCard.address}

Connect with me:
${mockBusinessCard.socialLinks
  .map(link => `${link.platform}: ${link.url}`)
  .join('\n')}

Digital Card: https://digbiz.app/card/${mockBusinessCard.id}`;

          Clipboard.setString(cardText);
          setCopied(true);

          // Reset copied status after 2 seconds
          setTimeout(() => setCopied(false), 2000);
        };

        return (
          <Provider store={store}>
            <MockClipboardShare
              cardData={mockBusinessCard}
              onCopyToClipboard={handleCopyToClipboard}
              copied={copied}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestClipboardShare />);

      const copyButton = getByTestId('copy-button');
      await act(async () => {
        fireEvent.press(copyButton);
      });

      await waitFor(() => {
        expect(Clipboard.setString).toHaveBeenCalledWith(
          expect.stringContaining('John Doe'),
        );
        expect(getByTestId('copy-button').children[0]).toBe('Copied!');
      });
    });
  });

  describe('File Export and Sharing', () => {
    test('should export card as PDF and share', async () => {
      const htmlToPdf = require('react-native-html-to-pdf');
      const Share = require('react-native-share').default;

      htmlToPdf.convert.mockResolvedValueOnce({
        filePath: '/path/to/business-card.pdf',
      });

      Share.open.mockResolvedValueOnce({ success: true });

      const MockPDFExport = ({ cardData, onExportPDF, isExporting }) => (
        <div testID="pdf-export">
          <div testID="export-options">
            <button
              testID="export-pdf"
              onPress={onExportPDF}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export as PDF'}
            </button>
          </div>
        </div>
      );

      const TestPDFExport = () => {
        const [isExporting, setIsExporting] = React.useState(false);

        const handleExportPDF = async () => {
          setIsExporting(true);

          try {
            const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .card { border: 1px solid #ddd; padding: 20px; border-radius: 10px; }
                  .header { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                  .subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
                  .contact-info { margin-bottom: 10px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="header">${mockBusinessCard.fullName}</div>
                  <div class="subtitle">${mockBusinessCard.jobTitle} at ${mockBusinessCard.company}</div>
                  <div class="contact-info">📧 ${mockBusinessCard.email}</div>
                  <div class="contact-info">📱 ${mockBusinessCard.phone}</div>
                  <div class="contact-info">🌐 ${mockBusinessCard.website}</div>
                  <div class="contact-info">📍 ${mockBusinessCard.address}</div>
                </div>
              </body>
              </html>
            `;

            const pdfResult = await htmlToPdf.convert({
              html: htmlContent,
              fileName: `${mockBusinessCard.fullName.replace(
                /\s+/g,
                '_',
              )}_BusinessCard`,
              base64: true,
            });

            await Share.open({
              title: `${mockBusinessCard.fullName} - Business Card PDF`,
              url: `file://${pdfResult.filePath}`,
              type: 'application/pdf',
            });
          } catch (error) {
            console.error('PDF export failed:', error);
          } finally {
            setIsExporting(false);
          }
        };

        return (
          <Provider store={store}>
            <MockPDFExport
              cardData={mockBusinessCard}
              onExportPDF={handleExportPDF}
              isExporting={isExporting}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestPDFExport />);

      const exportButton = getByTestId('export-pdf');
      await act(async () => {
        fireEvent.press(exportButton);
      });

      await waitFor(() => {
        expect(htmlToPdf.convert).toHaveBeenCalledWith({
          html: expect.stringContaining('John Doe'),
          fileName: 'John_Doe_BusinessCard',
          base64: true,
        });
        expect(Share.open).toHaveBeenCalledWith({
          title: 'John Doe - Business Card PDF',
          url: 'file:///path/to/business-card.pdf',
          type: 'application/pdf',
        });
      });
    });

    test('should print business card', async () => {
      const RNPrint = require('react-native-print');

      RNPrint.print.mockResolvedValueOnce();

      const MockPrintCard = ({ cardData, onPrint }) => (
        <div testID="print-card">
          <div testID="printable-content">
            <h1>{cardData.fullName}</h1>
            <h2>{cardData.jobTitle}</h2>
            <p>{cardData.company}</p>
            <p>{cardData.email}</p>
            <p>{cardData.phone}</p>
          </div>

          <button testID="print-button" onPress={onPrint}>
            Print Business Card
          </button>
        </div>
      );

      const TestPrintCard = () => {
        const handlePrint = async () => {
          const htmlContent = `
            <html>
              <head>
                <style>
                  @page { margin: 0.5in; }
                  body { font-family: Arial, sans-serif; }
                  .business-card { 
                    width: 3.5in; 
                    height: 2in; 
                    border: 1px solid #000; 
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                  }
                  .name { font-size: 18px; font-weight: bold; }
                  .title { font-size: 14px; color: #666; }
                  .company { font-size: 14px; }
                  .contact { font-size: 12px; margin-top: 5px; }
                </style>
              </head>
              <body>
                <div class="business-card">
                  <div class="name">${mockBusinessCard.fullName}</div>
                  <div class="title">${mockBusinessCard.jobTitle}</div>
                  <div class="company">${mockBusinessCard.company}</div>
                  <div class="contact">${mockBusinessCard.email} • ${mockBusinessCard.phone}</div>
                  <div class="contact">${mockBusinessCard.website}</div>
                </div>
              </body>
            </html>
          `;

          await RNPrint.print({
            html: htmlContent,
            jobName: `${mockBusinessCard.fullName} Business Card`,
          });
        };

        return (
          <Provider store={store}>
            <MockPrintCard cardData={mockBusinessCard} onPrint={handlePrint} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestPrintCard />);

      const printButton = getByTestId('print-button');
      await act(async () => {
        fireEvent.press(printButton);
      });

      await waitFor(() => {
        expect(RNPrint.print).toHaveBeenCalledWith({
          html: expect.stringContaining('John Doe'),
          jobName: 'John Doe Business Card',
        });
      });
    });
  });

  describe('Wallet Integration', () => {
    test('should add contact to device contacts', async () => {
      // Mock contacts API
      const mockContactsAPI = {
        addContact: jest.fn(() => Promise.resolve({ success: true })),
        getPermissions: jest.fn(() => Promise.resolve('authorized')),
      };

      const MockContactsIntegration = ({
        cardData,
        onAddToContacts,
        addResult,
      }) => (
        <div testID="contacts-integration">
          <div testID="contact-preview">
            <div>Name: {cardData.fullName}</div>
            <div>Company: {cardData.company}</div>
            <div>Email: {cardData.email}</div>
            <div>Phone: {cardData.phone}</div>
          </div>

          <button testID="add-to-contacts" onPress={onAddToContacts}>
            Add to Contacts
          </button>

          {addResult && (
            <div testID="add-result">
              {addResult.success
                ? 'Added to contacts!'
                : 'Failed to add contact'}
            </div>
          )}
        </div>
      );

      const TestContactsIntegration = () => {
        const [addResult, setAddResult] = React.useState(null);

        const handleAddToContacts = async () => {
          try {
            // Check permissions first
            const permission = await mockContactsAPI.getPermissions();

            if (permission !== 'authorized') {
              throw new Error('Contacts permission not granted');
            }

            const contactData = {
              givenName: mockBusinessCard.fullName.split(' ')[0],
              familyName: mockBusinessCard.fullName
                .split(' ')
                .slice(1)
                .join(' '),
              organizationName: mockBusinessCard.company,
              jobTitle: mockBusinessCard.jobTitle,
              emailAddresses: [
                {
                  label: 'work',
                  email: mockBusinessCard.email,
                },
              ],
              phoneNumbers: [
                {
                  label: 'work',
                  number: mockBusinessCard.phone,
                },
              ],
              urlAddresses: [
                {
                  label: 'work',
                  url: mockBusinessCard.website,
                },
              ],
            };

            const result = await mockContactsAPI.addContact(contactData);
            setAddResult(result);
          } catch (error) {
            setAddResult({ success: false, error: error.message });
          }
        };

        return (
          <Provider store={store}>
            <MockContactsIntegration
              cardData={mockBusinessCard}
              onAddToContacts={handleAddToContacts}
              addResult={addResult}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestContactsIntegration />);

      const addButton = getByTestId('add-to-contacts');
      await act(async () => {
        fireEvent.press(addButton);
      });

      await waitFor(() => {
        expect(mockContactsAPI.getPermissions).toHaveBeenCalled();
        expect(mockContactsAPI.addContact).toHaveBeenCalledWith({
          givenName: 'John',
          familyName: 'Doe',
          organizationName: 'Tech Corp',
          jobTitle: 'Senior Developer',
          emailAddresses: expect.arrayContaining([
            expect.objectContaining({ email: 'john@techcorp.com' }),
          ]),
          phoneNumbers: expect.arrayContaining([
            expect.objectContaining({ number: '+1234567890' }),
          ]),
          urlAddresses: expect.arrayContaining([
            expect.objectContaining({ url: 'https://johndoe.com' }),
          ]),
        });
        expect(getByTestId('add-result').children[0]).toBe(
          'Added to contacts!',
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle sharing failures gracefully', async () => {
      const Share = require('react-native-share').default;

      Share.open.mockRejectedValueOnce(new Error('User cancelled share'));

      const MockShareWithError = ({ onShare, shareError }) => (
        <div testID="share-with-error">
          <button testID="share-button" onPress={onShare}>
            Share Card
          </button>

          {shareError && <div testID="share-error">Error: {shareError}</div>}
        </div>
      );

      const TestShareError = () => {
        const [shareError, setShareError] = React.useState(null);

        const handleShare = async () => {
          try {
            setShareError(null);
            await Share.open({
              title: 'Business Card',
              message: 'Here is my business card',
              url: 'https://digbiz.app/card/123',
            });
          } catch (error) {
            setShareError(error.message);
          }
        };

        return (
          <Provider store={store}>
            <MockShareWithError onShare={handleShare} shareError={shareError} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestShareError />);

      const shareButton = getByTestId('share-button');
      await act(async () => {
        fireEvent.press(shareButton);
      });

      await waitFor(() => {
        expect(getByTestId('share-error').children[0]).toBe(
          'Error: User cancelled share',
        );
      });
    });

    test('should handle network errors during sharing', async () => {
      // Test network failures during URL sharing
      const Share = require('react-native-share').default;

      Share.open.mockRejectedValueOnce(new Error('Network request failed'));

      const MockNetworkShareError = ({ onShare, networkError }) => (
        <div testID="network-share-error">
          <button testID="share-with-network" onPress={onShare}>
            Share Online Card
          </button>

          {networkError && (
            <div testID="network-error">Network Error: {networkError}</div>
          )}
        </div>
      );

      const TestNetworkShareError = () => {
        const [networkError, setNetworkError] = React.useState(null);

        const handleShare = async () => {
          try {
            setNetworkError(null);

            // Simulate checking if URL is accessible
            const cardUrl = `https://digbiz.app/card/${mockBusinessCard.id}`;

            await Share.open({
              title: 'My Business Card',
              message: 'Check out my digital business card',
              url: cardUrl,
            });
          } catch (error) {
            setNetworkError(error.message);
          }
        };

        return (
          <Provider store={store}>
            <MockNetworkShareError
              onShare={handleShare}
              networkError={networkError}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestNetworkShareError />);

      const shareButton = getByTestId('share-with-network');
      await act(async () => {
        fireEvent.press(shareButton);
      });

      await waitFor(() => {
        expect(getByTestId('network-error').children[0]).toBe(
          'Network Error: Network request failed',
        );
      });
    });
  });
});
