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
import { Address } from '@/types';
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
  const [weekendExclusion, setWeekendExclusion] = useState<'none' | 'saturday' | 'sunday' | 'both'>('none');

  React.useEffect(() => {
    setCanGoBack(routerInstance.canGoBack());
  }, []);

  useEffect(() => {
    if (subscriptionData && typeof subscriptionData === 'string') {
      try {
        const parsedData = JSON.parse(subscriptionData);
        setSubscriptionDetails(parsedData);
        const initialExclusion: 'none' | 'saturday' | 'sunday' | 'both' = (parsedData.weekendExclusion as 'none' | 'saturday' | 'sunday' | 'both' | undefined)
          ?? (parsedData.excludeWeekends ? 'both' : 'none');
        setWeekendExclusion(initialExclusion);
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
    const promoDiscount: number = promoApplied ? 150 : 0;
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
  }, [subscriptionDetails, promoApplied, applyWallet, walletBalance]);

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

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'first100' || promoCode.toLowerCase() === 'weekend20') {
      setPromoApplied(true);
      showToast(`Promo applied. You saved ₹${150}.`);
    } else {
      Alert.alert('Invalid Code', 'Please enter a valid promo code.');
    }
  };

  const computeEndDate = (
    start: Date,
    durationDays: number,
    exclusion: 'none' | 'saturday' | 'sunday' | 'both'
  ): Date => {
    const end = new Date(start);
    let served = 0;
    while (served < durationDays) {
      const day = end.getDay();
      const isSat = day === 6;
      const isSun = day === 0;
      const excluded = exclusion === 'both' || (exclusion === 'saturday' && isSat) || (exclusion === 'sunday' && isSun);
      if (!excluded) {
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
        
        // Save subscription to database
        const startDate = new Date(subscriptionDetails.startDate);
        const endDate = computeEndDate(startDate, subscriptionDetails.plan.duration, weekendExclusion);

        const subscription = {
          userId: user?.id || 'guest',
          mealId: subscriptionDetails.meal.id,
          planId: subscriptionDetails.plan.id,
          startDate: startDate,
          endDate: endDate,
          deliveryTime: subscriptionDetails.timeSlot.time,
          deliveryTimeSlot: subscriptionDetails.timeSlot.time,
          weekendExclusion: weekendExclusion,
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
          console.log('Subscription created successfully');
        } catch (error) {
          console.error('Error creating subscription:', error);
        }
        
        setTimeout(() => {
          setShowPaymentModal(false);
          router.push('/(tabs)');
        }, 2000);
        setPaymentStatus('success');
        setTimeout(() => {
          setShowPaymentModal(false);
          router.push('/(tabs)');
        }, 2000);
      }, 1500);
      return;
    }

    // Non-zero payment: create Razorpay order then open checkout bridge
    const description = 'Credits towards consultation';
    const payload = {
      amount: Math.round(orderSummary.payableAmount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { description },
    };
    const orderResp = await fetch('http://localhost:5000/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

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
      name: 'Acme Corp',
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
      .then((data: { razorpay_payment_id: string }) => {
        alert(`Success: ${data.razorpay_payment_id}`);
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
      const endDate = computeEndDate(startDate, subscriptionDetails.plan.duration, weekendExclusion);

      const subscription = {
        userId: user?.id || 'guest',
        mealId: subscriptionDetails.meal.id,
        planId: subscriptionDetails.plan.id,
        startDate: startDate,
        endDate: endDate,
        deliveryTime: subscriptionDetails.timeSlot.time,
        deliveryTimeSlot: subscriptionDetails.timeSlot.time,
        weekendExclusion,
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
                    <Text style={styles.summaryLabel}>Promo Discount ({promoCode})</Text>
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
              <Text style={styles.sectionTitle}>Weekend Exclusions</Text>
              <View style={styles.weekendRow}>
                <TouchableOpacity
                  testID="weekend-saturday"
                  accessibilityRole="button"
                  accessibilityState={{ selected: weekendExclusion === 'saturday' }}
                  style={[styles.weekendChip, weekendExclusion === 'saturday' && styles.weekendChipActive]}
                  onPress={() => setWeekendExclusion('saturday')}
                >
                  <Text style={[styles.weekendChipText, weekendExclusion === 'saturday' && styles.weekendChipTextActive]}>Saturdays</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="weekend-sunday"
                  accessibilityRole="button"
                  accessibilityState={{ selected: weekendExclusion === 'sunday' }}
                  style={[styles.weekendChip, weekendExclusion === 'sunday' && styles.weekendChipActive]}
                  onPress={() => setWeekendExclusion('sunday')}
                >
                  <Text style={[styles.weekendChipText, weekendExclusion === 'sunday' && styles.weekendChipTextActive]}>Sundays</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="weekend-both"
                  accessibilityRole="button"
                  accessibilityState={{ selected: weekendExclusion === 'both' }}
                  style={[styles.weekendChip, weekendExclusion === 'both' && styles.weekendChipActive]}
                  onPress={() => setWeekendExclusion('both')}
                >
                  <Text style={[styles.weekendChipText, weekendExclusion === 'both' && styles.weekendChipTextActive]}>Both</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="weekend-none"
                  accessibilityRole="button"
                  accessibilityState={{ selected: weekendExclusion === 'none' }}
                  style={[styles.weekendChip, weekendExclusion === 'none' && styles.weekendChipActive]}
                  onPress={() => setWeekendExclusion('none')}
                >
                  <Text style={[styles.weekendChipText, weekendExclusion === 'none' && styles.weekendChipTextActive]}>None</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.weekendHelp}>Choose which weekend days to skip deliveries for this subscription.</Text>
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