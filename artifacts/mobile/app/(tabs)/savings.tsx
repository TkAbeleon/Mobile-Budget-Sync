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
import { EmptyState } from '@/components/ui/EmptyState';
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
    onError: (err: Error) => {
      Alert.alert('Erreur', err.message);
    },
  });

  function handleDelete(id: number) {
    Alert.alert('Supprimer', 'Supprimer cet objectif ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const totalSaved = (goals ?? []).reduce((s, g) => s + g.currentAmount, 0);
  const activeGoals = (goals ?? []).filter((g) => !g.completed).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.t3 }]}>TOTAL ÉPARGNÉ</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatCurrency(totalSaved)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.t3 }]}>OBJECTIFS EN COURS</Text>
          <Text style={[styles.summaryValue, { color: colors.t1 }]}>{activeGoals}</Text>
        </View>
      </View>

      <FlatList
        data={goals ?? []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SavingsCard
            goal={item}
            onDeposit={(g) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDepositGoal(g);
            }}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="save"
              title="Aucun objectif"
              subtitle="Appuyez sur + pour créer votre premier objectif d'épargne"
            />
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
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddModal(true);
        }}
      >
        <Feather name="plus" size={24} color="#0C0F1A" />
      </TouchableOpacity>

      <AddSavingsModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => setShowAddModal(false)}
      />
      <DepositModal
        visible={depositGoal !== null}
        goal={depositGoal}
        onClose={() => setDepositGoal(null)}
        onSuccess={() => setDepositGoal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    padding: 16,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
  },
  list: {
    padding: 16,
    gap: 14,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EE07A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
