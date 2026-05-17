import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

interface AttendanceRecord {
  id: string;
  user_display_name: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(min: number | null) {
  if (min == null) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

export function AttendanceScreen() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const today = new Date().toISOString().slice(0, 10);

  const { data: records, isLoading, isRefetching, refetch } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', today],
    queryFn: () => api.get('/attendance', { params: { date: today } }).then((r) => r.data),
    refetchInterval: 60_000,
  });

  // My own status today
  const myRecord = records?.find((r) => r.user_display_name === (user?.app_name ?? user?.full_name));
  const isClockedIn = myRecord != null && myRecord.clock_out == null;

  const clockMut = useMutation({
    mutationFn: (action: 'in' | 'out') =>
      api.post(`/attendance/${action}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });

  return (
    <Screen scrollable={false} padding={false}>
      {/* My clock in/out */}
      <View style={styles.myPanel}>
        <View>
          <Text style={styles.myLabel}>Mon statut aujourd'hui</Text>
          <Text style={styles.myStatus}>
            {isClockedIn
              ? `🟢 Arrivée ${formatTime(myRecord!.clock_in)}`
              : myRecord
              ? `✅ ${formatTime(myRecord.clock_in)} → ${formatTime(myRecord.clock_out!)}`
              : '⚪ Pas encore pointé'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.clockBtn, isClockedIn && styles.clockBtnOut]}
          onPress={() => clockMut.mutate(isClockedIn ? 'out' : 'in')}
          disabled={clockMut.isPending}
          activeOpacity={0.8}
        >
          {clockMut.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.clockBtnText}>{isClockedIn ? '⏹ Partir' : '▶ Arriver'}</Text>}
        </TouchableOpacity>
      </View>

      {/* Team list */}
      <Text style={styles.sectionTitle}>Équipe — {today}</Text>
      <FlatList
        data={records ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? 'Chargement…' : 'Aucun pointage aujourd'hui.'}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.record}>
            <View style={[styles.dot, { backgroundColor: item.clock_out ? Colors.success : Colors.brand }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.recordName}>{item.user_display_name}</Text>
              <Text style={styles.recordTime}>
                {formatTime(item.clock_in)}
                {item.clock_out ? ` → ${formatTime(item.clock_out)}` : ' → en cours'}
              </Text>
            </View>
            <Text style={styles.recordDur}>{formatDuration(item.duration_minutes)}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  myPanel:     { margin: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.border },
  myLabel:     { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  myStatus:    { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  clockBtn:    { backgroundColor: Colors.brand, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, minWidth: 90, alignItems: 'center' },
  clockBtnOut: { backgroundColor: Colors.error },
  clockBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionTitle:{ fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 4 },
  record:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  recordName:  { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  recordTime:  { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  recordDur:   { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  empty:       { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
});
