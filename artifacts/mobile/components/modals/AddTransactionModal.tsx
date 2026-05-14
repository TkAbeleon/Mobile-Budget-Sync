import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { Category, Expense, Revenue } from '@/lib/types';

interface Props {
  visible: boolean;
  type: 'expense' | 'revenue';
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTransactionModal({ visible, type, onClose, onSuccess }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const catType = type === 'expense' ? 'EXPENSE' : 'REVENUE';

  const { data: categories, isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ['categories', catType],
    queryFn: () => api.get<Category[]>(`/categories?type=${catType}`),
    enabled: visible,
  });

  const mutation = useMutation({
    mutationFn: () =>
      type === 'expense'
        ? api.post<Expense>('/expenses', {
            amount: parseFloat(amount),
            description,
            date,
            categoryId,
          })
        : api.post<Revenue>('/revenues', {
            amount: parseFloat(amount),
            description,
            date,
            categoryId,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [type === 'expense' ? 'expenses' : 'revenues'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      resetForm();
      onSuccess();
    },
    onError: (err: Error) => {
      Alert.alert('Erreur', err.message);
    },
  });

  function resetForm() {
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategoryId(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit() {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }
    if (!categoryId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }
    mutation.mutate();
  }

  const title = type === 'expense' ? 'Ajouter une dépense' : 'Ajouter un revenu';
  const accentColor = type === 'expense' ? colors.red : colors.primary;

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
            <Text style={[styles.title, { color: colors.t1 }]}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Feather name="x" size={16} color={colors.t2} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.body}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.t3 }]}>MONTANT (€)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                  placeholderTextColor={colors.t3}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.t3 }]}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                  placeholderTextColor={colors.t3}
                  placeholder="Description (optionnel)"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.t3 }]}>DATE</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                  placeholderTextColor={colors.t3}
                  placeholder="YYYY-MM-DD"
                  value={date}
                  onChangeText={setDate}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.t3 }]}>CATÉGORIE</Text>
                {catsLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
                ) : (
                  <View style={styles.catGrid}>
                    {(categories ?? []).map((cat) => {
                      const selected = categoryId === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => setCategoryId(cat.id)}
                          style={[
                            styles.catChip,
                            {
                              backgroundColor: selected ? cat.color + '25' : colors.surface2,
                              borderColor: selected ? cat.color : colors.border,
                            },
                          ]}
                        >
                          <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                          <Text style={[styles.catText, { color: selected ? cat.color : colors.t2 }]}>
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleClose} style={[styles.cancelBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.t2 }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={mutation.isPending}
              style={[styles.confirmBtn, { backgroundColor: accentColor, opacity: mutation.isPending ? 0.7 : 1 }]}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#0C0F1A" size="small" />
              ) : (
                <Text style={styles.confirmText}>Ajouter</Text>
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
    maxHeight: '90%',
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
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
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
