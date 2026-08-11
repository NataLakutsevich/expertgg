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
import { colors } from '../theme/colors';

export type TabParamList = {
  Play: undefined;
  History: undefined;
  Leaders: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICON_NAMES: Record<keyof TabParamList, MaterialDesignIconsIconName> = {
  Play: 'sword-cross',
  History: 'history',
  Leaders: 'trophy',
  Account: 'account',
};

function renderTabIcon(routeName: keyof TabParamList, focused: boolean, color: string) {
  return (
    <View style={styles.tabItem}>
      <MaterialDesignIcons name={TAB_ICON_NAMES[routeName]} size={22} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{routeName}</Text>
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
        tabBarInactiveTintColor: colors.textSecondary,
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
    borderTopColor: colors.border,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
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
