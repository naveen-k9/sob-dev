import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { 
  ShoppingBag, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Truck,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  X,
  CalendarDays,
  Sparkles,
  Package,
  ChefHat,
  Navigation,
  Phone,
  Eye,
  Filter,
  ArrowRight
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { getUserSubscriptions, featuredMeals, addOns } from '@/constants/data';
import { Subscription, Meal, AddOn, AppSettings, Order } from '@/types';
import db from '@/db';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasDelivery: boolean;
  deliveryStatus: 'delivered' | 'upcoming' | 'vacation' | 'on_hold' | 'skipped';
  subscription?: Subscription;
  canModify: boolean;
}

interface DeliveryDetails {
  id: string;
  mealName: string;
  mealImage?: string;
  addOns: string[];
  deliveryTime: string;
  status: 'preparing' | 'out_for_delivery' | 'delivered' | 'scheduled' | 'cooking_started' | 'cooking_done' | 'ready_for_delivery' | 'packaging_done' | 'delivery_started' | 'reached' | 'delivery_done';
  estimatedTime?: string;
  deliveryPerson?: string;
  phone?: string;
  subscription?: Subscription;
  canSkip?: boolean;
  canAddItems?: boolean;
  kitchenStaff?: string;
  orderDate: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
}

interface TodayOrder {
  id: string;
  subscriptionId: string;
  customerName: string;
  customerPhone: string;
  mealName: string;
  mealImage?: string;
  addOns: string[];
  deliveryTime: string;
  status: 'cooking_started' | 'cooking_done' | 'ready_for_delivery' | 'packaging_done' | 'delivery_started' | 'reached' | 'delivery_done';
  kitchenStaff?: string;
  deliveryPerson?: string;
  address?: string;
  estimatedTime?: string;
  orderDate: string;
}

