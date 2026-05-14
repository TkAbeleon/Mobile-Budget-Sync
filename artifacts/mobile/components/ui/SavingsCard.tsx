import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { SavingsGoal } from '@/lib/types';

interface SavingsCardProps {
  goal: SavingsGoal;
  onDeposit: (goal: SavingsGoal) => void;
  onDelete: (id: number) => void;
}

export function SavingsCard({ goal, onDeposit, onDelete }: SavingsCardProps) {
  const colors = useColors();
  const pct = Math.min(goal.progressPercent, 100);
  const fillColor = goal.completed ? colors.primary : colors.blue;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.t1 }]} numberOfLines={1}>
            {goal.goalName}
          </Text>
          {goal.targetDate ? (
            <Text style={[styles.deadline, { color: colors.t3 }]}>
              {formatDate(goal.targetDate)}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: goal.completed ? colors.primaryDim : colors.blueDim,
              borderColor: goal.completed
                ? 'rgba(14,224,122,0.2)'
                : 'rgba(91,138,244,0.2)',
            },
          ]}
        >
          <Text
            style={[styles.badgeText, { color: goal.completed ? colors.primary : colors.blue }]}
          >
            {goal.completed ? 'Atteint' : 'En cours'}
          </Text>
        </View>
      </View>

      <View style={styles.amounts}>
        <Text style={[styles.current, { color: colors.t1 }]}>
          {formatCurrency(goal.currentAmount)}
        </Text>
        <Text style={[styles.pct, { color: colors.t2 }]}>{pct.toFixed(0)}%</Text>
      </View>
      <Text style={[styles.target, { color: colors.t2 }]}>
        sur {formatCurrency(goal.targetAmount)}
      </Text>

      <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
        <View
          style={[styles.fill, { width: `${pct}%` as `${number}%`, backgroundColor: fillColor }]}
        />
      </View>

      <View style={styles.actions}>
        {!goal.completed ? (
          <TouchableOpacity
            style={[styles.depositBtn, { backgroundColor: colors.primaryDim, borderColor: 'rgba(14,224,122,0.2)' }]}
            onPress={() => onDeposit(goal)}
          >
            <Feather name="plus" size={14} color={colors.primary} />
            <Text style={[styles.depositText, { color: colors.primary }]}>Verser</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          onPress={() => onDelete(goal.id)}
        >
          <Feather name="trash-2" size={14} color={colors.t3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleRow: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  deadline: {
    fontSize: 11,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 50,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  current: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  pct: {
    fontSize: 13,
    fontWeight: '600',
  },
  target: {
    fontSize: 12,
    marginTop: -6,
  },
  track: {
    height: 6,
    borderRadius: 50,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 50,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  depositBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
  },
  depositText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
