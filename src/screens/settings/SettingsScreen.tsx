import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useConnectionStore } from '@/store/connectionStore';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';
import { LOCAL_BASE_URL, VPN_BASE_URL } from '@/constants/config';

export function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const mode = useConnectionStore((s) => s.mode);

  const confirmLogout = () => {
    Alert.alert('Déconnexion', 'Se déconnecter de Bixy ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  const rows = [
    { label: 'Nom',        value: user?.full_name ?? '—' },
    { label: 'Email',      value: user?.email ?? '—' },
    { label: 'Rôle',       value: user?.role ?? '—' },
    { label: 'Connexion',  value: mode === 'local' ? `LAN · ${LOCAL_BASE_URL}` : mode === 'vpn' ? `VPN · ${VPN_BASE_URL}` : mode },
  ];

  return (
    <Screen padding>
      <View style={styles.card}>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder]}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{r.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Bixy v1.0.0 — Android</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder:  { borderTopWidth: 1, borderTopColor: Colors.border },
  rowLabel:   { fontSize: 14, color: Colors.textSecondary },
  rowValue:   { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, maxWidth: '55%', textAlign: 'right' },
  logoutBtn:  { backgroundColor: Colors.error + '22', borderWidth: 1, borderColor: Colors.error + '60', borderRadius: 12, padding: 14, alignItems: 'center' },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
  version:    { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 32 },
});
