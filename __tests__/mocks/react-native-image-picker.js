/**
 * Mock for react-native-image-picker
 * Provides test-friendly versions of image picker functions
 */

export const launchImageLibrary = jest.fn((options, callback) => {
  if (callback) {
    callback({
      didCancel: false,
      assets: [
        {
          uri: 'file://mock-image.jpg',
          type: 'image/jpeg',
          fileName: 'mock-image.jpg',
          fileSize: 123456,
          width: 800,
          height: 600,
        },
      ],
    });
  }
  return Promise.resolve({
    didCancel: false,
    assets: [
      {
        uri: 'file://mock-image.jpg',
        type: 'image/jpeg',
        fileName: 'mock-image.jpg',
        fileSize: 123456,
        width: 800,
        height: 600,
      },
    ],
  });
});

export const launchCamera = jest.fn((options, callback) => {
  if (callback) {
    callback({
      didCancel: false,
      assets: [
        {
          uri: 'file://mock-camera.jpg',
          type: 'image/jpeg',
          fileName: 'mock-camera.jpg',
          fileSize: 234567,
          width: 1200,
          height: 900,
        },
      ],
    });
  }
  return Promise.resolve({
    didCancel: false,
    assets: [
      {
        uri: 'file://mock-camera.jpg',
        type: 'image/jpeg',
        fileName: 'mock-camera.jpg',
        fileSize: 234567,
        width: 1200,
        height: 900,
      },
    ],
  });
});

export const ImagePickerResponse = {
  didCancel: false,
  assets: [],
};

export const MediaType = {
  photo: 'photo',
  video: 'video',
  mixed: 'mixed',
};

export default {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
};
