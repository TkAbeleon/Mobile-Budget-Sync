import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleSheet, View, useColorScheme } from 'react-native';

import { useColors } from '@/hooks/useColors';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Tableau de bord</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="expenses">
        <Icon sf={{ default: 'arrow.down.circle', selected: 'arrow.down.circle.fill' }} />
        <Label>Dépenses</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="revenues">
        <Icon sf={{ default: 'arrow.up.circle', selected: 'arrow.up.circle.fill' }} />
        <Label>Revenus</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="savings">
        <Icon sf={{ default: 'banknote', selected: 'banknote.fill' }} />
        <Label>Épargne</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <Icon sf={{ default: 'bubble.left', selected: 'bubble.left.fill' }} />
        <Label>Assistant</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  const webTop = isWeb ? 67 : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.t3,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 58,
          paddingTop: isWeb ? 0 : 4,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
          ) : null,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={21} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Dépenses',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="arrow.down.circle.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="trending-down" size={21} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="revenues"
        options={{
          title: 'Revenus',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="arrow.up.circle.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="trending-up" size={21} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: 'Épargne',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="banknote.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="save" size={21} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Assistant IA',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bubble.left.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="message-circle" size={21} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({});
