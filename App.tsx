import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { HomeScreen } from './src/screens/HomeScreen';
import CompanyRegistrationScreen from './src/screens/company/CompanyRegistrationScreen';
import { CompanyProfileScreen } from './src/screens/CompanyProfileScreen';
import TeamManagementScreen from './src/screens/company/TeamManagementScreen';
import { IndustryHubsScreen } from './src/screens/IndustryHubsScreen';
import { HubDetailsScreen } from './src/screens/HubDetailsScreen';
import { CreateHubScreen } from './src/screens/CreateHubScreen';
import { MatchingScreen } from './src/screens/MatchingScreen';
import { MatchPreferencesScreen } from './src/screens/MatchPreferencesScreen';

const Stack = createStackNavigator<any>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <PaperProvider>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#6200ee',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'DigBiz' }}
              />
              <Stack.Screen
                name="CompanyRegistration"
                component={CompanyRegistrationScreen}
                options={{ title: 'Register Company' }}
              />
              <Stack.Screen
                name="CompanyProfile"
                component={CompanyProfileScreen}
                options={{ title: 'Company Profile' }}
              />
              <Stack.Screen
                name="TeamManagement"
                component={TeamManagementScreen}
                options={{ title: 'Team Management' }}
              />
              <Stack.Screen
                name="IndustryHubs"
                component={IndustryHubsScreen}
                options={{ title: 'Industry Hubs' }}
              />
              <Stack.Screen
                name="HubDetails"
                component={HubDetailsScreen}
                options={{ title: 'Hub Details' }}
              />
              <Stack.Screen
                name="CreateHub"
                component={CreateHubScreen}
                options={{ title: 'Create Hub' }}
              />
              <Stack.Screen
                name="Matching"
                component={MatchingScreen}
                options={{ title: 'Discover', headerShown: false }}
              />
              <Stack.Screen
                name="MatchPreferences"
                component={MatchPreferencesScreen}
                options={{ title: 'Match Preferences' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </Provider>
  );
}

export default App;
