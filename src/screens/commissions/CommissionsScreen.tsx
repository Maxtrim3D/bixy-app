import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';

interface ReportEntry {
  agent: { id: number; agent_name: string; commission_rate: number };
  order_count: number;
  total_revenue: number;
  total_commission: number;
  applied_rate: number;
}

interface Report {
  date_from: string;
  date_to: string;
  agents: ReportEntry[];
  grand_total_revenue: number;
  grand_total_commission: number;
}

function currentQuarter() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const from = new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().slice(0, 10);
  return { from, to };
}

const eur = (n: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(n);

export function CommissionsScreen() {
  const { from, to } = currentQuarter();
  const [dateFrom] = useState(from);
  const [dateTo] = useState(to);

  const { data: report, isLoading, isRefetching, refetch } = useQuery<Report>({
    queryKey: ['commissions-report', dateFrom, dateTo],
    queryFn: () =>
      api.get(`/label-commissions/report?date_from=${dateFrom}&date_to=${dateTo}`).then((r) => r.data),
  });

  return (
    <Screen scrollable={false} padding={false}>
      <View style={styles.header}>
        <Text style={styles.period}>{dateFrom} → {dateTo}</Text>
        {report && (
          <View style={styles.totals}>
            <Text style={styles.totalLabel}>CA total</Text>
            <Text style={styles.totalValue}>{eur(report.grand_total_revenue)}</Text>
            <Text style={[styles.totalLabel, { marginLeft: 20 }]}>Commissions</Text>
            <Text style={[styles.totalValue, { color: Colors.success }]}>{eur(report.grand_total_commission)}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={report?.agents ?? []}
        keyExtractor={(e) => String(e.agent.id)}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? 'Calcul en cours…' : 'Aucune donnée.'}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.agentName}>{item.agent.agent_name}</Text>
              <Text style={styles.commission}>{eur(item.total_commission)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.meta}>{item.order_count} commandes · {eur(item.total_revenue)} HTVA</Text>
              <Text style={styles.rate}>{(item.applied_rate * 100).toFixed(1)} %</Text>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header:      { padding: 14, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  period:      { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  totals:      { flexDirection: 'row', alignItems: 'center' },
  totalLabel:  { fontSize: 11, color: Colors.textMuted },
  totalValue:  { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginLeft: 6 },
  card:        { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  agentName:   { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  commission:  { fontSize: 16, fontWeight: '800', color: Colors.success },
  meta:        { fontSize: 12, color: Colors.textSecondary },
  rate:        { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  empty:       { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
});
