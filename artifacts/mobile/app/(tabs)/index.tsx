import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { DonutChart } from '@/components/charts/DonutChart';
import { BudgetProgress } from '@/components/ui/BudgetProgress';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { formatCurrency, getCurrentYearMonth } from '@/lib/formatters';
import type { Alert, AlertStats, Expense, ExpenseSummary, PagedResponse } from '@/lib/types';

const CATEGORY_COLORS = [
  '#0EE07A', '#5B8AF4', '#FFB547', '#FF5E5E', '#A78BFA',
  '#34D399', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
];

export default function DashboardScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { year, month } = getCurrentYearMonth();

  const { data: summary, refetch: refetchSummary } = useQuery<ExpenseSummary>({
    queryKey: ['summary', year, month],
    queryFn: () => api.get<ExpenseSummary>(`/expenses/summary/${year}/${month}`),
  });

  const { data: recentExpenses, refetch: refetchExpenses } = useQuery<PagedResponse<Expense>>({
    queryKey: ['expenses', 'recent'],
    queryFn: () => api.get<PagedResponse<Expense>>('/expenses?page=0&size=5'),
  });

  const { data: alertStats } = useQuery<AlertStats>({
    queryKey: ['alertStats'],
    queryFn: () => api.get<AlertStats>('/alerts/stats'),
  });

  const { data: unreadAlerts } = useQuery<Alert[]>({
    queryKey: ['alerts', 'unread'],
    queryFn: () => api.get<Alert[]>('/alerts/unread'),
    enabled: (alertStats?.unread ?? 0) > 0,
  });

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchExpenses()]);
    setRefreshing(false);
  }

  const totalExpenses = summary?.totalExpenses ?? 0;
  const totalRevenues = summary?.totalRevenues ?? 0;
  const balance = summary?.balance ?? 0;
  const monthlyBudget = user?.monthlyBudget ?? 0;
  const budgetUsed = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  const categoryData = Object.entries(summary?.expensesByCategory ?? {}).map(
    ([label, value], i) => ({
      label,
      value: value as number,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    })
  );

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.greeting}>
        <View>
          <Text style={[styles.greetingText, { color: colors.t2 }]}>Bonjour,</Text>
          <Text style={[styles.userName, { color: colors.t1 }]}>
            {user?.firstName ?? 'Utilisateur'}
          </Text>
        </View>
        {(alertStats?.unread ?? 0) > 0 ? (
          <View style={[styles.alertBadge, { backgroundColor: colors.redDim, borderColor: 'rgba(255,94,94,0.2)' }]}>
            <Feather name="bell" size={14} color={colors.red} />
            <Text style={[styles.alertCount, { color: colors.red }]}>{alertStats!.unread}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            label="Revenus"
            value={formatCurrency(totalRevenues)}
            iconName="trending-up"
            iconColor={colors.primary}
            iconBgColor={colors.primaryDim}
          />
          <StatCard
            label="Dépenses"
            value={formatCurrency(totalExpenses)}
            iconName="trending-down"
            iconColor={colors.red}
            iconBgColor={colors.redDim}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Solde"
            value={formatCurrency(balance)}
            sub={balance >= 0 ? 'Positif' : 'Négatif'}
            subPositive={balance >= 0}
            iconName="activity"
            iconColor={balance >= 0 ? colors.primary : colors.red}
            iconBgColor={balance >= 0 ? colors.primaryDim : colors.redDim}
          />
          <StatCard
            label="Budget"
            value={`${budgetUsed.toFixed(0)}%`}
            sub={formatCurrency(monthlyBudget)}
            subPositive={budgetUsed < 80}
            iconName="pie-chart"
            iconColor={colors.amber}
            iconBgColor={colors.amberDim}
          />
        </View>
      </View>

      {monthlyBudget > 0 ? (
        <BudgetProgress percent={budgetUsed} spent={totalExpenses} budget={monthlyBudget} />
      ) : null}

      {(unreadAlerts?.length ?? 0) > 0 ? (
        <View style={[styles.alertsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.t1 }]}>Alertes</Text>
          {unreadAlerts!.slice(0, 3).map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertItem,
                {
                  backgroundColor: alert.level === 'CRITICAL' ? colors.redDim : colors.amberDim,
                  borderColor: alert.level === 'CRITICAL'
                    ? 'rgba(255,94,94,0.15)'
                    : 'rgba(255,181,71,0.15)',
                },
              ]}
            >
              <Feather
                name={alert.level === 'CRITICAL' ? 'alert-circle' : 'alert-triangle'}
                size={16}
                color={alert.level === 'CRITICAL' ? colors.red : colors.amber}
              />
              <Text style={[styles.alertMsg, { color: colors.t1 }]} numberOfLines={2}>
                {alert.message}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {categoryData.length > 0 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.t1 }]}>Dépenses par catégorie</Text>
          <View style={styles.chartRow}>
            <DonutChart data={categoryData} total={totalExpenses} size={140} strokeWidth={22} />
            <View style={styles.legend}>
              {categoryData.map((seg, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                  <Text style={[styles.legendLabel, { color: colors.t2 }]} numberOfLines={1}>
                    {seg.label}
                  </Text>
                  <Text style={[styles.legendPct, { color: colors.t1 }]}>
                    {totalExpenses > 0 ? ((seg.value / totalExpenses) * 100).toFixed(0) : 0}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.t1 }]}>Transactions récentes</Text>
        </View>
        {(recentExpenses?.content?.length ?? 0) === 0 ? (
          <EmptyState icon="inbox" title="Aucune transaction" subtitle="Ajoutez votre première dépense" />
        ) : (
          recentExpenses!.content.map((item) => (
            <TransactionItem key={item.id} item={item} type="expense" />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 100,
  },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
  },
  alertCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  alertsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertMsg: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 12,
    flex: 1,
  },
  legendPct: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
  },
});
