/**
 * Template Selector - Interface for choosing business card templates
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';

import { CardTemplate, TemplateCategory } from '../../../types/businessCard';
import {
  DEFAULT_TEMPLATES,
  getTemplatesByCategory,
  getPopularTemplates,
  getPremiumTemplates,
} from '../../../data/cardTemplates';
import TemplatePreview from '../preview/TemplatePreview';

const { width } = Dimensions.get('window');
const TEMPLATE_WIDTH = (width - 60) / 2; // 2 columns with padding

interface TemplateSelectorProps {
  selectedTemplateId?: string;
  onSelect: (templateId: string) => void;
  showCategories?: boolean;
  allowPremium?: boolean;
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  professional: 'Professional',
  minimalist: 'Minimalist',
  startup: 'Startup',
  creative: 'Creative',
  tech: 'Tech',
  corporate: 'Corporate',
  artistic: 'Artistic',
  modern: 'Modern',
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelect,
  showCategories = true,
  allowPremium = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    TemplateCategory | 'popular' | 'all'
  >('popular');

  const filteredTemplates = useMemo(() => {
    let templates: CardTemplate[] = [];

    switch (selectedCategory) {
      case 'popular':
        templates = getPopularTemplates();
        break;
      case 'all':
        templates = DEFAULT_TEMPLATES;
        break;
      default:
        templates = getTemplatesByCategory(
          selectedCategory as TemplateCategory,
        );
        break;
    }

    // Filter out premium templates if not allowed
    if (!allowPremium) {
      templates = templates.filter(template => !template.isPremium);
    }

    return templates;
  }, [selectedCategory, allowPremium]);

  const categories: Array<{
    key: TemplateCategory | 'popular' | 'all';
    label: string;
  }> = [
    { key: 'popular', label: '🔥 Popular' },
    { key: 'all', label: 'All Templates' },
    ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
      key: key as TemplateCategory,
      label,
    })),
  ];

  const renderCategoryButton = (category: {
    key: TemplateCategory | 'popular' | 'all';
    label: string;
  }) => {
    const isSelected = selectedCategory === category.key;

    return (
      <TouchableOpacity
        key={category.key}
        style={[
          styles.categoryButton,
          isSelected && styles.categoryButtonActive,
        ]}
        onPress={() => setSelectedCategory(category.key)}
      >
        <Text
          style={[
            styles.categoryButtonText,
            isSelected && styles.categoryButtonTextActive,
          ]}
        >
          {category.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTemplate = ({ item: template }: { item: CardTemplate }) => {
    const isSelected = selectedTemplateId === template.id;

    return (
      <TouchableOpacity
        style={[styles.templateCard, isSelected && styles.templateCardSelected]}
        onPress={() => onSelect(template.id)}
        activeOpacity={0.8}
      >
        {/* Template preview */}
        <View style={styles.templatePreview}>
          <TemplatePreview
            template={template}
            width={TEMPLATE_WIDTH - 20}
            height={(TEMPLATE_WIDTH - 20) * 0.6}
          />
        </View>

        {/* Template info */}
        <View style={styles.templateInfo}>
          <View style={styles.templateHeader}>
            <Text style={styles.templateName} numberOfLines={1}>
              {template.name}
            </Text>
            <View style={styles.templateBadges}>
              {template.isPopular && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🔥</Text>
                </View>
              )}
              {template.isPremium && (
                <View style={[styles.badge, styles.premiumBadge]}>
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.templateCategory}>
            {CATEGORY_LABELS[template.category]}
          </Text>

          <Text style={styles.templateLayout} numberOfLines={1}>
            {template.layout.replace('-', ' ')} layout
          </Text>
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.selectionCheck}>✓</Text>
          </View>
        )}

        {/* Premium overlay */}
        {template.isPremium && !allowPremium && (
          <View style={styles.premiumOverlay}>
            <Text style={styles.premiumOverlayText}>PRO</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Template</Text>
        <Text style={styles.subtitle}>
          Select a layout that best represents your professional style
        </Text>
      </View>

      {/* Category filters */}
      {showCategories && (
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(renderCategoryButton)}
          </ScrollView>
        </View>
      )}

      {/* Templates grid */}
      <FlatList
        data={filteredTemplates}
        renderItem={renderTemplate}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.templatesContainer}
        columnWrapperStyle={styles.templateRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No templates found in this category
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setSelectedCategory('popular')}
            >
              <Text style={styles.emptyStateButtonText}>
                View Popular Templates
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Premium upsell */}
      {!allowPremium && getPremiumTemplates().length > 0 && (
        <View style={styles.premiumUpsell}>
          <Text style={styles.upsellTitle}>🎨 Want More Templates?</Text>
          <Text style={styles.upsellText}>
            Unlock {getPremiumTemplates().length} premium templates with unique
            designs
          </Text>
          <TouchableOpacity style={styles.upsellButton}>
            <Text style={styles.upsellButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesContainer: {
    paddingHorizontal: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  templatesContainer: {
    paddingBottom: 20,
  },
  templateRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  templateCard: {
    width: TEMPLATE_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  templateCardSelected: {
    borderColor: '#3b82f6',
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  templatePreview: {
    height: (TEMPLATE_WIDTH - 20) * 0.6,
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  templateInfo: {
    padding: 12,
    paddingTop: 0,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  templateBadges: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
  },
  premiumBadge: {
    backgroundColor: '#8b5cf6',
  },
  premiumBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  templateCategory: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: 2,
  },
  templateLayout: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumOverlayText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  premiumUpsell: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  upsellTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  upsellText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 12,
  },
  upsellButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upsellButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default TemplateSelector;
