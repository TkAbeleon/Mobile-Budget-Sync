import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { UserInfo } from '@/lib/types';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, setUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [monthlyBudget, setMonthlyBudget] = useState(
    user?.monthlyBudget?.toString() ?? '0'
  );
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const profileMutation = useMutation({
    mutationFn: () =>
      api.put<UserInfo>('/auth/profile', {
        firstName,
        lastName,
        email,
        monthlyBudget: parseFloat(monthlyBudget) || 0,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Profil mis à jour');
    },
    onError: (err: Error) => {
      Alert.alert('Erreur', err.message);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      api.put('/auth/password', { oldPassword, newPassword }),
    onSuccess: () => {
      setOldPassword('');
      setNewPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Mot de passe modifié');
    },
    onError: (err: Error) => {
      Alert.alert('Erreur', err.message);
    },
  });

  function handlePasswordChange() {
    if (!oldPassword || !newPassword) {
      Alert.alert('Erreur', 'Remplissez les deux champs');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    passwordMutation.mutate();
  }

  async function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryDim, borderColor: 'rgba(14,224,122,0.2)' }]}>
            <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.t1 }]}>{user?.fullName}</Text>
          <Text style={[styles.emailText, { color: colors.t2 }]}>{user?.email}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.t1 }]}>Informations personnelles</Text>

          <View style={styles.fields}>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.t3 }]}>PRÉNOM</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                  placeholderTextColor={colors.t3}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.t3 }]}>NOM</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                  placeholderTextColor={colors.t3}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.t3 }]}>EMAIL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                placeholderTextColor={colors.t3}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.t3 }]}>BUDGET MENSUEL (€)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                placeholderTextColor={colors.t3}
                keyboardType="decimal-pad"
                value={monthlyBudget}
                onChangeText={setMonthlyBudget}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: profileMutation.isPending ? 0.8 : 1 }]}
            onPress={() => profileMutation.mutate()}
            disabled={profileMutation.isPending}
          >
            {profileMutation.isPending ? (
              <ActivityIndicator color="#0C0F1A" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.t1 }]}>Changer le mot de passe</Text>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.t3 }]}>MOT DE PASSE ACTUEL</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                  placeholderTextColor={colors.t3}
                  secureTextEntry={!showOld}
                  placeholder="••••••••"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowOld((v) => !v)} hitSlop={8}>
                  <Feather name={showOld ? 'eye-off' : 'eye'} size={15} color={colors.t3} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.t3 }]}>NOUVEAU MOT DE PASSE</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
                  placeholderTextColor={colors.t3}
                  secureTextEntry={!showNew}
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew((v) => !v)} hitSlop={8}>
                  <Feather name={showNew ? 'eye-off' : 'eye'} size={15} color={colors.t3} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.surface2, borderColor: colors.border2, borderWidth: 1, opacity: passwordMutation.isPending ? 0.8 : 1 }]}
            onPress={handlePasswordChange}
            disabled={passwordMutation.isPending}
          >
            {passwordMutation.isPending ? (
              <ActivityIndicator color={colors.t1} size="small" />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.t1 }]}>Modifier le mot de passe</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.themeRow}>
            <View style={styles.themeInfo}>
              <Feather name={isDark ? 'moon' : 'sun'} size={18} color={isDark ? colors.blue : colors.amber} />
              <View>
                <Text style={[styles.themeTitle, { color: colors.t1 }]}>
                  {isDark ? 'Thème sombre' : 'Thème clair'}
                </Text>
                <Text style={[styles.themeSub, { color: colors.t3 }]}>
                  {isDark ? 'Basculer vers le thème clair' : 'Basculer vers le thème sombre'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleTheme();
              }}
              style={[
                styles.toggle,
                {
                  backgroundColor: isDark ? colors.blue : colors.amber,
                },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: isDark ? 20 : 0 }] },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.redDim, borderColor: 'rgba(255,94,94,0.2)' }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={16} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  initials: {
    fontSize: 26,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emailText: {
    fontSize: 13,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  fields: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
    padding: 11,
    fontSize: 14,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C0F1A',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeSub: {
    fontSize: 12,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 4,
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
});
