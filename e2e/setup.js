/**
 * E2E Test Setup for Detox
 */

const { device, expect, element, by, waitFor } = require('detox');

beforeAll(async () => {
  await device.launchApp({
    permissions: {
      location: 'always',
      camera: 'YES',
      microphone: 'YES',
      notifications: 'YES',
      contacts: 'YES',
    },
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await device.terminateApp();
});

// Global test utilities
global.waitForElementToExist = async (elementMatcher, timeout = 5000) => {
  await waitFor(element(elementMatcher)).toExist().withTimeout(timeout);
};

global.waitForElementToBeVisible = async (elementMatcher, timeout = 5000) => {
  await waitFor(element(elementMatcher)).toBeVisible().withTimeout(timeout);
};

global.tapElement = async elementMatcher => {
  await element(elementMatcher).tap();
};

global.typeInElement = async (elementMatcher, text) => {
  await element(elementMatcher).typeText(text);
};

global.scrollToElement = async (scrollViewMatcher, elementMatcher) => {
  await element(scrollViewMatcher).scrollTo('bottom');
  await waitFor(element(elementMatcher))
    .toBeVisible()
    .whileElement(scrollViewMatcher)
    .scroll(200, 'down');
};
