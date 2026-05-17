import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';
import type { PrinterData } from '@/types';

function statusColor(status?: string): string {
  if (!status) return Colors.textMuted;
  const s = status.toLowerCase();
  if (s.includes('print')) return Colors.brand;
  if (s.includes('idle') || s.includes('finish')) return Colors.success;
  if (s.includes('error') || s.includes('fail')) return Colors.error;
  return Colors.warning;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${Math.min(100, pct)}%` as `${number}%` }]} />
    </View>
  );
}

function PrinterCard({ printer }: { printer: PrinterData }) {
  const controlMut = useMutation({
    mutationFn: (action: string) =>
      api.post(`/machines/${printer.id}/control`, { action }),
  });

  const isActive = (printer.status ?? '').toLowerCase().includes('print');
  const progress = printer.progress ?? 0;
  const remaining = printer.remaining_time;
  const remainStr = remaining != null
    ? remaining >= 3600 ? `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}min`
      : `${Math.floor(remaining / 60)}min`
    : null;

  return (
    <View style={styles.printerCard}>
      <View style={styles.printerHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.printerName}>{printer.name ?? printer.id}</Text>
          {printer.model && <Text style={styles.printerModel}>{printer.model}</Text>}
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor(printer.status) }]} />
      </View>

      {printer.current_job_name || printer.job_name ? (
        <Text style={styles.jobName} numberOfLines={1}>
          📄 {printer.current_job_name ?? printer.job_name}
        </Text>
      ) : null}

      {isActive && progress > 0 && (
        <View style={{ marginTop: 8 }}>
          <View style={styles.progressRow}>
            <Text style={styles.progressPct}>{progress.toFixed(0)} %</Text>
            {remainStr && <Text style={styles.remaining}>⏱ {remainStr}</Text>}
          </View>
          <ProgressBar pct={progress} />
        </View>
      )}

      <View style={styles.tempsRow}>
        {printer.nozzle_temp != null && (
          <Text style={styles.temp}>🔥 {printer.nozzle_temp.toFixed(0)}° / {printer.nozzle_target_temp ?? 0}°</Text>
        )}
        {printer.bed_temp != null && (
          <Text style={styles.temp}>🛏 {printer.bed_temp.toFixed(0)}°</Text>
        )}
        {printer.filament_type && (
          <Text style={styles.temp}>🧵 {printer.filament_type}</Text>
        )}
      </View>

      {isActive && (
        <View style={styles.controlRow}>
          {[
            { action: 'pause',  label: '⏸ Pause',  color: Colors.warning },
            { action: 'stop',   label: '⏹ Stop',   color: Colors.error },
          ].map(({ action, label, color }) => (
            <TouchableOpacity
              key={action}
              style={[styles.ctrlBtn, { borderColor: color }]}
              onPress={() => controlMut.mutate(action)}
              disabled={controlMut.isPending}
              activeOpacity={0.7}
            >
              <Text style={[styles.ctrlBtnText, { color }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export function MachinesScreen() {
  const { data: printers, isLoading, isRefetching, refetch } = useQuery<PrinterData[]>({
    queryKey: ['machines'],
    queryFn: () => api.get('/machines').then((r) => r.data),
    refetchInterval: 3_000,
  });

  const active = printers?.filter((p) => (p.status ?? '').toLowerCase().includes('print')).length ?? 0;

  return (
    <Screen scrollable={false} padding={false}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>{active} imprimante{active !== 1 ? 's' : ''} active{active !== 1 ? 's' : ''} / {printers?.length ?? '…'} total</Text>
      </View>
      <FlatList
        data={printers ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? 'Chargement…' : 'Aucune imprimante connectée.'}</Text>
        }
        renderItem={({ item }) => <PrinterCard printer={item} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary:       { padding: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryText:   { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  printerCard:   { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  printerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  printerName:   { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  printerModel:  { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  statusDot:     { width: 10, height: 10, borderRadius: 5 },
  jobName:       { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressPct:   { fontSize: 12, fontWeight: '700', color: Colors.brand },
  remaining:     { fontSize: 12, color: Colors.textMuted },
  progressBg:    { height: 6, backgroundColor: Colors.card, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, backgroundColor: Colors.brand, borderRadius: 3 },
  tempsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  temp:          { fontSize: 12, color: Colors.textSecondary },
  controlRow:    { flexDirection: 'row', gap: 8, marginTop: 10 },
  ctrlBtn:       { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  ctrlBtnText:   { fontSize: 13, fontWeight: '600' },
  empty:         { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
});
