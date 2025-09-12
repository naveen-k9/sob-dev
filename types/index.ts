export type UserRole = 'customer' | 'admin' | 'kitchen' | 'delivery';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  addresses: Address[];
  walletBalance: number;
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
  isActive: boolean;
  isGuest?: boolean;
  currentStreak: number;
  longestStreak: number;
  totalReferrals: number;
  referralEarnings: number;
  pushToken?: string;
}

export interface Polygon {
  id: string;
  points: Array<{
    latitude: number;
    longitude: number;
  }>;
  color: string;
  name: string;
  completed: boolean;
}

export interface Address {
  id: string;
  userId: string;
  type: 'home' | 'work' | 'other';
  label: string;
  name: string;
  phone: string;
  addressLine: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  deliveryInstructions?: string;

  phoneNumber: string;
  addressText: string;
  createdAt: Date;
 
}
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
export interface Category {
  id: string;
  name: string;
  image: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  images: string[];
  categoryId: string;
  price: number;
  originalPrice?: number;
  isVeg: boolean;
  hasEgg: boolean;
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  ingredients: string[];
  allergens: string[];
  isActive: boolean;
  isFeatured: boolean;
  isDraft: boolean;
  rating: number;
  reviewCount: number;
  preparationTime: number;
  tags: string[];
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  category: 'snack' | 'dessert' | 'beverage' | 'extra';
  isVeg?: boolean;
  isActive?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  days: number;
  discount: number;
  description: string;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  mealId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  deliveryTime?: string;
  deliveryTimeSlot?: string;
  excludeWeekends?: boolean;
  weekendExclusion?: 'both' | 'saturday' | 'sunday' | 'none';
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount: number;
  paidAmount?: number;
  remainingDeliveries?: number;
  totalDeliveries?: number;
  addressId?: string;
  addOns?: string[];
  specialInstructions?: string;
  createdAt: Date;
  assignedKitchenId?: string;
  assignedDeliveryId?: string;
  customerName?: string;
  phone?: string;
  planName?: string;
  duration?: number;
  skippedDates?: string[];
  additionalAddOns?: { [date: string]: string[] };
}

export interface Order {
  id: string;
  userId: string;
  subscriptionId?: string;
  items: OrderItem[];
  addOns: OrderAddOn[];
  totalAmount: number;
  deliveryFee: number;
  discount: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'waiting_for_ack' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  addressId: string;
  deliveryTime: string;
  deliveryPersonId?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  mealId: string;
  quantity: number;
  price: number;
  mealType: 'veg' | 'nonveg' | 'egg';
}

export interface OrderAddOn {
  addOnId: string;
  quantity: number;
  price: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  actionType: 'category' | 'meal' | 'offer' | 'external';
  actionValue: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: Date;
  endDate?: Date;
}

export interface Testimonial {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  discountType: 'percentage' | 'fixed' | 'cashback';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  promoCode?: string;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  offerType: 'discount' | 'cashback' | 'deal';
  longDescription?: string;
  terms?: string[];
  discount?: string;
  code?: string;
  validUntil?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  orderId?: string;
  referenceId?: string;
  createdAt: Date;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleNumber: string;
  isActive: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  isAvailable: boolean;
}

export interface KitchenStaff {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'chef' | 'assistant' | 'manager';
  isActive: boolean;
}

export interface ServiceableLocation {
  id: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  deliveryFee: number;
  isActive: boolean;
  polygon?: { latitude: number; longitude: number }[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'promotion' | 'system';
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'admin';
  message: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: Date;
  deliveryStatus: 'sent' | 'delivered' | 'read';
}

export interface CorporateCateringRequest {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  eventDate: Date;
  guestCount: number;
  requirements: string;
  budget?: number;
  status: 'pending' | 'contacted' | 'quoted' | 'confirmed' | 'completed';
  createdAt: Date;
}

export interface NutritionistContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  height: number;
  weight: number;
  dietaryRestrictions: string[];
  healthGoals: string;
  medicalConditions?: string;
  status: 'pending' | 'contacted' | 'consultation_scheduled' | 'completed';
  createdAt: Date;
}

export interface CartItem {
  id: string;
  type: 'meal' | 'subscription';
  mealId: string;
  planId?: string;
  quantity: number;
  addOns: string[];
  selectedDate?: string;
  mealType: 'veg' | 'nonveg' | 'egg';
  price: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  duration: number;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  mealsPerDay: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface LocationState {
  selectedLocation: ServiceableLocation | null;
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  isLocationServiceable: boolean;
}

export interface AppSettings {
  deliveryRadius: number;
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryAbove: number;
  orderCutoffTime: string;
  skipCutoffTime: string;
  addOnCutoffTime: string;
  kitchenStartTime: string;
  deliveryStartTime: string;
  supportPhone: string;
  supportEmail: string;
  whatsappNumber: string;
}

export interface ReferralReward {
  id: string;
  userId: string;
  referredUserId: string;
  referralCode: string;
  amount: number;
  status: 'pending' | 'credited';
  createdAt: Date;
  creditedAt?: Date;
}

export interface StreakReward {
  id: string;
  userId: string;
  streakCount: number;
  rewardAmount: number;
  status: 'pending' | 'credited';
  createdAt: Date;
  creditedAt?: Date;
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastOrderDate: Date;
  streakRewards: StreakReward[];
}