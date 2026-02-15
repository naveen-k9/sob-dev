import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Package,
  DollarSign,
  Check,
  ChevronDown,
  Plus,
  Minus,
} from 'lucide-react-native';
import db from '@/db';
import { User as UserType, Meal, Plan, AddOn, Subscription } from '@/types';

interface SelectedMeal {
  meal: Meal;
  quantity: number;
}

interface SelectedAddOn {
  addOn: AddOn;
  quantity: number;
}

export default function ManualSubscription() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'kitchen' | 'delivery' | 'admin'>('customer');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [deliveryTime, setDeliveryTime] = useState('12:00 PM - 2:00 PM');
  const [startDate, setStartDate] = useState(new Date());
  const [weekType, setWeekType] = useState<Subscription['weekType']>('mon-fri');
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showWeekTypeModal, setShowWeekTypeModal] = useState(false);

  const timeSlots = [
    '12:00 PM - 2:00 PM',
    '7:00 PM - 9:00 PM',
    '6:00 PM - 8:00 PM',
    '1:00 PM - 3:00 PM',
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allUsers, allMeals, allPlans, allAddOns] = await Promise.all([
        db.getUsers(),
        db.getMeals(),
        db.getPlans(),
        db.getAddOns(),
      ]);
      setUsers(allUsers);
      setMeals(allMeals.filter(m => m.isActive));
      setPlans(allPlans.filter(p => p.isActive));
      setAddOns(allAddOns.filter(a => a.isActive));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedPlan) return {
      mealTotal: 0,
      addOnTotal: 0,
      subtotal: 0,
      discount: 0,
      deliveryFee: 0,
      total: 0,
    };

    const mealTotal = selectedMeals.reduce((sum, item) => {
      return sum + (item.meal.price * item.quantity * selectedPlan.days);
    }, 0);

    const addOnTotal = selectedAddOns.reduce((sum, item) => {
      return sum + (item.addOn.price * item.quantity * selectedPlan.days);
    }, 0);

    const subtotal = mealTotal + addOnTotal;
    const discount = (subtotal * selectedPlan.discount) / 100;
    const deliveryFee = 29;

    return {
      mealTotal,
      addOnTotal,
      subtotal,
      discount,
      deliveryFee,
      total: subtotal - discount + deliveryFee,
    };
  };

  const addMeal = (meal: Meal) => {
    const existing = selectedMeals.find(item => item.meal.id === meal.id);
    if (existing) {
      setSelectedMeals(prev => 
        prev.map(item => 
          item.meal.id === meal.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedMeals(prev => [...prev, { meal, quantity: 1 }]);
    }
  };

  const removeMeal = (mealId: string) => {
    setSelectedMeals(prev => {
      const existing = prev.find(item => item.meal.id === mealId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.meal.id === mealId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prev.filter(item => item.meal.id !== mealId);
      }
    });
  };

  const addAddOn = (addOn: AddOn) => {
    const existing = selectedAddOns.find(item => item.addOn.id === addOn.id);
    if (existing) {
      setSelectedAddOns(prev => 
        prev.map(item => 
          item.addOn.id === addOn.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedAddOns(prev => [...prev, { addOn, quantity: 1 }]);
    }
  };

  const removeAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => {
      const existing = prev.find(item => item.addOn.id === addOnId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.addOn.id === addOnId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prev.filter(item => item.addOn.id !== addOnId);
      }
    });
  };

  const calculateEndDate = () => {
    if (!selectedPlan) return startDate;
    const endDate = new Date(startDate);
    const planDays = selectedPlan.days;
    const skipWeekends = weekType === 'mon-fri' || weekType === 'mon-sat';
    if (!skipWeekends) {
      endDate.setDate(endDate.getDate() + planDays - 1);
      return endDate;
    }
    let added = 0;
    let cur = new Date(startDate);
    while (added < planDays) {
      const d = cur.getDay();
      const isWeekend = weekType === 'mon-fri' ? (d === 0 || d === 6) : d === 0;
      if (!isWeekend) added++;
      if (added < planDays) cur.setDate(cur.getDate() + 1);
    }
    return cur;
  };

  const weekendExclusionFromWeekType = (): string => {
    if (weekType === 'everyday' || weekType === 'none') return 'none';
    if (weekType === 'mon-sat') return 'sunday';
    return 'both';
  };

  const createSubscription = async () => {
    if (!selectedUser || !selectedPlan || selectedMeals.length === 0) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const totals = calculateTotal();
      const endDate = calculateEndDate();
      
      const subscriptionData: Omit<Subscription, 'id' | 'createdAt'> = {
        userId: selectedUser.id,
        mealId: selectedMeals[0].meal.id,
        planId: selectedPlan.id,
        addOns: selectedAddOns.map(item => item.addOn.id),
        startDate,
        endDate,
        deliveryTime,
        deliveryTimeSlot: deliveryTime,
        weekType,
        weekendExclusion: weekendExclusionFromWeekType(),
        excludeWeekends: weekType === 'mon-fri' || weekType === 'mon-sat',
        addressId: selectedUser.addresses[0]?.id || '',
        specialInstructions: deliveryInstructions,
        totalAmount: totals.total,
        paidAmount: totals.total,
        status: 'active',
        totalDeliveries: selectedPlan.days,
        remainingDeliveries: selectedPlan.days,
      };

      await db.createSubscription(subscriptionData);
      
      Alert.alert(
        'Success',
        'Manual subscription created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating subscription:', error);
      Alert.alert('Error', 'Failed to create subscription');
    }
  };

  const filteredModalUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchesQuery = (u.name?.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? u.isActive : !u.isActive;
    return matchesQuery && matchesRole && matchesStatus;
  });

  const renderUserModal = () => (
    <Modal visible={showUserModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Customer</Text>
          <TouchableOpacity onPress={() => setShowUserModal(false)}>
            <Text style={styles.modalClose}>Done</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <TextInput
            testID="manual-sub-users-search"
            style={[styles.textInput, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
            placeholder="Search by name, phone, or email"
            placeholderTextColor="#9CA3AF"
            value={userSearch}
            onChangeText={setUserSearch}
          />
          <View style={{ height: 10 }} />
          <Text style={{ color: '#9CA3AF', marginBottom: 6 }}>Role</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(['all','customer','kitchen','delivery','admin'] as const).map(r => (
              <TouchableOpacity
                key={r}
                testID={`manual-sub-users-role-${r}`}
                onPress={() => setRoleFilter(r)}
                style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>
                  {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 10 }} />
          <Text style={{ color: '#9CA3AF', marginBottom: 6 }}>Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(['all','active','inactive'] as const).map(s => (
              <TouchableOpacity
                key={s}
                testID={`manual-sub-users-status-${s}`}
                onPress={() => setStatusFilter(s)}
                style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <FlatList
          data={filteredModalUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                if (item.role !== 'customer') {
                  Alert.alert('Invalid selection', 'Please select a customer account');
                  return;
                }
                setSelectedUser(item);
                setShowUserModal(false);
              }}
            >
              <View>
                <Text style={styles.modalItemTitle}>{item.name || 'Unnamed User'}</Text>
                <Text style={styles.modalItemSubtitle}>{item.phone} • {item.role.toUpperCase()} • {item.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
              {selectedUser?.id === item.id && <Check size={20} color="#10B981" />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={{ padding: 24 }}>
              <Text style={{ color: '#9CA3AF' }}>No users match your filters.</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderMealModal = () => (
    <Modal visible={showMealModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Meals</Text>
          <TouchableOpacity onPress={() => setShowMealModal(false)}>
            <Text style={styles.modalClose}>Done</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const selectedItem = selectedMeals.find(m => m.meal.id === item.id);
            return (
              <View style={styles.modalItem}>
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemTitle}>{item.name}</Text>
                  <Text style={styles.modalItemSubtitle}>₹{item.price}</Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => removeMeal(item.id)}
                  >
                    <Minus size={16} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{selectedItem?.quantity || 0}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => addMeal(item)}
                  >
                    <Plus size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderPlanModal = () => (
    <Modal visible={showPlanModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Plan</Text>
          <TouchableOpacity onPress={() => setShowPlanModal(false)}>
            <Text style={styles.modalClose}>Done</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedPlan(item);
                setShowPlanModal(false);
              }}
            >
              <View>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemSubtitle}>
                  {item.days} days • {item.discount}% discount
                </Text>
              </View>
              {selectedPlan?.id === item.id && <Check size={20} color="#10B981" />}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderAddOnModal = () => (
    <Modal visible={showAddOnModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Add-ons</Text>
          <TouchableOpacity onPress={() => setShowAddOnModal(false)}>
            <Text style={styles.modalClose}>Done</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={addOns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const selectedItem = selectedAddOns.find(a => a.addOn.id === item.id);
            return (
              <View style={styles.modalItem}>
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemTitle}>{item.name}</Text>
                  <Text style={styles.modalItemSubtitle}>₹{item.price}</Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => removeAddOn(item.id)}
                  >
                    <Minus size={16} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{selectedItem?.quantity || 0}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => addAddOn(item)}
                  >
                    <Plus size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderTimeModal = () => (
    <Modal visible={showTimeModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Delivery Time</Text>
          <TouchableOpacity onPress={() => setShowTimeModal(false)}>
            <Text style={styles.modalClose}>Done</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={timeSlots}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setDeliveryTime(item);
                setShowTimeModal(false);
              }}
            >
              <Text style={styles.modalItemTitle}>{item}</Text>
              {deliveryTime === item && <Check size={20} color="#10B981" />}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const weekTypeOptions: { value: Subscription['weekType']; label: string }[] = [
    { value: 'mon-fri', label: 'Mon–Fri (weekdays only)' },
    { value: 'mon-sat', label: 'Mon–Sat (exclude Sunday)' },
    { value: 'everyday', label: 'Every day' },
    { value: 'none', label: 'None' },
  ];

  const renderWeekTypeModal = () => (
    <Modal visible={showWeekTypeModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Delivery days</Text>
          <TouchableOpacity onPress={() => setShowWeekTypeModal(false)}>
            <Text style={styles.modalClose}>Done</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={weekTypeOptions}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setWeekType(item.value);
                setExcludeWeekends(item.value === 'mon-fri' || item.value === 'mon-sat');
                setShowWeekTypeModal(false);
              }}
            >
              <Text style={styles.modalItemTitle}>{item.label}</Text>
              {weekType === item.value && <Check size={20} color="#10B981" />}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const totals = calculateTotal();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Create Manual Subscription',
          headerStyle: { backgroundColor: '#1F2937' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Customer Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowUserModal(true)}
            >
              <User size={20} color="#9CA3AF" />
              <Text style={styles.selectorText}>
                {selectedUser ? selectedUser.name || selectedUser.phone : 'Select Customer'}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Meal Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meals</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowMealModal(true)}
            >
              <Package size={20} color="#9CA3AF" />
              <Text style={styles.selectorText}>
                {selectedMeals.length > 0 
                  ? `${selectedMeals.length} meal(s) selected`
                  : 'Select Meals'
                }
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {selectedMeals.map((item) => (
              <View key={item.meal.id} style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>
                  {item.meal.name} x{item.quantity}
                </Text>
                <Text style={styles.selectedItemPrice}>₹{item.meal.price}</Text>
              </View>
            ))}
          </View>

          {/* Plan Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowPlanModal(true)}
            >
              <Calendar size={20} color="#9CA3AF" />
              <Text style={styles.selectorText}>
                {selectedPlan ? selectedPlan.name : 'Select Plan'}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Add-ons Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add-ons (Optional)</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowAddOnModal(true)}
            >
              <Plus size={20} color="#9CA3AF" />
              <Text style={styles.selectorText}>
                {selectedAddOns.length > 0 
                  ? `${selectedAddOns.length} add-on(s) selected`
                  : 'Select Add-ons'
                }
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {selectedAddOns.map((item) => (
              <View key={item.addOn.id} style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>
                  {item.addOn.name} x{item.quantity}
                </Text>
                <Text style={styles.selectedItemPrice}>₹{item.addOn.price}</Text>
              </View>
            ))}
          </View>

          {/* Delivery Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Time</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowTimeModal(true)}
            >
              <Clock size={20} color="#9CA3AF" />
              <Text style={styles.selectorText}>{deliveryTime}</Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Week type (delivery days) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery days (week type)</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowWeekTypeModal(true)}
            >
              <Calendar size={20} color="#9CA3AF" />
              <Text style={styles.selectorText}>
                {weekType === 'mon-fri' ? 'Mon–Fri (weekdays)' : weekType === 'mon-sat' ? 'Mon–Sat' : weekType === 'everyday' ? 'Every day' : 'None'}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Delivery Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Instructions</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter delivery instructions..."
              placeholderTextColor="#9CA3AF"
              value={deliveryInstructions}
              onChangeText={setDeliveryInstructions}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Admin Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Notes</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Internal notes for this subscription..."
              placeholderTextColor="#9CA3AF"
              value={adminNotes}
              onChangeText={setAdminNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Order Summary */}
          {selectedPlan && selectedMeals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Meals Total</Text>
                  <Text style={styles.summaryValue}>₹{totals.mealTotal}</Text>
                </View>
                {totals.addOnTotal > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Add-ons Total</Text>
                    <Text style={styles.summaryValue}>₹{totals.addOnTotal}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{totals.subtotal}</Text>
                </View>
                {totals.discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount ({selectedPlan.discount}%)</Text>
                    <Text style={[styles.summaryValue, styles.discountText]}>-₹{totals.discount}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>₹{totals.deliveryFee}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₹{totals.total}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>
                    {startDate.toLocaleDateString()} - {calculateEndDate().toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Create Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.createButton,
                (!selectedUser || !selectedPlan || selectedMeals.length === 0) && styles.createButtonDisabled
              ]}
              onPress={createSubscription}
              disabled={!selectedUser || !selectedPlan || selectedMeals.length === 0}
            >
              <Text style={styles.createButtonText}>Create Subscription</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modals */}
        {renderUserModal()}
        {renderMealModal()}
        {renderPlanModal()}
        {renderAddOnModal()}
        {renderTimeModal()}
        {renderWeekTypeModal()}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectorText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  selectedItemText: {
    color: 'white',
    fontSize: 14,
  },
  selectedItemPrice: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  summaryValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  discountText: {
    color: '#10B981',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalItemSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
});