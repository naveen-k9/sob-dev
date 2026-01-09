import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useRouter } from 'expo-router';
import { ArrowLeft, Check, Star, Clock, Truck, Shield } from 'lucide-react-native';
import { subscriptionPlans, addOns } from '@/constants/data';
import { SubscriptionPlan } from '@/types';

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(subscriptionPlans[1]);
  const [selectedMealType, setSelectedMealType] = useState<'veg' | 'non-veg' | 'egg'>('veg');
  const [weekendExclusion, setWeekendExclusion] = useState<'both' | 'saturday' | 'sunday' | 'none'>('both');
  const [startDate, setStartDate] = useState<string>('Tomorrow');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const routerInstance = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  React.useEffect(() => {
    setCanGoBack(routerInstance.canGoBack());
  }, []);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotalPrice = () => {
    if (!selectedPlan) return 0;
    const addOnTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOns.find(a => a.id === addOnId);
      return total + (addOn ? addOn.price * selectedPlan.duration : 0);
    }, 0);
    return selectedPlan.discountedPrice + addOnTotal;
  };

  const handleSubscribe = () => {
    if (!selectedPlan) return;

    const payload = {
      plan: selectedPlan,
      meal: { id: '1', name: 'Selected Meal', price: Math.round(selectedPlan.discountedPrice / selectedPlan.duration) },
      timeSlot: { time: '12:00 PM - 1:00 PM' },
      weekendExclusion,
      startDate: new Date().toISOString(),
      addOns: selectedAddOns.map((id) => ({ id })),
      isTrialMode: selectedPlan.duration <= 2,
      totalPrice: calculateTotalPrice(),
    };

    router.push({ pathname: './checkout', params: { subscriptionData: JSON.stringify(payload) } });
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan?.id === plan.id;
    const pricePerMeal = Math.round(plan.discountedPrice / plan.duration);
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
          plan.popular && styles.popularPlan,
        ]}
        onPress={() => handlePlanSelect(plan)}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Star size={12} color="white" fill="white" />
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.discountedPrice}>₹{plan.discountedPrice}</Text>
            <Text style={styles.originalPrice}>₹{plan.originalPrice}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{plan.discount}% OFF</Text>
            </View>
          </View>
          <Text style={styles.pricePerMeal}>₹{pricePerMeal}/meal</Text>
        </View>
        
        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Check size={14} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Check size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Choose Your Plan',
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Subscribe & Save</Text>
          <Text style={styles.subtitle}>
            Get fresh, healthy meals delivered daily. Cancel anytime.
          </Text>
        </View>
        
        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Clock size={20} color="#48479B" />
            <Text style={styles.benefitText}>Daily Fresh Meals</Text>
          </View>
          <View style={styles.benefitItem}>
            <Truck size={20} color="#48479B" />
            <Text style={styles.benefitText}>Free Delivery</Text>
          </View>
          <View style={styles.benefitItem}>
            <Shield size={20} color="#48479B" />
            <Text style={styles.benefitText}>Cancel Anytime</Text>
          </View>
        </View>
        
        {/* Plans */}
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {subscriptionPlans.map(renderPlanCard)}
        </View>
        
        {/* Meal Type Selection */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Meal Preference</Text>
          <View style={styles.mealTypeContainer}>
            {(['veg', 'non-veg', 'egg'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mealTypeButton,
                  selectedMealType === type && styles.selectedMealType,
                ]}
                onPress={() => setSelectedMealType(type)}
              >
                <Text style={[
                  styles.mealTypeText,
                  selectedMealType === type && styles.selectedMealTypeText,
                ]}>
                  {type === 'veg' ? '🥬 Vegetarian' : type === 'non-veg' ? '🍖 Non-Veg' : '🥚 Egg'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Weekend Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Exclude Days</Text>
          <View style={styles.mealTypeContainer}>
            {(['none','saturday','sunday','both'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.mealTypeButton,
                  weekendExclusion === opt && styles.selectedMealType,
                ]}
                onPress={() => setWeekendExclusion(opt)}
                testID={`exclude-${opt}`}
              >
                <Text style={[styles.mealTypeText, weekendExclusion === opt && styles.selectedMealTypeText]}>
                  {opt === 'none' ? 'None' : opt === 'both' ? 'Sat & Sun' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Add-ons */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Add-ons (Optional)</Text>
          <Text style={styles.sectionSubtitle}>Enhance your meal experience</Text>
          <View style={styles.addOnsContainer}>
            {addOns.map((addOn) => {
              const isSelected = selectedAddOns.includes(addOn.id);
              return (
                <TouchableOpacity
                  key={addOn.id}
                  style={[
                    styles.addOnCard,
                    isSelected && styles.selectedAddOn,
                  ]}
                  onPress={() => handleAddOnToggle(addOn.id)}
                >
                  <View style={styles.addOnImageContainer}>
                    <Text style={styles.addOnEmoji}>
                      {addOn.category === 'snack' ? '🥗' : 
                       addOn.category === 'dessert' ? '🍰' : 
                       addOn.category === 'beverage' ? '🥤' : '🍽️'}
                    </Text>
                  </View>
                  <View style={styles.addOnInfo}>
                    <Text style={styles.addOnName}>{addOn.name}</Text>
                    <Text style={styles.addOnDescription}>{addOn.description}</Text>
                    <Text style={styles.addOnPrice}>₹{addOn.price}/day</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.addOnSelected}>
                      <Check size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Start Date */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Start Date</Text>
          <View style={styles.startDateContainer}>
            {['Tomorrow', 'Day After Tomorrow', 'Next Monday'].map((date) => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateButton,
                  startDate === date && styles.selectedDate,
                ]}
                onPress={() => setStartDate(date)}
              >
                <Text style={[
                  styles.dateText,
                  startDate === date && styles.selectedDateText,
                ]}>
                  {date}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Bottom CTA */}
      {selectedPlan && (
        <View style={styles.bottomContainer}>
          <View style={styles.summaryContainer}>
            <View>
              <Text style={styles.summaryText}>
                {selectedPlan.name} • {selectedPlan.duration} days
              </Text>
              {selectedAddOns.length > 0 && (
                <Text style={styles.summaryAddOns}>
                  + {selectedAddOns.length} add-on{selectedAddOns.length > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <Text style={styles.summaryPrice}>₹{calculateTotalPrice()}</Text>
          </View>
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  benefitItem: {
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    fontWeight: '600',
  },
  plansContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#48479B',
  },
  popularPlan: {
    borderColor: '#10B981',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#48479B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  pricePerMeal: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#48479B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mealTypeButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedMealType: {
    borderColor: '#48479B',
    backgroundColor: 'rgba(163, 211, 151, 0.27)',
  },
  mealTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectedMealTypeText: {
    color: '#48479B',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkedBox: {
    backgroundColor: '#48479B',
    borderColor: '#48479B',
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  startDateContainer: {
    gap: 12,
  },
  dateButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedDate: {
    borderColor: '#48479B',
    backgroundColor: 'rgba(163, 211, 151, 0.27)',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedDateText: {
    color: '#48479B',
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#48479B',
  },
  subscribeButton: {
    backgroundColor: '#48479B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    marginTop: -8,
  },
  addOnsContainer: {
    gap: 12,
  },
  addOnCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  selectedAddOn: {
    borderColor: '#48479B',
    backgroundColor: 'rgba(163, 211, 151, 0.27)',
  },
  addOnImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addOnEmoji: {
    fontSize: 24,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  addOnDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  addOnPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48479B',
  },
  addOnSelected: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#48479B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryAddOns: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});