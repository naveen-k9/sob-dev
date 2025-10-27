import {
  Banner,
  Category,
  Meal,
  Testimonial,
  Offer,
  SubscriptionPlan,
  AddOn,
} from "@/types";

export const banners: Banner[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop",
    title: "Fresh Meals Daily",
    subtitle: "Healthy, delicious meals delivered to your door",
    actionType: "category",
    actionValue: "1",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop",
    title: "Subscribe & Save 20%",
    subtitle: "Get your first week free on any meal plan",
    actionType: "offer",
    actionValue: "welcome-free-meal",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop",
    title: "Protein Rich Meals",
    subtitle: "Perfect for your fitness goals",
    actionType: "category",
    actionValue: "3",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "4",
    image:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=400&fit=crop",
    title: "Authentic Indian Flavors",
    subtitle: "Traditional recipes with a modern twist",
    actionType: "category",
    actionValue: "5",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "5",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=400&fit=crop",
    title: "How We Cook",
    subtitle: "See our kitchen and cooking process",
    actionType: "external",
    actionValue: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "6",
    image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=400&fit=crop",
    title: "Nutrition Guide",
    subtitle: "Learn about healthy eating habits",
    actionType: "external",
    actionValue: "https://www.healthline.com/nutrition",
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "7",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop",
    title: "Fitness Tips",
    subtitle: "Workout routines to complement your meals",
    actionType: "external",
    actionValue: "https://www.bodybuilding.com/exercises",
    isActive: true,
    sortOrder: 7,
  },
];

export const categories: Category[] = [
  // ------------------ MEAL TIME ------------------
  {
    id: "breakfast",
    name: "Breakfast",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
    description:
      "Start your day with a healthy breakfast — chef’s choice menu with rotating South Indian and North Indian dishes.",
    isActive: true,
    sortOrder: 1,
    group: "meal-time",
  },
  {
    id: "lunch",
    name: "Lunch",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
    description:
      "Balanced and hearty lunch options — thalis, millet meals, and biryanis for all preferences.",
    isActive: true,
    sortOrder: 2,
    group: "meal-time",
  },
  {
    id: "dinner",
    name: "Dinner",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
    description:
      "Light and nutritious dinners — home-style or healthy chef’s specials for your evening meal.",
    isActive: true,
    sortOrder: 3,
    group: "meal-time",
  },

  // ------------------ HEALTH GOALS ------------------
  {
    id: "high-protein",
    name: "High Protein Meals",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
    description:
      "Meals designed to boost your protein intake — great for fitness and recovery.",
    isActive: true,
    sortOrder: 5,
    group: "collection",
  },
  {
    id: "low-calorie",
    name: "Low Calorie Meals",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
    description: "Light, wholesome meals for calorie-conscious eaters.",
    isActive: true,
    sortOrder: 6,
    group: "collection",
  },

  // ------------------ DRINKS & BOOSTERS ------------------
  {
    id: "drinks",
    name: "Drinks & Boosters",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
    description:
      "Cold-pressed juices, detox water, and protein shakes for energy and hydration.",
    isActive: true,
    sortOrder: 9,
    group: "collection",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
    description: "Diabetic Friendly and Calcium Rich Meals.",
    isActive: true,
    sortOrder: 12,
    group: "collection",
  },

  // ------------
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "1",
    name: "Meal Lite",
    duration: 2,
    originalPrice: 598,
    discountedPrice: 299,
    discount: 50,
    mealsPerDay: 1,
    description: "Perfect to try our service",
    features: ["2 Days Trial", "1 Meal/Day", "Free Delivery", "Cancel Anytime"],
  },
  {
    id: "2",
    name: "Basic Meal Plan",
    duration: 6,
    originalPrice: 1794,
    discountedPrice: 1499,
    discount: 16,
    mealsPerDay: 1,
    description: "Great for getting started",
    features: ["6 Working Days", "1 Meal/Day", "Free Delivery", "Weekend Off"],
    popular: true,
  },
  {
    id: "3",
    name: "Premium Meal Plan",
    duration: 15,
    originalPrice: 4485,
    discountedPrice: 3599,
    discount: 20,
    mealsPerDay: 1,
    description: "Most popular choice",
    features: [
      "15 Working Days",
      "1 Meal/Day",
      "Free Delivery",
      "Weekend Off",
      "₹100 Wallet Cashback",
    ],
  },
  {
    id: "4",
    name: "Elite Meal Plan",
    duration: 26,
    originalPrice: 7774,
    discountedPrice: 5999,
    discount: 23,
    mealsPerDay: 1,
    description: "Best value for money",
    features: [
      "26 Working Days",
      "1 Meal/Day",
      "Free Delivery",
      "Weekend Off",
      "₹200 Wallet Cashback",
      "Priority Support",
    ],
  },
];