export default function OrdersScreen() {
  const { user, isGuest } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedDateDelivery, setSelectedDateDelivery] = useState<DeliveryDetails | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [todayOrders, setTodayOrders] = useState<TodayOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'today'>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed' | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'wallet'>('upi');

  const handleLoginPrompt = () => {
    router.push('/auth/login');
  };

  useEffect(() => {
    if (user) {
      loadUserSubscriptions();
      loadAppSettings();
      loadAvailableAddOns();
      loadTodayOrders();
    }
  }, [user]);
  
  // Force reload app settings on component mount
  useEffect(() => {
    loadAppSettings();
  }, []);

  useEffect(() => {
    if (user && userSubscriptions.length > 0) {
      if (!selectedPlanId && userSubscriptions.length > 0) {
        setSelectedPlanId(userSubscriptions[0].id);
      }
      generateCalendarDays();
      loadSelectedDateDelivery();
    }
  }, [user, currentDate, userSubscriptions, selectedDate, selectedPlanId]);

  // Debug logging
  useEffect(() => {
    console.log('=== DEBUG INFO ===');
    console.log('selectedDateDelivery:', selectedDateDelivery);
    console.log('selectedDate:', selectedDate.toDateString());
    console.log('appSettings:', appSettings);
    console.log('userSubscriptions:', userSubscriptions.length);
    if (selectedDateDelivery) {
      console.log('canSkip:', selectedDateDelivery.canSkip);
      console.log('canAddItems:', selectedDateDelivery.canAddItems);
    }
    console.log('==================');
  }, [selectedDateDelivery, selectedDate, appSettings, userSubscriptions]);

  const loadUserSubscriptions = async () => {
    if (user) {
      try {
        const subs = await db.getUserSubscriptions(user.id);
        setUserSubscriptions(subs);
      } catch (error) {
        console.error('Error loading user subscriptions:', error);
      }
    }
  };

  const resolveWeekendExclusion = (sub: Subscription): string => {
    const fromNew = sub.weekendExclusion ?? null;
    if (fromNew) return fromNew;
    if (sub.excludeWeekends === true) return 'both';
    return 'none';
  };

  const isWeekendExcludedForDate = (date: Date, sub: Subscription): boolean => {
    const day = date.getDay();
    const setting = resolveWeekendExclusion(sub);
    if (setting === 'both') return day === 0 || day === 6;
    if (setting === 'saturday') return day === 6;
    if (setting === 'sunday') return day === 0;
    return false;
  };

  const weekendExclusionLabel = (sub: Subscription): string | null => {
    const setting = resolveWeekendExclusion(sub);
    if (setting === 'both') return '• Weekends excluded';
    if (setting === 'saturday') return '• Saturdays excluded';
    if (setting === 'sunday') return '• Sundays excluded';
    return null;
  };

  const loadAppSettings = async () => {
    try {
      console.log('Loading app settings...');
      const settings = await db.getAppSettings();
      console.log('App settings loaded in orders screen:', settings);
      setAppSettings(settings);
      
      // Force re-initialize database if settings are missing
      if (!settings || !settings.skipCutoffTime || !settings.addOnCutoffTime) {
        console.log('App settings incomplete, reinitializing database...');
        await db.initialize();
        const newSettings = await db.getAppSettings();
        console.log('New app settings after reinitialization:', newSettings);
        setAppSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
  };

  const loadAvailableAddOns = async () => {
    try {
      const addOnsData = await db.getAddOns();
      setAvailableAddOns(addOnsData.filter(addOn => addOn.isActive));
    } catch (error) {
      console.error('Error loading add-ons:', error);
    }
  };

  const loadTodayOrders = async () => {
    try {
      const subscriptions = await db.getAllSubscriptions();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      
      const orders: TodayOrder[] = [];
      
      for (const subscription of subscriptions) {
        if (subscription.status !== 'active') continue;
        
        const subStart = new Date(subscription.startDate);
        const subEnd = new Date(subscription.endDate);
        subStart.setHours(0, 0, 0, 0);
        subEnd.setHours(0, 0, 0, 0);
        
        // Check if today is within subscription period
        if (today >= subStart && today <= subEnd) {
          const isSkipped = subscription.skippedDates?.includes(todayString) || false;
          
          if (isWeekendExcludedForDate(today, subscription)) continue;
          if (isSkipped) continue;
          
          // Get meal details
          const meal = featuredMeals.find(m => m.id === subscription.mealId);
          if (!meal) continue;
          
          // Get add-ons
          const subscriptionAddOns = subscription.addOns || [];
          const additionalAddOnsForDate = subscription.additionalAddOns?.[todayString] || [];
          const allAddOnIds = [...subscriptionAddOns, ...additionalAddOnsForDate];
          const addOnNames = allAddOnIds.map(addOnId => {
            const addOn = addOns.find(a => a.id === addOnId);
            return addOn ? addOn.name : '';
          }).filter(Boolean);
          
          // Determine status based on time and random assignment for demo
          const currentHour = new Date().getHours();
          let status: TodayOrder['status'] = 'cooking_started';
          
          if (currentHour >= 11) status = 'cooking_done';
          if (currentHour >= 12) status = 'ready_for_delivery';
          if (currentHour >= 13) status = 'delivery_started';
          if (currentHour >= 14) status = 'delivery_done';
          
          const order: TodayOrder = {
            id: `order-${subscription.id}-${todayString}`,
            subscriptionId: subscription.id,
            customerName: subscription.customerName || 'Customer',
            customerPhone: subscription.phone || '+91 98765 43210',
            mealName: meal.name,
            mealImage: meal.images[0],
            addOns: addOnNames,
            deliveryTime: subscription.deliveryTimeSlot || subscription.deliveryTime || '12:00 PM - 1:00 PM',
            status,
            kitchenStaff: subscription.assignedKitchenId ? 'Chef Ramesh' : undefined,
            deliveryPerson: subscription.assignedDeliveryId ? 'Ravi Kumar' : undefined,
            address: 'Koramangala, Bangalore',
            estimatedTime: '12:30 PM',
            orderDate: todayString,
          };
          
          orders.push(order);
        }
      }
      
      setTodayOrders(orders);
    } catch (error) {
      console.error('Error loading today orders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserSubscriptions(),
      loadTodayOrders(),
      loadAppSettings()
    ]);
    setRefreshing(false);
  };

  const loadSelectedDateDelivery = () => {
    if (!selectedPlanId) {
      setSelectedDateDelivery(null);
      return;
    }
    
    const selectedSubscription = userSubscriptions.find(sub => sub.id === selectedPlanId);
    if (!selectedSubscription) {
      setSelectedDateDelivery(null);
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateCopy = new Date(selectedDate);
    selectedDateCopy.setHours(0, 0, 0, 0);
    
    const isToday = selectedDateCopy.getTime() === today.getTime();
    const isPast = selectedDateCopy < today;
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Check if this date should have a delivery for the selected subscription
    const subStart = new Date(selectedSubscription.startDate);
    const subEnd = new Date(selectedSubscription.endDate);
    subStart.setHours(0, 0, 0, 0);
    subEnd.setHours(0, 0, 0, 0);
    
    const isInSubscriptionPeriod = selectedDateCopy >= subStart && selectedDateCopy <= subEnd;
    const isWeekendExcluded = isWeekendExcludedForDate(selectedDateCopy, selectedSubscription);
    const isSkipped = selectedSubscription.skippedDates?.includes(dateString) || false;
    
    if (!isInSubscriptionPeriod || isWeekendExcluded) {
      setSelectedDateDelivery(null);
      return;
    }
    
    if (isSkipped) {
      setSelectedDateDelivery({
        id: selectedSubscription.id,
        mealName: 'Meal Skipped',
        addOns: [],
        deliveryTime: 'Skipped',
        status: 'scheduled',
        subscription: selectedSubscription,
        canSkip: false,
        canAddItems: false,
        orderDate: dateString
      });
      return;
    }
    
    // Check if this date is an active plan date (should have delivery)
    const isActivePlanDateResult = isActivePlanDate(selectedDateCopy, selectedSubscription);
    if (!isActivePlanDateResult) {
      setSelectedDateDelivery(null);
      return;
    }
    
    // Find the meal details
    const meal = featuredMeals.find(m => m.id === selectedSubscription.mealId);
    
    // Get base add-ons details
    const subscriptionAddOns = selectedSubscription.addOns || [];
    
    // Get additional add-ons for this specific date
    const additionalAddOnsForDate = selectedSubscription.additionalAddOns?.[dateString] || [];
    
    // Combine all add-ons
    const allAddOnIds = [...subscriptionAddOns, ...additionalAddOnsForDate];
    const addOnNames = allAddOnIds.map(addOnId => {
      const addOn = addOns.find(a => a.id === addOnId);
      return addOn ? addOn.name : '';
    }).filter(Boolean);
    
    let status: DeliveryDetails['status'] = 'scheduled';
    let deliveryPerson = '';
    let phone = '';
    let estimatedTime = '';
    
    if (isPast) {
      status = 'delivered';
    } else if (isToday) {
      status = 'out_for_delivery';
      deliveryPerson = 'Raj Kumar';
      phone = '+91 98765 43210';
      estimatedTime = '12:30 PM';
    }
    
    const deliveryDetails: DeliveryDetails = {
      id: selectedSubscription.id,
      mealName: meal?.name || 'Meal',
      mealImage: meal?.images[0],
      addOns: addOnNames,
      deliveryTime: selectedSubscription.deliveryTimeSlot || selectedSubscription.deliveryTime || '12:00 PM - 1:00 PM',
      status,
      estimatedTime,
      deliveryPerson,
      phone,
      subscription: selectedSubscription,
      canSkip: checkCanSkip(selectedDate),
      canAddItems: checkCanAddItems(selectedDate),
      orderDate: dateString
    };
    
    setSelectedDateDelivery(deliveryDetails);
  };

  const generateCalendarDays = () => {
    if (!selectedPlanId) return;
    
    const selectedSubscription = userSubscriptions.find(sub => sub.id === selectedPlanId);
    if (!selectedSubscription) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate delivery dates based on subscription start date and weekend exclusions
    const subStart = new Date(selectedSubscription.startDate);
    const subEnd = new Date(selectedSubscription.endDate);
    subStart.setHours(0, 0, 0, 0);
    subEnd.setHours(0, 0, 0, 0);
    
    const deliveryDates = new Set<string>();
    let currentDeliveryDate = new Date(subStart);
    let deliveredCount = 0;
    const totalDeliveries = selectedSubscription.duration || selectedSubscription.totalDeliveries || 0;
    
    // Generate all delivery dates for this subscription
    while (currentDeliveryDate <= subEnd && deliveredCount < totalDeliveries) {
      const dateString = currentDeliveryDate.toISOString().split('T')[0];
      const isSkipped = selectedSubscription.skippedDates?.includes(dateString) || false;
      
      if (isWeekendExcludedForDate(currentDeliveryDate, selectedSubscription)) {
        currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
        continue;
      }
      
      if (!isSkipped) {
        deliveryDates.add(dateString);
        deliveredCount++;
      } else {
        const extendedEndDate = new Date(subEnd);
        extendedEndDate.setDate(extendedEndDate.getDate() + 1);
        
        while (isWeekendExcludedForDate(extendedEndDate, selectedSubscription)) {
          extendedEndDate.setDate(extendedEndDate.getDate() + 1);
        }
        
        subEnd.setTime(extendedEndDate.getTime());
      }
      
      currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
    }
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const isCurrentMonth = date.getMonth() === month;
      const dateString = date.toISOString().split('T')[0];
      
      const hasDelivery = deliveryDates.has(dateString);
      const isSkipped = selectedSubscription.skippedDates?.includes(dateString) || false;
      
      let deliveryStatus: CalendarDay['deliveryStatus'] = 'upcoming';
      
      if (isSkipped) {
        deliveryStatus = 'skipped';
      } else if (date < today && hasDelivery) {
        deliveryStatus = 'delivered';
      } else if (isWeekendExcludedForDate(date, selectedSubscription)) {
        deliveryStatus = 'vacation';
      } else if (hasDelivery) {
        deliveryStatus = 'upcoming';
      }
      
      const canModify = date > today && hasDelivery && !isSkipped;
      
      days.push({
        date,
        isCurrentMonth,
        hasDelivery,
        deliveryStatus,
        subscription: hasDelivery ? selectedSubscription : undefined,
        canModify
      });
    }
    
    setCalendarDays(days);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const getCalendarStatusColor = (status: CalendarDay['deliveryStatus']) => {
    switch (status) {
      case 'delivered': return '#10B981';
      case 'upcoming': return '#48479B';
      case 'vacation': return '#F59E0B';
      case 'on_hold': return '#EF4444';
      case 'skipped': return '#6B7280';
      default: return '#E5E7EB';
    }
  };

  const checkCanSkip = (date: Date): boolean => {
    console.log('checkCanSkip called for date:', date.toDateString());
    console.log('appSettings:', appSettings);
    
    if (!appSettings?.skipCutoffTime) {
      console.log('No app settings or skip cutoff time');
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const isToday = checkDate.getTime() === today.getTime();
    const isFuture = checkDate > today;
    
    console.log('Date comparison - isToday:', isToday, 'isFuture:', isFuture);
    console.log('Skip cutoff time from settings:', appSettings.skipCutoffTime);
    
    if (isFuture) {
      console.log('Future date - can skip');
      return true;
    }
    
    if (isToday) {
      try {
        const cutoffTimeStr = appSettings.skipCutoffTime.toString();
        const [cutoffHour, cutoffMinute] = cutoffTimeStr.split(':').map(Number);
        
        if (isNaN(cutoffHour) || isNaN(cutoffMinute)) {
          console.error('Invalid cutoff time format:', cutoffTimeStr);
          return false;
        }
        
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);
        const currentTime = new Date();
        
        console.log('Cutoff time:', cutoffTime.toTimeString());
        console.log('Current time:', currentTime.toTimeString());
        console.log('Can skip today:', currentTime < cutoffTime);
        
        return currentTime < cutoffTime;
      } catch (error) {
        console.error('Error parsing skip cutoff time:', error);
        return false;
      }
    }
    
    console.log('Past date - cannot skip');
    return false;
  };

  const checkCanAddItems = (date: Date): boolean => {
    console.log('checkCanAddItems called for date:', date.toDateString());
    
    if (!appSettings?.addOnCutoffTime) {
      console.log('No app settings or addon cutoff time');
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const isToday = checkDate.getTime() === today.getTime();
    const isFuture = checkDate > today;
    
    console.log('Date comparison - isToday:', isToday, 'isFuture:', isFuture);
    console.log('AddOn cutoff time from settings:', appSettings.addOnCutoffTime);
    
    if (isFuture) {
      console.log('Future date - can add items');
      return true;
    }
    
    if (isToday) {
      try {
        const cutoffTimeStr = appSettings.addOnCutoffTime.toString();
        const [cutoffHour, cutoffMinute] = cutoffTimeStr.split(':').map(Number);
        
        if (isNaN(cutoffHour) || isNaN(cutoffMinute)) {
          console.error('Invalid addon cutoff time format:', cutoffTimeStr);
          return false;
        }
        
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);
        const currentTime = new Date();
        
        console.log('Addon cutoff time:', cutoffTime.toTimeString());
        console.log('Current time:', currentTime.toTimeString());
        console.log('Can add items today:', currentTime < cutoffTime);
        
        return currentTime < cutoffTime;
      } catch (error) {
        console.error('Error parsing add-on cutoff time:', error);
        return false;
      }
    }
    
    console.log('Past date - cannot add items');
    return false;
  };

  const handleSkipMeal = async () => {
    if (!selectedDateDelivery?.subscription) return;
    
    const dateStr = selectedDate.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    });
    
    Alert.alert(
      'Skip Meal',
      `Are you sure you want to skip the meal for ${dateStr}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: async () => {
          try {
            const dateString = selectedDate.toISOString().split('T')[0];
            await db.skipMealForDate(selectedDateDelivery.subscription!.id, dateString);
            
            // Update the calendar to reflect the skip
            await loadUserSubscriptions();
            loadSelectedDateDelivery();
            
            Alert.alert('Success', 'Meal skipped successfully');
          } catch (error) {
            console.error('Error skipping meal:', error);
            Alert.alert('Error', 'Failed to skip meal. Please try again.');
          }
        }}
      ]
    );
  };

  const handleAddMeal = () => {
    setSelectedAddOns([]);
    setShowAddOnModal(true);
  };

  const getSelectedAddOnsTotal = (): number => {
    return selectedAddOns.reduce((total, addOnId) => {
      const addOn = availableAddOns.find(a => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
  };

  const handleAddOnSelection = (addOnId: string) => {
    setSelectedAddOns(prev => {
      if (prev.includes(addOnId)) {
        return prev.filter(id => id !== addOnId);
      } else {
        return [...prev, addOnId];
      }
    });
  };

  const handleConfirmAddOns = async () => {
    if (!selectedDateDelivery?.subscription || selectedAddOns.length === 0) {
      Alert.alert('Error', 'Please select at least one add-on');
      return;
    }
    setShowPaymentModal(true);
    setPaymentStatus('processing');
    setTimeout(async () => {
      const success = Math.random() > 0.1;
      if (!user?.id) {
        setPaymentStatus('failed');
        return;
      }
      if (success) {
        try {
          const dateString = selectedDate.toISOString().split('T')[0];
          await db.purchaseAddOnsForDate(selectedDateDelivery!.subscription!.id, dateString, selectedAddOns, user.id);
          await loadUserSubscriptions();
          loadSelectedDateDelivery();
          setPaymentStatus('success');
          setTimeout(() => {
            setShowPaymentModal(false);
            setShowAddOnModal(false);
            setSelectedAddOns([]);
          }, 1500);
        } catch (error) {
          console.error('Error purchasing add-ons:', error);
          setPaymentStatus('failed');
        }
      } else {
        setPaymentStatus('failed');
      }
    }, 2000);
  };

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const isSelected = selectedDate.toDateString() === day.date.toDateString();
    const isToday = new Date().toDateString() === day.date.toDateString();
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          !day.isCurrentMonth && styles.calendarDayInactive,
          isSelected && styles.calendarDaySelected,
          isToday && styles.calendarDayToday,
          day.hasDelivery && styles.calendarDayWithDelivery
        ]}
        onPress={() => selectDate(day.date)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.calendarDayText,
          !day.isCurrentMonth && styles.calendarDayTextInactive,
          isSelected && styles.calendarDayTextSelected,
          isToday && styles.calendarDayTextToday
        ]}>
          {day.date.getDate()}
        </Text>
        {(day.hasDelivery || day.deliveryStatus === 'skipped' || day.deliveryStatus === 'vacation' || day.deliveryStatus === 'on_hold') && (
          <View
            style={[
              styles.deliveryIndicator,
              { backgroundColor: getCalendarStatusColor(day.deliveryStatus) }
            ]}
            testID={`indicator-${day.date.toISOString().split('T')[0]}`}
          />
        )}
        {isToday && !isSelected && (
          <View style={styles.todayIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  // Helper function to check if a date is an active plan date
  const isActivePlanDate = (date: Date, subscription: Subscription): boolean => {
    const subStart = new Date(subscription.startDate);
    const subEnd = new Date(subscription.endDate);
    subStart.setHours(0, 0, 0, 0);
    subEnd.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Must be within subscription period
    if (checkDate < subStart || checkDate > subEnd) {
      return false;
    }
    
    // Respect weekend exclusion settings
    if (isWeekendExcludedForDate(checkDate, subscription)) {
      return false;
    }
    
    // Calculate if this date should have a delivery based on the plan
    let currentDeliveryDate = new Date(subStart);
    let deliveredCount = 0;
    const totalDeliveries = subscription.duration || subscription.totalDeliveries || 0;
    
    while (currentDeliveryDate <= subEnd && deliveredCount < totalDeliveries) {
      const currentDateString = currentDeliveryDate.toISOString().split('T')[0];
      const currentIsSkipped = subscription.skippedDates?.includes(currentDateString) || false;
      
      if (isWeekendExcludedForDate(currentDeliveryDate, subscription)) {
        currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
        continue;
      }
      
      // If this date matches our check date and it's not skipped, it's an active date
      if (currentDeliveryDate.getTime() === checkDate.getTime() && !currentIsSkipped) {
        return true;
      }
      
      // Count non-skipped dates
      if (!currentIsSkipped) {
        deliveredCount++;
      }
      
      currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
    }
    
    return false;
  };

  const renderSelectedDateDelivery = () => {
    if (!selectedDateDelivery) {
      const selectedSubscription = userSubscriptions.find(sub => sub.id === selectedPlanId);
      const canAddProducts = selectedSubscription && 
                            selectedDate >= new Date() && 
                            isActivePlanDate(selectedDate, selectedSubscription);
      
      return (
        <View style={styles.noDeliveryContainer}>
          <Text style={styles.noDeliveryText}>No orders scheduled for this day</Text>
          {canAddProducts && (
            <TouchableOpacity style={styles.addProductButton} onPress={handleAddMeal}>
              <Text style={styles.addProductButtonText}>Add Products</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.deliveryContainer}>
        <View style={styles.deliveryHeader}>
          <View style={styles.mealInfo}>
            {selectedDateDelivery.mealImage && (
              <View style={styles.mealImageContainer}>
                <Text style={styles.mealImagePlaceholder}>🍽️</Text>
              </View>
            )}
            <View style={styles.mealDetails}>
              <Text style={styles.deliveryTitle}>{selectedDateDelivery.mealName}</Text>
              <Text style={styles.deliveryTime}>{selectedDateDelivery.deliveryTime}</Text>
            </View>
          </View>
          <View style={styles.deliveryStatus}>
            {selectedDateDelivery.status === 'delivered' && <CheckCircle size={20} color="#10B981" />}
            {selectedDateDelivery.status === 'out_for_delivery' && <Truck size={20} color="#48479B" />}
            {selectedDateDelivery.status === 'preparing' && <Clock size={20} color="#F59E0B" />}
            {selectedDateDelivery.status === 'scheduled' && <Calendar size={20} color="#6B7280" />}
            <Text style={styles.deliveryStatusText}>
              {selectedDateDelivery.status === 'delivered' && 'Delivered'}
              {selectedDateDelivery.status === 'out_for_delivery' && 'Out for Delivery'}
              {selectedDateDelivery.status === 'preparing' && 'Preparing'}
              {selectedDateDelivery.status === 'scheduled' && 'Scheduled'}
            </Text>
          </View>
        </View>
        
        {selectedDateDelivery.addOns.length > 0 && (
          <View style={styles.addOnsContainer}>
            <Text style={styles.addOnsTitle}>Add-ons:</Text>
            <Text style={styles.addOnsText}>{selectedDateDelivery.addOns.join(', ')}</Text>
          </View>
        )}
        
        {selectedDateDelivery.status === 'out_for_delivery' && selectedDateDelivery.deliveryPerson && (
          <View style={styles.trackingContainer}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.trackingText}>
              {selectedDateDelivery.deliveryPerson} • ETA: {selectedDateDelivery.estimatedTime}
            </Text>
          </View>
        )}
        
        {selectedDateDelivery.subscription && (
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionTitle}>Subscription Details</Text>
            <Text style={styles.subscriptionText}>
              Plan: {selectedDateDelivery.subscription.planName || 'Custom Plan'}
            </Text>
            <Text style={styles.subscriptionText}>
              Duration: {selectedDateDelivery.subscription.duration} days
            </Text>
            {weekendExclusionLabel(selectedDateDelivery.subscription) && (
              <Text style={styles.subscriptionText}>{weekendExclusionLabel(selectedDateDelivery.subscription)}</Text>
            )}
          </View>
        )}
        
        {/* Cutoff Time Information */}
        {appSettings && (selectedDateDelivery.canSkip || selectedDateDelivery.canAddItems) && (
          <View style={styles.cutoffInfo}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.cutoffText}>
              {selectedDateDelivery.canSkip && appSettings.skipCutoffTime && `Skip until ${appSettings.skipCutoffTime}`}
              {selectedDateDelivery.canSkip && selectedDateDelivery.canAddItems && ' • '}
              {selectedDateDelivery.canAddItems && appSettings.addOnCutoffTime && `Add items until ${appSettings.addOnCutoffTime}`}
            </Text>
          </View>
        )}
        
        {/* Action Buttons - Always show for future dates and today within cutoff */}
        {(selectedDateDelivery.canSkip || selectedDateDelivery.canAddItems) && (
          <View style={styles.deliveryActions}>
            {selectedDateDelivery.canSkip && (
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={handleSkipMeal}
                testID="skip-meal-button"
              >
                <XCircle size={16} color="#EF4444" />
                <Text style={styles.skipButtonText}>Skip Meal</Text>
              </TouchableOpacity>
            )}
            
            {selectedDateDelivery.canAddItems && (
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddMeal}
                testID="add-items-button"
              >
                <Plus size={16} color="#48479B" />
                <Text style={styles.addButtonText}>Add Items</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Debug Info - Remove in production */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Debug Info:</Text>
            <Text style={styles.debugText}>canSkip: {selectedDateDelivery.canSkip ? 'true' : 'false'}</Text>
            <Text style={styles.debugText}>canAddItems: {selectedDateDelivery.canAddItems ? 'true' : 'false'}</Text>
            <Text style={styles.debugText}>Current Time: {new Date().toTimeString()}</Text>
            <Text style={styles.debugText}>Skip Cutoff: {appSettings?.skipCutoffTime || 'N/A'}</Text>
            <Text style={styles.debugText}>AddOn Cutoff: {appSettings?.addOnCutoffTime || 'N/A'}</Text>
          </View>
        )}
      </View>
    );
  };

  const getTodayOrderStatusColor = (status: TodayOrder['status']) => {
    switch (status) {
      case 'cooking_started': return '#F59E0B';
      case 'cooking_done': return '#10B981';
      case 'ready_for_delivery': return '#48479B';
      case 'packaging_done': return '#8B5CF6';
      case 'delivery_started': return '#06B6D4';
      case 'reached': return '#84CC16';
      case 'delivery_done': return '#22C55E';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: TodayOrder['status']) => {
    switch (status) {
      case 'cooking_started': return <ChefHat size={16} color={getTodayOrderStatusColor(status)} />;
      case 'cooking_done': return <CheckCircle size={16} color={getTodayOrderStatusColor(status)} />;
      case 'ready_for_delivery': return <Package size={16} color={getTodayOrderStatusColor(status)} />;
      case 'packaging_done': return <Package size={16} color={getTodayOrderStatusColor(status)} />;
      case 'delivery_started': return <Truck size={16} color={getTodayOrderStatusColor(status)} />;
      case 'reached': return <Navigation size={16} color={getTodayOrderStatusColor(status)} />;
      case 'delivery_done': return <CheckCircle size={16} color={getTodayOrderStatusColor(status)} />;
      default: return <Clock size={16} color={getTodayOrderStatusColor(status)} />;
    }
  };

  const getStatusText = (status: TodayOrder['status']) => {
    switch (status) {
      case 'cooking_started': return 'Cooking Started';
      case 'cooking_done': return 'Cooking Done';
      case 'ready_for_delivery': return 'Ready for Delivery';
      case 'packaging_done': return 'Packaging Done';
      case 'delivery_started': return 'Delivery Started';
      case 'reached': return 'Reached';
      case 'delivery_done': return 'Delivered';
      default: return 'Scheduled';
    }
  };

  const filteredTodayOrders = todayOrders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <ShoppingBag size={64} color="#DDD" />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyDescription}>
            {isGuest 
              ? 'Sign in to view your order history and track deliveries'
              : 'Start ordering delicious meals to see them here'
            }
          </Text>
          {isGuest && (
            <TouchableOpacity style={styles.loginButton} onPress={handleLoginPrompt}>
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const renderTodayOrderCard = ({ item }: { item: TodayOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderCustomerName}>{item.customerName}</Text>
          <Text style={styles.orderPhone}>{item.customerPhone}</Text>
        </View>
        <View style={styles.orderStatus}>
          {getStatusIcon(item.status)}
          <Text style={[styles.orderStatusText, { color: getTodayOrderStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderMealInfo}>
        <View style={styles.mealImageContainer}>
          <Text style={styles.mealImagePlaceholder}>🍽️</Text>
        </View>
        <View style={styles.mealDetails}>
          <Text style={styles.orderMealName}>{item.mealName}</Text>
          <Text style={styles.orderDeliveryTime}>{item.deliveryTime}</Text>
          {item.addOns.length > 0 && (
            <Text style={styles.orderAddOns}>Add-ons: {item.addOns.join(', ')}</Text>
          )}
        </View>
      </View>
      
      {item.address && (
        <View style={styles.orderAddress}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.orderAddressText}>{item.address}</Text>
        </View>
      )}
      
      {(item.kitchenStaff || item.deliveryPerson) && (
        <View style={styles.orderStaff}>
          {item.kitchenStaff && (
            <View style={styles.staffInfo}>
              <ChefHat size={14} color="#6B7280" />
              <Text style={styles.staffText}>Kitchen: {item.kitchenStaff}</Text>
            </View>
          )}
          {item.deliveryPerson && (
            <View style={styles.staffInfo}>
              <Truck size={14} color="#6B7280" />
              <Text style={styles.staffText}>Delivery: {item.deliveryPerson}</Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.orderActions}>
        <TouchableOpacity style={styles.trackButton}>
          <Eye size={16} color="#48479B" />
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton}>
          <Phone size={16} color="#10B981" />
          <Text style={styles.callButtonText}>Call Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      > 
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <CalendarDays size={28} color="white" />
              <Text style={styles.headerTitle}>
                {viewMode === 'today' ? "Today's Orders" : 'My Meal Plans'}
              </Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {viewMode === 'today' 
                ? `${filteredTodayOrders.length} orders for ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}`
                : 'Manage your subscription calendars'
              }
            </Text>
          </View>
        </View>
        
        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'today' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('today')}
            >
              <Text style={[styles.viewModeButtonText, viewMode === 'today' && styles.viewModeButtonTextActive]}>
                Today's Orders
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('calendar')}
            >
              <Text style={[styles.viewModeButtonText, viewMode === 'calendar' && styles.viewModeButtonTextActive]}>
                Calendar View
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {viewMode === 'today' ? (
          <>
            {/* Status Filter */}
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {[
                  { key: 'all', label: 'All Orders' },
                  { key: 'cooking_started', label: 'Cooking' },
                  { key: 'cooking_done', label: 'Ready' },
                  { key: 'delivery_started', label: 'Out for Delivery' },
                  { key: 'delivery_done', label: 'Delivered' },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterChip,
                      statusFilter === filter.key && styles.filterChipActive
                    ]}
                    onPress={() => setStatusFilter(filter.key)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      statusFilter === filter.key && styles.filterChipTextActive
                    ]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Today's Orders List */}
            <View style={styles.ordersContainer}>
              {filteredTodayOrders.length > 0 ? (
                <FlatList
                  data={filteredTodayOrders}
                  renderItem={renderTodayOrderCard}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noOrdersContainer}>
                  <Package size={48} color="#D1D5DB" />
                  <Text style={styles.noOrdersTitle}>No Orders Found</Text>
                  <Text style={styles.noOrdersText}>
                    {statusFilter === 'all' 
                      ? "No orders scheduled for today"
                      : `No orders with status "${statusFilter.replace('_', ' ')}"`
                    }
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
        {/* Plan Tabs */}
        {userSubscriptions.length > 0 && (
          <View style={styles.planTabsContainer}>
            <Text style={styles.planTabsTitle}>Active Plans</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planTabsScroll}>
              {userSubscriptions.map((subscription, index) => (
                <TouchableOpacity
                  key={subscription.id}
                  style={[
                    styles.planTab,
                    selectedPlanId === subscription.id && styles.planTabSelected
                  ]}
                  onPress={() => setSelectedPlanId(subscription.id)}
                >
                  <View style={styles.planTabHeader}>
                    <Package size={16} color={selectedPlanId === subscription.id ? '#48479B' : '#6B7280'} />
                    <Text style={[
                      styles.planTabName,
                      selectedPlanId === subscription.id && styles.planTabNameSelected
                    ]}>
                      {subscription.planName || `Plan ${index + 1}`}
                    </Text>
                  </View>
                  <Text style={[
                    styles.planTabDuration,
                    selectedPlanId === subscription.id && styles.planTabDurationSelected
                  ]}>
                    {subscription.duration} days • {subscription.deliveryTimeSlot || subscription.deliveryTime}
                  </Text>
                  <View style={[
                    styles.planTabStatus,
                    { backgroundColor: subscription.status === 'active' ? '#10B981' : '#6B7280' }
                  ]}>
                    <Text style={styles.planTabStatusText}>
                      {subscription.status === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Status Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Delivered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#48479B' }]} />
              <Text style={styles.legendText}>Upcoming</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Weekend/Vacation</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.legendText}>Skipped</Text>
            </View>
          </View>
        </View>
        
        {/* Calendar Navigation */}
        {selectedPlanId && (
          <View style={styles.calendarHeader}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigateMonth('prev')}
            >
              <ChevronLeft size={20} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.monthYearContainer}>
              <Text style={styles.monthYear}>
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Text style={styles.monthSubtext}>
                {userSubscriptions.find(sub => sub.id === selectedPlanId)?.planName || 'Selected Plan'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigateMonth('next')}
            >
              <ChevronRight size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Calendar Grid */}
        {selectedPlanId && (
          <View style={styles.calendar}>
            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>
            
            {/* Calendar Days */}
            <View style={styles.calendarGrid}>
              {calendarDays.map(renderCalendarDay)}
            </View>
          </View>
        )}
        
        {/* Selected Date Details */}
        {selectedPlanId && (
          <View style={styles.selectedDateContainer}>
            <View style={styles.selectedDateHeader}>
              <View style={styles.selectedDateTitleContainer}>
                <Text style={styles.selectedDateTitle}>
                  {selectedDate.toLocaleDateString('en-US', { 
                    day: 'numeric',
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
                <Text style={styles.selectedDateWeekday}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
              </View>
              {selectedDateDelivery && (
                <View style={styles.selectedDateBadge}>
                  <Sparkles size={14} color="#48479B" />
                  <Text style={styles.selectedDateBadgeText}>Scheduled</Text>
                </View>
              )}
            </View>
            
            {renderSelectedDateDelivery()}
          </View>
        )}
          </>
        )}
      </ScrollView>
      
      {/* Add-On Selection Modal */}
      <Modal
        visible={showAddOnModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Items</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddOnModal(false)}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Select additional items for {selectedDate.toLocaleDateString('en-US', { 
                day: 'numeric',
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>

            <FlatList
              data={availableAddOns}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.addOnItem,
                    selectedAddOns.includes(item.id) && styles.addOnItemSelected
                  ]}
                  onPress={() => handleAddOnSelection(item.id)}
                >
                  <View style={styles.addOnInfo}>
                    <Text style={styles.addOnName}>{item.name}</Text>
                    <Text style={styles.addOnDescription}>{item.description}</Text>
                    <Text style={styles.addOnPrice}>₹{item.price}</Text>
                  </View>
                  <View style={[
                    styles.addOnCheckbox,
                    selectedAddOns.includes(item.id) && styles.addOnCheckboxSelected
                  ]}>
                    {selectedAddOns.includes(item.id) && (
                      <CheckCircle size={20} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />

            {selectedAddOns.length > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedSummaryTitle}>
                  Selected Items ({selectedAddOns.length})
                </Text>
                <Text style={styles.selectedSummaryTotal}>
                  Total: ₹{getSelectedAddOnsTotal()}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                selectedAddOns.length === 0 && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirmAddOns}
              disabled={selectedAddOns.length === 0}
            >
              <Text style={styles.confirmButtonText}>
                Pay ₹{getSelectedAddOnsTotal()} for {selectedAddOns.length} Item{selectedAddOns.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Payment Modal for Add-ons */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            {paymentStatus === 'processing' && (
              <>
                <Text style={styles.modalTitle}>Processing Payment</Text>
                <Text style={styles.modalSubtitle}>Collecting payment via {selectedPaymentMethod.toUpperCase()}...</Text>
              </>
            )}
            {paymentStatus === 'success' && (
              <>
                <Text style={styles.modalTitle}>Payment Successful</Text>
                <Text style={styles.modalSubtitle}>Add-ons have been scheduled.</Text>
              </>
            )}
            {paymentStatus === 'failed' && (
              <>
                <Text style={styles.modalTitle}>Payment Failed</Text>
                <Text style={styles.modalSubtitle}>Please try again.</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={handleConfirmAddOns}
                    testID="retry-addon-payment"
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => { setShowPaymentModal(false); setPaymentStatus(null); }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* WhatsApp Button */}
      <TouchableOpacity style={styles.whatsappButton}>
        <Text style={styles.whatsappButtonText}>💬</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#48479B',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  legend: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  monthSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  calendar: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 12,
    marginVertical: 2,
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDaySelected: {
    backgroundColor: '#48479B',
    transform: [{ scale: 1.1 }],
    shadowColor: '#48479B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  calendarDayToday: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  calendarDayWithDelivery: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  calendarDayTextInactive: {
    color: '#9CA3AF',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    color: 'white',
    fontWeight: 'bold',
  },
  deliveryIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
  },
  todayIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  selectedDateContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  selectedDateTitleContainer: {
    flex: 1,
  },
  selectedDateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  selectedDateWeekday: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedDateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#48479B',
    marginLeft: 4,
  },
  deliveryContainer: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  mealImagePlaceholder: {
    fontSize: 24,
  },
  mealDetails: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryStatusText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  addOnsContainer: {
    marginBottom: 12,
    marginTop: 8,
  },
  addOnsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  addOnsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  deliveryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 6,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#48479B',
    backgroundColor: '#EEF2FF',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    color: '#48479B',
    marginLeft: 6,
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },
  noDeliveryContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDeliveryText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  addProductButton: {
    backgroundColor: '#48479B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: '#48479B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addProductButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  whatsappButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  whatsappButtonText: {
    fontSize: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#48479B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionInfo: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  subscriptionText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  cutoffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  cutoffText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  addOnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addOnItemSelected: {
    borderColor: '#48479B',
    backgroundColor: '#EEF2FF',
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  addOnDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  addOnPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  addOnCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOnCheckboxSelected: {
    backgroundColor: '#48479B',
    borderColor: '#48479B',
  },
  selectedSummary: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
  },
  selectedSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectedSummaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#48479B',
  },
  confirmButton: {
    backgroundColor: '#48479B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  /* removed duplicate modalTitle and modalSubtitle to avoid key conflicts */
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#48479B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  planTabsContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  planTabsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  planTabsScroll: {
    flexGrow: 0,
  },
  planTab: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 180,
  },
  planTabSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#48479B',
  },
  planTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTabName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  planTabNameSelected: {
    color: '#48479B',
  },
  planTabDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  planTabDurationSelected: {
    color: '#6B7280',
  },
  planTabStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  planTabStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  subscriptionTabs: {
    marginBottom: 16,
  },
  subscriptionTabsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subscriptionTabsScroll: {
    flexGrow: 0,
  },
  subscriptionTab: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#48479B',
  },
  subscriptionTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#48479B',
    marginBottom: 2,
  },
  subscriptionTabDuration: {
    fontSize: 10,
    color: '#6B7280',
  },
  viewModeContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#48479B',
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewModeButtonTextActive: {
    color: 'white',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#48479B',
    borderColor: '#48479B',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  ordersContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  orderPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderMealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderMealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  orderDeliveryTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  orderAddOns: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  orderAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  orderAddressText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  orderStaff: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  staffText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48479B',
    marginLeft: 4,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  noOrdersContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noOrdersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noOrdersText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  topBg: { width: '100%', paddingBottom: 0, position: 'relative', overflow: 'hidden' },
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});