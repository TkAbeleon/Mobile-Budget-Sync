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
import { EmptyState } from '@/components/ui/EmptyState';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import type { PagedResponse, Revenue } from '@/lib/types';

export default function RevenuesScreen() {
  const colors = useColors();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch, isLoading } = useQuery<PagedResponse<Revenue>>({
    queryKey: ['revenues'],
    queryFn: () => api.get<PagedResponse<Revenue>>('/revenues?page=0&size=50'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/revenues/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revenues'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => {
      Alert.alert('Erreur', err.message);
    },
  });

  function handleDelete(id: number) {
    Alert.alert('Supprimer', 'Supprimer ce revenu ?', [
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

  const revenues = data?.content ?? [];
  const total = revenues.reduce((sum, r) => sum + r.amount, 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.totalBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.t3 }]}>TOTAL DU MOIS</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(total)}</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={[styles.countText, { color: colors.t2 }]}>{revenues.length} transactions</Text>
        </View>
      </View>

      <FlatList
        data={revenues}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TransactionItem item={item} type="revenue" onDelete={handleDelete} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="trending-up"
              title="Aucun revenu"
              subtitle="Appuyez sur + pour ajouter votre premier revenu"
            />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={revenues.length > 0}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowModal(true);
        }}
      >
        <Feather name="plus" size={24} color="#0C0F1A" />
      </TouchableOpacity>

      <AddTransactionModal
        visible={showModal}
        type="revenue"
        onClose={() => setShowModal(false)}
        onSuccess={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
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
