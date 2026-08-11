import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  MaterialDesignIcons,
  MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons';
import PlayScreen from '../screens/PlayScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LeadersScreen from '../screens/LeadersScreen';
import AccountScreen from '../screens/AccountScreen';
import { colors } from '../theme/theme';

export type TabParamList = {
  Play: undefined;
  History: undefined;
  Leaders: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICON_NAMES: Record<keyof TabParamList, MaterialDesignIconsIconName> = {
  Play: 'sword-cross',
  History: 'format-list-bulleted', // было 'history'
  Leaders: 'trophy',
  Account: 'account', // было 'account-circle'
};

// Route key stays "Leaders" (used in navigation types); the visible label
// spells out "Leaderboard" to match the on-screen header on that tab.
const TAB_LABELS: Record<keyof TabParamList, string> = {
  Play: 'Play',
  History: 'History',
  Leaders: 'Leaderboard',
  Account: 'Account',
};

function renderTabIcon(routeName: keyof TabParamList, focused: boolean, color: string) {
  return (
    <View style={styles.tabItem}>
      <MaterialDesignIcons name={TAB_ICON_NAMES[routeName]} size={22} color={color} />
      <Text
        style={[styles.tabLabel, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {TAB_LABELS[routeName]}
      </Text>
      <View style={[styles.tabIndicator, focused && styles.tabIndicatorActive]} />
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color }) =>
          renderTabIcon(route.name as keyof TabParamList, focused, color),
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
    backgroundColor: colors.background,
    borderTopWidth: 0,
  },
  tabItem: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabIndicator: {
    height: 2,
    width: 20,
    borderRadius: 1,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: colors.textPrimary,
  },
});
