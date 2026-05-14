import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { formatCurrency, formatShortDate } from '@/lib/formatters';
import type { Expense, Revenue } from '@/lib/types';

type Transaction = Expense | Revenue;

interface TransactionItemProps {
  item: Transaction;
  type: 'expense' | 'revenue';
  onDelete?: (id: number) => void;
}

const EMOJI: Record<string, string> = {
  Alimentation: '🛒', Transport: '🚗', Logement: '🏠', Santé: '🏥',
  Loisirs: '🎉', Vêtements: '👕', Abonnements: '📱', Éducation: '📚',
  Salaire: '💼', Freelance: '💻', Investissement: '📈', Épargne: '🏦',
};

function emoji(name: string) { return EMOJI[name] ?? '💳'; }

export function TransactionItem({ item, type, onDelete }: TransactionItemProps) {
  const colors = useColors();
  const [showDelete, setShowDelete] = useState(false);
  const isExpense = type === 'expense';
  const amountColor = isExpense ? colors.red : colors.primary;
  const prefix = isExpense ? '−' : '+';
  const catColor = item.category?.color ?? (isExpense ? colors.red : colors.primary);

  function handleLongPress() {
    if (!onDelete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDelete((v) => !v);
  }

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      delayLongPress={400}
      activeOpacity={0.7}
    >
      <View style={[styles.item, { borderBottomColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: catColor + '22' }]}>
          <Text style={styles.emoji}>{emoji(item.category?.name ?? '')}</Text>
        </View>

        <View style={styles.info}>
          <Text style={[styles.desc, { color: colors.t1 }]} numberOfLines={1}>
            {item.description || item.category?.name || 'Transaction'}
          </Text>
          <View style={styles.meta}>
            <View style={[styles.catTag, { backgroundColor: catColor + '18' }]}>
              <View style={[styles.catDot, { backgroundColor: catColor }]} />
              <Text style={[styles.catText, { color: catColor }]} numberOfLines={1}>
                {item.category?.name ?? '—'}
              </Text>
            </View>
            <View style={styles.dot} />
            <Text style={[styles.date, { color: colors.t3 }]}>{formatShortDate(item.date)}</Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {prefix} {formatCurrency(item.amount)}
          </Text>
          {showDelete && onDelete ? (
            <TouchableOpacity
              onPress={() => { setShowDelete(false); onDelete(item.id); }}
              style={[styles.deleteBtn, { backgroundColor: colors.redDim, borderColor: colors.red + '30' }]}
              hitSlop={4}
            >
              <Feather name="trash-2" size={12} color={colors.red} />
            </TouchableOpacity>
          ) : (
            <View style={styles.amountSpacer} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 20 },
  info: { flex: 1, minWidth: 0, gap: 4 },
  desc: { fontSize: 14, fontWeight: '500' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catDot: { width: 5, height: 5, borderRadius: 2.5 },
  catText: { fontSize: 11, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#555B74' },
  date: { fontSize: 11 },
  right: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  amount: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  deleteBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 3 },
  amountSpacer: { height: 20 },
});
