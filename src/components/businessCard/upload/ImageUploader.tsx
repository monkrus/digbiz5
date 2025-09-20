import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';

interface ImageUploaderProps {
  onImageSelect?: (uri: string) => void;
  placeholder?: string;
  style?: any;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  placeholder = 'Upload Image',
  style,
}) => {
  const handleImagePick = () => {
    Alert.alert('Select Image', 'Choose image source', [
      { text: 'Camera', onPress: () => handleCamera() },
      { text: 'Gallery', onPress: () => handleGallery() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCamera = () => {
    // TODO: Implement camera functionality
    console.log('Camera selected');
  };

  const handleGallery = () => {
    // TODO: Implement gallery functionality
    console.log('Gallery selected');
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.uploadArea} onPress={handleImagePick}>
        <Text style={styles.placeholderText}>{placeholder}</Text>
        <Button mode="outlined" onPress={handleImagePick}>
          Select Image
        </Button>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  placeholderText: {
    color: '#666',
    marginBottom: 10,
  },
});

export default ImageUploader;
