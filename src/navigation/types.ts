import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Discovery: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  DiscoveryTab: undefined;
  ProfileTab: undefined;
};

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;
