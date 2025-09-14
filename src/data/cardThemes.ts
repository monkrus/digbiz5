/**
 * Predefined Business Card Themes
 *
 * This file contains a collection of predefined themes for business cards,
 * including professional, startup, creative, and minimalist styles.
 */

import { CardTheme } from '../types/businessCard';

export const DEFAULT_THEMES: CardTheme[] = [
  // Professional Themes
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#3b82f6',
    fontFamily: 'Inter',
    headerFontSize: 24,
    bodyFontSize: 14,
    borderRadius: 12,
    padding: 24,
    spacing: 16,
    shadow: {
      color: '#000000',
      opacity: 0.1,
      offsetX: 0,
      offsetY: 4,
      blur: 12,
    },
  },

  {
    id: 'professional-gray',
    name: 'Professional Gray',
    primaryColor: '#374151',
    secondaryColor: '#111827',
    backgroundColor: '#f9fafb',
    textColor: '#1f2937',
    accentColor: '#6b7280',
    fontFamily: 'Inter',
    headerFontSize: 22,
    bodyFontSize: 14,
    borderRadius: 8,
    padding: 20,
    spacing: 14,
    shadow: {
      color: '#000000',
      opacity: 0.08,
      offsetX: 0,
      offsetY: 2,
      blur: 8,
    },
  },

  // Startup Themes
  {
    id: 'startup-gradient',
    name: 'Startup Gradient',
    primaryColor: '#7c3aed',
    secondaryColor: '#5b21b6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#8b5cf6',
    fontFamily: 'Poppins',
    headerFontSize: 26,
    bodyFontSize: 15,
    borderRadius: 16,
    padding: 28,
    spacing: 18,
    gradient: {
      type: 'linear',
      colors: ['#7c3aed', '#3b82f6'],
      direction: 45,
    },
    shadow: {
      color: '#7c3aed',
      opacity: 0.2,
      offsetX: 0,
      offsetY: 8,
      blur: 24,
    },
  },

  {
    id: 'startup-modern',
    name: 'Modern Startup',
    primaryColor: '#059669',
    secondaryColor: '#047857',
    backgroundColor: '#ffffff',
    textColor: '#065f46',
    accentColor: '#10b981',
    fontFamily: 'Montserrat',
    headerFontSize: 24,
    bodyFontSize: 14,
    borderRadius: 20,
    padding: 24,
    spacing: 16,
    shadow: {
      color: '#059669',
      opacity: 0.15,
      offsetX: 0,
      offsetY: 6,
      blur: 16,
    },
  },

  // Creative Themes
  {
    id: 'creative-vibrant',
    name: 'Creative Vibrant',
    primaryColor: '#dc2626',
    secondaryColor: '#991b1b',
    backgroundColor: '#fef2f2',
    textColor: '#7f1d1d',
    accentColor: '#ef4444',
    fontFamily: 'Nunito',
    headerFontSize: 28,
    bodyFontSize: 16,
    borderRadius: 24,
    padding: 32,
    spacing: 20,
    gradient: {
      type: 'radial',
      colors: ['#fef2f2', '#fee2e2'],
      center: { x: 0.5, y: 0.3 },
    },
    pattern: {
      type: 'dots',
      color: '#fecaca',
      opacity: 0.3,
      size: 4,
    },
  },

  {
    id: 'creative-dark',
    name: 'Creative Dark',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    backgroundColor: '#111827',
    textColor: '#f9fafb',
    accentColor: '#fbbf24',
    fontFamily: 'Space Grotesk',
    headerFontSize: 26,
    bodyFontSize: 15,
    borderRadius: 18,
    padding: 26,
    spacing: 18,
    shadow: {
      color: '#f59e0b',
      opacity: 0.3,
      offsetX: 0,
      offsetY: 8,
      blur: 20,
    },
  },

  // Minimalist Themes
  {
    id: 'minimalist-white',
    name: 'Minimalist White',
    primaryColor: '#000000',
    secondaryColor: '#374151',
    backgroundColor: '#ffffff',
    textColor: '#111827',
    accentColor: '#6b7280',
    fontFamily: 'Inter',
    headerFontSize: 22,
    bodyFontSize: 13,
    borderRadius: 4,
    padding: 18,
    spacing: 12,
    shadow: {
      color: '#000000',
      opacity: 0.05,
      offsetX: 0,
      offsetY: 1,
      blur: 3,
    },
  },

  {
    id: 'minimalist-mono',
    name: 'Minimalist Mono',
    primaryColor: '#1f2937',
    secondaryColor: '#111827',
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    accentColor: '#475569',
    fontFamily: 'JetBrains Mono',
    headerFontSize: 20,
    bodyFontSize: 12,
    borderRadius: 0,
    padding: 16,
    spacing: 10,
  },

  // Tech Themes
  {
    id: 'tech-neon',
    name: 'Tech Neon',
    primaryColor: '#06b6d4',
    secondaryColor: '#0891b2',
    backgroundColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#22d3ee',
    fontFamily: 'Fira Code',
    headerFontSize: 24,
    bodyFontSize: 14,
    borderRadius: 12,
    padding: 22,
    spacing: 15,
    gradient: {
      type: 'linear',
      colors: ['#0f172a', '#1e293b'],
      direction: 135,
    },
    shadow: {
      color: '#06b6d4',
      opacity: 0.4,
      offsetX: 0,
      offsetY: 0,
      blur: 16,
    },
  },

  {
    id: 'tech-matrix',
    name: 'Tech Matrix',
    primaryColor: '#22c55e',
    secondaryColor: '#16a34a',
    backgroundColor: '#000000',
    textColor: '#dcfce7',
    accentColor: '#4ade80',
    fontFamily: 'Courier New',
    headerFontSize: 23,
    bodyFontSize: 13,
    borderRadius: 8,
    padding: 20,
    spacing: 14,
    pattern: {
      type: 'lines',
      color: '#22c55e',
      opacity: 0.1,
      size: 2,
    },
    shadow: {
      color: '#22c55e',
      opacity: 0.3,
      offsetX: 0,
      offsetY: 4,
      blur: 12,
    },
  },

  // Corporate Themes
  {
    id: 'corporate-navy',
    name: 'Corporate Navy',
    primaryColor: '#1e3a8a',
    secondaryColor: '#1e40af',
    backgroundColor: '#ffffff',
    textColor: '#1e3a8a',
    accentColor: '#3b82f6',
    fontFamily: 'Roboto',
    headerFontSize: 24,
    bodyFontSize: 14,
    borderRadius: 6,
    padding: 24,
    spacing: 16,
    shadow: {
      color: '#1e3a8a',
      opacity: 0.12,
      offsetX: 0,
      offsetY: 4,
      blur: 10,
    },
  },

  {
    id: 'corporate-burgundy',
    name: 'Corporate Burgundy',
    primaryColor: '#991b1b',
    secondaryColor: '#7f1d1d',
    backgroundColor: '#fefefe',
    textColor: '#7f1d1d',
    accentColor: '#dc2626',
    fontFamily: 'Times New Roman',
    headerFontSize: 25,
    bodyFontSize: 15,
    borderRadius: 8,
    padding: 26,
    spacing: 17,
    shadow: {
      color: '#991b1b',
      opacity: 0.1,
      offsetX: 0,
      offsetY: 3,
      blur: 8,
    },
  },
];

// Theme categories for easy filtering
export const THEME_CATEGORIES = {
  professional: ['professional-blue', 'professional-gray'],
  startup: ['startup-gradient', 'startup-modern'],
  creative: ['creative-vibrant', 'creative-dark'],
  minimalist: ['minimalist-white', 'minimalist-mono'],
  tech: ['tech-neon', 'tech-matrix'],
  corporate: ['corporate-navy', 'corporate-burgundy'],
};

// Helper function to get theme by ID
export const getThemeById = (id: string): CardTheme | undefined => {
  return DEFAULT_THEMES.find(theme => theme.id === id);
};

// Helper function to get themes by category
export const getThemesByCategory = (
  category: keyof typeof THEME_CATEGORIES,
): CardTheme[] => {
  const themeIds = THEME_CATEGORIES[category] || [];
  return themeIds.map(id => getThemeById(id)).filter(Boolean) as CardTheme[];
};

// Default theme
export const DEFAULT_THEME = DEFAULT_THEMES[0]; // professional-blue
