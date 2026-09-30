import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={30} name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={30} name={focused ? "chatbubbles" : "chatbubbles-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={30} name={focused ? "newspaper" : "newspaper-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shops"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={30} name={focused ? "storefront" : "storefront-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={30} name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
