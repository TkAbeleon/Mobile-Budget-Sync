import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Link, router } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post<AuthResponse>('/auth/login', { email, password }),
    onSuccess: async (data) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await login(data.token, data.user);
      router.replace('/(tabs)');
    },
    onError: (err: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Connexion échouée', err.message);
    },
  });

  const canSubmit = email.includes('@') && password.length >= 1;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={[styles.logoRing, { borderColor: colors.primary + '30', backgroundColor: colors.primaryDim }]}>
            <View style={[styles.logoInner, { backgroundColor: colors.primary }]}>
              <Feather name="dollar-sign" size={26} color="#0C0F1A" />
            </View>
          </View>
          <Text style={[styles.appName, { color: colors.t1 }]}>
            Budget<Text style={{ color: colors.primary }}>Smart</Text>
          </Text>
          <Text style={[styles.appTagline, { color: colors.t3 }]}>Gérez vos finances intelligemment</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border2 }]}>
          <Text style={[styles.cardTitle, { color: colors.t1 }]}>Connexion</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Feather name="mail" size={16} color={colors.t3} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.t1 }]}
                placeholderTextColor={colors.t3}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.t3} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: colors.t1 }]}
                placeholderTextColor={colors.t3}
                placeholder="Mot de passe"
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={() => canSubmit && mutation.mutate()}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={12}
                style={styles.eyeBtn}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={colors.t3} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: canSubmit ? colors.primary : colors.surface2, borderColor: colors.border },
              mutation.isPending && { opacity: 0.8 },
            ]}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
            activeOpacity={0.85}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={canSubmit ? '#0C0F1A' : colors.t3} />
            ) : (
              <>
                <Text style={[styles.submitText, { color: canSubmit ? '#0C0F1A' : colors.t3 }]}>
                  Se connecter
                </Text>
                <Feather name="arrow-right" size={16} color={canSubmit ? '#0C0F1A' : colors.t3} />
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: colors.t2 }]}>Pas encore de compte ?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity hitSlop={8}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>Créer un compte →</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 32 },

  logoSection: { alignItems: 'center', gap: 10 },
  logoRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  logoInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  appTagline: { fontSize: 14 },

  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 14 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },

  fieldGroup: {},
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15 },
  eyeBtn: { padding: 4 },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, borderWidth: 1, marginTop: 4 },
  submitText: { fontSize: 15, fontWeight: '700' },

  divider: { height: 1 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  registerText: { fontSize: 13 },
  registerLink: { fontSize: 13, fontWeight: '700' },
});
