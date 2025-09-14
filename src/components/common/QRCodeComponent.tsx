/**
 * QR Code Component
 *
 * A reusable component for displaying QR codes with customization options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';

import { QRCodeData } from '../../utils/qrCodeGenerator';

interface QRCodeComponentProps {
  data: QRCodeData;
  onQRGenerated?: (uri: string) => void;
  showActions?: boolean;
  style?: any;
  containerStyle?: any;
}

const QRCodeComponent: React.FC<QRCodeComponentProps> = ({
  data,
  onQRGenerated,
  showActions = true,
  style,
  containerStyle,
}) => {
  const [qrRef, setQRRef] = useState<ViewShot | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const captureQR = async (): Promise<string | null> => {
    if (!qrRef) return null;

    try {
      setIsGenerating(true);
      const uri = await qrRef.capture();
      return uri;
    } catch (error) {
      console.error('Failed to capture QR code:', error);
      Alert.alert('Error', 'Failed to capture QR code');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQR = async () => {
    const uri = await captureQR();
    if (uri && onQRGenerated) {
      onQRGenerated(uri);
    }
  };

  const getQRCodeSize = () => {
    return data.size || 200;
  };

  const getDisplayText = () => {
    switch (data.type) {
      case 'url':
        return 'Scan to view card';
      case 'vcard':
        return 'Scan to save contact';
      case 'wifi':
        return 'Scan to connect WiFi';
      default:
        return 'Scan QR code';
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <ViewShot
        ref={setQRRef}
        options={{
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        }}
        style={[styles.qrContainer, style]}
      >
        <View style={styles.qrWrapper}>
          <QRCode
            value={data.data}
            size={getQRCodeSize()}
            color={data.color || '#000000'}
            backgroundColor={data.backgroundColor || '#FFFFFF'}
            logoSize={20}
            logoBackgroundColor="transparent"
            logoMargin={2}
            logoBorderRadius={10}
            quietZone={10}
            enableLinearGradient={false}
          />
        </View>
      </ViewShot>

      <Text style={styles.instructionText}>{getDisplayText()}</Text>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSaveQR}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Save QR Code</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QRCodeComponent;
