import React from 'react';
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

const CATEGORY_ICONS: Record<string, string> = {
  Alimentation: '🛒',
  Transport: '🚗',
  Logement: '🏠',
  Santé: '🏥',
  Loisirs: '🎉',
  Vêtements: '👕',
  Abonnements: '📱',
  Éducation: '📚',
  Salaire: '💼',
  Freelance: '💻',
  Investissement: '📈',
};

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? '💳';
}

export function TransactionItem({ item, type, onDelete }: TransactionItemProps) {
  const colors = useColors();
  const isExpense = type === 'expense';
  const amountColor = isExpense ? colors.red : colors.primary;
  const amountPrefix = isExpense ? '-' : '+';
  const catColor = item.category?.color ?? (isExpense ? colors.red : colors.primary);

  return (
    <View style={[styles.item, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: catColor + '20' }]}>
        <Text style={styles.icon}>{getCategoryIcon(item.category?.name ?? '')}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.t1 }]} numberOfLines={1}>
          {item.description || item.category?.name || 'Transaction'}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.catPill, { backgroundColor: catColor + '20' }]}>
            <View style={[styles.catDot, { backgroundColor: catColor }]} />
            <Text style={[styles.catName, { color: catColor }]}>
              {item.category?.name ?? '—'}
            </Text>
          </View>
          <Text style={[styles.date, { color: colors.t3 }]}>{formatShortDate(item.date)}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(item.amount)}
        </Text>
        {onDelete ? (
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn} hitSlop={8}>
            <Text style={[styles.deleteText, { color: colors.t3 }]}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 50,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catName: {
    fontSize: 10,
    fontWeight: '500',
  },
  date: {
    fontSize: 11,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 2,
  },
  deleteText: {
    fontSize: 12,
  },
});
