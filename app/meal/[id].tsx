import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Share, Plus, Minus, Star, Calendar, Clock, X, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Meal, AddOn, SubscriptionPlan, TimeSlot } from '@/types';
import db from '@/db';
import { addOns, subscriptionPlans } from '@/constants/data';

type WeekType = 'mon-fri' | 'mon-sat';
 type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export default function MealDetailScreen() {
  const { id, mode, planId } = useLocalSearchParams();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMealType, setSelectedMealType] = useState<'veg' | 'nonveg' | 'egg' | 'both'>('veg');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [showAddOnsDrawer, setShowAddOnsDrawer] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(subscriptionPlans[1]);
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [weekendExclusion, setWeekendExclusion] = useState<'saturdays' | 'sundays' | 'both'>('both');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const routerInstance = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const [weekType, setWeekType] = useState<WeekType>('mon-fri');
  const [addonMealFilter, setAddonMealFilter] = useState<'veg' | 'nonveg' | 'both'>('both');
  const [selectedAddOnDays, setSelectedAddOnDays] = useState<Record<string, DayKey[]>>({});
  const [thaliDayMap, setThaliDayMap] = useState<Record<DayKey, 'veg' | 'nonveg'>>({} as Record<DayKey, 'veg' | 'nonveg'>);
  const [productDays, setProductDays] = useState<DayKey[]>([]);

  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);

  React.useEffect(() => {
    setCanGoBack(routerInstance.canGoBack());
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const slots = await db.getTimeSlots();
        const active = (slots || []).filter(s => s.isActive !== false);
        setAllTimeSlots(active);
        if (typeof id === 'string') {
          const mealData = await db.getMealById(id);
          if (mealData) {
            setMeal(mealData);
            setSelectedMealType(mealData.isBasicThali ? 'veg' : mealData.isVeg ? 'veg' : mealData.hasEgg ? 'egg' : 'nonveg');
            const ids = mealData.availableTimeSlotIds && mealData.availableTimeSlotIds.length > 0
              ? mealData.availableTimeSlotIds
              : active.map(s => s.id);
            const first = active.find(s => ids.includes(s.id)) ?? active[0] ?? null;
            setSelectedTimeSlot(first ?? null);
          }
        }
      } catch (error) {
        console.error('Error loading meal or timeslots:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Update selected plan when trial mode changes
  useEffect(() => {
    const availablePlans = getAvailablePlans();
    if (availablePlans.length > 0) {
      const isCurrentPlanAvailable = availablePlans.some(plan => plan.id === selectedPlan.id);
      if (!isCurrentPlanAvailable) {
        setSelectedPlan(availablePlans[0]);
      }
    }
  }, [isTrialMode]);

  // Apply deep-link params from MealCard: mode=trial|subscribe and planId
  useEffect(() => {
    if (typeof mode === 'string' || typeof planId === 'string') {
      console.log('[MealDetail] Incoming params', { mode, planId });
      if (mode === 'trial') {
        setIsTrialMode(true);
        const twoDay = subscriptionPlans.find(p => p.duration === 2) ?? subscriptionPlans[0];
        setSelectedPlan(twoDay);
      } else if (mode === 'subscribe') {
        setIsTrialMode(false);
        const basic = subscriptionPlans.find(p => p.id === (typeof planId === 'string' ? planId : '2')) ?? subscriptionPlans[1] ?? subscriptionPlans[0];
        setSelectedPlan(basic);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, planId]);

  const getAvailablePlans = () => {
    if (isTrialMode) {
      // In trial mode, only show the 2-day Meal Lite plan
      return subscriptionPlans.filter(plan => plan.duration === 2);
    } else {
      // In regular mode, show 6, 15, and 26 day plans (exclude 2-day trial plan)
      return subscriptionPlans.filter(plan => plan.duration !== 2);
    }
  };

  const handleAddOnToggle = useCallback((addOnId: string) => {
    setSelectedAddOns(prev => {
      const exists = prev.includes(addOnId);
      const next = exists ? prev.filter(id => id !== addOnId) : [...prev, addOnId];
      if (!exists) {
        setSelectedAddOnDays(d => ({ ...d, [addOnId]: d[addOnId] ?? [] }));
      }
      return next;
    });
  }, []);

  const availableDays: { key: DayKey; label: string; short: string }[] = useMemo(() => {
    const base: { key: DayKey; label: string; short: string }[] = [
      { key: 'mon', label: 'Monday', short: 'M' },
      { key: 'tue', label: 'Tuesday', short: 'T' },
      { key: 'wed', label: 'Wednesday', short: 'W' },
      { key: 'thu', label: 'Thursday', short: 'T' },
      { key: 'fri', label: 'Friday', short: 'F' },
      { key: 'sat', label: 'Saturday', short: 'S' },
    ];
    return weekType === 'mon-fri' ? base.slice(0, 5) : base;
  }, [weekType]);

  useEffect(() => {
    if (availableDays.length > 0) {
      setThaliDayMap(prev => {
        const next: Record<DayKey, 'veg' | 'nonveg'> = { ...prev } as Record<DayKey, 'veg' | 'nonveg'>;
        availableDays.forEach((d, idx) => {
          if (!next[d.key]) {
            next[d.key] = idx % 2 === 0 ? 'veg' : 'nonveg';
          }
        });
        // Remove days not in availableDays
        const allowedKeys = availableDays.map(d => d.key);
        (Object.keys(next) as DayKey[]).forEach(k => {
          if (!allowedKeys.includes(k)) delete next[k];
        });
        return { ...next };
      });
      setProductDays(prev => prev.filter(d => availableDays.some(ad => ad.key === d)));
    }
  }, [availableDays.length]);

  const toggleAddOnDay = useCallback((addOnId: string, day: DayKey) => {
    setSelectedAddOnDays(prev => {
      const current = prev[addOnId] ?? [];
      const has = current.includes(day);
      const next = has ? current.filter(d => d !== day) : [...current, day];
      return { ...prev, [addOnId]: next };
    });
  }, []);

  const filteredAddOns: AddOn[] = useMemo(() => {
    if (addonMealFilter === 'veg') return addOns.filter(a => a.isVeg !== false);
    if (addonMealFilter === 'nonveg') return addOns.filter(a => a.isVeg === false);
    return addOns;
  }, [addonMealFilter]);



  const variantPrice = useMemo<number>(() => {
    if (!meal) return 0;
    if (meal.variantPricing) {
      const vegP = meal.variantPricing.veg ?? meal.price;
      const nonVegP = meal.variantPricing.nonveg ?? vegP;
      if (selectedMealType === 'veg') return vegP;
      if (selectedMealType === 'nonveg') return nonVegP;
      if (selectedMealType === 'both') return vegP;
    }
    return meal?.price ?? 0;
  }, [meal, selectedMealType]);

  const calculateTotalPrice = () => {
    if (!meal) return 0;
    const daysPerWeek = weekType === 'mon-fri' ? 5 : 6;
    const weeks = Math.ceil(selectedPlan.duration / daysPerWeek);

    let thaliDelta = 0;
    if (meal.isBasicThali && meal.variantPricing) {
      const vegPrice = meal.variantPricing.veg ?? meal.price;
      const nonVegPrice = meal.variantPricing.nonveg ?? vegPrice;
      const perDayDelta = nonVegPrice - vegPrice;
      if (selectedMealType === 'nonveg') {
        thaliDelta = perDayDelta * selectedPlan.duration;
      } else if (selectedMealType === 'both') {
        const daysPerWk = availableDays.length;
        const weeksCount = Math.ceil(selectedPlan.duration / daysPerWk);
        const nonVegDaysPerWeek = availableDays.reduce((n, d) => n + (thaliDayMap[d.key] === 'nonveg' ? 1 : 0), 0);
        const totalMarkedDays = weeksCount * nonVegDaysPerWeek;
        const capped = Math.min(selectedPlan.duration, totalMarkedDays);
        thaliDelta = perDayDelta * capped;
      }
    }

    let productDayTotal = 0;
    if (meal.allowDaySelection) {
      const daysSel = productDays.length === 0 ? availableDays.length : productDays.length;
      const weeksCount = Math.ceil(selectedPlan.duration / (weekType === 'mon-fri' ? 5 : 6));
      productDayTotal = meal.price * daysSel * weeksCount;
    }

    const addOnTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOns.find(a => a.id === addOnId);
      if (!addOn) return total;
      const selectedDaysCount = (selectedAddOnDays[addOnId]?.length ?? 0);
      const totalDaysForAddon = selectedDaysCount === 0
        ? selectedPlan.duration
        : Math.min(selectedPlan.duration, weeks * selectedDaysCount);
      return total + addOn.price * totalDaysForAddon;
    }, 0);

    const vegBasePlan = isTrialMode ? selectedPlan.discountedPrice * 0.5 : selectedPlan.discountedPrice;
    return vegBasePlan + thaliDelta + addOnTotal + productDayTotal;
  };

  const handleProceed = () => {
    if (!meal) return;
    
    const excludeWeekends = weekendExclusion === 'saturdays' || weekendExclusion === 'sundays' || weekendExclusion === 'both';

    const subscriptionData = {
      meal,
      plan: selectedPlan,
      addOns: selectedAddOns,
      mealType: selectedMealType,
      timeSlot: selectedTimeSlot ?? undefined,
      excludeWeekends,
      weekendExclusion,
      startDate,
      isTrialMode,
      totalPrice: calculateTotalPrice(),
    };
    
    router.push({
      pathname: '/checkout',
      params: { subscriptionData: JSON.stringify(subscriptionData) }
    });
  };



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!meal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Meal not found</Text>
        </View>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity style={styles.headerButton} onPress={() => {
              if (canGoBack) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Heart size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Share size={24} color="white" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: meal.images[0] }} style={styles.mealImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.basicInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <View style={styles.ratingContainer}>
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text style={styles.rating}>{meal.rating}</Text>
                <Text style={styles.reviewCount}>({meal.reviewCount})</Text>
              </View>
            </View>
            
            <Text style={styles.description}>{meal.description}</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{variantPrice}</Text>
              {meal.originalPrice && (
                <Text style={styles.originalPrice}>₹{meal.originalPrice}</Text>
              )}
              <View style={styles.tags}>
                {meal.isVeg && <Text style={styles.vegTag}>🟢 VEG</Text>}
                {meal.hasEgg && <Text style={styles.eggTag}>🟡 EGG</Text>}
                {!meal.isVeg && !meal.hasEgg && <Text style={styles.nonVegTag}>🔴 NON-VEG</Text>}
              </View>
            </View>
            {meal.variantPricing && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <View style={styles.variantPill}>
                  <Text style={styles.variantPillText}>Veg ₹{meal.variantPricing.veg ?? meal.price}</Text>
                </View>
                <View style={styles.variantPill}>
                  <Text style={styles.variantPillText}>Non-Veg ₹{meal.variantPricing.nonveg ?? (meal.variantPricing.veg ?? meal.price)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Nutrition Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Information</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.nutritionInfo.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.nutritionInfo.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.nutritionInfo.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.nutritionInfo.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.ingredients}>{meal.ingredients.join(', ')}</Text>
          </View>

          {/* Meal Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Meal Type</Text>
            <View style={styles.mealTypeContainer}>
              <TouchableOpacity
                style={[styles.mealTypeButton, selectedMealType === 'veg' && styles.selectedMealType]}
                onPress={() => setSelectedMealType('veg')}
              >
                <Text style={styles.mealTypeText}>🟢 Veg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mealTypeButton, selectedMealType === 'nonveg' && styles.selectedMealType]}
                onPress={() => setSelectedMealType('nonveg')}
              >
                <Text style={styles.mealTypeText}>🔴 Non-Veg</Text>
              </TouchableOpacity>
              {meal.isBasicThali && (
                <TouchableOpacity
                  style={[styles.mealTypeButton, selectedMealType === 'both' && styles.selectedMealType]}
                  onPress={() => setSelectedMealType('both')}
                >
                  <Text style={styles.mealTypeText}>🟢🔴 Both (customize)</Text>
                </TouchableOpacity>
              )}
              {meal.hasEgg && (
                <TouchableOpacity
                  style={[styles.mealTypeButton, selectedMealType === 'egg' && styles.selectedMealType]}
                  onPress={() => setSelectedMealType('egg')}
                >
                  <Text style={styles.mealTypeText}>🟡 With Egg</Text>
                </TouchableOpacity>
              )}
            </View>
            {meal.isBasicThali && selectedMealType === 'both' && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.daySelectorLabel}>Set Veg/Non-Veg for week</Text>
                <View style={styles.daysRow}>
                  {availableDays.map(d => {
                    const mode = thaliDayMap[d.key] ?? 'veg';
                    const isNonVeg = mode === 'nonveg';
                    return (
                      <TouchableOpacity
                        key={d.key}
                        style={[styles.dayChip, isNonVeg && styles.dayChipActive]}
                        onPress={() => setThaliDayMap(m => ({ ...m, [d.key]: m[d.key] === 'nonveg' ? 'veg' : 'nonveg' }))}
                      >
                        <Text style={[styles.dayChipText, isNonVeg && styles.dayChipTextActive]}>{d.short} {isNonVeg ? 'NV' : 'V'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.applyAllDaysNote}>Default is alternate days. Tap to toggle a day's type.</Text>
              </View>
            )}
          </View>

          {/* Plan Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Plan</Text>
            <View style={styles.planContainer}>
              {getAvailablePlans().map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    testID={`plan-${plan.id}`}
                    style={[styles.planCard, isSelected && styles.selectedPlan]}
                    onPress={() => setSelectedPlan(plan)}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>POPULAR</Text>
                      </View>
                    )}
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDuration}>{plan.duration} days</Text>
                    <View style={styles.planPricing}>
                      <Text style={styles.planPrice}>₹{plan.discountedPrice}</Text>
                      <Text style={styles.planOriginalPrice}>₹{plan.originalPrice}</Text>
                    </View>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Week Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Week Type</Text>
            <View style={styles.weekTypeRow}>
              {([['mon-fri','Mon-Fri'], ['mon-sat','Mon-Sat']] as const).map(([val,label]) => {
                const isSelected = weekType === val;
                return (
                  <TouchableOpacity
                    key={val}
                    testID={`week-type-${val}`}
                    style={[styles.weekTypeButton, isSelected && styles.weekTypeSelected]}
                    onPress={() => setWeekType(val)}
                  >
                    <Text style={[styles.weekTypeText, isSelected && styles.weekTypeTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Add-on Meal Type Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Addon Type</Text>
            <View style={styles.mealTypeContainer}>
              {(['veg','nonveg','both'] as const).map(opt => {
                const isSelected = addonMealFilter === opt;
                const label = opt === 'veg' ? 'Veg' : opt === 'nonveg' ? 'Non-Veg' : 'Both';
                return (
                  <TouchableOpacity
                    key={opt}
                    testID={`addon-filter-${opt}`}
                    style={[styles.mealTypeButton, isSelected && styles.selectedMealType]}
                    onPress={() => setAddonMealFilter(opt)}
                  >
                    <Text style={styles.mealTypeText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Trial/Subscribe Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleContainer}>
              <Text style={styles.sectionTitle}>Trial Mode</Text>
              <Switch
                value={isTrialMode}
                onValueChange={setIsTrialMode}
                trackColor={{ false: '#E5E7EB', true: '#FF6B35' }}
                thumbColor={isTrialMode ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
            {isTrialMode && (
              <Text style={styles.trialNote}>Try our service with a 2-day meal plan at a special price!</Text>
            )}
          </View>

          {/* Add-ons */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.addOnHeader}
              onPress={() => setShowAddOnsDrawer(true)}
            >
              <Text style={styles.sectionTitle}>Add-ons ({selectedAddOns.length})</Text>
              <Text style={styles.addOnToggle}>{'>'}</Text>
            </TouchableOpacity>
            {selectedAddOns.length > 0 && (
              <View style={styles.selectedAddOnsPreview}>
                {selectedAddOns.slice(0, 2).map((addOnId) => {
                  const addOn = addOns.find(a => a.id === addOnId);
                  return addOn ? (
                    <Text key={addOnId} style={styles.selectedAddOnText}>
                      {addOn.name} (+₹{addOn.price})
                    </Text>
                  ) : null;
                })}
                {selectedAddOns.length > 2 && (
                  <Text style={styles.moreAddOnsText}>+{selectedAddOns.length - 2} more</Text>
                )}
              </View>
            )}
            {meal.allowDaySelection && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionTitle}>Select Days for this item</Text>
                <View style={styles.daysRow}>
                  {availableDays.map(d => {
                    const active = productDays.includes(d.key);
                    return (
                      <TouchableOpacity
                        key={`product-${d.key}`}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                        onPress={() => setProductDays(prev => active ? prev.filter(x => x !== d.key) : [...prev, d.key])}
                      >
                        <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{d.short}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {productDays.length === 0 && (
                  <Text style={styles.applyAllDaysNote}>No day selected → applies to all working days</Text>
                )}
              </View>
            )}
          </View>

          {/* Delivery Time Slot */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Time</Text>
            <View style={styles.timeSlotContainer}>
              {(allTimeSlots.filter(s => !meal.availableTimeSlotIds || meal.availableTimeSlotIds.length === 0 || meal.availableTimeSlotIds.includes(s.id))).map((slot) => {
                const isSelected = selectedTimeSlot?.id === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.timeSlotButton, isSelected && styles.selectedTimeSlot]}
                    onPress={() => setSelectedTimeSlot(slot)}
                  >
                    <Clock size={16} color={isSelected ? '#FF6B35' : '#666'} />
                    <Text style={[styles.timeSlotText, isSelected && styles.selectedTimeSlotText]}>
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Weekend Exclusion & Start Date */}
          <View style={styles.section}>
            <View style={styles.toggleContainer}>
              <Text style={styles.sectionTitle}>Weekend Exclusions</Text>
            </View>
            <View style={styles.weekendOptionsRow}>
              {(['saturdays','sundays','both'] as const).map((opt) => {
                const isSelected = weekendExclusion === opt;
                const label = opt === 'saturdays' ? 'Saturdays' : opt === 'sundays' ? 'Sundays' : 'Both';
                return (
                  <TouchableOpacity
                    key={opt}
                    testID={`weekend-option-${opt}`}
                    style={[styles.weekendOptionButton, isSelected && styles.weekendOptionSelected]}
                    onPress={() => {
                      console.log('Weekend exclusion changed', opt);
                      setWeekendExclusion(opt);
                    }}
                  >
                    <Text style={[styles.weekendOptionText, isSelected && styles.weekendOptionTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#FF6B35" />
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>
                  {startDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              <ChevronRight size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={styles.priceBreakdown}>
          <Text style={styles.totalPriceLabel}>Total Price</Text>
          <Text style={styles.totalPriceValue}>₹{calculateTotalPrice()}</Text>
          {isTrialMode && (
            <Text style={styles.trialDiscount}>50% Trial Discount Applied</Text>
          )}
        </View>
        <TouchableOpacity testID="proceed-to-checkout" style={styles.proceedButton} onPress={handleProceed}>
          <Text style={styles.proceedButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <SafeAreaView style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Start Date</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDatePicker(false)}
            >
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.datePickerContent}>
            <Text style={styles.datePickerDescription}>
              Choose when you want your subscription to start. You can select today or any future date.
            </Text>
            
            <View style={styles.dateOptionsContainer}>
              {/* Today Option */}
              <TouchableOpacity
                style={[
                  styles.dateOption,
                  startDate.toDateString() === new Date().toDateString() && styles.selectedDateOption
                ]}
                onPress={() => {
                  setStartDate(new Date());
                  setShowDatePicker(false);
                }}
              >
                <View style={styles.dateOptionContent}>
                  <Text style={styles.dateOptionTitle}>Today</Text>
                  <Text style={styles.dateOptionSubtitle}>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </Text>
                </View>
                {startDate.toDateString() === new Date().toDateString() && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Tomorrow Option */}
              {(() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return (
                  <TouchableOpacity
                    style={[
                      styles.dateOption,
                      startDate.toDateString() === tomorrow.toDateString() && styles.selectedDateOption
                    ]}
                    onPress={() => {
                      setStartDate(tomorrow);
                      setShowDatePicker(false);
                    }}
                  >
                    <View style={styles.dateOptionContent}>
                      <Text style={styles.dateOptionTitle}>Tomorrow</Text>
                      <Text style={styles.dateOptionSubtitle}>
                        {tomorrow.toLocaleDateString('en-US', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </Text>
                    </View>
                    {startDate.toDateString() === tomorrow.toDateString() && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })()}
              
              {/* Next Week Options */}
              {Array.from({ length: 7 }, (_, i) => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + i + 2);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dateOption,
                      startDate.toDateString() === futureDate.toDateString() && styles.selectedDateOption
                    ]}
                    onPress={() => {
                      setStartDate(futureDate);
                      setShowDatePicker(false);
                    }}
                  >
                    <View style={styles.dateOptionContent}>
                      <Text style={styles.dateOptionTitle}>
                        {futureDate.toLocaleDateString('en-US', {
                          weekday: 'long'
                        })}
                      </Text>
                      <Text style={styles.dateOptionSubtitle}>
                        {futureDate.toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    {startDate.toDateString() === futureDate.toDateString() && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={styles.datePickerNote}>
              <Text style={styles.datePickerNoteText}>
                💡 Your subscription will start on the selected date. You can modify or skip meals up to the cutoff time.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add-ons Drawer Modal */}
      <Modal
        visible={showAddOnsDrawer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddOnsDrawer(false)}
      >
        <SafeAreaView style={styles.drawerContainer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Select Add-ons</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAddOnsDrawer(false)}
            >
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.drawerContent}>
            {filteredAddOns.map((addOn) => {
              const isSelected = selectedAddOns.includes(addOn.id);
              const days = selectedAddOnDays[addOn.id] ?? [];
              return (
                <View key={addOn.id} style={[styles.drawerAddOnCard, isSelected && styles.selectedDrawerAddOn]}>
                  <TouchableOpacity
                    testID={`addon-toggle-${addOn.id}`}
                    style={styles.addOnRow}
                    onPress={() => handleAddOnToggle(addOn.id)}
                  >
                    <Image source={{ uri: addOn.image }} style={styles.addOnImage} />
                    <View style={styles.addOnInfo}>
                      <Text style={styles.addOnName}>{addOn.name}</Text>
                      <Text style={styles.addOnDescription}>{addOn.description}</Text>
                      <Text style={styles.addOnPrice}>+₹{addOn.price}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.addOnSelected}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {isSelected && (
                    <View style={styles.daySelectorContainer}>
                      <Text style={styles.daySelectorLabel}>Select days for this addon</Text>
                      <View style={styles.daysRow}>
                        {availableDays.map(d => {
                          const active = days.includes(d.key);
                          return (
                            <TouchableOpacity
                              key={d.key}
                              testID={`addon-${addOn.id}-day-${d.key}`}
                              style={[styles.dayChip, active && styles.dayChipActive]}
                              onPress={() => toggleAddOnDay(addOn.id, d.key)}
                            >
                              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{d.short}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      {days.length === 0 && (
                        <Text style={styles.applyAllDaysNote}>No day selected → applies to all plan days</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
          
          <View style={styles.drawerFooter}>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => setShowAddOnsDrawer(false)}
            >
              <Text style={styles.doneButtonText}>Done ({selectedAddOns.length} selected)</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  basicInfo: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  tags: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  vegTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  eggTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  nonVegTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ingredients: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: 'white',
  },
  selectedMealType: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF0EB',
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  planContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7F5',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  planOriginalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  planDescription: {
    fontSize: 12,
    color: '#666',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trialNote: {
    fontSize: 14,
    color: '#10B981',
    fontStyle: 'italic',
  },
  selectedAddOnsPreview: {
    marginTop: 8,
    gap: 4,
  },
  selectedAddOnText: {
    fontSize: 14,
    color: '#666',
  },
  moreAddOnsText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: 'white',
    gap: 6,
  },
  selectedTimeSlot: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF0EB',
  },
  weekTypeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  weekTypeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: 'white',
  },
  weekTypeSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF0EB',
  },
  weekTypeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  weekTypeTextSelected: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  weekendOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  weekendOptionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: 'white',
  },
  weekendOptionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF0EB',
  },
  weekendOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  weekendOptionTextSelected: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeSlotText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateContent: {
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  datePickerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerContent: {
    flex: 1,
    padding: 20,
  },
  datePickerDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  dateOptionsContainer: {
    gap: 12,
  },
  dateOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateOption: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7F5',
  },
  dateOptionContent: {
    flex: 1,
  },
  dateOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateOptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerNote: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  datePickerNoteText: {
    fontSize: 14,
    color: '#4F46E5',
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomActions: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceBreakdown: {
    marginBottom: 16,
  },
  totalPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalPriceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  trialDiscount: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  proceedButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  drawerContent: {
    flex: 1,
    padding: 20,
  },
  drawerAddOnCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDrawerAddOn: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7F5',
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addOnImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  drawerFooter: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  doneButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  variantPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  variantPillText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  addOnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addOnToggle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  addOnsContainer: {
    gap: 12,
  },
  selectedAddOn: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7F5',
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addOnDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addOnPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  addOnSelected: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySelectorContainer: {
    marginTop: 12,
  },
  daySelectorLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  dayChipActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF0EB',
  },
  dayChipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  dayChipTextActive: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  applyAllDaysNote: {
    marginTop: 6,
    fontSize: 12,
    color: '#10B981',
  },
  checkMark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});