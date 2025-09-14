import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList, TabParamList } from './types';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import DiscoveryScreen from '../screens/DiscoveryScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#007bff',
      tabBarInactiveTintColor: '#6c757d',
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e9ecef',
        paddingBottom: 5,
      },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeScreen}
      options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => (
          <Icon name="home" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="DiscoveryTab"
      component={DiscoveryScreen}
      options={{
        title: 'Discover',
        tabBarIcon: ({ color, size }) => (
          <Icon name="search" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={TabNavigator} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
