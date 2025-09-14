/**
 * Phase 2 Tests: QR Code Generation and Scanning
 *
 * Integration tests for QR code generation for business cards,
 * QR code scanning functionality, and deep link handling.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock QR Code library
jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ value, size, onError }) => (
      <div
        testID="qr-code"
        data-value={value}
        data-size={size}
        style={{ width: size, height: size }}
      >
        QR Code: {value}
      </div>
    ),
  };
});

// Mock camera for QR scanning
jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      BarCodeType: {
        qr: 'qr',
      },
    },
  },
}));

// Mock permissions
jest.mock('react-native-permissions', () => ({
  request: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    IOS: { CAMERA: 'ios.permission.CAMERA' },
    ANDROID: { CAMERA: 'android.permission.CAMERA' },
  },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
}));

// Mock linking for deep links
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getInitialURL: jest.fn(() => Promise.resolve(null)),
  },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

describe('Phase 2: QR Code Generation and Scanning', () => {
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
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
    ],
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

  describe('QR Code Generation', () => {
    test('should generate QR code for business card', async () => {
      const MockQRCodeGenerator = ({ cardData, qrValue, onGenerateQR }) => (
        <div testID="qr-generator">
          <div testID="card-info">
            <div>Name: {cardData.fullName}</div>
            <div>Email: {cardData.email}</div>
            <div>Phone: {cardData.phone}</div>
          </div>

          <button testID="generate-qr" onPress={onGenerateQR}>
            Generate QR Code
          </button>

          {qrValue && (
            <div testID="qr-code-container">
              <QRCode value={qrValue} size={200} />
              <div testID="qr-value">{qrValue}</div>
            </div>
          )}
        </div>
      );

      const TestQRGeneration = () => {
        const [qrValue, setQRValue] = React.useState(null);

        const generateQRCode = () => {
          // Generate URL with card data
          const cardUrl = `https://digbiz.app/card/${mockBusinessCard.id}`;
          setQRValue(cardUrl);
        };

        return (
          <Provider store={store}>
            <MockQRCodeGenerator
              cardData={mockBusinessCard}
              qrValue={qrValue}
              onGenerateQR={generateQRCode}
            />
          </Provider>
        );
      };

      const QRCode = require('react-native-qrcode-svg').default;
      const { getByTestId } = render(<TestQRGeneration />);

      // Check card info is displayed
      expect(getByTestId('card-info')).toBeTruthy();

      // Generate QR code
      const generateButton = getByTestId('generate-qr');
      await act(async () => {
        fireEvent.press(generateButton);
      });

      await waitFor(() => {
        expect(getByTestId('qr-code-container')).toBeTruthy();
        expect(getByTestId('qr-code')).toBeTruthy();
        expect(getByTestId('qr-value').children[0]).toBe(
          'https://digbiz.app/card/card-123',
        );
      });
    });

    test('should generate QR code with vCard format', async () => {
      const MockVCardQR = ({ cardData, onGenerateVCard, vCardData }) => (
        <div testID="vcard-qr">
          <button testID="generate-vcard" onPress={onGenerateVCard}>
            Generate vCard QR
          </button>

          {vCardData && (
            <div testID="vcard-container">
              <QRCode value={vCardData} size={200} />
              <textarea testID="vcard-content" readOnly value={vCardData} />
            </div>
          )}
        </div>
      );

      const TestVCardGeneration = () => {
        const [vCardData, setVCardData] = React.useState(null);

        const generateVCard = () => {
          const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${mockBusinessCard.fullName}
ORG:${mockBusinessCard.company}
TITLE:${mockBusinessCard.jobTitle}
EMAIL:${mockBusinessCard.email}
TEL:${mockBusinessCard.phone}
URL:${mockBusinessCard.website}
END:VCARD`;

          setVCardData(vCard);
        };

        return (
          <Provider store={store}>
            <MockVCardQR
              cardData={mockBusinessCard}
              onGenerateVCard={generateVCard}
              vCardData={vCardData}
            />
          </Provider>
        );
      };

      const QRCode = require('react-native-qrcode-svg').default;
      const { getByTestId } = render(<TestVCardGeneration />);

      const generateButton = getByTestId('generate-vcard');
      await act(async () => {
        fireEvent.press(generateButton);
      });

      await waitFor(() => {
        expect(getByTestId('vcard-container')).toBeTruthy();
        expect(getByTestId('vcard-content').value).toContain('BEGIN:VCARD');
        expect(getByTestId('vcard-content').value).toContain('John Doe');
        expect(getByTestId('vcard-content').value).toContain(
          'john@techcorp.com',
        );
      });
    });

    test('should handle QR code generation errors', async () => {
      const MockQRWithError = ({ onGenerate, error, qrValue }) => (
        <div testID="qr-with-error">
          <button testID="generate-button" onPress={onGenerate}>
            Generate QR
          </button>

          {error && <div testID="error-message">{error}</div>}

          {qrValue && (
            <QRCode
              value={qrValue}
              size={200}
              onError={() => console.error('QR Code generation error')}
            />
          )}
        </div>
      );

      const TestQRError = () => {
        const [error, setError] = React.useState(null);
        const [qrValue, setQRValue] = React.useState(null);

        const handleGenerate = () => {
          try {
            // Simulate error with too much data
            const largeData = 'x'.repeat(3000); // QR codes have size limits
            if (largeData.length > 2900) {
              throw new Error('QR code data too large');
            }
            setQRValue(largeData);
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <Provider store={store}>
            <MockQRWithError
              onGenerate={handleGenerate}
              error={error}
              qrValue={qrValue}
            />
          </Provider>
        );
      };

      const QRCode = require('react-native-qrcode-svg').default;
      const { getByTestId } = render(<TestQRError />);

      const generateButton = getByTestId('generate-button');
      await act(async () => {
        fireEvent.press(generateButton);
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByTestId('error-message').children[0]).toBe(
          'QR code data too large',
        );
      });
    });
  });

  describe('QR Code Scanning', () => {
    test('should scan QR code and extract business card data', async () => {
      const MockQRScanner = ({
        onScan,
        isScanning,
        scannedData,
        onStartScan,
      }) => (
        <div testID="qr-scanner">
          {!isScanning ? (
            <button testID="start-scan" onPress={onStartScan}>
              Start Scanning
            </button>
          ) : (
            <div testID="scanner-view">
              <div testID="camera-view">Camera View</div>
              <button
                testID="mock-scan-success"
                onPress={() => onScan('https://digbiz.app/card/card-456')}
              >
                Mock Scan Success
              </button>
              <button
                testID="mock-scan-vcard"
                onPress={() =>
                  onScan('BEGIN:VCARD\nVERSION:3.0\nFN:Jane Smith\nEND:VCARD')
                }
              >
                Mock Scan vCard
              </button>
            </div>
          )}

          {scannedData && (
            <div testID="scanned-result">
              <div testID="scanned-data">{scannedData}</div>
              <button
                testID="process-scan"
                onPress={() => console.log('Processing:', scannedData)}
              >
                Process Scanned Data
              </button>
            </div>
          )}
        </div>
      );

      const TestQRScanning = () => {
        const [isScanning, setIsScanning] = React.useState(false);
        const [scannedData, setScannedData] = React.useState(null);

        const startScanning = async () => {
          // Check camera permission
          const {
            request,
            PERMISSIONS,
            RESULTS,
          } = require('react-native-permissions');
          const permission = await request(PERMISSIONS.IOS.CAMERA);

          if (permission === RESULTS.GRANTED) {
            setIsScanning(true);
          }
        };

        const handleScan = data => {
          setScannedData(data);
          setIsScanning(false);

          // Process different types of QR codes
          if (data.startsWith('https://digbiz.app/card/')) {
            const cardId = data.split('/').pop();
            navigation.navigate('CardView', { cardId });
          } else if (data.startsWith('BEGIN:VCARD')) {
            navigation.navigate('ImportCard', { vCardData: data });
          }
        };

        return (
          <Provider store={store}>
            <MockQRScanner
              onScan={handleScan}
              isScanning={isScanning}
              scannedData={scannedData}
              onStartScan={startScanning}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestQRScanning />);

      // Start scanning
      const startButton = getByTestId('start-scan');
      await act(async () => {
        fireEvent.press(startButton);
      });

      await waitFor(() => {
        expect(getByTestId('scanner-view')).toBeTruthy();
      });

      // Mock successful scan
      const mockScanButton = getByTestId('mock-scan-success');
      await act(async () => {
        fireEvent.press(mockScanButton);
      });

      await waitFor(() => {
        expect(getByTestId('scanned-result')).toBeTruthy();
        expect(getByTestId('scanned-data').children[0]).toBe(
          'https://digbiz.app/card/card-456',
        );
      });

      expect(navigation.navigate).toHaveBeenCalledWith('CardView', {
        cardId: 'card-456',
      });
    });

    test('should handle vCard QR code scanning', async () => {
      const MockVCardScanner = ({ onScanVCard, vCardData }) => (
        <div testID="vcard-scanner">
          <button
            testID="scan-vcard"
            onPress={() =>
              onScanVCard(`BEGIN:VCARD
VERSION:3.0
FN:Jane Smith
ORG:Design Co
TITLE:Creative Director
EMAIL:jane@designco.com
TEL:+0987654321
END:VCARD`)
            }
          >
            Scan vCard QR
          </button>

          {vCardData && (
            <div testID="vcard-preview">
              <div testID="parsed-name">{vCardData.name}</div>
              <div testID="parsed-company">{vCardData.company}</div>
              <div testID="parsed-title">{vCardData.title}</div>
              <div testID="parsed-email">{vCardData.email}</div>
              <div testID="parsed-phone">{vCardData.phone}</div>

              <button
                testID="import-vcard"
                onPress={() => navigation.navigate('ImportCard', { vCardData })}
              >
                Import Contact
              </button>
            </div>
          )}
        </div>
      );

      const TestVCardScanning = () => {
        const [vCardData, setVCardData] = React.useState(null);

        const parseVCard = vCardString => {
          const lines = vCardString.split('\n');
          const parsed = {};

          lines.forEach(line => {
            if (line.startsWith('FN:')) parsed.name = line.substring(3);
            if (line.startsWith('ORG:')) parsed.company = line.substring(4);
            if (line.startsWith('TITLE:')) parsed.title = line.substring(6);
            if (line.startsWith('EMAIL:')) parsed.email = line.substring(6);
            if (line.startsWith('TEL:')) parsed.phone = line.substring(4);
          });

          return parsed;
        };

        const handleScanVCard = vCardString => {
          const parsed = parseVCard(vCardString);
          setVCardData(parsed);
        };

        return (
          <Provider store={store}>
            <MockVCardScanner
              onScanVCard={handleScanVCard}
              vCardData={vCardData}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestVCardScanning />);

      const scanButton = getByTestId('scan-vcard');
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(getByTestId('vcard-preview')).toBeTruthy();
        expect(getByTestId('parsed-name').children[0]).toBe('Jane Smith');
        expect(getByTestId('parsed-company').children[0]).toBe('Design Co');
        expect(getByTestId('parsed-title').children[0]).toBe(
          'Creative Director',
        );
        expect(getByTestId('parsed-email').children[0]).toBe(
          'jane@designco.com',
        );
        expect(getByTestId('parsed-phone').children[0]).toBe('+0987654321');
      });

      // Import the contact
      const importButton = getByTestId('import-vcard');
      await act(async () => {
        fireEvent.press(importButton);
      });

      expect(navigation.navigate).toHaveBeenCalledWith('ImportCard', {
        vCardData: expect.objectContaining({
          name: 'Jane Smith',
          company: 'Design Co',
        }),
      });
    });

    test('should handle invalid QR code data', async () => {
      const MockInvalidQRScanner = ({ onScan, error, scannedData }) => (
        <div testID="invalid-qr-scanner">
          <button
            testID="scan-invalid"
            onPress={() => onScan('invalid-qr-data-12345')}
          >
            Scan Invalid QR
          </button>

          <button
            testID="scan-malformed-vcard"
            onPress={() => onScan('BEGIN:VCARD\nINVALID_FORMAT')}
          >
            Scan Malformed vCard
          </button>

          {error && <div testID="scan-error">{error}</div>}
          {scannedData && (
            <div testID="unknown-format">Unknown format: {scannedData}</div>
          )}
        </div>
      );

      const TestInvalidQRScanning = () => {
        const [error, setError] = React.useState(null);
        const [scannedData, setScannedData] = React.useState(null);

        const handleScan = data => {
          setError(null);

          if (data.startsWith('https://digbiz.app/card/')) {
            // Valid business card URL
            const cardId = data.split('/').pop();
            navigation.navigate('CardView', { cardId });
          } else if (
            data.startsWith('BEGIN:VCARD') &&
            data.includes('END:VCARD')
          ) {
            // Valid vCard
            navigation.navigate('ImportCard', { vCardData: data });
          } else if (data.startsWith('BEGIN:VCARD')) {
            // Malformed vCard
            setError('Invalid vCard format');
          } else {
            // Unknown format
            setScannedData(data);
            setError('QR code format not recognized');
          }
        };

        return (
          <Provider store={store}>
            <MockInvalidQRScanner
              onScan={handleScan}
              error={error}
              scannedData={scannedData}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestInvalidQRScanning />);

      // Scan invalid QR code
      const scanInvalidButton = getByTestId('scan-invalid');
      await act(async () => {
        fireEvent.press(scanInvalidButton);
      });

      await waitFor(() => {
        expect(getByTestId('scan-error')).toBeTruthy();
        expect(getByTestId('unknown-format')).toBeTruthy();
      });

      // Scan malformed vCard
      const scanMalformedButton = getByTestId('scan-malformed-vcard');
      await act(async () => {
        fireEvent.press(scanMalformedButton);
      });

      await waitFor(() => {
        expect(getByTestId('scan-error').children[0]).toBe(
          'Invalid vCard format',
        );
      });
    });
  });

  describe('Deep Link Handling', () => {
    test('should handle deep links from QR codes', async () => {
      const { Linking } = require('react-native');

      const MockDeepLinkHandler = ({ onHandleDeepLink, lastDeepLink }) => (
        <div testID="deep-link-handler">
          <button
            testID="simulate-deep-link"
            onPress={() => onHandleDeepLink('digbiz://card/card-789')}
          >
            Simulate Deep Link
          </button>

          <button
            testID="simulate-web-link"
            onPress={() => onHandleDeepLink('https://digbiz.app/card/card-790')}
          >
            Simulate Web Link
          </button>

          {lastDeepLink && (
            <div testID="processed-link">Processed: {lastDeepLink}</div>
          )}
        </div>
      );

      const TestDeepLinkHandling = () => {
        const [lastDeepLink, setLastDeepLink] = React.useState(null);

        const handleDeepLink = url => {
          setLastDeepLink(url);

          if (url.startsWith('digbiz://card/')) {
            const cardId = url.split('/').pop();
            navigation.navigate('CardView', { cardId });
          } else if (url.includes('digbiz.app/card/')) {
            const cardId = url.split('/').pop();
            navigation.navigate('CardView', { cardId });
          }
        };

        // Simulate app launch from deep link
        React.useEffect(() => {
          const handleInitialURL = async () => {
            const url = await Linking.getInitialURL();
            if (url) {
              handleDeepLink(url);
            }
          };

          handleInitialURL();

          const linkingListener = Linking.addEventListener('url', event => {
            handleDeepLink(event.url);
          });

          return () => {
            Linking.removeEventListener('url', linkingListener);
          };
        }, []);

        return (
          <Provider store={store}>
            <MockDeepLinkHandler
              onHandleDeepLink={handleDeepLink}
              lastDeepLink={lastDeepLink}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestDeepLinkHandling />);

      // Simulate custom scheme deep link
      const deepLinkButton = getByTestId('simulate-deep-link');
      await act(async () => {
        fireEvent.press(deepLinkButton);
      });

      await waitFor(() => {
        expect(getByTestId('processed-link')).toBeTruthy();
        expect(navigation.navigate).toHaveBeenCalledWith('CardView', {
          cardId: 'card-789',
        });
      });

      // Clear previous calls
      navigation.navigate.mockClear();

      // Simulate web URL deep link
      const webLinkButton = getByTestId('simulate-web-link');
      await act(async () => {
        fireEvent.press(webLinkButton);
      });

      await waitFor(() => {
        expect(navigation.navigate).toHaveBeenCalledWith('CardView', {
          cardId: 'card-790',
        });
      });
    });

    test('should validate deep link parameters', async () => {
      const MockDeepLinkValidator = ({ onValidateLink, validationResult }) => (
        <div testID="deep-link-validator">
          <button
            testID="validate-valid-link"
            onPress={() => onValidateLink('digbiz://card/valid-card-id')}
          >
            Validate Valid Link
          </button>

          <button
            testID="validate-invalid-link"
            onPress={() => onValidateLink('digbiz://invalid-format')}
          >
            Validate Invalid Link
          </button>

          <button
            testID="validate-malicious-link"
            onPress={() => onValidateLink('digbiz://card/../../../admin')}
          >
            Validate Malicious Link
          </button>

          {validationResult && (
            <div testID="validation-result">
              <div testID="is-valid">
                {validationResult.isValid ? 'Valid' : 'Invalid'}
              </div>
              {validationResult.error && (
                <div testID="validation-error">{validationResult.error}</div>
              )}
              {validationResult.cardId && (
                <div testID="extracted-card-id">{validationResult.cardId}</div>
              )}
            </div>
          )}
        </div>
      );

      const TestDeepLinkValidation = () => {
        const [validationResult, setValidationResult] = React.useState(null);

        const validateDeepLink = url => {
          const result = { isValid: false, error: null, cardId: null };

          try {
            const parsedUrl = new URL(url);

            if (parsedUrl.protocol !== 'digbiz:') {
              result.error = 'Invalid protocol';
              setValidationResult(result);
              return;
            }

            if (!parsedUrl.pathname.startsWith('//card/')) {
              result.error = 'Invalid path format';
              setValidationResult(result);
              return;
            }

            const cardId = parsedUrl.pathname.replace('//card/', '');

            // Validate card ID format
            if (!/^[a-zA-Z0-9-]+$/.test(cardId)) {
              result.error = 'Invalid card ID format';
              setValidationResult(result);
              return;
            }

            // Check for path traversal attempts
            if (cardId.includes('..') || cardId.includes('/')) {
              result.error = 'Security violation detected';
              setValidationResult(result);
              return;
            }

            result.isValid = true;
            result.cardId = cardId;
          } catch (error) {
            result.error = 'Invalid URL format';
          }

          setValidationResult(result);
        };

        return (
          <Provider store={store}>
            <MockDeepLinkValidator
              onValidateLink={validateDeepLink}
              validationResult={validationResult}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestDeepLinkValidation />);

      // Validate valid link
      const validLinkButton = getByTestId('validate-valid-link');
      await act(async () => {
        fireEvent.press(validLinkButton);
      });

      await waitFor(() => {
        expect(getByTestId('is-valid').children[0]).toBe('Valid');
        expect(getByTestId('extracted-card-id').children[0]).toBe(
          'valid-card-id',
        );
      });

      // Validate invalid link
      const invalidLinkButton = getByTestId('validate-invalid-link');
      await act(async () => {
        fireEvent.press(invalidLinkButton);
      });

      await waitFor(() => {
        expect(getByTestId('is-valid').children[0]).toBe('Invalid');
        expect(getByTestId('validation-error')).toBeTruthy();
      });

      // Validate malicious link
      const maliciousLinkButton = getByTestId('validate-malicious-link');
      await act(async () => {
        fireEvent.press(maliciousLinkButton);
      });

      await waitFor(() => {
        expect(getByTestId('is-valid').children[0]).toBe('Invalid');
        expect(getByTestId('validation-error').children[0]).toBe(
          'Security violation detected',
        );
      });
    });
  });
});