export const addOns: AddOn[] = [
  {
    id: "boiled-egg",
    name: "Boiled Egg",
    description:
      "Simple protein-packed boiled egg — perfect add-on for any meal.",
    category: "add-ons",
    price: 25,
    isVeg: false,
    isActive: true,
    image:
      "https://images.unsplash.com/photo-1604908176997-431310be8d5e?w=300&h=300&fit=crop",
  },
  {
    id: "omelette",
    name: "Omelette",
    description: "Classic masala omelette. Add to your breakfast or lunch.",
    category: "add-ons",
    price: 39,
    isVeg: false,
    isActive: true,
    image:
      "https://images.unsplash.com/photo-1604908176997-431310be8d5e?w=300&h=300&fit=crop",
  },
  {
    id: "fruit-bowl",
    name: "Fruit Bowl",
    description: "Seasonal mixed fruit bowl. Healthy and refreshing add-on.",
    category: "add-ons",
    price: 59,
    isVeg: true,
    isActive: true,
    image:
      "https://images.unsplash.com/photo-1604908176997-431310be8d5e?w=300&h=300&fit=crop",
  },
  {
    id: "sprouts-bowl",
    name: "Sprouts Bowl",
    description:
      "Freshly sprouted green gram with lemon and spices. Great for mid-day snack.",
    category: "add-ons",
    price: 49,
    isVeg: true,
    isActive: true,
    image:
      "https://images.unsplash.com/photo-1604908176997-431310be8d5e?w=300&h=300&fit=crop",
  },
  {
    id: "sweet",
    name: "Dessert (Chef’s Choice)",
    description:
      "Rotating sweet of the day — kheer, halwa or gulab jamun. Chef’s selection.",
    category: "add-ons",
    price: 69,
    isVeg: true,
    isActive: true,
    image:
      "https://images.unsplash.com/photo-1604908176997-431310be8d5e?w=300&h=300&fit=crop",
  },
  {
    id: "chicken-curry-addon",
    name: "Chicken Curry (Add-on)",
    description:
      "Homestyle chicken curry add-on to enhance your thali or meal.",
    category: "add-ons",
    price: 99,
    isVeg: false,
    isActive: true,
    image:
      "https://images.unsplash.com/photo-1604908176997-431310be8d5e?w=300&h=300&fit=crop",
  },
  {
    id: "chicken-fry-addon",
    name: "Chicken Fry (Add-on)",
    description: "Spicy chicken fry add-on. Great with biryani or thali.",
    image:
      "https://images.unsplash.com/photo-1604908176997-431310be8d5e?w=300&h=300&fit=crop",
    category: "dessert",
    price: 109,
    isVeg: false,
    isActive: true,
  },
];

