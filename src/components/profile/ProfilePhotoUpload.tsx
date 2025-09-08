import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ProfilePhotoUploadProps {
  photoData?: any;
  onPhotoSelect?: (photo: any) => void;
  onPhotoRemove?: () => void;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  photoData,
  onPhotoSelect,
  onPhotoRemove,
}) => (
  <View>
    <TouchableOpacity onPress={() => onPhotoSelect?.({})}>
      <Text>Upload Photo</Text>
    </TouchableOpacity>
    {photoData && (
      <TouchableOpacity onPress={onPhotoRemove}>
        <Text>Remove Photo</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default ProfilePhotoUpload;
