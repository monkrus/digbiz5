/**
 * Mock for react-native-image-crop-picker
 * Provides test-friendly versions of image cropping functions
 */

export const openPicker = jest.fn(options => {
  return Promise.resolve({
    path: 'file://mock-cropped-image.jpg',
    width: 800,
    height: 600,
    mime: 'image/jpeg',
    size: 123456,
    data: null,
    exif: null,
    filename: 'mock-cropped-image.jpg',
  });
});

export const openCamera = jest.fn(options => {
  return Promise.resolve({
    path: 'file://mock-camera-cropped.jpg',
    width: 1200,
    height: 900,
    mime: 'image/jpeg',
    size: 234567,
    data: null,
    exif: null,
    filename: 'mock-camera-cropped.jpg',
  });
});

export const Image = {
  path: '',
  width: 0,
  height: 0,
  mime: '',
  size: 0,
  data: null,
  exif: null,
  filename: null,
};

export default {
  openPicker,
  openCamera,
  Image,
};
