import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { formatCurrency } from '@/lib/formatters';

interface BudgetProgressProps {
  percent: number;
  spent: number;
  budget: number;
}

export function BudgetProgress({ percent, spent, budget }: BudgetProgressProps) {
  const colors = useColors();
  const clamped = Math.min(percent, 100);

  const fillColor =
    percent >= 100
      ? colors.red
      : percent >= 80
        ? colors.amber
        : colors.primary;

  const pctColor =
    percent >= 100 ? colors.red : percent >= 80 ? colors.amber : colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.t1 }]}>Budget mensuel</Text>
        <Text style={[styles.pct, { color: pctColor }]}>{percent.toFixed(1)}%</Text>
      </View>
      <View style={styles.amounts}>
        <Text style={[styles.spent, { color: colors.t1 }]}>{formatCurrency(spent)}</Text>
        <Text style={[styles.of, { color: colors.t2 }]}> / {formatCurrency(budget)}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
        <View
          style={[
            styles.fill,
            { width: `${clamped}%` as `${number}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
      <View style={styles.labels}>
        <Text style={[styles.labelText, { color: colors.t3 }]}>0 €</Text>
        <Text style={[styles.labelText, { color: colors.t3 }]}>{formatCurrency(budget)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  pct: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  amounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  spent: {
    fontSize: 14,
    fontWeight: '600',
  },
  of: {
    fontSize: 12,
  },
  track: {
    height: 8,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 50,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 10,
  },
});
