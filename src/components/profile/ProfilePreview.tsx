/**
 * Profile Preview Component
 *
 * This component displays a user's profile in a clean, readable format
 * with different views (card, detailed, compact) and interactive elements.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { UserProfile } from '../../types/profile';
import { getProfileCompletionPercentage } from '../../utils/profileValidation';

// Icons (you'd import from your icon library)
import Icon from 'react-native-vector-icons/MaterialIcons';
import SocialIcon from 'react-native-vector-icons/FontAwesome';

interface ProfilePreviewProps {
  profile: UserProfile;
  variant?: 'card' | 'detailed' | 'compact' | 'header';
  showActions?: boolean;
  showCompletion?: boolean;
  showSocialLinks?: boolean;
  showSkills?: boolean;
  showContact?: boolean;
  editable?: boolean;
  onEdit?: () => void;
  onShare?: () => void;
  onContact?: () => void;
  onConnect?: () => void;
  style?: any;
}

const ProfilePreview: React.FC<ProfilePreviewProps> = ({
  profile,
  variant = 'card',
  showActions = true,
  showCompletion = false,
  showSocialLinks = true,
  showSkills = true,
  showContact = true,
  editable = false,
  onEdit,
  onShare,
  onContact,
  onConnect,
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const [expandedBio, setExpandedBio] = useState(false);

  const completionPercentage = getProfileCompletionPercentage({
    name: profile.name,
    title: profile.title,
    company: profile.company,
    bio: profile.bio,
    email: profile.email,
    phone: profile.phone || '',
    location: profile.location || '',
    website: profile.website || '',
    socialLinks: profile.socialLinks,
    skills: profile.skills,
    isPublic: profile.isPublic,
  });

  const handleSocialLinkPress = useCallback((url: string) => {
    if (url) {
      const validUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(validUrl).catch(() => {
        Alert.alert('Error', 'Unable to open this link');
      });
    }
  }, []);

  const handleWebsitePress = useCallback(() => {
    if (profile.website) {
      const validUrl = profile.website.startsWith('http')
        ? profile.website
        : `https://${profile.website}`;
      Linking.openURL(validUrl).catch(() => {
        Alert.alert('Error', 'Unable to open website');
      });
    }
  }, [profile.website]);

  const handleEmailPress = useCallback(() => {
    if (profile.email) {
      Linking.openURL(`mailto:${profile.email}`).catch(() => {
        Alert.alert('Error', 'Unable to open email client');
      });
    }
  }, [profile.email]);

  const handlePhonePress = useCallback(() => {
    if (profile.phone) {
      Linking.openURL(`tel:${profile.phone}`).catch(() => {
        Alert.alert('Error', 'Unable to make phone call');
      });
    }
  }, [profile.phone]);

  const handleShare = useCallback(async () => {
    try {
      const shareMessage = `Check out ${profile.name}'s profile\n${profile.title} at ${profile.company}`;
      await Share.share({
        message: shareMessage,
        title: `${profile.name}'s Profile`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }

    if (onShare) onShare();
  }, [profile, onShare]);

  const renderProfileImage = () => {
    const imageSize =
      variant === 'compact' ? 50 : variant === 'header' ? 80 : 100;

    return (
      <View
        style={[styles.imageContainer, { width: imageSize, height: imageSize }]}
      >
        {profile.profilePhoto && !imageError ? (
          <Image
            source={{ uri: profile.profilePhoto }}
            style={[
              styles.profileImage,
              { width: imageSize, height: imageSize },
            ]}
            onError={() => setImageError(true)}
          />
        ) : (
          <View
            style={[
              styles.placeholderImage,
              { width: imageSize, height: imageSize },
            ]}
          >
            <Icon name="person" size={imageSize * 0.6} color="#9CA3AF" />
          </View>
        )}
        {profile.isVerified && (
          <View style={styles.verifiedBadge}>
            <Icon name="verified" size={20} color="#3B82F6" />
          </View>
        )}
      </View>
    );
  };

  const renderBasicInfo = () => (
    <View style={styles.basicInfo}>
      <View style={styles.nameContainer}>
        <Text style={styles.name} numberOfLines={variant === 'compact' ? 1 : 2}>
          {profile.name}
        </Text>
        {profile.isVerified && variant !== 'compact' && (
          <Icon
            name="verified"
            size={18}
            color="#3B82F6"
            style={styles.verifiedIcon}
          />
        )}
      </View>

      <Text style={styles.title} numberOfLines={variant === 'compact' ? 1 : 2}>
        {profile.title}
      </Text>

      <Text style={styles.company} numberOfLines={1}>
        {profile.company}
      </Text>

      {profile.location && variant !== 'compact' && (
        <View style={styles.locationContainer}>
          <Icon name="location-on" size={14} color="#6B7280" />
          <Text style={styles.location}>{profile.location}</Text>
        </View>
      )}
    </View>
  );

  const renderBio = () => {
    if (!profile.bio || variant === 'compact') return null;

    const shouldTruncate = profile.bio.length > 150 && !expandedBio;
    const displayBio = shouldTruncate
      ? `${profile.bio.substring(0, 150)}...`
      : profile.bio;

    return (
      <View style={styles.bioContainer}>
        <Text style={styles.bio}>{displayBio}</Text>
        {profile.bio.length > 150 && (
          <TouchableOpacity onPress={() => setExpandedBio(!expandedBio)}>
            <Text style={styles.bioToggle}>
              {expandedBio ? 'Show less' : 'Show more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSkills = () => {
    if (!showSkills || !profile.skills.length || variant === 'compact')
      return null;

    const displaySkills =
      variant === 'card' ? profile.skills.slice(0, 6) : profile.skills;

    return (
      <View style={styles.skillsContainer}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsWrapper}>
          {displaySkills.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {variant === 'card' && profile.skills.length > 6 && (
            <View style={styles.skillTag}>
              <Text style={styles.skillText}>+{profile.skills.length - 6}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSocialLinks = () => {
    if (!showSocialLinks || variant === 'compact') return null;

    const socialLinks = Object.entries(profile.socialLinks)
      .filter(([_, url]) => url)
      .slice(0, 5);

    if (socialLinks.length === 0) return null;

    return (
      <View style={styles.socialLinksContainer}>
        <Text style={styles.sectionTitle}>Connect</Text>
        <View style={styles.socialLinksWrapper}>
          {socialLinks.map(([platform, url]) => (
            <TouchableOpacity
              key={platform}
              style={styles.socialLink}
              onPress={() => handleSocialLinkPress(url!)}
            >
              <SocialIcon name={platform} size={20} color="#6B7280" />
            </TouchableOpacity>
          ))}
          {profile.website && (
            <TouchableOpacity
              style={styles.socialLink}
              onPress={handleWebsitePress}
            >
              <Icon name="language" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderContactInfo = () => {
    if (!showContact || variant === 'compact' || variant === 'card')
      return null;

    return (
      <View style={styles.contactContainer}>
        <Text style={styles.sectionTitle}>Contact</Text>
        {profile.email && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={handleEmailPress}
          >
            <Icon name="email" size={18} color="#6B7280" />
            <Text style={styles.contactText}>{profile.email}</Text>
          </TouchableOpacity>
        )}
        {profile.phone && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={handlePhonePress}
          >
            <Icon name="phone" size={18} color="#6B7280" />
            <Text style={styles.contactText}>{profile.phone}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCompletion = () => {
    if (!showCompletion || variant === 'compact') return null;

    return (
      <View style={styles.completionContainer}>
        <View style={styles.completionHeader}>
          <Text style={styles.completionTitle}>Profile Completion</Text>
          <Text style={styles.completionPercentage}>
            {completionPercentage}%
          </Text>
        </View>
        <View style={styles.completionBar}>
          <View
            style={[
              styles.completionProgress,
              { width: `${completionPercentage}%` },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderActions = () => {
    if (!showActions) return null;

    return (
      <View style={styles.actionsContainer}>
        {editable && onEdit && (
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Icon name="edit" size={18} color="#3B82F6" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}
        {!editable && onConnect && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={onConnect}
          >
            <Icon name="person-add" size={18} color="#FFFFFF" />
            <Text style={[styles.actionText, styles.primaryActionText]}>
              Connect
            </Text>
          </TouchableOpacity>
        )}
        {onContact && (
          <TouchableOpacity style={styles.actionButton} onPress={onContact}>
            <Icon name="message" size={18} color="#3B82F6" />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Icon name="share" size={18} color="#3B82F6" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    styles[`${variant}Container`],
    style,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        {renderProfileImage()}
        {renderBasicInfo()}
      </View>

      {renderBio()}
      {renderSkills()}
      {renderSocialLinks()}
      {renderContactInfo()}
      {renderCompletion()}
      {renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContainer: {
    marginBottom: 16,
  },
  compactContainer: {
    padding: 12,
    marginBottom: 8,
  },
  detailedContainer: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    borderRadius: 50,
  },
  placeholderImage: {
    backgroundColor: '#F3F4F6',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  basicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  bioContainer: {
    marginBottom: 16,
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bioToggle: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  skillText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  socialLinksContainer: {
    marginBottom: 16,
  },
  socialLinksWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialLink: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  contactContainer: {
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  completionContainer: {
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  completionPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  completionBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  completionProgress: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  primaryAction: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
  },
});

export default ProfilePreview;
