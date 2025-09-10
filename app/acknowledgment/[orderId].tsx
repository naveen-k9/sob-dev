import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import db from '@/db';
import { Order } from '@/types';
import { CheckCircle2, Package } from 'lucide-react-native';

export default function AcknowledgmentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const load = useCallback(async () => {
    try {
      if (!orderId || typeof orderId !== 'string') {
        setLoading(false);
        return;
      }
      const orders = await db.getOrders();
      const found = orders.find((o) => o.id === orderId) || null;
      setOrder(found ?? null);
    } catch (e) {
      console.log('[Ack] load error', e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkReceived = async () => {
    if (!order?.id) return;
    try {
      setSubmitting(true);
      const updated = await db.markDeliveryAsReceived(order.id);
      if (updated) {
        Alert.alert('Thank you!', 'Delivery marked as received. Enjoy your meal!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        setOrder(updated);
      } else {
        Alert.alert('Error', 'Unable to update order. Please try again.');
      }
    } catch (e) {
      console.log('[Ack] mark error', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canAck = order?.status === 'waiting_for_ack' || order?.status === 'out_for_delivery';

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Delivery Acknowledgment' }} />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}> 
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading order...</Text>
          </View>
        ) : !order ? (
          <View style={styles.center}>
            <Text style={styles.title}>Order not found</Text>
            <Text style={styles.subtitle}>We couldn't find the order associated with this notification.</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Package size={28} color="#FF6B35" />
              </View>
              <Text style={styles.title}>Confirm Delivery</Text>
              <Text style={styles.subtitle}>Order ID: {order.id}</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{order.status.replaceAll('_', ' ')}</Text>
              </View>
            </View>

            <TouchableOpacity
              testID="mark-received"
              style={[styles.cta, !canAck && styles.ctaDisabled]}
              onPress={handleMarkReceived}
              disabled={!canAck || submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <CheckCircle2 size={20} color="white" />
                  <Text style={styles.ctaText}>Mark as received</Text>
                </>
              )}
            </TouchableOpacity>

            {!canAck && (
              <Text style={styles.helper}>
                You can only acknowledge orders that are waiting for confirmation.
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  content: { gap: 16 },
  card: {
    backgroundColor: '#FFFBF8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE2D5',
    alignItems: 'center',
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF2EC', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 12, color: '#334155', textTransform: 'capitalize' },
  cta: {
    marginTop: 16,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  ctaDisabled: { backgroundColor: '#9CA3AF' },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '700' },
  helper: { color: '#6B7280', textAlign: 'center', marginTop: 8 },
});
