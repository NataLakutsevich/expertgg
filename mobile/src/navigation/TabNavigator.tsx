import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

const TAB_LABELS: Record<keyof TabParamList, string> = {
  Play: 'Play',
  History: 'History',
  Leaders: 'Leaders',
  Account: 'Account',
};

function renderTabIcon(routeName: keyof TabParamList, color: string) {
  const iconSource =
    routeName === 'Play'
      ? require('../assets/icons/empty-state-swords.png')
      : routeName === 'History'
      ? require('../assets/icons/tab-history.png')
      : routeName === 'Leaders'
      ? require('../assets/icons/tab-leaders.png')
      : require('../assets/icons/tab-account.png');

  return (
    <View style={styles.tabItem}>
      <Image source={iconSource} style={styles.tabIcon} tintColor={color} resizeMode="contain" />
      <Text
        style={[styles.tabLabel, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {TAB_LABELS[routeName]}
      </Text>
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
        tabBarIcon: ({ color }) => renderTabIcon(route.name as keyof TabParamList, color),
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
    backgroundColor: colors.cardBackground,
    borderTopWidth: 0,
    height: 64, // явная высота, чтобы контент не обрезался
    paddingBottom: 8,
    paddingTop: 7,
  },
  tabIcon: {
    width: 22,
    height: 22,
  },
  tabItem: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
});
