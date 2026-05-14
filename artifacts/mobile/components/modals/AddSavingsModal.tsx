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
import type { SavingsGoal } from '@/lib/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSavingsModal({ visible, onClose, onSuccess }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.post<SavingsGoal>('/savings', {
        goalName,
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savings'] });
      resetForm();
      onSuccess();
    },
    onError: (err: Error) => {
      Alert.alert('Erreur', err.message);
    },
  });

  function resetForm() {
    setGoalName('');
    setTargetAmount('');
    setTargetDate('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit() {
    if (!goalName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour l\'objectif');
      return;
    }
    if (!targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      Alert.alert('Erreur', 'Montant cible invalide');
      return;
    }
    mutation.mutate();
  }

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
            <Text style={[styles.title, { color: colors.t1 }]}>Nouvel objectif</Text>
            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Feather name="x" size={16} color={colors.t2} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.t3 }]}>NOM DE L'OBJECTIF</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                placeholderTextColor={colors.t3}
                placeholder="ex: Voyage, Voiture..."
                value={goalName}
                onChangeText={setGoalName}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.t3 }]}>MONTANT CIBLE (€)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                placeholderTextColor={colors.t3}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={targetAmount}
                onChangeText={setTargetAmount}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.t3 }]}>DATE CIBLE (optionnel)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                placeholderTextColor={colors.t3}
                placeholder="YYYY-MM-DD"
                value={targetDate}
                onChangeText={setTargetDate}
              />
            </View>
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
                <Text style={styles.confirmText}>Créer</Text>
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
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  body: {
    gap: 16,
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
    marginTop: 24,
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