export const Meals: Meal[] = [
  // -------------------- BREAKFAST --------------------
  {
    id: "regular-breakfast",
    name: "Regular Breakfast",
    description:
      "Healthy Indian breakfast with rotating options like poha, upma, dosa, or paratha. Chef’s choice changes daily for freshness and balance.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "breakfast",
    categoryIds: ["breakfast"],
    price: 149,
    originalPrice: 169,
    isVeg: true,
    hasEgg: false,
    rating: 4.6,
    reviewCount: 220,
    tags: ["Chef’s Choice", "Home Style", "Healthy"],
    nutritionInfo: {
      calories: 400,
      protein: 10,
      carbs: 60,
      fat: 10,
      fiber: 5,
    },
    ingredients: ["Poha", "Upma", "Paratha", "Sambar", "Chutney"],
    allergens: ["Gluten"],
    isActive: true,
    isFeatured: false,
    isDraft: false,
    preparationTime: 20,
    availableTimeSlotIds: ["1"],
    addonIds: ["boiled-egg", "omelette", "fruit-bowl", "sprouts-bowl"],
  },

  // -------------------- LUNCH --------------------
  {
    id: "mini-meal",
    name: "Mini Meal (Veg/Non-Veg)",
    description:
      "Light and balanced lunch box with rice, dal, and one curry. Chef’s choice rotates daily to keep it fresh and interesting.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "lunch",
    categoryIds: ["lunch"],
    price: 169,
    originalPrice: 189,
    isVeg: true,
    hasEgg: false,
    rating: 4.5,
    reviewCount: 310,
    tags: ["Lunch", "Light Meal", "Chef’s Choice"],
    nutritionInfo: {
      calories: 480,
      protein: 15,
      carbs: 65,
      fat: 14,
      fiber: 6,
    },
    ingredients: ["Rice", "Dal", "Curry", "Salad"],
    allergens: ["Gluten"],
    isActive: true,
    isFeatured: false,
    isDraft: false,
    preparationTime: 25,
    variantPricing: { veg: 169, nonveg: 189 },
    availableTimeSlotIds: ["2"],
    addonIds: [
      "boiled-egg",
      "omelette",
      "fruit-bowl",
      "sprouts-bowl",
      "sweet",
      "chicken-curry-addon",
      "chicken-fry-addon",
    ],
  },
  {
    id: "basic-meal",
    name: "Basic Meal (Veg/Non-Veg)",
    description:
      "Everyday home-style thali with rice, roti, dal, and two seasonal curries. Chef’s choice menu changes daily.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "basic-meal",
    categoryIds: ["lunch"],
    price: 199,
    originalPrice: 229,
    isVeg: true,
    hasEgg: false,
    rating: 4.6,
    reviewCount: 412,
    tags: ["Chef’s Choice", "Home Style", "Balanced"],
    nutritionInfo: {
      calories: 550,
      protein: 18,
      carbs: 70,
      fat: 16,
      fiber: 8,
    },
    ingredients: ["Rice", "Roti", "Dal", "Curry", "Salad"],
    allergens: ["Gluten"],
    isActive: true,
    isFeatured: false,
    isDraft: false,
    preparationTime: 30,
    variantPricing: { veg: 199, nonveg: 229 },
    availableTimeSlotIds: ["2", "3"],
    addonIds: [
      "boiled-egg",
      "omelette",
      "fruit-bowl",
      "sprouts-bowl",
      "sweet",
      "chicken-curry-addon",
      "chicken-fry-addon",
    ],
  },
  {
    id: "millet-meal",
    name: "Millet Meal",
    description:
      "Wholesome millet-based meal with dal, sabzi, and salad. Perfect for those seeking low-GI, gluten-free nutrition.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "lunch",
    categoryIds: ["lunch"],
    price: 219,
    originalPrice: 249,
    isVeg: true,
    hasEgg: false,
    rating: 4.7,
    reviewCount: 180,
    tags: ["Healthy", "Gluten Free", "Chef’s Choice"],
    nutritionInfo: {
      calories: 500,
      protein: 20,
      carbs: 55,
      fat: 14,
      fiber: 9,
    },
    ingredients: ["Foxtail Millet", "Dal", "Veg Curry", "Salad"],
    allergens: [],
    isActive: true,
    isFeatured: true,
    preparationTime: 30,
    availableTimeSlotIds: ["2", "3"],
    isDraft: false,
    addonIds: ["fruit-bowl", "sprouts-bowl", "sweet"],
  },
  {
    id: "brown-rice-meal",
    name: "Meal with Brown Rice",
    description:
      "High-fiber brown rice meal with dal and seasonal curry. Great for weight watchers and diabetics.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "lunch",
    categoryIds: ["lunch"],
    price: 229,
    originalPrice: 259,
    isVeg: true,
    hasEgg: false,
    rating: 4.6,
    reviewCount: 200,
    tags: ["Healthy", "Chef’s Choice", "Low GI"],
    nutritionInfo: {
      calories: 480,
      protein: 17,
      carbs: 58,
      fat: 15,
      fiber: 8,
    },
    ingredients: ["Brown Rice", "Dal", "Curry", "Salad"],
    allergens: [],
    isActive: true,
    isFeatured: false,
    preparationTime: 30,
    availableTimeSlotIds: ["2", "3"],
    isDraft: false,
    addonIds: ["fruit-bowl", "sprouts-bowl", "sweet"],
  },

  // -------------------- DINNER --------------------
  {
    id: "basic-dinner",
    name: "Basic Dinner",
    description:
      "Light and comforting dinner with roti, sabzi, and salad. Chef’s choice menu rotates daily for variety.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "dinner",
    categoryIds: ["dinner"],
    price: 179,
    originalPrice: 209,
    isVeg: true,
    hasEgg: false,
    rating: 4.5,
    reviewCount: 250,
    tags: ["Dinner", "Light", "Chef’s Choice"],
    nutritionInfo: {
      calories: 420,
      protein: 15,
      carbs: 55,
      fat: 12,
      fiber: 6,
    },
    ingredients: ["Roti", "Sabzi", "Salad"],
    allergens: ["Gluten"],
    isActive: true,
    isFeatured: false,
    preparationTime: 25,
    availableTimeSlotIds: ["3", "4"],
    isDraft: false,
    addonIds: ["fruit-bowl", "sprouts-bowl", "sweet"],
  },
  {
    id: "healthy-dinner",
    name: "Healthy Dinner Bowl",
    description:
      "Balanced dinner bowl with quinoa/brown rice, dal, and steamed vegetables. Perfect for mindful eaters.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "dinner",
    categoryIds: ["dinner"],
    price: 249,
    originalPrice: 279,
    isVeg: true,
    hasEgg: false,
    rating: 4.7,
    reviewCount: 190,
    tags: ["Healthy", "Chef’s Choice", "Dinner"],
    nutritionInfo: {
      calories: 380,
      protein: 20,
      carbs: 45,
      fat: 10,
      fiber: 9,
    },
    ingredients: ["Quinoa", "Dal", "Steamed Vegetables", "Salad"],
    allergens: [],
    isActive: true,
    isFeatured: false,
    preparationTime: 25,
    availableTimeSlotIds: ["3", "4"],
    isDraft: false,
    addonIds: ["fruit-bowl", "sprouts-bowl"],
  },

  // -------------------- HEALTH GOALS --------------------
  {
    id: "high-protein-meal",
    name: "High Protein Meal",
    description:
      "Protein-rich meal with grilled chicken or paneer, brown rice, and veggies. Chef’s choice combinations daily.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "high-protein",
    categoryIds: ["high-protein"],
    price: 299,
    originalPrice: 339,
    isVeg: true,
    hasEgg: false,
    rating: 4.8,
    reviewCount: 160,
    tags: ["High Protein", "Healthy", "Chef’s Choice"],
    nutritionInfo: {
      calories: 480,
      protein: 35,
      carbs: 40,
      fat: 12,
      fiber: 7,
    },
    ingredients: ["Paneer/Chicken", "Brown Rice", "Vegetables", "Sauce"],
    allergens: ["Dairy"],
    isActive: true,
    isFeatured: false,
    preparationTime: 25,
    availableTimeSlotIds: ["2", "3"],
    isDraft: false,
    addonIds: [
      "boiled-egg",
      "omelette",
      "chicken-curry-addon",
      "chicken-fry-addon",
    ],
  },
  {
    id: "high-protein-salad",
    name: "High Protein Salad",
    description:
      "Fresh salad with grilled chicken/paneer, beans, and seeds. Perfect post-workout fuel.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "high-protein",
    categoryIds: ["high-protein", "breakfast"],
    price: 249,
    originalPrice: 279,
    isVeg: true,
    hasEgg: false,
    rating: 4.7,
    reviewCount: 140,
    tags: ["Salad", "Protein Rich", "Healthy"],
    nutritionInfo: {
      calories: 350,
      protein: 28,
      carbs: 20,
      fat: 10,
      fiber: 8,
    },
    ingredients: ["Paneer/Chicken", "Beans", "Lettuce", "Seeds"],
    allergens: ["Dairy"],
    isActive: true,
    isFeatured: false,
    preparationTime: 20,
    availableTimeSlotIds: ["2", "3", "4"],
    isDraft: false,
    addonIds: ["boiled-egg", "omelette", "sprouts-bowl"],
  },
  {
    id: "protein-shake",
    name: "Protein Shake",
    description:
      "Thick and creamy protein shake — chocolate, vanilla or banana. Select delivery days you prefer.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "drinks",
    categoryIds: ["drinks", "high-protein"],
    price: 149,
    isVeg: true,
    hasEgg: false,
    rating: 4.5,
    reviewCount: 120,
    tags: ["Drink", "Protein", "Fixed"],
    nutritionInfo: {
      calories: 220,
      protein: 25,
      carbs: 8,
      fat: 4,
      fiber: 2,
    },
    ingredients: ["Whey Protein", "Milk", "Banana"],
    allergens: ["Dairy"],
    isActive: true,
    isFeatured: false,
    allowDaySelection: true,
    preparationTime: 5,
    availableTimeSlotIds: ["1", "2", "3", "4"],
    isDraft: false,
    addonIds: ["boiled-egg", "fruit-bowl"],
  },

  // -------------------- LOW CALORIE --------------------
  {
    id: "low-calorie-meal",
    name: "Low Calorie Meal",
    description:
      "Under 400 calorie meal with brown rice, dal, and sauteed veggies. Ideal for weight management.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "low-calorie",
    categoryIds: ["low-calorie"],
    price: 239,
    originalPrice: 269,
    isVeg: true,
    rating: 4.6,
    reviewCount: 95,
    tags: ["Low Calorie", "Healthy", "Chef’s Choice"],
    nutritionInfo: {
      calories: 380,
      protein: 18,
      carbs: 45,
      fat: 10,
      fiber: 8,
    },
    ingredients: ["Brown Rice", "Dal", "Vegetables", "Salad"],
    allergens: [],
    isActive: true,
    isFeatured: true,
    preparationTime: 25,
    availableTimeSlotIds: ["2", "3"],
    isDraft: false,
    hasEgg: false,
    addonIds: ["fruit-bowl", "sprouts-bowl"],
  },
  {
    id: "low-calorie-salad",
    name: "Low Calorie Salad",
    description:
      "Fresh low-calorie salad with greens, sprouts, and lemon dressing. Fixed menu.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "low-calorie",
    categoryIds: ["low-calorie", "breakfast"],
    price: 179,
    isVeg: true,
    rating: 4.5,
    reviewCount: 80,
    tags: ["Healthy", "Salad", "Fixed"],
    nutritionInfo: {
      calories: 200,
      protein: 8,
      carbs: 25,
      fat: 6,
      fiber: 6,
    },
    ingredients: ["Lettuce", "Sprouts", "Cucumber", "Lemon Dressing"],
    allergens: [],
    isActive: true,
    isFeatured: true,
    preparationTime: 10,
    availableTimeSlotIds: ["1", "2", "3"],
    isDraft: false,
    hasEgg: false,
    addonIds: ["sprouts-bowl", "fruit-bowl"],
  },

  // -------------------- LIFESTYLE --------------------
  {
    id: "diabetic-friendly-meal",
    name: "Diabetic Friendly Meal",
    description:
      "Low GI millet or brown rice meal, rich in fiber and nutrients. Designed for steady energy release.",
    images: [
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=300&fit=crop",
    ],
    categoryId: "lifestyle",
    categoryIds: ["lifestyle", "low-calorie"],
    price: 249,
    originalPrice: 279,
    isVeg: true,
    rating: 4.6,
    reviewCount: 120,
    tags: ["Healthy", "Low GI", "Chef’s Choice"],
    nutritionInfo: {
      calories: 420,
      protein: 18,
      carbs: 50,
      fat: 12,
      fiber: 9,
    },
    ingredients: ["Millet", "Dal", "Curry", "Salad"],
    allergens: [],
    isActive: true,
    isFeatured: true,
    preparationTime: 25,
    availableTimeSlotIds: ["2", "3"],
    isDraft: false,
    hasEgg: false,
    addonIds: ["fruit-bowl", "sprouts-bowl"],
  },
  {
    id: "calcium-rich-meal",
    name: "Calcium Rich Meal",
    description:
      "High-calcium meal with paneer, sesame, and greens. Chef’s curated for bone health.",
    images: [
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop",
    ],
    categoryId: "lifestyle",
    categoryIds: ["lifestyle", "low-calorie"],
    price: 259,
    isVeg: true,
    rating: 4.7,
    reviewCount: 85,
    tags: ["Healthy", "Calcium", "Chef’s Choice"],
    nutritionInfo: {
      calories: 460,
      protein: 20,
      carbs: 50,
      fat: 14,
      fiber: 8,
    },
    ingredients: ["Paneer", "Spinach", "Sesame", "Dal", "Salad"],
    allergens: ["Dairy", "Sesame"],
    isActive: true,
    isFeatured: true,
    preparationTime: 25,
    availableTimeSlotIds: ["2", "3"],
    isDraft: false,
    hasEgg: false,
    addonIds: ["fruit-bowl", "sprouts-bowl"],
  },

  // -------------------- DRINKS & BOOSTERS --------------------
  {
    id: "detox-water",
    name: "Detox Water",
    description:
      "Infused detox water with lemon, mint, and cucumber. Select your preferred delivery days.",
    images: [
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=300&fit=crop",
    ],
    categoryId: "drinks",
    categoryIds: ["drinks"],
    price: 79,
    isVeg: true,
    allowDaySelection: true,
    rating: 4.4,
    reviewCount: 60,
    tags: ["Drink", "Detox", "Fixed"],
    nutritionInfo: { calories: 10, protein: 0, carbs: 2, fat: 0, fiber: 0 },
    ingredients: ["Water", "Lemon", "Mint", "Cucumber"],
    allergens: [],
    isActive: true,
    isFeatured: false,
    preparationTime: 5,
    availableTimeSlotIds: ["1", "2", "3", "4"],
    isDraft: false,
    hasEgg: false,
    addonIds: [],
  },
  {
    id: "coldpress-juice",
    name: "Coldpress Juice",
    description:
      "Cold-pressed juice from seasonal fruits and vegetables. Choose delivery days.",
    images: [
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=300&fit=crop",
    ],
    categoryId: "drinks",
    categoryIds: ["drinks"],
    price: 99,
    allowDaySelection: true,
    isVeg: true,
    rating: 4.5,
    reviewCount: 100,
    tags: ["Juice", "Healthy", "Fresh"],
    nutritionInfo: {
      calories: 90,
      protein: 2,
      carbs: 20,
      fat: 0,
      fiber: 1,
    },
    ingredients: ["Apple", "Carrot", "Ginger", "Lemon"],
    allergens: [],
    isActive: true,
    isFeatured: true,
    preparationTime: 5,
    availableTimeSlotIds: ["1", "2", "3"],
    isDraft: false,
    hasEgg: false,
    addonIds: [],
  },

  // -------------------- ADD-ONS --------------------
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    userName: "Priya Sharma",
    userImage:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment:
      "Amazing food quality and timely delivery. The subscription has made my life so much easier!",
    isActive: true,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    userName: "Rahul Gupta",
    userImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment:
      "Perfect for my fitness goals. High protein meals that actually taste great!",
    isActive: true,
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "3",
    userName: "Anita Patel",
    userImage:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    comment: "Love the variety and freshness. My family enjoys every meal!",
    isActive: true,
    createdAt: new Date("2024-01-25"),
  },
  {
    id: "4",
    userName: "Arjun Singh",
    userImage:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment:
      "The Indian meals taste just like home. Excellent service and packaging!",
    isActive: true,
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "5",
    userName: "Sneha Reddy",
    userImage:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    comment:
      "Great vegan options! Finally found a service that caters to my dietary needs.",
    isActive: true,
    createdAt: new Date("2024-02-05"),
  },
];

