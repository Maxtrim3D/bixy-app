import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useConnectionStore } from '@/store/connectionStore';

export function ConnectionBanner() {
  const mode = useConnectionStore((s) => s.mode);

  if (mode === 'local' || mode === 'vpn') return null;

  return (
    <View style={[styles.banner, mode === 'offline' ? styles.offline : styles.connecting]}>
      {mode === 'connecting' && <ActivityIndicator size="small" color="#fff" style={styles.spinner} />}
      <Text style={styles.text}>
        {mode === 'connecting' ? 'Connexion en cours…' : 'Hors ligne — Vérifiez votre réseau'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  connecting: { backgroundColor: '#1d4ed8' },
  offline:    { backgroundColor: '#dc2626' },
  spinner:    { marginRight: 8 },
  text:       { color: '#fff', fontSize: 13, fontWeight: '500' },
});
