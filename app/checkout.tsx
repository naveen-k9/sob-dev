import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import AddressBookModal from '@/components/AddressBookModal';
import { Address, Offer } from '@/types';
import { Stack, router, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Wallet, MapPin, Tag, Check, CheckCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import db from '@/db';
import RazorpayCheckout from 'react-native-razorpay';
export default function CheckoutScreen() {
  const { user, isGuest, updateUser } = useAuth();
  const { subscriptionData } = useLocalSearchParams();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'upi' | 'wallet' | 'razorpay'>('razorpay');
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [applyWallet, setApplyWallet] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralApplying, setReferralApplying] = useState<boolean>(false);
  const [referralApplied, setReferralApplied] = useState<boolean>(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed' | null>(null);
  const routerInstance = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressBook, setShowAddressBook] = useState<boolean>(false);

  React.useEffect(() => {
    setCanGoBack(routerInstance.canGoBack());
  }, []);

  useEffect(() => {
    if (subscriptionData && typeof subscriptionData === 'string') {
      try {
        const parsedData = JSON.parse(subscriptionData);
        setSubscriptionDetails(parsedData);

      } catch (error) {
        console.error('Error parsing subscription data:', error);
        Alert.alert('Error', 'Invalid subscription data');
        if (canGoBack) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      }
    }
  }, [subscriptionData]);

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [user?.addresses]);

  const walletBalance = user?.walletBalance ?? 0;


  const orderSummary = useMemo(() => {
    if (!subscriptionDetails) {
      return {
        planName: '',
        duration: 0,
        originalPrice: 0,
        discountedPrice: 0,
        discount: 0,
        deliveryFee: 0,
        promoDiscount: 0,
        trialDiscount: 0,
        addOnTotal: 0,
        walletAppliedAmount: 0,
        finalAmount: 0,
        payableAmount: 0,
        subtotalAfterPromo: 0,
      };
    }
    const planName: string = String(subscriptionDetails.plan?.name ?? '');
    const duration: number = Number(subscriptionDetails.plan?.duration ?? 0);
    const originalPrice: number = Number(subscriptionDetails.plan?.originalPrice ?? 0);
    const discountedPrice: number = Number(subscriptionDetails.plan?.discountedPrice ?? 0);
    const baseDiscount: number = Math.max(0, originalPrice - discountedPrice);
    const deliveryFee: number = 0;
    const trialDiscount: number = subscriptionDetails.isTrialMode ? discountedPrice * 0.5 : 0;
    const addOnTotal: number = (subscriptionDetails.addOns?.length ?? 0) * 50 * duration;
    const baseSubtotal: number = discountedPrice + addOnTotal - trialDiscount + deliveryFee;
    let promoDiscount: number = 0;
    if (appliedOffer && promoApplied) {
      const benefitType = appliedOffer.benefitType ?? 'amount';
      if (benefitType === 'meal') {
        const days = duration > 0 ? duration : 1;
        const perMeal = days > 0 ? Math.round(discountedPrice / days) : 0;
        promoDiscount = Math.max(0, perMeal);
      } else {
        if (appliedOffer.discountType === 'fixed') {
          promoDiscount = Math.min(appliedOffer.discountValue, baseSubtotal);
        } else if (appliedOffer.discountType === 'percentage') {
          const pct = Math.max(0, Math.min(100, appliedOffer.discountValue));
          const raw = (baseSubtotal * pct) / 100;
          const capped = typeof appliedOffer.maxDiscount === 'number' ? Math.min(raw, appliedOffer.maxDiscount) : raw;
          promoDiscount = Math.min(capped, baseSubtotal);
        }
      }
    }
    const subtotalAfterPromo: number = Math.max(0, baseSubtotal - promoDiscount);
    const walletAppliedAmount: number = applyWallet ? Math.min(walletBalance, subtotalAfterPromo) : 0;
    const payableAmount: number = Math.max(0, subtotalAfterPromo - walletAppliedAmount);
    return {
      planName,
      duration,
      originalPrice,
      discountedPrice,
      discount: baseDiscount,
      deliveryFee,
      promoDiscount,
      trialDiscount,
      addOnTotal,
      walletAppliedAmount,
      finalAmount: payableAmount,
      payableAmount,
      subtotalAfterPromo,
    };
  }, [subscriptionDetails, promoApplied, appliedOffer, applyWallet, walletBalance]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setToastVisible(false);
        });
      }, 2200);
    });
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Enter Code', 'Please enter a promo code.');
      return;
    }
    try {
      const active = await db.getActiveOffers();
      let merged: Offer[] = Array.isArray(active) ? active : [];
      try {
        const constants = await import('@/constants/data');
        const constOffers: Offer[] = (constants as any).offers ?? [];
        const seen = new Set(merged.map(o => o.id));
        constOffers.forEach(o => { if (o && !seen.has(o.id)) { merged.push(o); seen.add(o.id); } });
      } catch (e) {
        console.log('Offer constants import failed', e);
      }
      const match = merged.find(o => (o.promoCode ?? o.code ?? '').toUpperCase() === code && o.isActive);
      if (!match) {
        Alert.alert('Invalid Code', 'Please enter a valid promo code.');
        return;
      }
      const now = new Date();
      if (new Date(match.validFrom) > now || new Date(match.validTo) < now) {
        Alert.alert('Expired', 'This promo code is not currently valid.');
        return;
      }
      setAppliedOffer(match);
      setPromoApplied(true);
      showToast('Promo applied successfully.');
    } catch (e) {
      console.log('Apply promo failed', e);
      Alert.alert('Error', 'Could not validate promo code. Try again.');
    }
  };

  const computeEndDate = (
    start: Date,
    durationDays: number,
    weekType: 'mon-fri' | 'mon-sat'
  ): Date => {
    const end = new Date(start);
    let served = 0;

    while (served < durationDays) {
      const day = end.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

      let isWorkingDay = false;
      if (weekType === 'mon-fri') {
        isWorkingDay = day >= 1 && day <= 5; // Mon to Fri
      } else if (weekType === 'mon-sat') {
        isWorkingDay = day >= 1 && day <= 6; // Mon to Sat
      }

      if (isWorkingDay) {
        served += 1;
      }

      if (served < durationDays) {
        end.setDate(end.getDate() + 1);
      }
    }

    return end;
  };


  const handleApplyReferral = async () => {
    if (!user?.id) {
      Alert.alert('Login required', 'Please login to apply a referral code.');
      return;
    }
    if (!referralCode.trim()) {
      Alert.alert('Enter code', 'Please enter a referral code to apply.');
      return;
    }
    try {
      setReferralApplying(true);
      const res = await db.applyReferralCode(user.id, referralCode.trim().toUpperCase());
      if (res.success) {
        setReferralApplied(true);
        Alert.alert('Success', res.message);
      } else {
        Alert.alert('Failed', res.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not apply referral code. Please try again.');
    } finally {
      setReferralApplying(false);
    }
  };

  const createRazorpayOrderAndOpenCheckout = async (amount: number, description: string) => {
    try {
      const envBase = process.env.EXPO_PUBLIC_RORK_API_BASE_URL as string | undefined;
      const base = envBase && envBase.length > 0
        ? envBase
        : (typeof window !== 'undefined' && (window as any).location?.origin ? (window as any).location.origin : undefined);

      if (!base) {
        console.log('[Razorpay] Missing base URL. EXPO_PUBLIC_RORK_API_BASE_URL not set and window.location.origin unavailable');
        Alert.alert('Config error', 'API base URL not configured');
        return null;
      }

      const customer = {
        name: user?.name ?? 'Customer',
        email: user?.email ?? undefined,
        contact: user?.phone ?? undefined,
      } as { name: string; email?: string; contact?: string };

      const orderResp = await fetch(`${base}/api/payments/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR', receipt: `rcpt_${Date.now()}`, notes: { description } }),
      });

      if (!orderResp.ok) {
        const t = await orderResp.text();
        console.log('[Razorpay] order create failed', orderResp.status, t);
        try {
          const json = JSON.parse(t);
          Alert.alert('Payment error', json?.error ? String(json.error) : 'Unable to start Razorpay checkout');
        } catch {
          Alert.alert('Payment error', 'Unable to start Razorpay checkout');
        }
        return null;
      }

      const order = (await orderResp.json()) as { id?: string; amount?: number };
      if (!order?.id) {
        Alert.alert('Payment error', 'Invalid order response from server');
        return null;
      }

      const checkoutUrl = `${base}/api/payments/razorpay/checkout?orderId=${encodeURIComponent(order.id)}&amount=${encodeURIComponent(String(order.amount ?? Math.round(amount * 100)))}&name=${encodeURIComponent(customer.name)}&description=${encodeURIComponent(description)}&email=${encodeURIComponent(customer.email ?? '')}&contact=${encodeURIComponent(customer.contact ?? '')}&themeColor=${encodeURIComponent('#FF6B35')}`;

      return checkoutUrl;
    } catch (e) {
      console.log('[Razorpay] order create exception', e);
      Alert.alert('Payment error', 'Something went wrong while initializing payment.');
      return null;
    }
  };

  const handlePlaceOrder = async () => {
    if (isGuest) {
      router.push('/auth/login');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select a delivery address to continue.');
      return;
    }

    if (selectedPaymentMethod === 'wallet') {
      if (orderSummary.payableAmount > 0) {
        Alert.alert('Insufficient Wallet Balance', 'Remaining amount exists after wallet usage. Choose UPI/Card or apply more wallet.');
        return;
      }
    }

    // If amount payable is zero, activate immediately
    if (orderSummary.payableAmount === 0) {
      setShowPaymentModal(true);
      setPaymentStatus('processing');
      setTimeout(async () => {
        setPaymentStatus('success');
        console.log('Deducting wallet --- IGNORE ---');
        if (user?.id && orderSummary.walletAppliedAmount > 0) {
          try {
            await db.addWalletTransaction({
              userId: user.id,
              type: 'debit',
              amount: orderSummary.walletAppliedAmount,
              description: 'Subscription payment (wallet applied)',
              referenceId: `sub-${Date.now()}`,
            });
            await updateUser({ walletBalance: Math.max(0, walletBalance - orderSummary.walletAppliedAmount) });
          } catch (e) {
            console.log('Wallet debit failed', e);
          }
        }

        console.log('PaymentStatus after wallet --- IGNORE ---');
        // Save subscription to database
        const startDate = new Date(subscriptionDetails.startDate);
        const endDate = computeEndDate(startDate, subscriptionDetails.plan.duration, subscriptionDetails.weekType);

        const subscription = {
          userId: user?.id || 'guest',
          mealId: subscriptionDetails.meal.id,
          planId: subscriptionDetails.plan.id,
          startDate: startDate,
          endDate: endDate,
          deliveryTime: subscriptionDetails.timeSlot.time,
          deliveryTimeSlot: subscriptionDetails.timeSlot.time,
          weekType: subscriptionDetails.weekType,
          weekendExclusion: subscriptionDetails.weekType === 'mon-sat' ? 'sunday' : 'both',
          excludeWeekends: subscriptionDetails.weekType === 'mon-sat' ? true : false,
          status: 'active' as const,
          totalAmount: orderSummary.finalAmount,
          paidAmount: orderSummary.finalAmount,
          remainingDeliveries: subscriptionDetails.plan.duration,
          totalDeliveries: subscriptionDetails.plan.duration,
          addressId: selectedAddress?.id || 'default',
          addOns: (subscriptionDetails.addOns ?? []).map((addon: any) => addon.id),
          additionalAddOns: {},
          specialInstructions: deliveryInstructions,
        };
        console.log('Creating subscription:', subscription);
        try {
          await db.createSubscription(subscription);
          console.log('Subscription created successfully');
        } catch (error) {
          console.error('Error creating subscription:', error);
        }
        setTimeout(() => {
          setShowPaymentModal(false);
          // Wait for modal to close before navigating
          setTimeout(() => {
            if (router.dismiss) {
              router.dismiss();
            }
            router.replace('/(tabs)/orders');
          }, 100);
        }, 2000);
      }, 1500);
      return;
    }

    // Non-zero payment: create Razorpay order then open checkout bridge
    // const checkoutUrl = await createRazorpayOrderAndOpenCheckout(orderSummary.payableAmount, `Subscription payment for ${subscriptionDetails?.meal?.name ?? 'Meal'}`);
    // if (checkoutUrl) {
    //   router.push({ pathname: '/webview', params: { url: checkoutUrl, title: 'Complete Payment' } });
    // }
    const description = 'Credits towards consultation';
    const payload = {
      amount: Math.round(orderSummary.payableAmount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { description },
    };

    console.log('Creating Razorpay order with payload:', payload);
    const orderResp = await fetch('https://sameoldbox.com/wp-json/razorpay/v1/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log('Created Razorpay order :', orderResp);

    if (!orderResp.ok) {
      alert('Failed to create Razorpay order');
      return;
    }
    const orderData = await orderResp.json();
    const options = {
      description,
      image: 'https://i.imgur.com/3g7nmJC.jpg',
      currency: 'INR',
      key: 'rzp_test_RFSonKoJy6tEEL', // Use your public Razorpay key here
      amount: `${orderSummary.payableAmount * 100}`,
      name: 'SOB',
      order_id: orderData.id, // Use the order_id from backend
      prefill: {
        email: 'gaurav.kumar@example.com',
        contact: '+919876543210',
        name: 'Gaurav Kumar'
      },
      theme: { color: '#53a20e' }
    };

    console.log('Razorpay options:', options);
    RazorpayCheckout.open(options)
      .then(async (data: { razorpay_payment_id: string }) => {
        // alert(`Success: ${data.razorpay_payment_id}`);
        // Always close payment modal and overlays
        // setShowPaymentModal(false);
        // ...existing code...
        setShowPaymentModal(true);
        setPaymentStatus('success');
        if (user?.id && orderSummary.walletAppliedAmount > 0) {
          try {
            await db.addWalletTransaction({
              userId: user.id,
              type: 'debit',
              amount: orderSummary.walletAppliedAmount,
              description: 'Subscription payment (wallet applied)',
              referenceId: `sub-${Date.now()}`,
            });
            await updateUser({ walletBalance: Math.max(0, walletBalance - orderSummary.walletAppliedAmount) });
          } catch (e) {
            console.log('Wallet debit failed', e);
          }
        }

        console.log('PaymentStatus after wallet --- IGNORE ---');

        // Save subscription to database
        const startDate = new Date(subscriptionDetails.startDate);
        console.log('Start Date:', startDate);
        const endDate = computeEndDate(startDate, subscriptionDetails.plan.duration, subscriptionDetails.weekType);
        console.log('End Date:', endDate);

        const subscription = {
          userId: user?.id || 'guest',
          mealId: subscriptionDetails.meal.id,
          planId: subscriptionDetails.plan.id,
          startDate: startDate,
          endDate: endDate,
          deliveryTime: subscriptionDetails.timeSlot.time,
          deliveryTimeSlot: subscriptionDetails.timeSlot.time,
          weekType: subscriptionDetails.weekType,
          weekendExclusion: subscriptionDetails.weekType === 'mon-sat' ? 'sunday' : 'both',
          excludeWeekends: subscriptionDetails.weekType === 'mon-sat' ? true : false,
          status: 'active' as const,
          totalAmount: orderSummary.finalAmount,
          paidAmount: orderSummary.finalAmount,
          remainingDeliveries: subscriptionDetails.plan.duration,
          totalDeliveries: subscriptionDetails.plan.duration,
          addressId: selectedAddress?.id || 'default',
          addOns: (subscriptionDetails.addOns ?? []).map((addon: any) => addon.id),
          additionalAddOns: {},
          specialInstructions: deliveryInstructions,
        };
        console.log('Creating subscription:', subscription);

        try {
          await db.createSubscription(subscription);
          console.log('Subscription created successfully');
        } catch (error) {
          console.error('Error creating subscription:', error);
        }

        // Force navigation reset to orders tab
        // if (router.dismiss) {
        //   router.dismiss(); // If using expo-router v3+, this will close the modal/screen
        // }

        setShowPaymentModal(false);
        setTimeout(() => {
          router.replace('/(tabs)');
          setTimeout(() => {
            router.replace('/(tabs)/orders');
          }, 100);
        }, 100);
      })
      .catch((error: any) => {
        console.log('Razorpay error:', error);
        alert(`Error: ${error.code} | ${error.description}`);
      });

  };

  const retryPayment = async () => {
    setPaymentStatus('processing');
    setTimeout(async () => {
      if (selectedPaymentMethod === 'wallet' && user?.id) {
        try {
          await db.addWalletTransaction({
            userId: user.id,
            type: 'debit',
            amount: orderSummary.finalAmount,
            description: 'Subscription payment (retry)',
            referenceId: `sub-${Date.now()}`,
          });
          await updateUser({ walletBalance: Math.max(0, walletBalance - orderSummary.finalAmount) });
        } catch (e) {
          console.log('Wallet debit failed (retry)', e);
        }
      }

      // Save subscription on retry as well
      const startDate = new Date(subscriptionDetails.startDate);
      const endDate = computeEndDate(startDate, subscriptionDetails.plan.duration, subscriptionDetails.weekType);

      const subscription = {
        userId: user?.id || 'guest',
        mealId: subscriptionDetails.meal.id,
        planId: subscriptionDetails.plan.id,
        startDate: startDate,
        endDate: endDate,
        deliveryTime: subscriptionDetails.timeSlot.time,
        deliveryTimeSlot: subscriptionDetails.timeSlot.time,
        weekType: subscriptionDetails.weekType,
        excludeWeekends: subscriptionDetails.weekType === 'mon-sat' ? true : false,
        weekendExclusion: subscriptionDetails.weekType === 'mon-sat' ? 'sunday' : 'both' ,
        status: 'active' as const,
        totalAmount: orderSummary.finalAmount,
        paidAmount: orderSummary.finalAmount,
        remainingDeliveries: subscriptionDetails.plan.duration,
        totalDeliveries: subscriptionDetails.plan.duration,
        addressId: selectedAddress?.id || 'default',
        addOns: (subscriptionDetails.addOns ?? []).map((addon: any) => addon.id),
        additionalAddOns: {},
        specialInstructions: deliveryInstructions,
      };

      try {
        await db.createSubscription(subscription);
        console.log('Subscription created successfully on retry');
      } catch (error) {
        console.error('Error creating subscription on retry:', error);
      }

      setPaymentStatus('success');
      setTimeout(() => {
        setShowPaymentModal(false);
        router.push('/(tabs)');
      }, 2000);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Checkout',
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              if (canGoBack) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }} style={styles.backButton}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!subscriptionDetails ? (
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              {selectedAddress ? (
                <View style={styles.addressCard}>
                  <MapPin size={20} color="#FF6B35" />
                  <View style={styles.addressContent}>
                    <Text style={styles.addressName}>{selectedAddress.name}</Text>
                    <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
                    <Text style={styles.addressText}>
                      {selectedAddress.addressLine}
                    </Text>
                    <Text style={styles.addressSubtext}>
                      {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => setShowAddressBook(true)}
                  >
                    <Text style={styles.changeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addAddressCard}
                  onPress={() => setShowAddressBook(true)}
                >
                  <MapPin size={20} color="#FF6B35" />
                  <View style={styles.addressContent}>
                    <Text style={styles.addAddressText}>Add Delivery Address</Text>
                    <Text style={styles.addAddressSubtext}>
                      Please add an address to continue with your order
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{subscriptionDetails.meal?.name}</Text>
                  <Text style={styles.summaryValue}>₹{subscriptionDetails.meal?.price}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{orderSummary.planName} ({orderSummary.duration} days)</Text>
                  <Text style={styles.summaryValue}>₹{orderSummary.originalPrice}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Plan Discount</Text>
                  <Text style={styles.discountValue}>-₹{orderSummary.discount}</Text>
                </View>
                {subscriptionDetails.isTrialMode && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Trial Discount (50%)</Text>
                    <Text style={styles.discountValue}>-₹{orderSummary.trialDiscount}</Text>
                  </View>
                )}
                {(subscriptionDetails.addOns?.length ?? 0) > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Add-ons ({subscriptionDetails.addOns?.length ?? 0} items)</Text>
                    <Text style={styles.summaryValue}>₹{orderSummary.addOnTotal}</Text>
                  </View>
                )}
                {promoApplied && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Promo Discount ({appliedOffer?.promoCode ?? appliedOffer?.code ?? promoCode})</Text>
                    <Text style={styles.discountValue}>-₹{orderSummary.promoDiscount}</Text>
                  </View>
                )}
                {applyWallet && orderSummary.walletAppliedAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Wallet Used</Text>
                    <Text style={styles.discountValue}>-₹{orderSummary.walletAppliedAmount}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.freeText}>FREE</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₹{orderSummary.finalAmount}</Text>
                </View>
              </View>
            </View>


            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Promo Code</Text>
              <View style={styles.promoContainer}>
                <View style={styles.promoInputContainer}>
                  <Tag size={20} color="#666" />
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.applyButton, promoApplied && styles.appliedButton]}
                  onPress={handleApplyPromo}
                  disabled={promoApplied}
                >
                  {promoApplied ? (
                    <Check size={16} color="white" />
                  ) : (
                    <Text style={styles.applyButtonText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Referral Code</Text>
              <View style={styles.promoContainer}>
                <View style={styles.promoInputContainer}>
                  <Tag size={20} color="#666" />
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChangeText={setReferralCode}
                    autoCapitalize="characters"
                    testID="referral-input"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.applyButton, (referralApplied || referralApplying) && styles.appliedButton]}
                  onPress={handleApplyReferral}
                  disabled={referralApplied || referralApplying}
                  testID="referral-apply"
                >
                  {referralApplied ? (
                    <Check size={16} color="white" />
                  ) : referralApplying ? (
                    <Text style={styles.applyButtonText}>Applying...</Text>
                  ) : (
                    <Text style={styles.applyButtonText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#666', fontSize: 12, marginTop: 8 }}>Both you and your friend get ₹200 in wallet on successful referral.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Use Wallet</Text>
              <TouchableOpacity
                style={[styles.walletRow, applyWallet && styles.walletRowActive]}
                onPress={() => {
                  const next = !applyWallet;
                  setApplyWallet(next);
                  if (next) {
                    const saveAmt = Math.min(walletBalance, orderSummary.subtotalAfterPromo);
                    showToast(`Wallet applied. You saved ₹${saveAmt}.`);
                  }
                }}
                testID="wallet-apply"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: applyWallet }}
              >
                <View style={[styles.checkbox, applyWallet && styles.checkboxChecked]}>
                  {applyWallet && <Check size={16} color="#fff" />}
                </View>
                <View style={styles.walletContent}>
                  <Text style={styles.walletTitle}>Use wallet balance</Text>
                  <Text style={styles.walletSub}>Available: ₹{walletBalance}</Text>
                </View>
                {applyWallet && orderSummary.walletAppliedAmount > 0 && (
                  <Text style={styles.walletAppliedText}>-₹{orderSummary.walletAppliedAmount}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Payment methods removed: redirecting directly to Razorpay on pay */}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Instructions (Optional)</Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="e.g., Leave at the door, Ring the bell twice"
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.bottomSpacing} />
          </>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Payable: ₹{orderSummary.payableAmount}</Text>
          <Text style={styles.savingsText}>
            You save ₹{orderSummary.discount + orderSummary.promoDiscount + orderSummary.trialDiscount}
          </Text>
        </View>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderButtonText}>
            {isGuest ? 'Login & Place Order' : orderSummary.payableAmount === 0 ? 'Activate Now' : 'Pay Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            {paymentStatus === 'processing' && (
              <>
                <View style={styles.processingIcon}>
                  <Text style={styles.processingText}>💳</Text>
                </View>
                <Text style={styles.modalTitle}>Processing Payment</Text>
                <Text style={styles.modalSubtitle}>Please wait while we process your payment...</Text>
              </>
            )}

            {paymentStatus === 'success' && (
              <>
                <CheckCircle size={60} color="#10B981" />
                <Text style={styles.modalTitle}>Payment Successful!</Text>
                <Text style={styles.modalSubtitle}>
                  Your subscription has been activated. You will receive a confirmation on WhatsApp.
                </Text>
                {orderSummary.walletAppliedAmount > 0 && (
                  <Text style={[styles.modalSubtitle, { color: '#10B981', marginTop: 8 }]}>Wallet used: ₹{orderSummary.walletAppliedAmount}</Text>
                )}
                {promoApplied && (
                  <Text style={[styles.modalSubtitle, { color: '#10B981', marginTop: 4 }]}>Promo saved: ₹{orderSummary.promoDiscount}</Text>
                )}
              </>
            )}

            {paymentStatus === 'failed' && (
              <>
                <XCircle size={60} color="#EF4444" />
                <Text style={styles.modalTitle}>Payment Failed</Text>
                <Text style={styles.modalSubtitle}>
                  There was an issue processing your payment. Please try again.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={retryPayment}
                  >
                    <Text style={styles.retryButtonText}>Retry Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowPaymentModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [80, 0],
                  }),
                },
              ],
              opacity: toastAnim,
            },
          ]}
          testID="toast"
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      <AddressBookModal
        visible={showAddressBook}
        onClose={() => setShowAddressBook(false)}
        onSelectAddress={(address) => {
          setSelectedAddress(address);
          setShowAddressBook(false);
        }}
        showSelectMode={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressContent: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressSubtext: {
    fontSize: 14,
    color: '#666',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  changeButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#333',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  freeText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B35',
  },
  promoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  promoInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  promoInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedButton: {
    backgroundColor: '#10B981',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPaymentMethod: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7F5',
  },
  walletRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  walletRowActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7F5',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
  },
  walletContent: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  walletSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  walletAppliedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  paymentMethodContent: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentMethodSubtext: {
    fontSize: 14,
    color: '#666',
  },
  instructionsInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  savingsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  placeOrderButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    minWidth: 280,
  },
  processingIcon: {
    marginBottom: 16,
  },
  processingText: {
    fontSize: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addAddressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 4,
  },
  addAddressSubtext: {
    fontSize: 14,
    color: '#666',
  },
  weekendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekendChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  weekendChipActive: {
    backgroundColor: '#FF6B35',
  },
  weekendChipText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  weekendChipTextActive: {
    color: 'white',
  },
  weekendHelp: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
});