export const offers: Offer[] = [
  {
    id: "welcome-free-meal",
    title: "Get 1 Meal Free on your first order",
    description:
      "New here? Enjoy your first meal on us when you place your first order or start a plan.",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=120&fit=crop",
    discountType: "percentage",
    discountValue: 100,
    promoCode: "FIRSTMEAL",
    validFrom: new Date("2024-01-01"),
    validTo: new Date("2025-12-31"),
    isActive: true,
    usageLimit: 100000,
    usedCount: 0,
    offerType: "discount",
    discount: "1st Meal Free",
    code: "FIRSTMEAL",
    validUntil: "Dec 31, 2025",
    longDescription:
      "Welcome offer for new users. Apply FIRSTMEAL at checkout to get your first meal free.",
    terms: [
      "Valid for first order only",
      "Applicable on meals and subscriptions",
      "Cannot be combined with other coupons",
      "Auto-applies where eligible",
    ],
    benefitType: "meal",
  },
  {
    id: "refer-earn-meals",
    title: "Refer and earn meals as many as you can",
    description:
      "Share your code. When friends order, you both earn free meals. No cap on how many you can earn.",
    image:
      "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=200&h=120&fit=crop",
    discountType: "percentage",
    discountValue: 0,
    validFrom: new Date("2024-01-01"),
    validTo: new Date("2025-12-31"),
    isActive: true,
    usageLimit: 0,
    usedCount: 0,
    offerType: "deal",
    discount: "Free Meals via Referrals",
    longDescription:
      "Invite friends using your referral code. On their first successful order, both of you earn free meal credits. Unlimited referrals allowed during the campaign period.",
    terms: [
      "New user must complete a paid order",
      "Credits are added within 24 hours of delivery",
      "No upper limit on referrals",
      "Non-transferable",
    ],
  },
  {
    id: "save-100-coupon",
    title: "Coupon Codes, 100 OFF",
    description: "Flat ₹100 OFF on eligible orders. Limited time.",
    image:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=120&fit=crop",
    discountType: "fixed",
    discountValue: 100,
    promoCode: "SAVE100",
    validFrom: new Date("2024-01-01"),
    validTo: new Date("2025-12-31"),
    isActive: true,
    usageLimit: 100000,
    usedCount: 0,
    offerType: "discount",
    discount: "₹100 OFF",
    code: "SAVE100",
    validUntil: "Dec 31, 2025",
    longDescription:
      "Apply SAVE100 at checkout to get flat ₹100 OFF. Minimum order value may apply in some regions.",
    terms: [
      "Applicable on eligible items only",
      "May require minimum order value",
      "Cannot be clubbed with wallet cashback",
      "Limited time offer",
    ],
    benefitType: "amount",
  },
];

