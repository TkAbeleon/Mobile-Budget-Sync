import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import type { SavingsGoal } from '@/lib/types';

interface Props {
  visible: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepositModal({ visible, goal, onClose, onSuccess }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.post<SavingsGoal>(`/savings/${goal!.id}/add`, {
        amount: parseFloat(amount),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savings'] });
      setAmount('');
      onSuccess();
    },
    onError: (err: Error) => {
      Alert.alert('Erreur', err.message);
    },
  });

  function handleClose() {
    setAmount('');
    onClose();
  }

  function handleSubmit() {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }
    mutation.mutate();
  }

  if (!goal) return null;

  const remaining = goal.remaining;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border2 }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.t1 }]}>Verser des fonds</Text>
            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Feather name="x" size={16} color={colors.t2} />
            </TouchableOpacity>
          </View>

          <View style={[styles.goalInfo, { backgroundColor: colors.primaryDim, borderColor: 'rgba(14,224,122,0.2)' }]}>
            <Text style={[styles.goalName, { color: colors.primary }]}>{goal.goalName}</Text>
            <Text style={[styles.goalRemaining, { color: colors.t2 }]}>
              Restant : {formatCurrency(remaining)}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.t3 }]}>MONTANT À VERSER (€)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
              placeholderTextColor={colors.t3}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleClose} style={[styles.cancelBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.t2 }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={mutation.isPending}
              style={[styles.confirmBtn, { backgroundColor: colors.primary, opacity: mutation.isPending ? 0.7 : 1 }]}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#0C0F1A" size="small" />
              ) : (
                <Text style={styles.confirmText}>Verser</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '700',
  },
  goalRemaining: {
    fontSize: 12,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C0F1A',
  },
});
