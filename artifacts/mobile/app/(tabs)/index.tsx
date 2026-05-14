import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DonutChart } from '@/components/charts/DonutChart';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddSavingsModal } from '@/components/modals/AddSavingsModal';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import type { Alert, AlertStats, Expense, ExpenseSummary, PagedResponse } from '@/lib/types';

const CAT_COLORS = [
  '#0EE07A', '#5B8AF4', '#FFB547', '#FF5E5E', '#A78BFA',
  '#34D399', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function prevMonthOf(y: number, m: number) {
  return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };
}
function nextMonthOf(y: number, m: number) {
  return m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isMax = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);

  const { data: summary, isFetching: summaryLoading } = useQuery<ExpenseSummary>({
    queryKey: ['summary', year, month],
    queryFn: () => api.get<ExpenseSummary>(`/expenses/summary/${year}/${month}`),
  });

  const { data: recentExpenses } = useQuery<PagedResponse<Expense>>({
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
    await qc.invalidateQueries();
    setRefreshing(false);
  }

  function goToPrev() {
    const p = prevMonthOf(year, month);
    setYear(p.year);
    setMonth(p.month);
    Haptics.selectionAsync();
  }
  function goToNext() {
    if (isMax) return;
    const n = nextMonthOf(year, month);
    setYear(n.year);
    setMonth(n.month);
    Haptics.selectionAsync();
  }

  const totalExpenses = summary?.totalExpenses ?? 0;
  const totalRevenues = summary?.totalRevenues ?? 0;
  const balance = summary?.balance ?? 0;
  const monthlyBudget = user?.monthlyBudget ?? 0;
  const budgetUsed = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;
  const balancePositive = balance >= 0;

  const catData = Object.entries(summary?.expensesByCategory ?? {}).map(
    ([label, value], i) => ({ label, value: value as number, color: CAT_COLORS[i % CAT_COLORS.length] })
  );

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.t2 }]}>{getGreeting()},</Text>
            <Text style={[styles.userName, { color: colors.t1 }]}>{user?.firstName ?? '—'}</Text>
          </View>
          <View style={styles.headerRight}>
            {(alertStats?.unread ?? 0) > 0 && (
              <View style={[styles.alertPill, { backgroundColor: colors.redDim, borderColor: colors.red + '40' }]}>
                <Feather name="bell" size={13} color={colors.red} />
                <Text style={[styles.alertPillText, { color: colors.red }]}>{alertStats!.unread}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={[styles.avatarBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '40' }]}
            >
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                {`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Selector */}
        <View style={[styles.monthBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={goToPrev} style={styles.monthArrow} hitSlop={12}>
            <Feather name="chevron-left" size={18} color={colors.t2} />
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={[styles.monthText, { color: colors.t1 }]}>{formatMonth(year, month)}</Text>
            {isCurrentMonth && (
              <View style={[styles.currentDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <TouchableOpacity onPress={goToNext} style={styles.monthArrow} hitSlop={12} disabled={isMax}>
            <Feather name="chevron-right" size={18} color={isMax ? colors.t3 : colors.t2} />
          </TouchableOpacity>
        </View>

        {/* Hero Balance Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {summaryLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          )}
          <Text style={[styles.heroLabel, { color: colors.t3 }]}>SOLDE DU MOIS</Text>
          <Text style={[styles.heroBalance, { color: balancePositive ? colors.primary : colors.red }]}>
            {formatCurrency(balance)}
          </Text>
          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <View style={[styles.heroStatIcon, { backgroundColor: colors.primaryDim }]}>
                <Feather name="arrow-up" size={14} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.heroStatLabel, { color: colors.t3 }]}>Revenus</Text>
                <Text style={[styles.heroStatValue, { color: colors.primary }]}>{formatCurrency(totalRevenues)}</Text>
              </View>
            </View>
            <View style={[styles.heroVertDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStat}>
              <View style={[styles.heroStatIcon, { backgroundColor: colors.redDim }]}>
                <Feather name="arrow-down" size={14} color={colors.red} />
              </View>
              <View>
                <Text style={[styles.heroStatLabel, { color: colors.t3 }]}>Dépenses</Text>
                <Text style={[styles.heroStatValue, { color: colors.red }]}>{formatCurrency(totalExpenses)}</Text>
              </View>
            </View>
          </View>

          {/* Budget bar */}
          {monthlyBudget > 0 && (
            <View style={styles.budgetSection}>
              <View style={[styles.budgetDivider, { backgroundColor: colors.border }]} />
              <View style={styles.budgetRow}>
                <Text style={[styles.budgetLabel, { color: colors.t3 }]}>Budget mensuel</Text>
                <Text style={[styles.budgetPct, {
                  color: budgetUsed >= 100 ? colors.red : budgetUsed >= 80 ? colors.amber : colors.primary
                }]}>{budgetUsed.toFixed(0)}%</Text>
              </View>
              <View style={[styles.budgetTrack, { backgroundColor: colors.surface2 }]}>
                <View style={[styles.budgetFill, {
                  width: `${Math.min(budgetUsed, 100)}%` as `${number}%`,
                  backgroundColor: budgetUsed >= 100 ? colors.red : budgetUsed >= 80 ? colors.amber : colors.primary,
                }]} />
              </View>
              <View style={styles.budgetAmounts}>
                <Text style={[styles.budgetAmt, { color: colors.t3 }]}>{formatCurrency(totalExpenses)} dépensés</Text>
                <Text style={[styles.budgetAmt, { color: colors.t3 }]}>sur {formatCurrency(monthlyBudget)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.redDim, borderColor: colors.red + '30' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowExpenseModal(true); }}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.red }]}>
              <Feather name="minus" size={14} color="#fff" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.red }]}>Dépense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '30' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowRevenueModal(true); }}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={14} color="#0C0F1A" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.primary }]}>Revenu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.blueDim, borderColor: colors.blue + '30' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowSavingsModal(true); }}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.blue }]}>
              <Feather name="bookmark" size={14} color="#fff" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.blue }]}>Épargne</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        {(unreadAlerts?.length ?? 0) > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Feather name="bell" size={14} color={colors.amber} />
              <Text style={[styles.sectionTitle, { color: colors.t1 }]}>Alertes</Text>
              <View style={[styles.sectionBadge, { backgroundColor: colors.red }]}>
                <Text style={styles.sectionBadgeText}>{alertStats!.unread}</Text>
              </View>
            </View>
            {unreadAlerts!.slice(0, 2).map((a) => (
              <View key={a.id} style={[styles.alertRow, {
                backgroundColor: a.level === 'CRITICAL' ? colors.redDim : colors.amberDim,
                borderColor: a.level === 'CRITICAL' ? colors.red + '30' : colors.amber + '30',
              }]}>
                <Feather name={a.level === 'CRITICAL' ? 'alert-circle' : 'alert-triangle'} size={15}
                  color={a.level === 'CRITICAL' ? colors.red : colors.amber} />
                <Text style={[styles.alertText, { color: colors.t1 }]} numberOfLines={2}>{a.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Category Chart */}
        {catData.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Feather name="pie-chart" size={14} color={colors.blue} />
              <Text style={[styles.sectionTitle, { color: colors.t1 }]}>Répartition des dépenses</Text>
            </View>
            <View style={styles.chartArea}>
              <DonutChart data={catData} total={totalExpenses} size={148} strokeWidth={24} />
              <View style={styles.catLegend}>
                {catData.map((seg, i) => (
                  <View key={i} style={styles.catLegendItem}>
                    <View style={[styles.catDot, { backgroundColor: seg.color }]} />
                    <Text style={[styles.catName, { color: colors.t2 }]} numberOfLines={1}>{seg.label}</Text>
                    <Text style={[styles.catPct, { color: colors.t1 }]}>
                      {totalExpenses > 0 ? ((seg.value / totalExpenses) * 100).toFixed(0) : 0}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={14} color={colors.purple} />
            <Text style={[styles.sectionTitle, { color: colors.t1 }]}>Transactions récentes</Text>
            <TouchableOpacity onPress={() => {/* navigate to expenses tab */}} style={styles.seeAll}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {(recentExpenses?.content?.length ?? 0) === 0 ? (
            <View style={styles.emptyRecent}>
              <Text style={[styles.emptyRecentText, { color: colors.t3 }]}>Aucune transaction ce mois</Text>
              <TouchableOpacity
                style={[styles.emptyRecentBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '30' }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowExpenseModal(true); }}
              >
                <Feather name="plus" size={14} color={colors.primary} />
                <Text style={[styles.emptyRecentBtnText, { color: colors.primary }]}>Ajouter une dépense</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentExpenses!.content.map((item) => (
              <TransactionItem key={item.id} item={item} type="expense" />
            ))
          )}
        </View>
      </ScrollView>

      <AddTransactionModal visible={showExpenseModal} type="expense"
        onClose={() => setShowExpenseModal(false)} onSuccess={() => setShowExpenseModal(false)} />
      <AddTransactionModal visible={showRevenueModal} type="revenue"
        onClose={() => setShowRevenueModal(false)} onSuccess={() => setShowRevenueModal(false)} />
      <AddSavingsModal visible={showSavingsModal}
        onClose={() => setShowSavingsModal(false)} onSuccess={() => setShowSavingsModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  greeting: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 50, borderWidth: 1 },
  alertPillText: { fontSize: 11, fontWeight: '700' },
  avatarBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 13, fontWeight: '700' },

  monthBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 4 },
  monthArrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  monthText: { fontSize: 14, fontWeight: '600' },
  currentDot: { width: 6, height: 6, borderRadius: 3 },

  heroCard: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 0 },
  loadingOverlay: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
  heroLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  heroBalance: { fontSize: 38, fontWeight: '800', letterSpacing: -1.5, marginBottom: 20 },
  heroDivider: { height: 1, marginBottom: 16 },
  heroStats: { flexDirection: 'row', gap: 0 },
  heroStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroStatIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heroStatLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  heroStatValue: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  heroVertDivider: { width: 1, alignSelf: 'stretch', marginHorizontal: 16 },

  budgetSection: { gap: 8 },
  budgetDivider: { height: 1, marginBottom: 4 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  budgetPct: { fontSize: 16, fontWeight: '700' },
  budgetTrack: { height: 6, borderRadius: 50, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: 50 },
  budgetAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetAmt: { fontSize: 11 },

  quickActions: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
  quickIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '600' },

  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  sectionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 50 },
  sectionBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  seeAll: {},
  seeAllText: { fontSize: 12, fontWeight: '600' },

  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1, margin: 12, marginTop: 0 },
  alertText: { fontSize: 12, flex: 1, lineHeight: 18 },

  chartArea: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, paddingTop: 0 },
  catLegend: { flex: 1, gap: 10 },
  catLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
  catName: { fontSize: 12, flex: 1 },
  catPct: { fontSize: 12, fontWeight: '600', flexShrink: 0 },

  emptyRecent: { alignItems: 'center', paddingVertical: 28, gap: 12, paddingHorizontal: 16 },
  emptyRecentText: { fontSize: 13 },
  emptyRecentBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50, borderWidth: 1 },
  emptyRecentBtnText: { fontSize: 13, fontWeight: '600' },
});
