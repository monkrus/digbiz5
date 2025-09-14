/**
 * Search Bar Component
 *
 * Enhanced search input with filter button and voice search capabilities
 */

import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress: () => void;
  hasFilters: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFilterPress,
  hasFilters,
  onFocus,
  onBlur,
  autoFocus,
}) => {
  const inputRef = useRef<TextInput>(null);
  const animatedScale = useRef(new Animated.Value(1)).current;

  const handleFilterPress = () => {
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onFilterPress();
  };

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={autoFocus}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType="search"
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
        />

        {Platform.OS === 'android' && value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Icon name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={[styles.filterButtonContainer, { transform: [{ scale: animatedScale }] }]}>
        <TouchableOpacity
          onPress={handleFilterPress}
          style={[
            styles.filterButton,
            hasFilters && styles.filterButtonActive,
          ]}
        >
          <Icon
            name="tune"
            size={20}
            color={hasFilters ? '#ffffff' : '#6c757d'}
          />
          {hasFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  filterButtonContainer: {
    position: 'relative',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc3545',
  },
});

export default SearchBar;