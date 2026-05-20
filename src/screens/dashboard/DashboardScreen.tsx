import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useConnectionStore } from '@/store/connectionStore';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';

interface DashboardStats {
  pending_orders?: number;
  in_progress_preparations?: number;
  done_today?: number;
  active_printers?: number;
  total_printers?: number;
  attendance_today?: number;
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const { user } = useAuthStore();
  const mode = useConnectionStore((s) => s.mode);

  const { data: stats, isLoading, refetch, isRefetching, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
    refetchInterval: 60_000,
    retry: 1,
  });

  const modeLabel = mode === 'local' ? '🟢 LAN' : mode === 'vpn' ? '🔵 VPN' : mode === 'offline' ? '🔴 Hors ligne' : '⏳ Connexion…';

  // Has prep data
  const hasPrep = stats && (
    stats.pending_orders != null ||
    stats.in_progress_preparations != null ||
    stats.done_today != null
  );

  // Has machine data
  const hasMachines = stats && stats.total_printers != null;

  // Has attendance data
  const hasAttendance = stats && stats.attendance_today != null;

  return (
    <Screen scrollable={false} padding={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Bonjour, {user?.app_name ?? user?.full_name?.split(' ')[0]} 👋
          </Text>
          <Text style={styles.subtitle}>{modeLabel}</Text>
        </View>

        {isLoading && (
          <Text style={styles.loading}>Chargement…</Text>
        )}

        {!isLoading && error && !stats && (
          <Text style={styles.empty}>Données indisponibles pour le moment.</Text>
        )}

        {hasPrep && (
          <>
            <Text style={styles.sectionTitle}>Préparation</Text>
            <View style={styles.grid}>
              <StatCard label="En attente"        value={stats!.pending_orders ?? 0}           color={Colors.warning} />
              <StatCard label="En cours"           value={stats!.in_progress_preparations ?? 0} color={Colors.brand} />
              <StatCard label="Finies aujourd'hui" value={stats!.done_today ?? 0}               color={Colors.success} />
            </View>
          </>
        )}

        {hasMachines && (
          <>
            <Text style={styles.sectionTitle}>Machines 3D</Text>
            <View style={styles.grid}>
              <StatCard label="Actives" value={stats!.active_printers ?? 0} color={Colors.success} />
              <StatCard label="Total"   value={stats!.total_printers ?? 0} />
            </View>
          </>
        )}

        {hasAttendance && (
          <>
            <Text style={styles.sectionTitle}>Pointeuse</Text>
            <View style={styles.grid}>
              <StatCard label="Présents" value={stats!.attendance_today ?? 0} color={Colors.brand} />
            </View>
          </>
        )}

        {!isLoading && stats && !hasPrep && !hasMachines && !hasAttendance && (
          <Text style={styles.empty}>Tableau de bord non configuré pour ce rôle.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll:        { flex: 1 },
  content:       { padding: 16, paddingBottom: 32 },
  header:        { marginBottom: 24 },
  greeting:      { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle:      { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  loading:       { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
  empty:         { color: Colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 10 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:      { flex: 1, minWidth: 100, backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  statValue:     { fontSize: 32, fontWeight: '800', color: Colors.textPrimary },
  statLabel:     { fontSize: 12, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
});
