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

import { AddSavingsModal } from '@/components/modals/AddSavingsModal';
import { DepositModal } from '@/components/modals/DepositModal';
import { SavingsCard } from '@/components/ui/SavingsCard';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import type { SavingsGoal } from '@/lib/types';

export default function SavingsScreen() {
  const colors = useColors();
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: goals, refetch, isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ['savings'],
    queryFn: () => api.get<SavingsGoal[]>('/savings'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/savings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savings'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => Alert.alert('Erreur', err.message),
  });

  function handleDelete(id: number) {
    Alert.alert('Supprimer', 'Supprimer cet objectif d\'épargne ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  async function handleRefresh() { setRefreshing(true); await refetch(); setRefreshing(false); }

  const totalSaved = (goals ?? []).reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = (goals ?? []).reduce((s, g) => s + g.targetAmount, 0);
  const completed = (goals ?? []).filter((g) => g.completed).length;
  const active = (goals ?? []).filter((g) => !g.completed).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Summary header */}
      <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.t3 }]}>TOTAL ÉPARGNÉ</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatCurrency(totalSaved)}</Text>
          {totalTarget > 0 && (
            <Text style={[styles.summaryOf, { color: colors.t3 }]}>sur {formatCurrency(totalTarget)}</Text>
          )}
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statsCol}>
          <View style={styles.statRow}>
            <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.statNum, { color: colors.t1 }]}>{completed}</Text>
            <Text style={[styles.statLabel, { color: colors.t3 }]}>atteints</Text>
          </View>
          <View style={styles.statRow}>
            <View style={[styles.statDot, { backgroundColor: colors.blue }]} />
            <Text style={[styles.statNum, { color: colors.t1 }]}>{active}</Text>
            <Text style={[styles.statLabel, { color: colors.t3 }]}>en cours</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={goals ?? []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SavingsCard
            goal={item}
            onDeposit={(g) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDepositGoal(g); }}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.blueDim }]}>
                <Feather name="target" size={28} color={colors.blue} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.t1 }]}>Aucun objectif</Text>
              <Text style={[styles.emptySub, { color: colors.t3 }]}>
                Définissez un objectif d'épargne et suivez vos progrès
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAddModal(true); }}
              >
                <Feather name="plus" size={16} color="#0C0F1A" />
                <Text style={[styles.emptyBtnText, { color: '#0C0F1A' }]}>Créer un objectif</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!(goals && goals.length > 0)}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAddModal(true); }}
      >
        <Feather name="plus" size={24} color="#0C0F1A" />
      </TouchableOpacity>

      <AddSavingsModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => setShowAddModal(false)} />
      <DepositModal visible={depositGoal !== null} goal={depositGoal} onClose={() => setDepositGoal(null)} onSuccess={() => setDepositGoal(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  summaryBar: { borderBottomWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryItem: { flex: 1, gap: 3 },
  summaryLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  summaryValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.8 },
  summaryOf: { fontSize: 12 },
  summaryDivider: { width: 1, alignSelf: 'stretch' },
  statsCol: { gap: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 7, height: 7, borderRadius: 2 },
  statNum: { fontSize: 16, fontWeight: '700', minWidth: 20 },
  statLabel: { fontSize: 12 },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 50, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', shadowColor: '#0EE07A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
