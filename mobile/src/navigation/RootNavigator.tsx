import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import SignInScreen from '../screens/SignInScreen';
import TabNavigator from './TabNavigator';
import GetCoinsScreen from '../screens/GetCoinsScreen';
import AppSplash from '../components/AppSplash';

export type RootStackParamList = {
  SignIn: undefined;
  Tabs: undefined;
  GetCoins: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { state } = useAuth();

  if (state === 'loading') {
    // Branded splash while AuthContext checks for a stored session — bridges
    // the gap between the native boot splash and either SignIn or Tabs.
    return <AppSplash />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {state === 'signedIn' ? (
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen
            name="GetCoins"
            component={GetCoinsScreen}
            options={{ presentation: 'card' }}
          />
        </>
      ) : (
        <Stack.Screen name="SignIn" component={SignInScreen} />
      )}
    </Stack.Navigator>
  );
}
