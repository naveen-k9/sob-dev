import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { ArrowLeft } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

type Params = Partial<Record<'amount' | 'description' | 'name' | 'email' | 'contact' | 'ackOrderId', string | string[]>>;

export default function PaymentScreen() {
  const { amount, description, name, email, contact, ackOrderId } = useLocalSearchParams<Params>();

  const first = useCallback((v: string | string[] | undefined): string | undefined => {
    if (Array.isArray(v)) return v[0];
    return v;
  }, []);

  const amountStr = first(amount) ?? '0';
  const nameStr = first(name) ?? undefined;
  const descStr = first(description) ?? undefined;
  const emailStr = first(email) ?? undefined;
  const contactStr = first(contact) ?? undefined;
  const ackIdStr = first(ackOrderId) ?? undefined;

  const parsedAmount = useMemo(() => {
    const n = Number(amountStr ?? 0);
    return Number.isFinite(n) ? n : 0;
  }, [amountStr]);

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const createdOrderIdRef = useRef<string | null>(null);

  const baseUrl = useMemo(() => {
    const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    if (envUrl && envUrl.length > 0) return envUrl;
    if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
    return 'http://localhost:8081';
  }, []);

  const createOrder = trpc.payments.razorpay.createOrder.useMutation({
    onError: (err) => {
      console.log('[Payment] createOrder error', err);
      Alert.alert('Payment error', err.message || 'Unable to initialize payment');
    },
    onSuccess: (data) => {
      createdOrderIdRef.current = data?.id ?? null;
      const url = `${baseUrl}/api/payments/razorpay/checkout?orderId=${encodeURIComponent(data.id)}&amount=${encodeURIComponent(String(data.amount))}&name=${encodeURIComponent(nameStr ?? 'Payment')}&description=${encodeURIComponent(descStr ?? 'Order payment')}&email=${encodeURIComponent(emailStr ?? '')}&contact=${encodeURIComponent(contactStr ?? '')}&themeColor=${encodeURIComponent('#48479B')}`;
      setCheckoutUrl(url);
    },
  });

  useEffect(() => {
    if (parsedAmount <= 0) return;
    if (!createOrder.isIdle) return;
    createOrder.mutate({ amount: parsedAmount, currency: 'INR' });
  }, [parsedAmount]);

  const handleThankyouUrl = (url: string) => {
    try {
      const u = new URL(url);
      if (!u.pathname.includes('/api/payments/razorpay/thankyou')) return false;
      const status = u.searchParams.get('status') ?? 'unknown';
      const nextId = (ackIdStr && typeof ackIdStr === 'string') ? ackIdStr : (createdOrderIdRef.current ?? 'unknown');
      if (status === 'success') {
        router.replace({ pathname: '/acknowledgment/[orderId]', params: { orderId: nextId } });
      } else {
        Alert.alert('Payment cancelled', 'You can try again.');
        router.back();
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        title: 'Payment',
        headerLeft: () => (
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>
        )
      }} />

      {!checkoutUrl ? (
        <View style={styles.center}>
          {createOrder.isPending ? (
            <>
              <ActivityIndicator size="large" color="#48479B" />
              <Text style={styles.loadingText}>Preparing payment...</Text>
            </>
          ) : (
            <Text style={styles.errorText}>Unable to initialize payment.</Text>
          )}
        </View>
      ) : (
        Platform.OS === 'web' ? (
          <View style={styles.webWrap}>
            <Text style={styles.note}>For web, checkout opens in a new tab.</Text>
            <TouchableOpacity
              accessibilityRole="button"
              testID="open-checkout"
              style={styles.payBtn}
              onPress={() => {
                window.open(checkoutUrl, '_blank');
              }}
            >
              <Text style={styles.payBtnText}>Open Checkout</Text>
            </TouchableOpacity>
            <View style={{ height: 12 }} />
            <TouchableOpacity
              accessibilityRole="button"
              testID="i-paid"
              style={[styles.payBtn, { backgroundColor: '#10B981' }]}
              onPress={() => {
                const nextId = (ackIdStr && typeof ackIdStr === 'string') ? ackIdStr : (createdOrderIdRef.current ?? 'unknown');
                router.replace({ pathname: '/acknowledgment/[orderId]', params: { orderId: nextId } });
              }}
            >
              <Text style={styles.payBtnText}>I completed payment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              testID="cancel"
              style={[styles.payBtn, { backgroundColor: '#9CA3AF', marginTop: 8 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.payBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{ uri: checkoutUrl }}
            style={styles.webview}
            startInLoadingState
            onShouldStartLoadWithRequest={(req) => {
              const intercepted = handleThankyouUrl(req.url);
              return !intercepted;
            }}
            onNavigationStateChange={(navState) => {
              handleThankyouUrl(navState.url);
            }}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerBtn: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 14 },
  webview: { flex: 1 },
  webWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  note: { color: '#6B7280', marginBottom: 12 },
  payBtn: { backgroundColor: '#48479B', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  payBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});