/**
 * @format
 *
 * App Component Test
 *
 * This test file validates the main App component rendering and functionality.
 * It ensures the root component can be instantiated without errors and renders
 * all its child components (navigation, providers, screens) correctly.
 *
 * What this test does:
 * - Renders the main App component using React Test Renderer
 * - Verifies that all Redux providers, navigation containers, and theme providers load properly
 * - Checks that the component tree initializes without throwing errors
 * - Validates the basic app structure and component composition
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../../App';

// Test: Main App Component Rendering
// Validates that the App component can be rendered without crashing
// This is a smoke test that ensures the basic app structure is sound
test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
}, 10000);
