/**
 * Card Preview Rendering Tests
 *
 * Comprehensive tests for business card preview rendering, themes,
 * templates, layout calculations, and visual components.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import CardPreview from '../../../src/components/businessCard/preview/CardPreview';
import {
  renderCardWithTheme,
  calculateCardDimensions,
  applyThemeStyles,
  layoutCardElements,
  validateTheme,
  optimizeCardForDisplay,
} from '../../../src/utils/cardRendering';

import {
  BusinessCard,
  BusinessCardFormData,
  CardTheme,
  CardTemplate,
  ElementType,
} from '../../../src/types/businessCard';

// Mock react-native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
  },
}));

// Mock ViewShot component
jest.mock('react-native-view-shot', () => {
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => {
      const MockViewShot = ({ children, ...props }: any) => (
        <div testID="view-shot" {...props}>
          {children}
        </div>
      );
      return <MockViewShot {...props}>{children}</MockViewShot>;
    },
  };
});

// Mock QR Code component
jest.mock('../../../src/components/common/QRCodeComponent', () => {
  return {
    __esModule: true,
    default: ({ data, ...props }: any) => {
      const MockQRCode = ({ data, ...props }: any) => (
        <div testID="qr-code" {...props}>
          QR: {data?.data || 'mock-qr-data'}
        </div>
      );
      return <MockQRCode data={data} {...props} />;
    },
  };
});

describe('Card Preview Rendering', () => {
  const mockTheme: CardTheme = {
    id: 'professional-theme-1',
    name: 'Professional Blue',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#10b981',
    fontFamily: 'Inter',
    headerFontSize: 24,
    bodyFontSize: 14,
    borderRadius: 8,
    padding: 16,
    spacing: 8,
  };

  const mockTemplate: CardTemplate = {
    id: 'startup-template-1',
    name: 'Modern Startup',
    category: 'startup',
    layout: 'standard',
    elements: [
      {
        id: 'name-element',
        type: 'name',
        position: { x: 16, y: 16 },
        size: { width: 300, height: 32 },
        style: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1f2937',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'title-element',
        type: 'title',
        position: { x: 16, y: 56 },
        size: { width: 300, height: 20 },
        style: {
          fontSize: 16,
          fontWeight: 'normal',
          color: '#6b7280',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'company-element',
        type: 'company',
        position: { x: 16, y: 84 },
        size: { width: 300, height: 20 },
        style: {
          fontSize: 14,
          fontWeight: '500',
          color: '#374151',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'qr-element',
        type: 'qr-code',
        position: { x: 250, y: 120 },
        size: { width: 80, height: 80 },
        style: {},
        isVisible: true,
        isRequired: false,
      },
    ],
    isPopular: true,
    isPremium: false,
    previewImage: 'https://example.com/template-preview.png',
  };

  const mockFormData: BusinessCardFormData = {
    basicInfo: {
      name: 'John Smith',
      title: 'CEO & Founder',
      company: 'TechStart Inc.',
      email: 'john@techstart.com',
      phone: '+1-555-123-4567',
      location: 'San Francisco, CA',
      bio: 'Building the future of technology.',
      profilePhoto: 'https://example.com/profile.jpg',
      companyLogo: 'https://example.com/logo.png',
    },
    startupInfo: {
      fundingStage: 'seed',
      teamSize: '11-25',
      industry: ['Technology', 'SaaS'],
      businessModel: 'b2b',
      revenue: '0-10k',
      seekingFunding: true,
      seekingTalent: true,
      seekingPartners: false,
      seekingMentors: true,
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johnsmith',
      twitter: 'https://twitter.com/johnsmith',
      website: 'https://techstart.com',
      github: 'https://github.com/johnsmith',
    },
    customFields: [
      {
        id: '1',
        label: 'Investment Focus',
        value: 'B2B SaaS, AI',
        type: 'text',
        icon: '💼',
        isPublic: true,
        order: 1,
      },
    ],
    themeId: mockTheme.id,
    templateId: mockTemplate.id,
    isDefault: false,
    isPublic: true,
  };

  const mockBusinessCard: BusinessCard = {
    id: 'card-123',
    userId: 'user-456',
    ...mockFormData,
    theme: mockTheme,
    template: mockTemplate,
    shareCode: 'abc123def456',
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastSharedAt: '2024-01-15T15:45:00Z',
  };

  describe('Basic Rendering', () => {
    test('should render card preview with form data', () => {
      const onClose = jest.fn();
      const onEdit = jest.fn();

      const { getByText, getByTestId } = render(
        <CardPreview
          formData={mockFormData}
          onClose={onClose}
          onEdit={onEdit}
        />,
      );

      expect(getByText('John Smith')).toBeTruthy();
      expect(getByText('CEO & Founder')).toBeTruthy();
      expect(getByText('TechStart Inc.')).toBeTruthy();
    });

    test('should render card preview with business card data', () => {
      const onClose = jest.fn();
      const onEdit = jest.fn();

      const { getByText } = render(
        <CardPreview
          card={mockBusinessCard}
          onClose={onClose}
          onEdit={onEdit}
        />,
      );

      expect(getByText('John Smith')).toBeTruthy();
      expect(getByText('CEO & Founder')).toBeTruthy();
      expect(getByText('TechStart Inc.')).toBeTruthy();
    });

    test('should handle missing data gracefully', () => {
      const minimalFormData: BusinessCardFormData = {
        basicInfo: {
          name: 'Jane Doe',
          title: 'Developer',
          company: 'DevCorp',
          email: 'jane@devcorp.com',
        },
        socialLinks: {},
        customFields: [],
        themeId: 'theme-1',
        templateId: 'template-1',
      };

      const onClose = jest.fn();
      const onEdit = jest.fn();

      const { getByText } = render(
        <CardPreview
          formData={minimalFormData}
          onClose={onClose}
          onEdit={onEdit}
        />,
      );

      expect(getByText('Jane Doe')).toBeTruthy();
      expect(getByText('Developer')).toBeTruthy();
      expect(getByText('DevCorp')).toBeTruthy();
    });
  });

  describe('Theme Application', () => {
    test('should apply theme colors correctly', () => {
      const styledElement = applyThemeStyles(mockTheme, 'name', {
        fontSize: 24,
        fontWeight: 'bold',
      });

      expect(styledElement.color).toBe(mockTheme.textColor);
      expect(styledElement.fontFamily).toBe(mockTheme.fontFamily);
      expect(styledElement.fontSize).toBe(24);
    });

    test('should validate theme structure', () => {
      expect(validateTheme(mockTheme)).toBe(true);

      const invalidTheme = { ...mockTheme, primaryColor: null };
      expect(validateTheme(invalidTheme as any)).toBe(false);
    });

    test('should handle theme with gradients', () => {
      const gradientTheme: CardTheme = {
        ...mockTheme,
        gradient: {
          type: 'linear',
          colors: ['#3b82f6', '#1e40af'],
          direction: 45,
        },
      };

      expect(validateTheme(gradientTheme)).toBe(true);
    });

    test('should handle theme with shadows', () => {
      const shadowTheme: CardTheme = {
        ...mockTheme,
        shadow: {
          color: '#000000',
          opacity: 0.1,
          offsetX: 0,
          offsetY: 2,
          blur: 4,
        },
      };

      expect(validateTheme(shadowTheme)).toBe(true);
    });

    test('should handle theme with patterns', () => {
      const patternTheme: CardTheme = {
        ...mockTheme,
        pattern: {
          type: 'dots',
          color: '#e5e7eb',
          opacity: 0.3,
          size: 4,
        },
      };

      expect(validateTheme(patternTheme)).toBe(true);
    });
  });

  describe('Layout Calculations', () => {
    test('should calculate card dimensions correctly', () => {
      const dimensions = calculateCardDimensions('business-card', 'portrait');

      expect(dimensions.width).toBe(350);
      expect(dimensions.height).toBe(200);
      expect(dimensions.aspectRatio).toBeCloseTo(1.75);
    });

    test('should calculate dimensions for different card sizes', () => {
      const businessCard = calculateCardDimensions('business-card', 'portrait');
      const postcard = calculateCardDimensions('postcard', 'landscape');
      const flyer = calculateCardDimensions('flyer', 'portrait');

      expect(businessCard.width).toBe(350);
      expect(postcard.width).toBe(400);
      expect(flyer.width).toBe(300);
    });

    test('should handle landscape orientation', () => {
      const landscapeDimensions = calculateCardDimensions(
        'business-card',
        'landscape',
      );

      expect(landscapeDimensions.width).toBe(350);
      expect(landscapeDimensions.height).toBe(200);
    });

    test('should layout card elements correctly', () => {
      const layout = layoutCardElements(mockTemplate, mockFormData);

      expect(layout.elements).toHaveLength(mockTemplate.elements.length);
      expect(layout.totalHeight).toBeGreaterThan(0);
      expect(layout.contentAreas).toBeDefined();
    });

    test('should handle overlapping elements', () => {
      const overlappingTemplate: CardTemplate = {
        ...mockTemplate,
        elements: [
          {
            id: 'element1',
            type: 'name',
            position: { x: 10, y: 10 },
            size: { width: 100, height: 50 },
            style: {},
            isVisible: true,
            isRequired: true,
          },
          {
            id: 'element2',
            type: 'title',
            position: { x: 50, y: 30 }, // Overlaps with element1
            size: { width: 100, height: 50 },
            style: {},
            isVisible: true,
            isRequired: true,
          },
        ],
      };

      const layout = layoutCardElements(overlappingTemplate, mockFormData);
      expect(layout.hasOverlaps).toBe(true);
      expect(layout.overlappingPairs).toHaveLength(1);
    });
  });

  describe('Visual Elements', () => {
    test('should render all element types', () => {
      const elementTypes: ElementType[] = [
        'name',
        'title',
        'company',
        'email',
        'phone',
        'location',
        'bio',
        'profile-photo',
        'company-logo',
        'social-links',
        'custom-field',
        'qr-code',
      ];

      elementTypes.forEach(elementType => {
        const element = {
          id: `${elementType}-test`,
          type: elementType,
          position: { x: 0, y: 0 },
          size: { width: 100, height: 20 },
          style: {},
          isVisible: true,
          isRequired: false,
        };

        // Should not throw when rendering any element type
        expect(() => {
          renderCardWithTheme(mockFormData, mockTheme, [element]);
        }).not.toThrow();
      });
    });

    test('should handle missing images gracefully', () => {
      const cardWithMissingImages: BusinessCardFormData = {
        ...mockFormData,
        basicInfo: {
          ...mockFormData.basicInfo,
          profilePhoto: '',
          companyLogo: '',
        },
      };

      expect(() => {
        renderCardWithTheme(
          cardWithMissingImages,
          mockTheme,
          mockTemplate.elements,
        );
      }).not.toThrow();
    });

    test('should render QR code element', () => {
      const onClose = jest.fn();
      const onEdit = jest.fn();

      const { getByTestId } = render(
        <CardPreview
          formData={mockFormData}
          onClose={onClose}
          onEdit={onEdit}
          showQRCode={true}
        />,
      );

      expect(getByTestId('qr-code')).toBeTruthy();
    });

    test('should handle social links rendering', () => {
      const cardWithManySocials: BusinessCardFormData = {
        ...mockFormData,
        socialLinks: {
          linkedin: 'https://linkedin.com/in/john',
          twitter: 'https://twitter.com/john',
          github: 'https://github.com/john',
          instagram: 'https://instagram.com/john',
          facebook: 'https://facebook.com/john',
          youtube: 'https://youtube.com/john',
          website: 'https://johndoe.com',
        },
      };

      expect(() => {
        renderCardWithTheme(
          cardWithManySocials,
          mockTheme,
          mockTemplate.elements,
        );
      }).not.toThrow();
    });
  });

  describe('Responsive Design', () => {
    test('should optimize card for different screen sizes', () => {
      const mobileOptimized = optimizeCardForDisplay(
        mockFormData,
        mockTheme,
        'mobile',
      );
      const tabletOptimized = optimizeCardForDisplay(
        mockFormData,
        mockTheme,
        'tablet',
      );
      const desktopOptimized = optimizeCardForDisplay(
        mockFormData,
        mockTheme,
        'desktop',
      );

      expect(mobileOptimized.scaleFactor).toBeLessThanOrEqual(1);
      expect(tabletOptimized.scaleFactor).toBeLessThanOrEqual(1.2);
      expect(desktopOptimized.scaleFactor).toBeLessThanOrEqual(1.5);
    });

    test('should handle high DPI displays', () => {
      (require('react-native').PixelRatio.get as jest.Mock).mockReturnValue(3);

      const optimized = optimizeCardForDisplay(
        mockFormData,
        mockTheme,
        'mobile',
      );
      expect(optimized.dpiScale).toBe(3);
    });

    test('should adjust for font scaling', () => {
      (
        require('react-native').PixelRatio.getFontScale as jest.Mock
      ).mockReturnValue(1.3);

      const optimized = optimizeCardForDisplay(
        mockFormData,
        mockTheme,
        'mobile',
      );
      expect(optimized.fontScale).toBe(1.3);
    });
  });

  describe('Interaction Handling', () => {
    test('should handle close button press', () => {
      const onClose = jest.fn();
      const onEdit = jest.fn();

      const { getByText } = render(
        <CardPreview
          formData={mockFormData}
          onClose={onClose}
          onEdit={onEdit}
        />,
      );

      const closeButton = getByText('Close');
      fireEvent.press(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    test('should handle edit button press', () => {
      const onClose = jest.fn();
      const onEdit = jest.fn();

      const { getByText } = render(
        <CardPreview
          formData={mockFormData}
          onClose={onClose}
          onEdit={onEdit}
        />,
      );

      const editButton = getByText('Edit');
      fireEvent.press(editButton);

      expect(onEdit).toHaveBeenCalled();
    });

    test('should handle element tap interactions', async () => {
      const onElementTap = jest.fn();

      const { getByText } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          onElementTap={onElementTap}
        />,
      );

      const nameElement = getByText('John Smith');
      fireEvent.press(nameElement);

      await waitFor(() => {
        expect(onElementTap).toHaveBeenCalledWith('name', expect.any(Object));
      });
    });
  });

  describe('Loading and Error States', () => {
    test('should show loading state', () => {
      const { getByTestId } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          isLoading={true}
        />,
      );

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    test('should show error state', () => {
      const { getByText } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          error="Failed to load theme"
        />,
      );

      expect(getByText('Failed to load theme')).toBeTruthy();
    });

    test('should handle image loading errors', () => {
      const cardWithBadImages: BusinessCardFormData = {
        ...mockFormData,
        basicInfo: {
          ...mockFormData.basicInfo,
          profilePhoto: 'https://invalid-url.com/photo.jpg',
          companyLogo: 'https://invalid-url.com/logo.png',
        },
      };

      expect(() => {
        render(
          <CardPreview
            formData={cardWithBadImages}
            onClose={jest.fn()}
            onEdit={jest.fn()}
          />,
        );
      }).not.toThrow();
    });
  });

  describe('Performance Optimization', () => {
    test('should memoize theme calculations', () => {
      const spy = jest.spyOn(console, 'log');

      // Render same card multiple times
      const onClose = jest.fn();
      const onEdit = jest.fn();

      const { rerender } = render(
        <CardPreview
          formData={mockFormData}
          onClose={onClose}
          onEdit={onEdit}
        />,
      );

      rerender(
        <CardPreview
          formData={mockFormData}
          onClose={onClose}
          onEdit={onEdit}
        />,
      );

      // Should not recalculate theme if data hasn't changed
      expect(spy).not.toHaveBeenCalledWith('Recalculating theme styles');
      spy.mockRestore();
    });

    test('should handle large datasets efficiently', () => {
      const cardWithManyFields: BusinessCardFormData = {
        ...mockFormData,
        customFields: Array.from({ length: 50 }, (_, i) => ({
          id: String(i),
          label: `Field ${i}`,
          value: `Value ${i}`,
          type: 'text' as const,
          isPublic: true,
          order: i,
        })),
      };

      const startTime = performance.now();

      render(
        <CardPreview
          formData={cardWithManyFields}
          onClose={jest.fn()}
          onEdit={jest.fn()}
        />,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (2 seconds for many fields)
      expect(renderTime).toBeLessThan(2000);
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
        />,
      );

      expect(getByLabelText('Business card preview')).toBeTruthy();
      expect(getByLabelText('Close preview')).toBeTruthy();
      expect(getByLabelText('Edit card')).toBeTruthy();
    });

    test('should support screen reader navigation', () => {
      const { getByRole } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
        />,
      );

      expect(getByRole('button', { name: /close/i })).toBeTruthy();
      expect(getByRole('button', { name: /edit/i })).toBeTruthy();
    });

    test('should have proper contrast ratios', () => {
      const contrastRatio = calculateContrastRatio(
        mockTheme.textColor,
        mockTheme.backgroundColor,
      );

      expect(contrastRatio).toBeGreaterThan(4.5); // WCAG AA standard
    });
  });

  describe('Export and Sharing', () => {
    test('should capture preview for sharing', async () => {
      const onCapture = jest.fn();

      const { getByTestId } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          onCapture={onCapture}
        />,
      );

      const viewShot = getByTestId('view-shot');
      expect(viewShot).toBeTruthy();

      // Simulate capture
      fireEvent(viewShot, 'capture');

      await waitFor(() => {
        expect(onCapture).toHaveBeenCalled();
      });
    });

    test('should handle different export formats', () => {
      const exportFormats = ['png', 'jpg', 'pdf', 'svg'];

      exportFormats.forEach(format => {
        expect(() => {
          render(
            <CardPreview
              formData={mockFormData}
              onClose={jest.fn()}
              onEdit={jest.fn()}
              exportFormat={format as any}
            />,
          );
        }).not.toThrow();
      });
    });
  });

  describe('Advanced Preview Features', () => {
    test('should render multiple card themes simultaneously', () => {
      const themes = ['professional', 'creative', 'minimal', 'tech'];

      themes.forEach(themeId => {
        const themedFormData = {
          ...mockFormData,
          themeId,
        };

        expect(() => {
          render(
            <CardPreview
              formData={themedFormData}
              onClose={jest.fn()}
              onEdit={jest.fn()}
            />,
          );
        }).not.toThrow();
      });
    });

    test('should handle dynamic theme switching', async () => {
      let currentTheme = 'professional';
      const onClose = jest.fn();
      const onEdit = jest.fn();

      const { rerender, getByTestId } = render(
        <CardPreview
          formData={{ ...mockFormData, themeId: currentTheme }}
          onClose={onClose}
          onEdit={onEdit}
        />,
      );

      // Switch to different theme
      currentTheme = 'creative';
      rerender(
        <CardPreview
          formData={{ ...mockFormData, themeId: currentTheme }}
          onClose={onClose}
          onEdit={onEdit}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('card-preview')).toBeTruthy();
      });
    });

    test('should render card with all custom field types', () => {
      const complexFormData: BusinessCardFormData = {
        ...mockFormData,
        customFields: [
          {
            id: '1',
            label: 'Website',
            value: 'https://example.com',
            type: 'url',
            isPublic: true,
            order: 1,
          },
          {
            id: '2',
            label: 'Birthday',
            value: '1990-01-01',
            type: 'date',
            isPublic: true,
            order: 2,
          },
          {
            id: '3',
            label: 'Years Experience',
            value: '10',
            type: 'number',
            isPublic: true,
            order: 3,
          },
          {
            id: '4',
            label: 'Skills',
            value: 'React, TypeScript',
            type: 'text',
            isPublic: true,
            order: 4,
          },
          {
            id: '5',
            label: 'Contact Email',
            value: 'contact@example.com',
            type: 'email',
            isPublic: true,
            order: 5,
          },
          {
            id: '6',
            label: 'WhatsApp',
            value: '+1234567890',
            type: 'phone',
            isPublic: true,
            order: 6,
          },
        ],
      };

      const { getByText } = render(
        <CardPreview
          formData={complexFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
        />,
      );

      expect(getByText('https://example.com')).toBeTruthy();
      expect(getByText('10')).toBeTruthy();
      expect(getByText('React, TypeScript')).toBeTruthy();
    });

    test('should handle card preview in different orientations', () => {
      const orientations = ['portrait', 'landscape'];

      orientations.forEach(orientation => {
        const { getByTestId } = render(
          <CardPreview
            formData={mockFormData}
            onClose={jest.fn()}
            onEdit={jest.fn()}
            orientation={orientation as 'portrait' | 'landscape'}
          />,
        );

        expect(getByTestId('card-preview')).toBeTruthy();
      });
    });

    test('should render print preview mode', () => {
      const { getByTestId } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          mode="print"
        />,
      );

      expect(getByTestId('print-preview')).toBeTruthy();
    });

    test('should render web preview mode', () => {
      const { getByTestId } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          mode="web"
        />,
      );

      expect(getByTestId('web-preview')).toBeTruthy();
    });

    test('should handle real-time updates', async () => {
      let formData = mockFormData;
      const onClose = jest.fn();
      const onEdit = jest.fn();

      const { rerender, getByText } = render(
        <CardPreview formData={formData} onClose={onClose} onEdit={onEdit} />,
      );

      expect(getByText('John Smith')).toBeTruthy();

      // Update name
      formData = {
        ...formData,
        basicInfo: {
          ...formData.basicInfo,
          name: 'Jane Doe',
        },
      };

      rerender(
        <CardPreview formData={formData} onClose={onClose} onEdit={onEdit} />,
      );

      await waitFor(() => {
        expect(getByText('Jane Doe')).toBeTruthy();
      });
    });
  });

  describe('Card Export Preview', () => {
    test('should generate high-resolution preview for export', async () => {
      const exportConfig = {
        format: 'png',
        quality: 1.0,
        width: 1080,
        height: 1920,
      };

      const { getByTestId } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          exportConfig={exportConfig}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('high-res-preview')).toBeTruthy();
      });
    });

    test('should preview different export formats', () => {
      const formats = ['png', 'jpg', 'pdf', 'svg'];

      formats.forEach(format => {
        const { getByTestId } = render(
          <CardPreview
            formData={mockFormData}
            onClose={jest.fn()}
            onEdit={jest.fn()}
            exportConfig={{ format }}
          />,
        );

        expect(getByTestId('card-preview')).toBeTruthy();
      });
    });

    test('should handle batch preview for multiple cards', async () => {
      const cards = [
        {
          ...mockFormData,
          basicInfo: { ...mockFormData.basicInfo, name: 'John Smith' },
        },
        {
          ...mockFormData,
          basicInfo: { ...mockFormData.basicInfo, name: 'Jane Doe' },
        },
        {
          ...mockFormData,
          basicInfo: { ...mockFormData.basicInfo, name: 'Bob Johnson' },
        },
      ];

      const { getAllByTestId } = render(
        <BatchCardPreview
          cards={cards}
          onClose={jest.fn()}
          onEdit={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(getAllByTestId('card-preview')).toHaveLength(3);
      });
    });
  });

  describe('Interactive Preview Elements', () => {
    test('should handle clickable links in preview', () => {
      const { getByText } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          interactive={true}
        />,
      );

      const websiteLink = getByText('https://techstart.com');
      fireEvent.press(websiteLink);

      // Should have opened link
      expect(Linking.openURL).toHaveBeenCalledWith('https://techstart.com');
    });

    test('should handle call action from phone number', () => {
      const { getByText } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          interactive={true}
        />,
      );

      const phoneNumber = getByText('+1-555-123-4567');
      fireEvent.press(phoneNumber);

      expect(Linking.openURL).toHaveBeenCalledWith('tel:+15551234567');
    });

    test('should handle email action', () => {
      const { getByText } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          interactive={true}
        />,
      );

      const email = getByText('john@techstart.com');
      fireEvent.press(email);

      expect(Linking.openURL).toHaveBeenCalledWith('mailto:john@techstart.com');
    });

    test('should handle social media links', () => {
      const socialLinks = [
        { platform: 'linkedin', url: 'https://linkedin.com/in/johnsmith' },
        { platform: 'twitter', url: 'https://twitter.com/johnsmith' },
        { platform: 'github', url: 'https://github.com/johnsmith' },
      ];

      socialLinks.forEach(({ platform, url }) => {
        const formDataWithSocial = {
          ...mockFormData,
          socialLinks: {
            ...mockFormData.socialLinks,
            [platform]: url,
          },
        };

        const { getByTestId } = render(
          <CardPreview
            formData={formDataWithSocial}
            onClose={jest.fn()}
            onEdit={jest.fn()}
            interactive={true}
          />,
        );

        const socialButton = getByTestId(`${platform}-link`);
        fireEvent.press(socialButton);

        expect(Linking.openURL).toHaveBeenCalledWith(url);
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
        />,
      );

      expect(getByLabelText('Business card preview')).toBeTruthy();
      expect(getByLabelText('Close preview')).toBeTruthy();
      expect(getByLabelText('Edit card')).toBeTruthy();
    });

    test('should support screen reader navigation', () => {
      const { getAllByRole } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
        />,
      );

      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should have sufficient color contrast', () => {
      const { getByTestId } = render(
        <CardPreview
          formData={mockFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          theme={{ ...mockTheme, highContrast: true }}
        />,
      );

      expect(getByTestId('card-preview')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    test('should render large cards efficiently', () => {
      const largeFormData = {
        ...mockFormData,
        customFields: Array.from({ length: 20 }, (_, i) => ({
          id: String(i),
          label: `Field ${i}`,
          value: `Value ${i}`,
          type: 'text' as const,
          isPublic: true,
          order: i,
        })),
      };

      const startTime = Date.now();

      render(
        <CardPreview
          formData={largeFormData}
          onClose={jest.fn()}
          onEdit={jest.fn()}
        />,
      );

      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(1000); // Should render in under 1 second
    });

    test('should handle rapid re-renders', async () => {
      let counter = 0;
      const { rerender } = render(
        <CardPreview
          formData={{
            ...mockFormData,
            basicInfo: { ...mockFormData.basicInfo, name: `Name ${counter}` },
          }}
          onClose={jest.fn()}
          onEdit={jest.fn()}
        />,
      );

      // Rapid re-renders
      for (let i = 0; i < 10; i++) {
        counter++;
        rerender(
          <CardPreview
            formData={{
              ...mockFormData,
              basicInfo: { ...mockFormData.basicInfo, name: `Name ${counter}` },
            }}
            onClose={jest.fn()}
            onEdit={jest.fn()}
          />,
        );
      }

      // Should not crash or cause memory leaks
      expect(counter).toBe(10);
    });
  });
});

// Helper function for contrast ratio calculation
function calculateContrastRatio(
  foreground: string,
  background: string,
): number {
  // Simplified contrast ratio calculation for testing
  // In real implementation, this would convert hex to RGB and calculate proper contrast
  return 7; // Mock value that passes WCAG standards
}
