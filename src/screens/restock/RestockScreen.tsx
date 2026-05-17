import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';

interface RestockEntry {
  partner_id: number;
  partner_name: string;
  last_order_date: string | null;
  days_since: number | null;
  total_orders: number;
  alert: boolean;
}

function dayColor(days: number | null): string {
  if (days == null) return Colors.textMuted;
  if (days > 60) return Colors.error;
  if (days > 30) return Colors.warning;
  return Colors.success;
}

export function RestockScreen() {
  const { data: clients, isLoading, isRefetching, refetch } = useQuery<RestockEntry[]>({
    queryKey: ['restock'],
    queryFn: () => api.get('/restock').then((r) => r.data),
  });

  const alerts = clients?.filter((c) => c.alert).length ?? 0;

  return (
    <Screen scrollable={false} padding={false}>
      {alerts > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠ {alerts} client{alerts > 1 ? 's' : ''} sans commande récente</Text>
        </View>
      )}
      <FlatList
        data={clients ?? []}
        keyExtractor={(c) => String(c.partner_id)}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Chargement…' : 'Aucun client RetailB2B.'}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, item.alert && styles.cardAlert]}>
            <View style={styles.row}>
              <Text style={styles.name} numberOfLines={1}>{item.partner_name}</Text>
              {item.days_since != null && (
                <Text style={[styles.days, { color: dayColor(item.days_since) }]}>
                  {item.days_since}j
                </Text>
              )}
            </View>
            <Text style={styles.meta}>
              Dernière commande : {item.last_order_date?.slice(0, 10) ?? 'jamais'}
              {' · '}{item.total_orders} commande{item.total_orders > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  alertBanner:{ padding: 10, backgroundColor: '#450a0a', borderBottomWidth: 1, borderBottomColor: Colors.error },
  alertText:  { color: '#fca5a5', fontWeight: '600', textAlign: 'center', fontSize: 13 },
  card:       { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  cardAlert:  { borderColor: Colors.error + '60' },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:       { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  days:       { fontSize: 20, fontWeight: '800', minWidth: 48, textAlign: 'right' },
  meta:       { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  empty:      { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
});
