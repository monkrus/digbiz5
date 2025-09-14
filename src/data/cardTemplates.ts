/**
 * Predefined Business Card Templates
 *
 * This file contains a collection of predefined templates for business cards,
 * including different layouts and element arrangements.
 */

import { CardTemplate, TemplateElement } from '../types/businessCard';

export const DEFAULT_TEMPLATES: CardTemplate[] = [
  // Standard Professional Template
  {
    id: 'standard-professional',
    name: 'Standard Professional',
    category: 'professional',
    layout: 'standard',
    isPopular: true,
    isPremium: false,
    previewImage: '/templates/standard-professional.png',
    elements: [
      {
        id: 'profile-photo',
        type: 'profile-photo',
        position: { x: 20, y: 20 },
        size: { width: 80, height: 80 },
        style: {
          borderRadius: 40,
          borderWidth: 2,
          borderColor: '#e5e7eb',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'name',
        type: 'name',
        position: { x: 120, y: 25 },
        size: { width: 200, height: 30 },
        style: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1f2937',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'title',
        type: 'title',
        position: { x: 120, y: 55 },
        size: { width: 200, height: 20 },
        style: {
          fontSize: 16,
          color: '#6b7280',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'company',
        type: 'company',
        position: { x: 120, y: 75 },
        size: { width: 200, height: 20 },
        style: {
          fontSize: 14,
          color: '#374151',
          fontWeight: '500',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'email',
        type: 'email',
        position: { x: 20, y: 120 },
        size: { width: 160, height: 18 },
        style: {
          fontSize: 13,
          color: '#4b5563',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'phone',
        type: 'phone',
        position: { x: 200, y: 120 },
        size: { width: 120, height: 18 },
        style: {
          fontSize: 13,
          color: '#4b5563',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'location',
        type: 'location',
        position: { x: 20, y: 145 },
        size: { width: 200, height: 18 },
        style: {
          fontSize: 12,
          color: '#6b7280',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'social-links',
        type: 'social-links',
        position: { x: 20, y: 175 },
        size: { width: 300, height: 25 },
        style: {
          fontSize: 12,
        },
        isVisible: true,
        isRequired: false,
      },
    ],
  },

  // Minimalist Template
  {
    id: 'minimalist-clean',
    name: 'Minimalist Clean',
    category: 'minimalist',
    layout: 'compact',
    isPopular: true,
    isPremium: false,
    previewImage: '/templates/minimalist-clean.png',
    elements: [
      {
        id: 'name',
        type: 'name',
        position: { x: 20, y: 20 },
        size: { width: 280, height: 32 },
        style: {
          fontSize: 26,
          fontWeight: 'bold',
          color: '#000000',
          textAlign: 'center',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'title',
        type: 'title',
        position: { x: 20, y: 60 },
        size: { width: 280, height: 20 },
        style: {
          fontSize: 14,
          color: '#6b7280',
          textAlign: 'center',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'divider',
        type: 'divider',
        position: { x: 60, y: 90 },
        size: { width: 200, height: 1 },
        style: {
          backgroundColor: '#e5e7eb',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'email',
        type: 'email',
        position: { x: 20, y: 110 },
        size: { width: 280, height: 18 },
        style: {
          fontSize: 13,
          color: '#374151',
          textAlign: 'center',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'phone',
        type: 'phone',
        position: { x: 20, y: 135 },
        size: { width: 280, height: 18 },
        style: {
          fontSize: 13,
          color: '#374151',
          textAlign: 'center',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'website',
        type: 'custom-field',
        position: { x: 20, y: 160 },
        size: { width: 280, height: 18 },
        style: {
          fontSize: 12,
          color: '#6b7280',
          textAlign: 'center',
        },
        isVisible: true,
        isRequired: false,
      },
    ],
  },

  // Startup Template
  {
    id: 'startup-founder',
    name: 'Startup Founder',
    category: 'startup',
    layout: 'expanded',
    isPopular: true,
    isPremium: false,
    previewImage: '/templates/startup-founder.png',
    elements: [
      {
        id: 'background',
        type: 'background',
        position: { x: 0, y: 0 },
        size: { width: 350, height: 220 },
        style: {
          backgroundColor: '#f8fafc',
          borderRadius: 16,
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'company-logo',
        type: 'company-logo',
        position: { x: 280, y: 20 },
        size: { width: 50, height: 50 },
        style: {
          borderRadius: 8,
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'name',
        type: 'name',
        position: { x: 20, y: 20 },
        size: { width: 250, height: 28 },
        style: {
          fontSize: 22,
          fontWeight: 'bold',
          color: '#1f2937',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'title',
        type: 'title',
        position: { x: 20, y: 50 },
        size: { width: 200, height: 20 },
        style: {
          fontSize: 16,
          color: '#7c3aed',
          fontWeight: '600',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'company',
        type: 'company',
        position: { x: 20, y: 75 },
        size: { width: 200, height: 18 },
        style: {
          fontSize: 14,
          color: '#374151',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'bio',
        type: 'bio',
        position: { x: 20, y: 100 },
        size: { width: 310, height: 40 },
        style: {
          fontSize: 12,
          color: '#6b7280',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'email',
        type: 'email',
        position: { x: 20, y: 155 },
        size: { width: 150, height: 16 },
        style: {
          fontSize: 12,
          color: '#4b5563',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'phone',
        type: 'phone',
        position: { x: 180, y: 155 },
        size: { width: 150, height: 16 },
        style: {
          fontSize: 12,
          color: '#4b5563',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'social-links',
        type: 'social-links',
        position: { x: 20, y: 180 },
        size: { width: 200, height: 20 },
        style: {
          fontSize: 11,
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'qr-code',
        type: 'qr-code',
        position: { x: 280, y: 155 },
        size: { width: 40, height: 40 },
        style: {},
        isVisible: true,
        isRequired: false,
      },
    ],
  },

  // Creative Template
  {
    id: 'creative-artistic',
    name: 'Creative Artistic',
    category: 'creative',
    layout: 'magazine',
    isPopular: false,
    isPremium: true,
    previewImage: '/templates/creative-artistic.png',
    elements: [
      {
        id: 'background',
        type: 'background',
        position: { x: 0, y: 0 },
        size: { width: 350, height: 220 },
        style: {
          backgroundColor: '#fef2f2',
          borderRadius: 24,
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'profile-photo',
        type: 'profile-photo',
        position: { x: 250, y: 20 },
        size: { width: 80, height: 80 },
        style: {
          borderRadius: 40,
          borderWidth: 3,
          borderColor: '#dc2626',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'name',
        type: 'name',
        position: { x: 20, y: 30 },
        size: { width: 220, height: 35 },
        style: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#7f1d1d',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'title',
        type: 'title',
        position: { x: 20, y: 70 },
        size: { width: 220, height: 25 },
        style: {
          fontSize: 18,
          color: '#dc2626',
          fontStyle: 'italic',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'company',
        type: 'company',
        position: { x: 20, y: 100 },
        size: { width: 200, height: 20 },
        style: {
          fontSize: 14,
          color: '#991b1b',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'bio',
        type: 'bio',
        position: { x: 20, y: 130 },
        size: { width: 200, height: 35 },
        style: {
          fontSize: 11,
          color: '#7f1d1d',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'email',
        type: 'email',
        position: { x: 20, y: 175 },
        size: { width: 150, height: 16 },
        style: {
          fontSize: 12,
          color: '#dc2626',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'phone',
        type: 'phone',
        position: { x: 20, y: 195 },
        size: { width: 150, height: 16 },
        style: {
          fontSize: 12,
          color: '#dc2626',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'social-links',
        type: 'social-links',
        position: { x: 240, y: 110 },
        size: { width: 90, height: 80 },
        style: {
          fontSize: 10,
        },
        isVisible: true,
        isRequired: false,
      },
    ],
  },

  // Tech Template
  {
    id: 'tech-developer',
    name: 'Tech Developer',
    category: 'tech',
    layout: 'split',
    isPopular: true,
    isPremium: false,
    previewImage: '/templates/tech-developer.png',
    elements: [
      {
        id: 'background',
        type: 'background',
        position: { x: 0, y: 0 },
        size: { width: 350, height: 220 },
        style: {
          backgroundColor: '#0f172a',
          borderRadius: 12,
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'name',
        type: 'name',
        position: { x: 20, y: 20 },
        size: { width: 200, height: 30 },
        style: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#22d3ee',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'title',
        type: 'title',
        position: { x: 20, y: 55 },
        size: { width: 200, height: 20 },
        style: {
          fontSize: 16,
          color: '#e2e8f0',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'company',
        type: 'company',
        position: { x: 20, y: 80 },
        size: { width: 200, height: 18 },
        style: {
          fontSize: 14,
          color: '#94a3b8',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'email',
        type: 'email',
        position: { x: 20, y: 115 },
        size: { width: 200, height: 16 },
        style: {
          fontSize: 13,
          color: '#cbd5e1',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'phone',
        type: 'phone',
        position: { x: 20, y: 140 },
        size: { width: 200, height: 16 },
        style: {
          fontSize: 13,
          color: '#cbd5e1',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'social-links',
        type: 'social-links',
        position: { x: 20, y: 165 },
        size: { width: 200, height: 20 },
        style: {
          fontSize: 12,
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'qr-code',
        type: 'qr-code',
        position: { x: 270, y: 80 },
        size: { width: 60, height: 60 },
        style: {
          backgroundColor: '#22d3ee',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'profile-photo',
        type: 'profile-photo',
        position: { x: 260, y: 20 },
        size: { width: 70, height: 70 },
        style: {
          borderRadius: 8,
          borderWidth: 2,
          borderColor: '#22d3ee',
        },
        isVisible: true,
        isRequired: false,
      },
    ],
  },

  // Corporate Template
  {
    id: 'corporate-executive',
    name: 'Corporate Executive',
    category: 'corporate',
    layout: 'standard',
    isPopular: false,
    isPremium: true,
    previewImage: '/templates/corporate-executive.png',
    elements: [
      {
        id: 'background',
        type: 'background',
        position: { x: 0, y: 0 },
        size: { width: 350, height: 220 },
        style: {
          backgroundColor: '#ffffff',
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'company-logo',
        type: 'company-logo',
        position: { x: 20, y: 20 },
        size: { width: 60, height: 40 },
        style: {},
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'name',
        type: 'name',
        position: { x: 100, y: 25 },
        size: { width: 200, height: 30 },
        style: {
          fontSize: 22,
          fontWeight: 'bold',
          color: '#1e3a8a',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'title',
        type: 'title',
        position: { x: 100, y: 55 },
        size: { width: 200, height: 20 },
        style: {
          fontSize: 16,
          color: '#374151',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'divider',
        type: 'divider',
        position: { x: 20, y: 85 },
        size: { width: 310, height: 1 },
        style: {
          backgroundColor: '#1e3a8a',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'company',
        type: 'company',
        position: { x: 20, y: 100 },
        size: { width: 200, height: 18 },
        style: {
          fontSize: 14,
          color: '#1e3a8a',
          fontWeight: '600',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'email',
        type: 'email',
        position: { x: 20, y: 130 },
        size: { width: 150, height: 16 },
        style: {
          fontSize: 13,
          color: '#374151',
        },
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'phone',
        type: 'phone',
        position: { x: 180, y: 130 },
        size: { width: 150, height: 16 },
        style: {
          fontSize: 13,
          color: '#374151',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'location',
        type: 'location',
        position: { x: 20, y: 155 },
        size: { width: 200, height: 16 },
        style: {
          fontSize: 12,
          color: '#6b7280',
        },
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'website',
        type: 'custom-field',
        position: { x: 20, y: 180 },
        size: { width: 200, height: 16 },
        style: {
          fontSize: 12,
          color: '#1e3a8a',
        },
        isVisible: true,
        isRequired: false,
      },
    ],
  },
];

// Template categories for easy filtering
export const TEMPLATE_CATEGORIES = {
  professional: ['standard-professional'],
  minimalist: ['minimalist-clean'],
  startup: ['startup-founder'],
  creative: ['creative-artistic'],
  tech: ['tech-developer'],
  corporate: ['corporate-executive'],
};

// Helper function to get template by ID
export const getTemplateById = (id: string): CardTemplate | undefined => {
  return DEFAULT_TEMPLATES.find(template => template.id === id);
};

// Helper function to get templates by category
export const getTemplatesByCategory = (
  category: keyof typeof TEMPLATE_CATEGORIES,
): CardTemplate[] => {
  const templateIds = TEMPLATE_CATEGORIES[category] || [];
  return templateIds
    .map(id => getTemplateById(id))
    .filter(Boolean) as CardTemplate[];
};

// Helper function to get popular templates
export const getPopularTemplates = (): CardTemplate[] => {
  return DEFAULT_TEMPLATES.filter(template => template.isPopular);
};

// Helper function to get premium templates
export const getPremiumTemplates = (): CardTemplate[] => {
  return DEFAULT_TEMPLATES.filter(template => template.isPremium);
};

// Default template
export const DEFAULT_TEMPLATE = DEFAULT_TEMPLATES[0]; // standard-professional