// Storage for subscriptions
export let userSubscriptions: any[] = [];

// Wallet transactions for cashback tracking
export let walletTransactions: any[] = [];

export const addSubscription = (subscription: any) => {
  userSubscriptions.push({
    ...subscription,
    id: Date.now().toString(),
    createdAt: new Date(),
  });
};

export const getUserSubscriptions = (userId: string) => {
  return userSubscriptions.filter((sub) => sub.userId === userId);
};

// Delivery time slots
export const deliveryTimeSlots = [
  { id: "1", time: "12:00 PM - 1:00 PM", label: "Lunch Time" },
  { id: "2", time: "1:00 PM - 2:00 PM", label: "Afternoon" },
  { id: "3", time: "7:00 PM - 8:00 PM", label: "Dinner Time" },
  { id: "4", time: "8:00 PM - 9:00 PM", label: "Late Dinner" },
];

// Promotional Section Data (Admin Controllable)
export interface PromotionalItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  backgroundColor: string;
  textColor: string;
  icon?: string;
  actionType: "category" | "offer" | "external" | "meal";
  actionValue: string;
  size: "large" | "medium" | "small";
  position: number;
  isActive: boolean;
}

export const promotionalSections = {
  // Festival/Event Section (like Vinayaka Chavithi in the image)
  festival: {
    title: "Celebrate Vinayaka Chavithi",
    backgroundColor: "#FFF8E1", // Light yellow background
    items: [
      {
        id: "festival-main",
        title: "Get a FREE Laddu Box",
        subtitle: "on orders above ₹999",
        image:
          "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=200&h=200&fit=crop",
        backgroundColor: "#FF8F00",
        textColor: "#FFFFFF",
        icon: "gift",
        actionType: "offer" as const,
        actionValue: "LADDU999",
        size: "large" as const,
        position: 1,
        isActive: true,
      },
      {
        id: "festival-1",
        title: "Idols & Pooja Needs",
        image:
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
        backgroundColor: "#FFA726",
        textColor: "#FFFFFF",
        actionType: "category" as const,
        actionValue: "pooja",
        size: "medium" as const,
        position: 2,
        isActive: true,
      },
      {
        id: "festival-2",
        title: "Festive Get-Togethers",
        image:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop",
        backgroundColor: "#FF7043",
        textColor: "#FFFFFF",
        actionType: "category" as const,
        actionValue: "party-meals",
        size: "medium" as const,
        position: 3,
        isActive: true,
      },
      {
        id: "festival-3",
        title: "Modak & Sweets",
        image:
          "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop",
        backgroundColor: "#8BC34A",
        textColor: "#FFFFFF",
        actionType: "category" as const,
        actionValue: "sweets",
        size: "small" as const,
        position: 4,
        isActive: true,
      },
      {
        id: "festival-4",
        title: "Home Decor",
        image:
          "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop",
        backgroundColor: "#9C27B0",
        textColor: "#FFFFFF",
        actionType: "category" as const,
        actionValue: "decor",
        size: "small" as const,
        position: 5,
        isActive: true,
      },
      {
        id: "festival-5",
        title: "Festive Ready",
        image:
          "https://images.unsplash.com/photo-1544441893-675973e31985?w=200&h=200&fit=crop",
        backgroundColor: "#E91E63",
        textColor: "#FFFFFF",
        actionType: "category" as const,
        actionValue: "ready-meals",
        size: "small" as const,
        position: 6,
        isActive: true,
      },
      {
        id: "festival-6",
        title: "Festival Recipes",
        image:
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop",
        backgroundColor: "#673AB7",
        textColor: "#FFFFFF",
        actionType: "external" as const,
        actionValue:
          "https://www.indianhealthyrecipes.com/recipes/festival-recipes/",
        size: "small" as const,
        position: 7,
        isActive: true,
      },
    ],
  },
  // Regular promotional section (can be changed by admin)
  weekly: {
    title: "This Week's Special",
    backgroundColor: "#E8F5E8",
    items: [
      {
        id: "weekly-main",
        title: "Healthy Meal Plans",
        subtitle: "Starting from ₹199/day",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop",
        backgroundColor: "#4CAF50",
        textColor: "#FFFFFF",
        icon: "star",
        actionType: "offer" as const,
        actionValue: "HEALTHY199",
        size: "large" as const,
        position: 1,
        isActive: true,
      },
      {
        id: "weekly-1",
        title: "Protein Power",
        image:
          "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop",
        backgroundColor: "#FF5722",
        textColor: "#FFFFFF",
        actionType: "category" as const,
        actionValue: "3",
        size: "medium" as const,
        position: 2,
        isActive: true,
      },
      {
        id: "weekly-2",
        title: "Quick Delivery",
        image:
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop",
        backgroundColor: "#2196F3",
        textColor: "#FFFFFF",
        actionType: "offer" as const,
        actionValue: "QUICK30",
        size: "medium" as const,
        position: 3,
        isActive: true,
      },
      {
        id: "weekly-3",
        title: "Vegan",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop",
        backgroundColor: "#8BC34A",
        textColor: "#FFFFFF",
        actionType: "category" as const,
        actionValue: "4",
        size: "small" as const,
        position: 4,
        isActive: true,
      },
      {
        id: "weekly-4",
        title: "Indian",
        image:
          "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop",
        backgroundColor: "#FF9800",
        textColor: "#FFFFFF",
        actionType: "category" as const,
        actionValue: "5",
        size: "small" as const,
        position: 5,
        isActive: true,
      },
      {
        id: "weekly-5",
        title: "Desserts",
        image:
          "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop",
        backgroundColor: "#E91E63",
        textColor: "#FFFFFF",
        actionType: "category" as const,
        actionValue: "7",
        size: "small" as const,
        position: 6,
        isActive: true,
      },
    ],
  },
};

// Function to get active promotional section (admin can control which one to show)
export const getActivePromotionalSection = () => {
  // Admin can change this to show different sections
  // For now, showing festival section
  return promotionalSections.festival;
};
