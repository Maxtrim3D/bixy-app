import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';

interface Task {
  id: string;
  title: string;
  assigned_to_name: string | null;
  due_date: string | null;
  status: string;
  priority: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: Colors.error,
  high: Colors.error,
  normal: Colors.warning,
  medium: Colors.warning,
  low: Colors.success,
};

export function TasksScreen() {
  const { data: tasks, isLoading, isRefetching, refetch, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then((r) => Array.isArray(r.data) ? r.data : (r.data.items ?? [])),
    refetchInterval: 30_000,
  });

  return (
    <Screen scrollable={false} padding={false}>
      <FlatList
        data={tasks ?? []}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isLoading ? 'Chargement…' : error ? `Erreur: ${(error as Error).message}` : 'Aucune tâche.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: PRIORITY_COLOR[item.priority] ?? Colors.textMuted }]} />
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            </View>
            <View style={styles.meta}>
              {item.assigned_to_name && <Text style={styles.metaText}>👤 {item.assigned_to_name}</Text>}
              {item.due_date && <Text style={styles.metaText}>📅 {item.due_date.slice(0, 10)}</Text>}
              <Text style={styles.status}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  row:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot:     { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  title:   { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  meta:    { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  metaText:{ fontSize: 12, color: Colors.textSecondary },
  status:  { fontSize: 12, color: Colors.textMuted, marginLeft: 'auto' },
  empty:   { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
});
