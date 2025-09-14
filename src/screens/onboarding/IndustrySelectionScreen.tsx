/**
 * Industry Selection Screen
 *
 * Searchable industry selection with categories and filtering.
 * Allows users to select their industry with intelligent search.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  FlatList,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { INDUSTRY_CATEGORIES } from '../../data/onboardingData';
import { Industry, IndustryCategory, UserType } from '../../types/onboarding';

interface IndustrySelectionScreenProps {
  onIndustrySelected?: (industry: Industry) => void;
  onBack?: () => void;
}

interface RouteParams {
  userType: UserType;
}

const IndustrySelectionScreen: React.FC<IndustrySelectionScreenProps> = ({
  onIndustrySelected,
  onBack,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userType } = (route.params as RouteParams) || {};

  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSelections, setRecentSelections] = useState<Industry[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate header and search
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Load recent selections from storage (mock for now)
    loadRecentSelections();
  }, []);

  const loadRecentSelections = () => {
    // Mock recent selections - in real app, load from AsyncStorage
    const recent = [
      INDUSTRY_CATEGORIES[0].industries[0], // Software & SaaS
      INDUSTRY_CATEGORIES[1].industries[0], // Financial Technology
    ];
    setRecentSelections(recent);
  };

  // Filter industries based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return selectedCategory
        ? INDUSTRY_CATEGORIES.filter(cat => cat.id === selectedCategory)
        : INDUSTRY_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    const filtered: IndustryCategory[] = [];

    INDUSTRY_CATEGORIES.forEach(category => {
      const matchingIndustries = category.industries.filter(
        industry =>
          industry.name.toLowerCase().includes(query) ||
          industry.keywords.some(keyword =>
            keyword.toLowerCase().includes(query),
          ),
      );

      if (matchingIndustries.length > 0) {
        filtered.push({
          ...category,
          industries: matchingIndustries,
        });
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory]);

  // Get popular industries based on user type
  const getPopularIndustries = () => {
    const popularByType = {
      founder: ['software', 'fintech', 'healthtech', 'ai-ml'],
      investor: ['software', 'fintech', 'biotech', 'cleantech'],
      employee: ['software', 'fintech', 'healthtech', 'consulting'],
    };

    const popularIds = popularByType[userType] || popularByType.employee;
    const popular: Industry[] = [];

    INDUSTRY_CATEGORIES.forEach(category => {
      category.industries.forEach(industry => {
        if (popularIds.includes(industry.id)) {
          popular.push(industry);
        }
      });
    });

    return popular;
  };

  const handleIndustrySelect = (industry: Industry) => {
    setSelectedIndustry(industry);

    // Add to recent selections
    const updatedRecent = [
      industry,
      ...recentSelections.filter(i => i.id !== industry.id),
    ].slice(0, 3);
    setRecentSelections(updatedRecent);
  };

  const handleContinue = () => {
    if (!selectedIndustry) return;

    if (onIndustrySelected) {
      onIndustrySelected(selectedIndustry);
    } else {
      navigation.navigate(
        'LocationSetup' as never,
        {
          userType,
          industry: selectedIndustry,
        } as never,
      );
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryScrollContent}
    >
      <TouchableOpacity
        style={[
          styles.categoryChip,
          !selectedCategory && styles.activeCategoryChip,
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text
          style={[
            styles.categoryChipText,
            !selectedCategory && styles.activeCategoryChipText,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {INDUSTRY_CATEGORIES.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.activeCategoryChip,
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.activeCategoryChipText,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderIndustryItem = ({ item }: { item: Industry }) => {
    const isSelected = selectedIndustry?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.industryItem, isSelected && styles.selectedIndustryItem]}
        onPress={() => handleIndustrySelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.industryContent}>
          <Text
            style={[
              styles.industryName,
              isSelected && styles.selectedIndustryName,
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.industryKeywords,
              isSelected && styles.selectedIndustryKeywords,
            ]}
          >
            {item.keywords.slice(0, 3).join(' • ')}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.checkIcon}>
            <Icon name="check" size={20} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: IndustryCategory }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.name}</Text>
      <Text style={styles.sectionCount}>
        {section.industries.length} industries
      </Text>
    </View>
  );

  const renderQuickSelection = () => {
    if (searchQuery.trim()) return null;

    const popularIndustries = getPopularIndustries();

    return (
      <View style={styles.quickSelectionSection}>
        {recentSelections.length > 0 && (
          <View style={styles.quickCategory}>
            <Text style={styles.quickCategoryTitle}>Recently Selected</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentSelections.map(industry => (
                <TouchableOpacity
                  key={`recent-${industry.id}`}
                  style={[
                    styles.quickIndustryChip,
                    selectedIndustry?.id === industry.id &&
                      styles.selectedQuickChip,
                  ]}
                  onPress={() => handleIndustrySelect(industry)}
                >
                  <Text
                    style={[
                      styles.quickIndustryText,
                      selectedIndustry?.id === industry.id &&
                        styles.selectedQuickText,
                    ]}
                  >
                    {industry.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.quickCategory}>
          <Text style={styles.quickCategoryTitle}>Popular for {userType}s</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularIndustries.map(industry => (
              <TouchableOpacity
                key={`popular-${industry.id}`}
                style={[
                  styles.quickIndustryChip,
                  selectedIndustry?.id === industry.id &&
                    styles.selectedQuickChip,
                ]}
                onPress={() => handleIndustrySelect(industry)}
              >
                <Text
                  style={[
                    styles.quickIndustryText,
                    selectedIndustry?.id === industry.id &&
                      styles.selectedQuickText,
                  ]}
                >
                  {industry.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>What's your industry?</Text>
          <Text style={styles.headerSubtitle}>
            Help us connect you with relevant opportunities
          </Text>
        </View>

        <View style={styles.progressIndicator}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={styles.progressDot} />
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            opacity: searchAnim,
            transform: [
              {
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.searchInputContainer}>
          <Icon
            name="search"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search industries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Quick Selection */}
      {renderQuickSelection()}

      {/* Industry List */}
      <SectionList
        sections={filteredData}
        keyExtractor={item => item.id}
        renderItem={renderIndustryItem}
        renderSectionHeader={renderSectionHeader}
        style={styles.industryList}
        contentContainerStyle={styles.industryListContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

      {/* Continue Button */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedIndustry && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedIndustry}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.continueText,
              !selectedIndustry && styles.disabledText,
            ]}
          >
            Continue
          </Text>
          <Icon
            name="arrow-forward"
            size={20}
            color={selectedIndustry ? '#FFFFFF' : '#9CA3AF'}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 24,
  },
  categoryChip: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeCategoryChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeCategoryChipText: {
    color: '#FFFFFF',
  },
  quickSelectionSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  quickCategory: {
    marginBottom: 16,
  },
  quickCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  quickIndustryChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  selectedQuickChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  quickIndustryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  selectedQuickText: {
    color: '#FFFFFF',
  },
  industryList: {
    flex: 1,
  },
  industryListContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  industryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIndustryItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  industryContent: {
    flex: 1,
  },
  industryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedIndustryName: {
    color: '#3B82F6',
  },
  industryKeywords: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedIndustryKeywords: {
    color: '#3B82F6',
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default IndustrySelectionScreen;
