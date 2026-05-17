import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/colors';
import type { Preparation, PendingOrder, PrepLine } from '@/types';

type Tab = 'waiting' | 'in_progress' | 'partial' | 'done';

const TABS: Array<{ key: Tab; label: string; color: string }> = [
  { key: 'waiting',     label: 'Attente',  color: Colors.textSecondary },
  { key: 'in_progress', label: 'En cours', color: Colors.brand },
  { key: 'partial',     label: 'Partiel',  color: Colors.warning },
  { key: 'done',        label: 'Terminé',  color: Colors.success },
];

function StatusBadge({ status }: { status: string }) {
  const tab = TABS.find((t) => t.key === status);
  return (
    <View style={[styles.badge, { borderColor: tab?.color ?? Colors.border }]}>
      <Text style={[styles.badgeText, { color: tab?.color ?? Colors.textSecondary }]}>
        {tab?.label ?? status}
      </Text>
    </View>
  );
}

function PrepCard({ prep, onPress }: { prep: Preparation; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>{prep.odoo_sale_order_name ?? `Prépa ${prep.id.slice(0, 6)}`}</Text>
        <StatusBadge status={prep.status} />
      </View>
      <Text style={styles.cardPartner}>{prep.partner_name}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>{prep.lines.length} article{prep.lines.length > 1 ? 's' : ''}</Text>
        {prep.order_amount != null && (
          <Text style={styles.cardMeta}>{prep.order_amount.toFixed(2)} €</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PendingCard({ order, onSync, syncing }: { order: PendingOrder; onSync: () => void; syncing: boolean }) {
  return (
    <TouchableOpacity style={[styles.card, styles.pendingCard]} onPress={onSync} activeOpacity={0.7} disabled={syncing}>
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>{order.name}</Text>
        {syncing
          ? <ActivityIndicator size="small" color={Colors.brand} />
          : <Text style={styles.syncHint}>+ Importer</Text>}
      </View>
      <Text style={styles.cardPartner}>{order.partner}</Text>
      {order.amount_total > 0 && (
        <Text style={styles.cardMeta}>{order.amount_total.toFixed(2)} {order.currency}</Text>
      )}
    </TouchableOpacity>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function PrepDetail({ prep, onClose, onRefresh }: { prep: Preparation; onClose: () => void; onRefresh: () => void }) {
  const qc = useQueryClient();
  const [syncingLine, setSyncingLine] = useState<string | null>(null);

  const startMut = useMutation({
    mutationFn: () => api.post(`/preparation/${prep.id}/start`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['preparation'] }); onRefresh(); },
  });

  const lineMut = useMutation({
    mutationFn: ({ lineId, payload }: { lineId: string; payload: Partial<PrepLine> }) =>
      api.patch(`/preparation/${prep.id}/lines/${lineId}`, payload).then((r) => r.data),
    onSuccess: () => { setSyncingLine(null); qc.invalidateQueries({ queryKey: ['preparation'] }); },
  });

  const completeMut = useMutation({
    mutationFn: () => api.post(`/preparation/${prep.id}/complete`, { send_email: true, instant: true }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['preparation'] }); onClose(); },
  });

  const markDone = (line: PrepLine) => {
    setSyncingLine(line.id);
    lineMut.mutate({ lineId: line.id, payload: { is_done: true, quantity_picked: line.quantity_demanded, missing_quantity: 0 } });
  };

  const markMissing = (line: PrepLine) => {
    Alert.prompt('Quantité manquante', `Max: ${line.quantity_demanded}`, (val) => {
      const missing = Math.min(Number(val || 0), line.quantity_demanded);
      lineMut.mutate({ lineId: line.id, payload: { is_done: true, quantity_picked: line.quantity_demanded - missing, missing_quantity: missing } });
    }, 'plain-text', '1', 'numeric');
  };

  const allDone = prep.lines.every((l) => l.is_done);

  return (
    <View style={styles.detail}>
      <View style={styles.detailHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailTitle}>{prep.odoo_sale_order_name ?? 'Commande'}</Text>
          <Text style={styles.detailPartner}>{prep.partner_name}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {prep.status === 'waiting' && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => startMut.mutate()}
          disabled={startMut.isPending}
        >
          {startMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>▶  Commencer la préparation</Text>}
        </TouchableOpacity>
      )}

      <FlatList
        data={prep.lines}
        keyExtractor={(l) => l.id}
        style={{ flex: 1 }}
        renderItem={({ item: line }) => (
          <View style={[styles.lineCard, line.is_done && styles.lineDone]}>
            <View style={styles.lineRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineName}>{line.product_name}</Text>
                {line.product_ref && <Text style={styles.lineMeta}>Réf. {line.product_ref}</Text>}
                <Text style={styles.lineQty}>Qté : {line.quantity_demanded}</Text>
                {(line.missing_quantity ?? 0) > 0 && (
                  <Text style={styles.lineMissing}>⚠ {line.missing_quantity} manquant(s)</Text>
                )}
              </View>
              {line.is_done
                ? <Text style={styles.checkmark}>✓</Text>
                : prep.status === 'in_progress' && (
                  <View style={styles.lineActions}>
                    <TouchableOpacity
                      style={styles.btnGreen}
                      onPress={() => markDone(line)}
                      disabled={syncingLine === line.id}
                    >
                      {syncingLine === line.id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.btnSmText}>Pris ✓</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnAmber} onPress={() => markMissing(line)}>
                      <Text style={styles.btnSmText}>Manque</Text>
                    </TouchableOpacity>
                  </View>
                )
              }
            </View>
          </View>
        )}
      />

      {prep.status === 'in_progress' && allDone && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.success }]}
          onPress={() => completeMut.mutate()}
          disabled={completeMut.isPending}
        >
          {completeMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>✓  Terminer &amp; envoyer email</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function PreparationScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('waiting');
  const [selected, setSelected] = useState<Preparation | null>(null);
  const [syncingOrder, setSyncingOrder] = useState<number | null>(null);

  const prepsQuery = useQuery<Preparation[]>({
    queryKey: ['preparation'],
    queryFn: () => api.get('/preparation', { params: { limit: 200 } }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const pendingQuery = useQuery<PendingOrder[]>({
    queryKey: ['preparation', 'pending'],
    queryFn: () => api.get('/preparation/pending-retail-b2b', { params: { limit: 100 } }).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['preparation'] });
  };

  const syncMut = useMutation({
    mutationFn: (orderId: number) => api.post<Preparation>(`/preparation/sync/${orderId}`).then((r) => r.data),
    onSuccess: (prep) => {
      setSyncingOrder(null);
      setSelected(prep);
      setTab('waiting');
      refreshAll();
    },
    onError: () => setSyncingOrder(null),
  });

  const byStatus = useMemo(() => {
    const map: Record<Tab, Preparation[]> = { waiting: [], in_progress: [], partial: [], done: [] };
    for (const p of prepsQuery.data ?? []) {
      if (p.status in map) map[p.status as Tab].push(p);
    }
    return map;
  }, [prepsQuery.data]);

  const currentItems = useMemo(() => {
    if (tab === 'waiting') {
      // Show pending Odoo orders at the top of 'waiting'
      return { pending: pendingQuery.data ?? [], preps: byStatus.waiting };
    }
    return { pending: [], preps: byStatus[tab] };
  }, [tab, byStatus, pendingQuery.data]);

  const tabCount = (t: Tab) => t === 'waiting'
    ? byStatus.waiting.length + (pendingQuery.data?.length ?? 0)
    : byStatus[t].length;

  if (selected) {
    // Show full-screen detail panel
    return (
      <Screen scrollable={false} padding={false}>
        <PrepDetail
          prep={selected}
          onClose={() => setSelected(null)}
          onRefresh={refreshAll}
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} padding={false}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, tab === t.key && { color: t.color }]}>
              {t.label}
            </Text>
            <View style={[styles.tabBadge, tab === t.key && { backgroundColor: t.color + '33' }]}>
              <Text style={[styles.tabCount, { color: t.color }]}>{tabCount(t.key)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={[...currentItems.pending.map((o) => ({ type: 'pending', data: o } as const)),
               ...currentItems.preps.map((p) => ({ type: 'prep', data: p } as const))]}
        keyExtractor={(item) => item.type === 'pending' ? `pending-${item.data.id}` : (item.data as Preparation).id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={prepsQuery.isRefetching || pendingQuery.isRefetching}
            onRefresh={refreshAll}
            tintColor={Colors.brand}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Rien ici pour le moment.</Text>
        }
        renderItem={({ item }) => {
          if (item.type === 'pending') {
            const order = item.data as PendingOrder;
            return (
              <PendingCard
                order={order}
                syncing={syncingOrder === order.id}
                onSync={() => {
                  setSyncingOrder(order.id);
                  syncMut.mutate(order.id);
                }}
              />
            );
          }
          const prep = item.data as Preparation;
          return (
            <PrepCard
              prep={prep}
              onPress={() => setSelected(prep)}
            />
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabBar:       { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', gap: 4 },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: Colors.brand },
  tabLabel:     { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  tabBadge:     { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: Colors.card },
  tabCount:     { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  card:         { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  pendingCard:  { borderColor: '#0e4a6e', backgroundColor: '#0c1a24' },
  cardRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle:    { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardPartner:  { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  cardMeta:     { fontSize: 12, color: Colors.textMuted },
  badge:        { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  syncHint:     { fontSize: 12, color: Colors.brand, fontWeight: '600' },
  empty:        { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
  // Detail
  detail:       { flex: 1, backgroundColor: Colors.bg },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  detailTitle:  { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  detailPartner:{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: Colors.textSecondary, fontSize: 16 },
  actionBtn:    { margin: 12, backgroundColor: Colors.brand, borderRadius: 10, padding: 14, alignItems: 'center' },
  actionBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  lineCard:     { marginHorizontal: 12, marginBottom: 8, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border },
  lineDone:     { opacity: 0.5, borderColor: Colors.success },
  lineRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineName:     { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  lineMeta:     { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  lineQty:      { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  lineMissing:  { fontSize: 13, color: Colors.warning, marginTop: 2 },
  lineActions:  { flexDirection: 'row', gap: 6 },
  btnGreen:     { backgroundColor: Colors.success, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  btnAmber:     { backgroundColor: Colors.warning, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  btnSmText:    { color: '#fff', fontWeight: '700', fontSize: 12 },
  checkmark:    { fontSize: 20, color: Colors.success },
});
