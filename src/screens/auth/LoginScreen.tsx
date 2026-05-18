import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useConnectionStore } from '@/store/connectionStore';
import { Colors } from '@/constants/colors';
import { ConnectionBanner } from '@/components/ui/ConnectionBanner';
import type { LoginResponse } from '@/types';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();
  const mode = useConnectionStore((s) => s.mode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Remplissez l'email et le mot de passe.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = new URLSearchParams();
      form.append('username', email.trim());
      form.append('password', password);
      const res = await api.post<LoginResponse>('/auth/login', form.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      await setAuth(res.data.access_token, res.data.user);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  const isConnecting = mode === 'connecting';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ConnectionBanner />

      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={styles.logo}>Bixy</Text>
          <Text style={styles.tagline}>Gestion Maxtrim3D</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="votre@email.com"
            placeholderTextColor={Colors.textMuted}
            editable={!isConnecting}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            editable={!isConnecting}
            onSubmitEditing={login}
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, (loading || isConnecting) && styles.btnDisabled]}
            onPress={login}
            disabled={loading || isConnecting}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>
                  {isConnecting ? 'Connexion réseau…' : 'Se connecter'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.bg },
  content:  { flex: 1, justifyContent: 'center', padding: 24 },
  logoBox:  { alignItems: 'center', marginBottom: 40 },
  logo:     { fontSize: 48, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -2 },
  tagline:  { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card:     { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.border },
  label:    { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input:    { backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  errorBox: { marginTop: 12, backgroundColor: '#450a0a', borderRadius: 8, padding: 10 },
  errorText:{ color: '#fca5a5', fontSize: 13 },
  btn:      { marginTop: 24, backgroundColor: Colors.brand, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
});
