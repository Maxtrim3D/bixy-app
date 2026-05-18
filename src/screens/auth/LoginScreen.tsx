import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useConnectionStore } from '@/store/connectionStore';
import { initConnection } from '@/services/ConnectionManager';
import { Colors } from '@/constants/colors';
import { ConnectionBanner } from '@/components/ui/ConnectionBanner';
import type { AuthUser } from '@/types';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();
  const mode = useConnectionStore((s) => s.mode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retryConnection = async () => {
    setRetrying(true);
    setError(null);
    try { await initConnection(); } finally { setRetrying(false); }
  };

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Remplissez l'email et le mot de passe.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });
      const d = res.data;
      const authUser: AuthUser = {
        id: d.user_id,
        email: email.trim().toLowerCase(),
        full_name: d.full_name,
        display_name: d.display_name ?? null,
        app_name: d.display_name ?? d.full_name,
        role: d.role,
        locale: d.locale ?? 'fr',
      };
      await setAuth(d.access_token, authUser);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string; code?: string };
      if (e.response?.data?.detail) {
        // Server replied with an error (401, 403…)
        setError(e.response.data.detail);
      } else if (e.code === 'ECONNREFUSED' || e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED' || !e.response) {
        // Network unreachable / timeout
        setError('Serveur inaccessible. Vérifiez votre réseau ou votre VPN.');
      } else {
        setError(`Erreur ${e.response?.status ?? '?'} — réessayez.`);
      }
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
              {mode === 'offline' && (
                <TouchableOpacity onPress={retryConnection} disabled={retrying} style={styles.retryBtn}>
                  <Text style={styles.retryText}>
                    {retrying ? 'Reconnexion…' : 'Réessayer la connexion'}
                  </Text>
                </TouchableOpacity>
              )}
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
  retryBtn: { marginTop: 8, alignSelf: 'flex-start' },
  retryText:{ color: '#fca5a5', fontSize: 12, textDecorationLine: 'underline' },
  btn:      { marginTop: 24, backgroundColor: Colors.brand, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
});
