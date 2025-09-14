/**
 * Camera Scanner Component
 *
 * Provides camera interface for scanning business cards with ML Kit integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { Worklets } from 'react-native-worklets-core';
import {
  ocrScannerService,
  ParsedCardData,
} from '../../services/ocrScannerService';
import { usePermissions } from '../../hooks/usePermissions';
import { trackEvent } from '../../services/analyticsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraScannerProps {
  onScanComplete: (results: ParsedCardData[]) => void;
  onCancel: () => void;
  enableMultipleScan?: boolean;
  autoCapture?: boolean;
  showGuides?: boolean;
}

interface ScanGuide {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanComplete,
  onCancel,
  enableMultipleScan = false,
  autoCapture = false,
  showGuides = true,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [scanResults, setScanResults] = useState<ParsedCardData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = usePermissions();

  // Business card guide dimensions (3.5" x 2" ratio)
  const guideWidth = screenWidth * 0.8;
  const guideHeight = guideWidth * (2 / 3.5);
  const guideX = (screenWidth - guideWidth) / 2;
  const guideY = (screenHeight - guideHeight) / 2;

  const scanGuide: ScanGuide = {
    x: guideX,
    y: guideY,
    width: guideWidth,
    height: guideHeight,
  };

  useEffect(() => {
    checkCameraPermissions();
  }, []);

  const checkCameraPermissions = async () => {
    const permission = await Camera.getCameraPermissionStatus();
    if (permission !== 'granted') {
      const newPermission = await Camera.requestCameraPermission();
      if (newPermission !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access to scan business cards.',
          [{ text: 'OK', onPress: onCancel }],
        );
      }
    }
  };

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      if (isProcessing || !autoCapture) return;

      // Auto-capture logic would go here
      // For now, we'll use manual capture
    },
    [isProcessing, autoCapture],
  );

  const capturePhoto = async () => {
    if (!camera.current || isProcessing) return;

    setIsProcessing(true);
    trackEvent('camera_capture_started', { scanCount, enableMultipleScan });

    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
        enableAutoStabilization: true,
        enableAutoDistortionCorrection: true,
      });

      await processPhoto(photo.path);
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      trackEvent('camera_capture_failed', { error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const processPhoto = async (photoPath: string) => {
    try {
      const parsedData = await ocrScannerService.processImage(photoPath);

      trackEvent('ocr_processing_completed', {
        confidence: parsedData.confidence,
        fieldsDetected: Object.keys(parsedData).length,
      });

      if (enableMultipleScan) {
        const newResults = [...scanResults, parsedData];
        setScanResults(newResults);
        setScanCount(scanCount + 1);

        // Show preview or continue scanning
        Alert.alert(
          'Card Scanned',
          `Scanned ${scanCount + 1} card(s). Continue scanning or finish?`,
          [
            { text: 'Continue', onPress: () => {} },
            { text: 'Finish', onPress: () => onScanComplete(newResults) },
          ],
        );
      } else {
        onScanComplete([parsedData]);
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process the image. Please try again.',
      );
      trackEvent('ocr_processing_failed', { error: error.message });
    }
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
    trackEvent('camera_flash_toggled', { enabled: !flashEnabled });
  };

  const selectFromGallery = async () => {
    try {
      const result = await ocrScannerService.scanBusinessCard({
        useCamera: false,
        multiple: enableMultipleScan,
      });

      if (result.success && result.results.length > 0) {
        onScanComplete(result.results);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image from gallery.');
    }
  };

  if (!device) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Camera not available</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        frameProcessor={frameProcessor}
        torch={flashEnabled ? 'on' : 'off'}
      />

      {/* Overlay with scan guide */}
      <View style={styles.overlay} pointerEvents="none">
        {showGuides && (
          <>
            {/* Dimmed background */}
            <View style={[styles.dimmer, styles.dimmerTop]} />
            <View style={[styles.dimmer, styles.dimmerBottom]} />
            <View style={[styles.dimmer, styles.dimmerLeft]} />
            <View style={[styles.dimmer, styles.dimmerRight]} />

            {/* Scan guide frame */}
            <View
              style={[
                styles.scanGuide,
                {
                  left: scanGuide.x,
                  top: scanGuide.y,
                  width: scanGuide.width,
                  height: scanGuide.height,
                },
              ]}
            >
              {/* Corner indicators */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {isProcessing
            ? 'Processing...'
            : 'Align business card within the frame and tap capture'}
        </Text>
        {enableMultipleScan && scanCount > 0 && (
          <Text style={styles.scanCountText}>Cards scanned: {scanCount}</Text>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={selectFromGallery}
          disabled={isProcessing}
        >
          <Text style={styles.controlButtonText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.captureButton,
            isProcessing && styles.captureButtonDisabled,
          ]}
          onPress={capturePhoto}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleFlash}
          disabled={isProcessing}
        >
          <Text style={styles.controlButtonText}>
            {flashEnabled ? 'Flash On' : 'Flash Off'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Top controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.topButton} onPress={onCancel}>
          <Text style={styles.topButtonText}>Cancel</Text>
        </TouchableOpacity>

        {enableMultipleScan && scanCount > 0 && (
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => onScanComplete(scanResults)}
          >
            <Text style={styles.topButtonText}>Done ({scanCount})</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dimmer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dimmerTop: {
    top: 0,
    left: 0,
    right: 0,
    height: (screenHeight - screenWidth * 0.8 * (2 / 3.5)) / 2,
  },
  dimmerBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: (screenHeight - screenWidth * 0.8 * (2 / 3.5)) / 2,
  },
  dimmerLeft: {
    top: (screenHeight - screenWidth * 0.8 * (2 / 3.5)) / 2,
    left: 0,
    width: screenWidth * 0.1,
    height: screenWidth * 0.8 * (2 / 3.5),
  },
  dimmerRight: {
    top: (screenHeight - screenWidth * 0.8 * (2 / 3.5)) / 2,
    right: 0,
    width: screenWidth * 0.1,
    height: screenWidth * 0.8 * (2 / 3.5),
  },
  scanGuide: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00FF00',
    borderRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionsContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanCountText: {
    color: '#00FF00',
    fontSize: 14,
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  topButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraScanner;
