import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PlayScreen from '../screens/PlayScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LeadersScreen from '../screens/LeadersScreen';
import AccountScreen from '../screens/AccountScreen';

export type TabParamList = {
  Play: undefined;
  History: undefined;
  Leaders: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// TODO: swap for real icons (react-native-vector-icons or custom SVGs) once screens are finalized.
const TAB_ICONS: Record<keyof TabParamList, string> = {
  Play: '▶',
  History: '⏱',
  Leaders: '🏆',
  Account: '👤',
};

function renderTabIcon(routeName: keyof TabParamList, color: string, size: number) {
  return <Text style={{ color, fontSize: size }}>{TAB_ICONS[routeName]}</Text>;
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#8A8A8E',
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color, size }) =>
          renderTabIcon(route.name as keyof TabParamList, color, size),
      })}>
      <Tab.Screen name="Play" component={PlayScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Leaders" component={LeadersScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F0F10',
    borderTopColor: '#1C1C1E',
  },
});
