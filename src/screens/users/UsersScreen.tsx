import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';

interface UserOut {
  id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
}

export function UsersScreen() {
  const { data: users, isLoading, isRefetching, refetch } = useQuery<UserOut[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  return (
    <Screen scrollable={false} padding={false}>
      <FlatList
        data={users ?? []}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Chargement…' : 'Aucun utilisateur.'}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_active && styles.inactive]}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{(item.display_name ?? item.full_name).charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.display_name ?? item.full_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <Text style={styles.role}>{item.role}</Text>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card:        { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  inactive:    { opacity: 0.4 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  name:        { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  email:       { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  role:        { fontSize: 11, fontWeight: '600', color: Colors.brand, backgroundColor: Colors.brand + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  empty:       { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
});
