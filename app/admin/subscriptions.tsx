import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import db from '@/db';
import { Subscription, User } from '@/types';
import { Calendar, Package, Clock } from 'lucide-react-native';

export default function AdminSubscriptionsScreen() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState<string>('');
  const [status, setStatus] = useState<'all' | Subscription['status']>('all');

  const load = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([db.getSubscriptions(), db.getUsers()]);
      setSubs(s);
      setUsers(u);
    } catch (e) {
      console.log('load subscriptions error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(React.useCallback(() => {
    load();
    return () => {};
  }, []));

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return subs.filter((s) => {
      const u = users.find((x) => x.id === s.userId);
      const matchesQ = !ql || (
        (u?.name?.toLowerCase().includes(ql) ?? false) ||
        (u?.phone?.toLowerCase().includes(ql) ?? false) ||
        s.id.toLowerCase().includes(ql)
      );
      const matchesStatus = status === 'all' ? true : s.status === status;
      return matchesQ && matchesStatus;
    });
  }, [subs, users, q, status]);

  const renderItem = ({ item }: { item: Subscription }) => {
    const u = users.find((x) => x.id === item.userId);
    const delivered = (item.totalDeliveries ?? 0) - (item.remainingDeliveries ?? 0);
    const fmt = (d: Date) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
      <View style={styles.card} testID={`subscription-${item.id}`}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{u?.name ?? 'Unknown'} • {u?.phone ?? ''}</Text>
            <Text style={styles.subId}>#{item.id.slice(-6)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badgeColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.metaText}>{fmt(item.startDate)} - {fmt(item.endDate)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Package size={16} color="#6B7280" />
          <Text style={styles.metaText}>{delivered}/{item.totalDeliveries ?? 0} meals delivered</Text>
        </View>
        <View style={styles.metaRow}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.metaText}>Delivery: {item.deliveryTime ?? item.deliveryTimeSlot}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.amount}>₹{item.totalAmount}</Text>
          <Text style={styles.paid}>Paid: ₹{item.paidAmount ?? 0}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Subscriptions</Text>
        <View style={styles.filters}>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search name, phone, id"
              placeholderTextColor="#9CA3AF"
              value={q}
              onChangeText={setQ}
              style={styles.input}
              testID="subs-search-input"
            />
          </View>
          <View style={styles.statusRow}>
            {(['all','active','paused','cancelled','completed'] as const).map((s) => (
              <TouchableOpacity key={s} onPress={() => setStatus(s)} style={[styles.chip, status === s && styles.chipActive]} testID={`subs-status-${s}`}>
                <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s.charAt(0).toUpperCase()+s.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}><ActivityIndicator color="#3B82F6" /></View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>No subscriptions found</Text></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function badgeColor(status: Subscription['status']): string {
  switch (status) {
    case 'active': return '#10B981';
    case 'paused': return '#F59E0B';
    case 'cancelled': return '#EF4444';
    case 'completed': return '#6B7280';
    default: return '#6B7280';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1220' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  title: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  filters: { marginBottom: 12 },
  searchBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  input: { color: 'white', fontSize: 16 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151' },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: 'white' },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  name: { color: 'white', fontSize: 16, fontWeight: '600' },
  subId: { color: '#9CA3AF', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { marginLeft: 8, color: '#9CA3AF', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  amount: { color: '#10B981', fontSize: 16, fontWeight: '700' },
  paid: { color: '#9CA3AF', fontSize: 14 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: 'white', fontSize: 14 },
});
