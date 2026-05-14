import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subPositive?: boolean;
  iconName: keyof typeof Feather.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
}

export function StatCard({
  label,
  value,
  sub,
  subPositive,
  iconName,
  iconColor,
  iconBgColor,
}: StatCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.t3 }]}>{label}</Text>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor ?? colors.surface2 }]}>
          <Feather name={iconName} size={16} color={iconColor ?? colors.t2} />
        </View>
      </View>
      <Text style={[styles.value, { color: colors.t1 }]}>{value}</Text>
      {sub ? (
        <Text style={[styles.sub, { color: subPositive ? colors.primary : colors.red }]}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: {
    fontSize: 11,
    fontWeight: '500',
  },
});
