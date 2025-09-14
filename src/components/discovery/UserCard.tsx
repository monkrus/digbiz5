/**
 * User Card Component
 *
 * Displays user information in discovery lists with action buttons
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DiscoveredUser } from '../../types/discovery';

interface UserCardProps {
  user: DiscoveredUser;
  onConnect: () => void;
  onViewProfile: () => void;
  showDistance?: boolean;
  showMutualConnections?: boolean;
  showSuggestionReason?: boolean;
  suggestionReasons?: string[];
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onConnect,
  onViewProfile,
  showDistance = false,
  showMutualConnections = false,
  showSuggestionReason = false,
  suggestionReasons = [],
}) => {
  const [imageError, setImageError] = useState(false);

  const getConnectionButtonText = () => {
    switch (user.connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'pending':
        return 'Pending';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Connect';
    }
  };

  const getConnectionButtonStyle = () => {
    switch (user.connectionStatus) {
      case 'connected':
        return [styles.actionButton, styles.connectedButton];
      case 'pending':
        return [styles.actionButton, styles.pendingButton];
      case 'blocked':
        return [styles.actionButton, styles.blockedButton];
      default:
        return [styles.actionButton, styles.connectButton];
    }
  };

  const isConnectionDisabled = () => {
    return user.connectionStatus === 'connected' ||
           user.connectionStatus === 'pending' ||
           user.connectionStatus === 'blocked';
  };

  const formatSuggestionReasons = (reasons: string[]) => {
    const reasonMap: { [key: string]: string } = {
      mutual_connections: 'Mutual connections',
      same_company: 'Same company',
      same_industry: 'Same industry',
      same_location: 'Same location',
      similar_skills: 'Similar skills',
      startup_stage: 'Same startup stage',
      recent_activity: 'Recent activity',
      profile_views: 'Profile interaction',
    };

    return reasons
      .slice(0, 2) // Show max 2 reasons
      .map(reason => reasonMap[reason] || reason)
      .join(', ');
  };

  const renderProfileImage = () => {
    if (!user.profilePhoto || imageError) {
      return (
        <View style={styles.avatarPlaceholder}>
          <Icon name="person" size={24} color="#9ca3af" />
        </View>
      );
    }

    return (
      <Image
        source={{ uri: user.profilePhoto }}
        style={styles.avatar}
        onError={() => setImageError(true)}
      />
    );
  };

  const renderBadges = () => (
    <View style={styles.badgesContainer}>
      {user.isVerified && (
        <View style={styles.badge}>
          <Icon name="verified" size={12} color="#10b981" />
        </View>
      )}
      {user.isRecent && (
        <View style={[styles.badge, styles.newBadge]}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
    </View>
  );

  const renderMetadata = () => (
    <View style={styles.metadataContainer}>
      {showDistance && user.distance && (
        <View style={styles.metadataItem}>
          <Icon name="location-on" size={14} color="#6c757d" />
          <Text style={styles.metadataText}>
            {user.distance < 1 ? '<1km' : `${Math.round(user.distance)}km`}
          </Text>
        </View>
      )}

      {showMutualConnections && user.mutualConnections && user.mutualConnections > 0 && (
        <View style={styles.metadataItem}>
          <Icon name="people" size={14} color="#6c757d" />
          <Text style={styles.metadataText}>
            {user.mutualConnections} mutual
          </Text>
        </View>
      )}

      {user.startupStage && (
        <View style={[styles.metadataItem, styles.stageTag]}>
          <Text style={styles.stageText}>{user.startupStage}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onViewProfile} style={styles.content}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {renderProfileImage()}

            <View style={styles.textInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {user.name}
                </Text>
                {renderBadges()}
              </View>

              {user.title && (
                <Text style={styles.title} numberOfLines={1}>
                  {user.title}
                </Text>
              )}

              {user.company && (
                <Text style={styles.company} numberOfLines={1}>
                  {user.company}
                </Text>
              )}

              {showSuggestionReason && suggestionReasons.length > 0 && (
                <Text style={styles.suggestionReason} numberOfLines={1}>
                  {formatSuggestionReasons(suggestionReasons)}
                </Text>
              )}
            </View>
          </View>

          {renderMetadata()}
        </View>

        {user.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>
        )}

        {user.skills && user.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {user.skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {user.skills.length > 3 && (
              <Text style={styles.moreSkills}>+{user.skills.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onConnect}
          disabled={isConnectionDisabled()}
          style={getConnectionButtonStyle()}
        >
          <Text style={[
            styles.actionButtonText,
            user.connectionStatus === 'connected' && styles.connectedButtonText,
            user.connectionStatus === 'pending' && styles.pendingButtonText,
            user.connectionStatus === 'blocked' && styles.blockedButtonText,
          ]}>
            {getConnectionButtonText()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onViewProfile} style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  suggestionReason: {
    fontSize: 12,
    color: '#007bff',
    fontStyle: 'italic',
    marginTop: 2,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  badge: {
    marginLeft: 4,
  },
  newBadge: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#6c757d',
  },
  stageTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  stageText: {
    fontSize: 11,
    color: '#495057',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bio: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#007bff',
  },
  connectedButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  pendingButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  blockedButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  connectedButtonText: {
    color: '#28a745',
  },
  pendingButtonText: {
    color: '#856404',
  },
  blockedButtonText: {
    color: '#6c757d',
  },
  viewButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
});

export default UserCard;