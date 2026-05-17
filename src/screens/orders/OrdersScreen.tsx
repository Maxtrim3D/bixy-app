import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';

interface Order {
  id: number;
  name: string;
  partner_name: string;
  date_order: string;
  amount_total: number;
  state: string;
  currency: string;
}

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Brouillon',  color: Colors.textMuted },
  sent:      { label: 'Envoyé',     color: Colors.warning },
  sale:      { label: 'Confirmé',   color: Colors.brand },
  done:      { label: 'Terminé',    color: Colors.success },
  cancel:    { label: 'Annulé',     color: Colors.error },
};

export function OrdersScreen() {
  const [search, setSearch] = useState('');

  const { data: orders, isLoading, isRefetching, refetch } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders', { params: { limit: 100 } }).then((r) => r.data),
  });

  const filtered = (orders ?? []).filter((o) => {
    const q = search.toLowerCase();
    return !q || o.name.toLowerCase().includes(q) || o.partner_name.toLowerCase().includes(q);
  });

  return (
    <Screen scrollable={false} padding={false}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher…"
          placeholderTextColor={Colors.textMuted}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? 'Chargement…' : 'Aucune commande.'}</Text>
        }
        renderItem={({ item }) => {
          const st = STATE_LABELS[item.state] ?? { label: item.state, color: Colors.textMuted };
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={[styles.state, { color: st.color }]}>{st.label}</Text>
              </View>
              <Text style={styles.partner}>{item.partner_name}</Text>
              <View style={styles.row}>
                <Text style={styles.meta}>{item.date_order?.slice(0, 10)}</Text>
                <Text style={styles.amount}>{item.amount_total.toFixed(2)} {item.currency}</Text>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: { padding: 10, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  search:    { backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: Colors.textPrimary, fontSize: 14 },
  card:      { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:      { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  state:     { fontSize: 12, fontWeight: '600' },
  partner:   { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  meta:      { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  amount:    { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 6 },
  empty:     { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
});
