import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import type { Expense, PagedResponse } from '@/lib/types';

function prevM(y: number, m: number) { return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 }; }
function nextM(y: number, m: number) { return m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 }; }

export default function ExpensesScreen() {
  const colors = useColors();
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isMax = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);

  const { data, refetch, isLoading } = useQuery<PagedResponse<Expense>>({
    queryKey: ['expenses', year, month],
    queryFn: () => api.get<PagedResponse<Expense>>(`/expenses?page=0&size=100`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => Alert.alert('Erreur', err.message),
  });

  function handleDelete(id: number) {
    Alert.alert('Supprimer', 'Supprimer cette dépense ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function goPrev() { const p = prevM(year, month); setYear(p.year); setMonth(p.month); Haptics.selectionAsync(); }
  function goNext() { if (isMax) return; const n = nextM(year, month); setYear(n.year); setMonth(n.month); Haptics.selectionAsync(); }

  const expenses = data?.content ?? [];
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Month bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goPrev} style={styles.navArrow} hitSlop={12}>
            <Feather name="chevron-left" size={18} color={colors.t2} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.t1 }]}>{formatMonth(year, month)}</Text>
          <TouchableOpacity onPress={goNext} style={styles.navArrow} hitSlop={12} disabled={isMax}>
            <Feather name="chevron-right" size={18} color={isMax ? colors.t3 : colors.t2} />
          </TouchableOpacity>
        </View>
        <View style={styles.totalRow}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.t3 }]}>Total dépenses</Text>
            <Text style={[styles.totalValue, { color: colors.red }]}>{formatCurrency(total)}</Text>
          </View>
          <View style={[styles.countChip, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Text style={[styles.countText, { color: colors.t2 }]}>{expenses.length}</Text>
            <Text style={[styles.countSub, { color: colors.t3 }]}>transactions</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TransactionItem item={item} type="expense" onDelete={handleDelete} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.redDim }]}>
                <Feather name="trending-down" size={26} color={colors.red} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.t1 }]}>Aucune dépense</Text>
              <Text style={[styles.emptySub, { color: colors.t3 }]}>
                Ajoutez votre première dépense via le bouton +
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.red }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Ajouter une dépense</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={expenses.length > 0}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.red }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <AddTransactionModal
        visible={showModal} type="expense"
        onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { borderBottomWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 14 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  navArrow: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15, fontWeight: '600', minWidth: 140, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  totalLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  totalValue: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  countChip: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  countText: { fontSize: 18, fontWeight: '700' },
  countSub: { fontSize: 10, fontWeight: '500' },
  list: { paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 50, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF5E5E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
