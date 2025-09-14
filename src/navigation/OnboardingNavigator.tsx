/**
 * Onboarding Navigator
 *
 * Stack navigator for the onboarding flow with proper type safety
 * and smooth transitions between screens.
 */

import React from 'react';
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';

import { OnboardingStackParamList } from '../types/onboarding';

// Import onboarding screens
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import UserTypeSelectionScreen from '../screens/onboarding/UserTypeSelectionScreen';
import IndustrySelectionScreen from '../screens/onboarding/IndustrySelectionScreen';
import LocationSetupScreen from '../screens/onboarding/LocationSetupScreen';
import PermissionRequestsScreen from '../screens/onboarding/PermissionRequestsScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

interface OnboardingNavigatorProps {
  initialRouteName?: keyof OnboardingStackParamList;
}

const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({
  initialRouteName = 'Welcome',
}) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
        },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forFadeFromBottomAndroid,
        }}
      />

      <Stack.Screen
        name="UserTypeSelection"
        component={UserTypeSelectionScreen}
        options={{
          gestureDirection: 'horizontal',
        }}
      />

      <Stack.Screen
        name="IndustrySelection"
        component={IndustrySelectionScreen}
        options={{
          gestureDirection: 'horizontal',
        }}
      />

      <Stack.Screen
        name="LocationSetup"
        component={LocationSetupScreen}
        options={{
          gestureDirection: 'horizontal',
        }}
      />

      <Stack.Screen
        name="PermissionRequests"
        component={PermissionRequestsScreen}
        options={{
          gestureDirection: 'horizontal',
        }}
      />

      <Stack.Screen
        name="OnboardingComplete"
        component={OnboardingCompleteScreen}
        options={{
          gestureEnabled: false, // Prevent going back from completion screen
          cardStyleInterpolator:
            CardStyleInterpolators.forFadeFromBottomAndroid,
        }}
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
