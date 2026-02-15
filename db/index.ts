import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  Address,
  Category,
  Meal,
  AddOn,
  Plan,
  Subscription,
  DeliveryDayLogEntry,
  Order,
  Banner,
  Testimonial,
  Offer,
  WalletTransaction,
  DeliveryPerson,
  KitchenStaff,
  ServiceableLocation,
  Notification,
  FAQ,
  SupportTicket,
  CorporateCateringRequest,
  NutritionistContact,
  CartItem,
  UserRole,
  AppSettings,
  ReferralReward,
  StreakReward,
  UserStreak,
  SupportMessage,
  TimeSlot,
} from "@/types";
import {
  fetchUsers as fbFetchUsers,
  createUser as fbCreateUser,
  updateUser as fbUpdateUser,
  fetchSubscriptions as fbFetchSubscriptions,
  createSubscription as fbCreateSubscription,
  updateSubscriptionDoc as fbUpdateSubscription,
  fetchServiceableLocations as fbFetchServiceableLocations,
  createServiceableLocation as fbCreateServiceableLocation,
  updateServiceableLocation as fbUpdateServiceableLocation,
  deleteServiceableLocation as fbDeleteServiceableLocation,
} from "@/services/firebase";

class Database {
  private static instance: Database;
  private initialized = false;

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Clear cached AsyncStorage data to force fetch from Firebase
  async clearCatalogCache(): Promise<void> {
    try {
      console.log(
        "[db] Clearing catalog cache (categories, meals, addons) to fetch from Firebase..."
      );
      await AsyncStorage.multiRemove(["categories", "meals", "addOns"]);
      console.log("[db] Catalog cache cleared successfully");
    } catch (error) {
      console.error("[db] Error clearing catalog cache:", error);
    }
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.seedData();
      this.initialized = true;
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  private async seedData() {
    const existingUsers = await this.getItem("users");
    if (!existingUsers) {
      console.log("Seeding initial data...");
      await this.setItem("users", this.getInitialUsers());
      // NOTE: Categories, meals, and addons are NOT seeded to AsyncStorage
      // They will be fetched from Firebase as the primary source of truth
      // await this.setItem("categories", this.getInitialCategories());
      // await this.setItem("meals", this.getInitialMeals());
      // await this.setItem("addOns", this.getInitialAddOns());
      await this.setItem("plans", this.getInitialPlans());
      await this.setItem("banners", this.getInitialBanners());
      await this.setItem("testimonials", this.getInitialTestimonials());
      await this.setItem("offers", this.getInitialOffers());
      await this.setItem("timeSlots", this.getInitialTimeSlots());
      await this.setItem(
        "serviceableLocations",
        this.getInitialServiceableLocations()
      );
      await this.setItem("deliveryPersons", this.getInitialDeliveryPersons());
      await this.setItem("kitchenStaff", this.getInitialKitchenStaff());
      await this.setItem("faqs", this.getInitialFAQs());
      const initialSettings = this.getInitialAppSettings();
      await this.setItem("appSettings", initialSettings);
      console.log("Initial app settings saved:", initialSettings);
      await this.setItem("subscriptions", this.getInitialSubscriptions());
      await this.setItem("orders", []);
      await this.setItem("walletTransactions", []);
      await this.setItem("notifications", []);
      await this.setItem("supportTickets", this.getInitialSupportTickets());
      await this.setItem("supportMessages", this.getInitialSupportMessages());
      await this.setItem("corporateCateringRequests", []);
      await this.setItem("nutritionistContacts", []);
      await this.setItem("notifyRequests", []);
      await this.setItem("referralRewards", []);
      await this.setItem("streakRewards", []);
      await this.setItem("userStreaks", []);
      console.log(
        "Initial data seeding completed (categories/meals/addons from Firebase)"
      );
    } else {
      // Ensure app settings exist even if users exist
      const existingSettings = await this.getItem("appSettings");
      if (!existingSettings) {
        const initialSettings = this.getInitialAppSettings();
        await this.setItem("appSettings", initialSettings);
        console.log(
          "App settings initialized for existing database:",
          initialSettings
        );
      }
    }
  }

  private async getItem(key: string): Promise<any> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  private async setItem(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    try {
      const users = await fbFetchUsers();
      return users;
    } catch (e) {
      console.log(
        "[db] fetchUsers from firebase failed, falling back to local storage",
        e
      );
      return (await this.getItem("users")) || [];
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((user) => user.id === id) || null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((user) => user.phone === phone) || null;
  }

  async createUser(
    userData: Omit<
      User,
      | "id"
      | "createdAt"
      | "referralCode"
      | "currentStreak"
      | "longestStreak"
      | "totalReferrals"
      | "referralEarnings"
    >
  ): Promise<User> {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      referralCode: this.generateReferralCode(),
      currentStreak: 0,
      longestStreak: 0,
      totalReferrals: 0,
      referralEarnings: 0,
      walletBalance: userData.walletBalance ?? 500,
    } as User;
    try {
      await fbCreateUser(newUser);
    } catch (e) {
      console.log("[db] createUser on firebase failed, caching locally", e);
      const usersLocal = (await this.getItem("users")) || [];
      usersLocal.push(newUser);
      await this.setItem("users", usersLocal);
    }

    await this.initializeUserStreak(newUser.id);

    if (userData.referredBy) {
      await this.processReferral(userData.referredBy, newUser.id);
    }

    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      await fbUpdateUser(id, updates);
      const refreshed = await this.getUsers();
      const updated = refreshed.find((u) => u.id === id) || null;
      return updated;
    } catch (e) {
      console.log(
        "[db] updateUser on firebase failed, updating local cache",
        e
      );
      const users = (await this.getItem("users")) || [];
      const index = users.findIndex((user: User) => user.id === id);
      if (index === -1) return null;
      users[index] = { ...users[index], ...updates };
      await this.setItem("users", users);
      return users[index];
    }
  }

  // Address methods - Production ready with Firebase sync
  async addAddress(
    userId: string,
    addressData: Omit<Address, "id" | "userId">
  ): Promise<Address> {
    try {
      // Try Firebase first
      const { addUserAddress } = await import("@/services/firebase");
      const newAddress = await addUserAddress(userId, addressData);
      console.log("[db] ✅ Address added to Firebase:", newAddress.id);

      // Sync to local storage for offline access
      try {
        const users = (await this.getItem("users")) || [];
        const userIndex = users.findIndex((user: User) => user.id === userId);
        if (userIndex !== -1) {
          users[userIndex].addresses.push(newAddress);
          await this.setItem("users", users);
        }
      } catch (localError) {
        console.log(
          "[db] Local storage sync failed (non-critical):",
          localError
        );
      }

      return newAddress;
    } catch (firebaseError) {
      console.warn(
        "[db] ⚠️ Firebase operation failed, using local storage:",
        firebaseError
      );

      // Fallback to local storage
      const users = (await this.getItem("users")) || [];
      const userIndex = users.findIndex((user: User) => user.id === userId);
      if (userIndex === -1) {
        throw new Error("User not found");
      }

      const newAddress: Address = {
        ...addressData,
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      users[userIndex].addresses.push(newAddress);
      await this.setItem("users", users);
      console.log("[db] ✅ Address saved to local storage:", newAddress.id);
      return newAddress;
    }
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updates: Partial<Address>
  ): Promise<Address | null> {
    try {
      // Try Firebase first
      const { updateUserAddress } = await import("@/services/firebase");
      const updatedAddress = await updateUserAddress(
        userId,
        addressId,
        updates
      );
      console.log("[db] ✅ Address updated in Firebase:", addressId);

      // Sync to local storage
      try {
        const users = (await this.getItem("users")) || [];
        const userIndex = users.findIndex((user: User) => user.id === userId);
        if (userIndex !== -1) {
          const addressIndex = users[userIndex].addresses.findIndex(
            (addr: Address) => addr.id === addressId
          );
          if (addressIndex !== -1) {
            users[userIndex].addresses[addressIndex] = updatedAddress;
            await this.setItem("users", users);
          }
        }
      } catch (localError) {
        console.log(
          "[db] Local storage sync failed (non-critical):",
          localError
        );
      }

      return updatedAddress;
    } catch (firebaseError) {
      console.warn(
        "[db] ⚠️ Firebase operation failed, using local storage:",
        firebaseError
      );

      // Fallback to local storage
      const users = (await this.getItem("users")) || [];
      const userIndex = users.findIndex((user: User) => user.id === userId);
      if (userIndex === -1) return null;

      const addressIndex = users[userIndex].addresses.findIndex(
        (addr: Address) => addr.id === addressId
      );
      if (addressIndex === -1) return null;

      users[userIndex].addresses[addressIndex] = {
        ...users[userIndex].addresses[addressIndex],
        ...updates,
        updatedAt: new Date(),
      };
      await this.setItem("users", users);
      return users[userIndex].addresses[addressIndex];
    }
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    try {
      // Try Firebase first
      const { deleteUserAddress } = await import("@/services/firebase");
      await deleteUserAddress(userId, addressId);
      console.log("[db] ✅ Address deleted from Firebase:", addressId);

      // Sync to local storage
      try {
        const users = (await this.getItem("users")) || [];
        const userIndex = users.findIndex((user: User) => user.id === userId);
        if (userIndex !== -1) {
          const addressIndex = users[userIndex].addresses.findIndex(
            (addr: Address) => addr.id === addressId
          );
          if (addressIndex !== -1) {
            const wasDefault =
              users[userIndex].addresses[addressIndex].isDefault;
            users[userIndex].addresses = users[userIndex].addresses.filter(
              (addr: Address) => addr.id !== addressId
            );
            if (wasDefault && users[userIndex].addresses.length > 0) {
              users[userIndex].addresses[0].isDefault = true;
            }
            await this.setItem("users", users);
          }
        }
      } catch (localError) {
        console.log(
          "[db] Local storage sync failed (non-critical):",
          localError
        );
      }
    } catch (firebaseError) {
      console.warn(
        "[db] ⚠️ Firebase operation failed, using local storage:",
        firebaseError
      );

      // Fallback to local storage
      const users = (await this.getItem("users")) || [];
      const userIndex = users.findIndex((user: User) => user.id === userId);
      if (userIndex === -1) {
        throw new Error("User not found");
      }

      const addressIndex = users[userIndex].addresses.findIndex(
        (addr: Address) => addr.id === addressId
      );
      if (addressIndex === -1) {
        throw new Error("Address not found");
      }

      const wasDefault = users[userIndex].addresses[addressIndex].isDefault;
      users[userIndex].addresses = users[userIndex].addresses.filter(
        (addr: Address) => addr.id !== addressId
      );

      if (wasDefault && users[userIndex].addresses.length > 0) {
        users[userIndex].addresses[0].isDefault = true;
      }

      await this.setItem("users", users);
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    try {
      // Try Firebase first
      const { setDefaultUserAddress } = await import("@/services/firebase");
      await setDefaultUserAddress(userId, addressId);
      console.log("[db] ✅ Default address set in Firebase:", addressId);

      // Sync to local storage
      try {
        const users = (await this.getItem("users")) || [];
        const userIndex = users.findIndex((user: User) => user.id === userId);
        if (userIndex !== -1) {
          users[userIndex].addresses = users[userIndex].addresses.map(
            (addr: Address) => ({
              ...addr,
              isDefault: addr.id === addressId,
            })
          );
          await this.setItem("users", users);
        }
      } catch (localError) {
        console.log(
          "[db] Local storage sync failed (non-critical):",
          localError
        );
      }
    } catch (firebaseError) {
      console.warn(
        "[db] ⚠️ Firebase operation failed, using local storage:",
        firebaseError
      );

      // Fallback to local storage
      const users = (await this.getItem("users")) || [];
      const userIndex = users.findIndex((user: User) => user.id === userId);
      if (userIndex === -1) {
        throw new Error("User not found");
      }

      users[userIndex].addresses = users[userIndex].addresses.map(
        (addr: Address) => ({
          ...addr,
          isDefault: addr.id === addressId,
        })
      );

      await this.setItem("users", users);
    }
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    try {
      // First try Firebase
      const { fetchCategories } = await import("@/services/firebase");
      const categories = await fetchCategories();
      if (categories && categories.length > 0) {
        return categories;
      }
      // Fallback to AsyncStorage
      const stored = await this.getItem("categories");
      if (stored && Array.isArray(stored)) {
        return stored;
      }
      // Final fallback to initial categories
      return this.getInitialCategories();
    } catch (error) {
      console.error("[db] Error getting categories:", error);
      // Try AsyncStorage fallback
      try {
        const stored = await this.getItem("categories");
        if (stored && Array.isArray(stored)) {
          return stored;
        }
      } catch (e) {
        console.error("[db] AsyncStorage fallback failed:", e);
      }
      return this.getInitialCategories();
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find((cat) => cat.id === id) || null;
  }

  // Time slots methods
  async getTimeSlots(): Promise<TimeSlot[]> {
    return (await this.getItem("timeSlots")) || [];
  }

  async createTimeSlot(data: {
    time: string;
    label?: string;
    isActive?: boolean;
  }): Promise<TimeSlot> {
    const slots = await this.getTimeSlots();
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      time: data.time,
      label: data.label,
      isActive: data.isActive ?? true,
    };
    slots.push(newSlot);
    await this.setItem("timeSlots", slots);
    return newSlot;
  }

  async updateTimeSlot(
    id: string,
    updates: Partial<Omit<TimeSlot, "id">>
  ): Promise<TimeSlot | null> {
    const slots = await this.getTimeSlots();
    const idx = slots.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    slots[idx] = { ...slots[idx], ...updates } as TimeSlot;
    await this.setItem("timeSlots", slots);
    return slots[idx];
  }

  async toggleTimeSlotActive(id: string): Promise<TimeSlot | null> {
    const slots = await this.getTimeSlots();
    const idx = slots.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    slots[idx].isActive = !(slots[idx].isActive ?? true);
    await this.setItem("timeSlots", slots);
    return slots[idx];
  }

  async assignTimeSlotsToMeal(
    mealId: string,
    slotIds: string[]
  ): Promise<Meal | null> {
    const meals = await this.getMeals();
    const idx = meals.findIndex((m) => m.id === mealId);
    if (idx === -1) return null;
    meals[idx].availableTimeSlotIds = slotIds;
    await this.setItem("meals", meals);
    return meals[idx];
  }

  // Meal methods
  async getMeals(): Promise<Meal[]> {
    try {
      // First try Firebase
      const { fetchMeals } = await import("@/services/firebase");
      const meals = await fetchMeals();
      if (meals && meals.length > 0) {
        return meals.filter(
          (meal) =>
            meal &&
            typeof meal.id === "string" &&
            typeof meal.name === "string" &&
            typeof meal.price === "number"
        );
      }

      // Fallback to AsyncStorage
      const stored: Meal[] = (await this.getItem("meals")) || [];
      if (stored && stored.length > 0) {
        return stored.filter(
          (meal) =>
            meal &&
            typeof meal.id === "string" &&
            typeof meal.name === "string" &&
            typeof meal.price === "number"
        );
      }

      // Final fallback to initial meals
      return this.getInitialMeals().filter(
        (meal) =>
          meal &&
          typeof meal.id === "string" &&
          typeof meal.name === "string" &&
          typeof meal.price === "number"
      );
    } catch (e) {
      console.error("[db] Error loading meals:", e);
      // Try AsyncStorage fallback
      try {
        const stored: Meal[] = (await this.getItem("meals")) || [];
        if (stored && stored.length > 0) {
          return stored.filter(
            (meal) =>
              meal &&
              typeof meal.id === "string" &&
              typeof meal.name === "string" &&
              typeof meal.price === "number"
          );
        }
      } catch (err) {
        console.error("[db] AsyncStorage fallback failed:", err);
      }
      // Final fallback to initial meals
      return this.getInitialMeals().filter(
        (meal) =>
          meal &&
          typeof meal.id === "string" &&
          typeof meal.name === "string" &&
          typeof meal.price === "number"
      );
    }
  }

  // Admin-specific method to get ALL meals including drafts and inactive
  async getAllMealsAdmin(): Promise<Meal[]> {
    try {
      // First try Firebase admin function
      const { fetchAllMealsAdmin } = await import("@/services/firebase");
      const meals = await fetchAllMealsAdmin();
      if (meals && meals.length > 0) {
        return meals.filter(
          (meal) =>
            meal &&
            typeof meal.id === "string" &&
            typeof meal.name === "string" &&
            typeof meal.price === "number"
        );
      }

      // Fallback to AsyncStorage - get ALL meals without filtering
      const stored: Meal[] = (await this.getItem("meals")) || [];
      if (stored && stored.length > 0) {
        return stored.filter(
          (meal) =>
            meal &&
            typeof meal.id === "string" &&
            typeof meal.name === "string" &&
            typeof meal.price === "number"
        );
      }

      // Final fallback to initial meals
      return this.getInitialMeals().filter(
        (meal) =>
          meal &&
          typeof meal.id === "string" &&
          typeof meal.name === "string" &&
          typeof meal.price === "number"
      );
    } catch (e) {
      console.error("[db] Error loading all meals for admin:", e);
      // Try AsyncStorage fallback
      try {
        const stored: Meal[] = (await this.getItem("meals")) || [];
        if (stored && stored.length > 0) {
          return stored.filter(
            (meal) =>
              meal &&
              typeof meal.id === "string" &&
              typeof meal.name === "string" &&
              typeof meal.price === "number"
          );
        }
      } catch (err) {
        console.error("[db] AsyncStorage fallback failed:", err);
      }
      // Final fallback to initial meals
      return this.getInitialMeals().filter(
        (meal) =>
          meal &&
          typeof meal.id === "string" &&
          typeof meal.name === "string" &&
          typeof meal.price === "number"
      );
    }
  }

  async getMealById(id: string): Promise<Meal | null> {
    const meals = await this.getMeals();
    const found = meals.find((meal) => meal.id === id) || null;
    if (found) return found;
    try {
      const { Meals } = await import("@/constants/data");
      const fallback = [...(Meals || [])].find((m) => m.id === id) || null;
      return fallback;
    } catch (e) {
      console.log("[db] getMealById fallback failed", e);
      return null;
    }
  }

  async getMealsByCategory(categoryId: string): Promise<Meal[]> {
    const meals = await this.getMeals();
    return meals.filter(
      (meal) =>
        (meal.categoryId === categoryId ||
          (Array.isArray(meal.categoryIds) &&
            meal.categoryIds.includes(categoryId))) &&
        meal.isActive &&
        !meal.isDraft
    );
  }

  async getFeaturedMeals(): Promise<Meal[]> {
    const meals = await this.getMeals();
    return meals.filter(
      (meal) => meal.isFeatured && meal.isActive && !meal.isDraft
    );
  }

  // AddOn methods
  async getAddOns(): Promise<AddOn[]> {
    try {
      // First try Firebase
      const { fetchAddOns } = await import("@/services/firebase");
      const addons = await fetchAddOns();
      if (addons && addons.length > 0) {
        return addons;
      }
      // Fallback to AsyncStorage
      const stored = await this.getItem("addOns");
      if (stored && Array.isArray(stored)) {
        return stored;
      }
      // Final fallback to initial add-ons
      return this.getInitialAddOns();
    } catch (error) {
      console.error("[db] Error getting add-ons:", error);
      // Try AsyncStorage fallback
      try {
        const stored = await this.getItem("addOns");
        if (stored && Array.isArray(stored)) {
          return stored;
        }
      } catch (e) {
        console.error("[db] AsyncStorage fallback failed:", e);
      }
      return this.getInitialAddOns();
    }
  }

  async getAddOnById(id: string): Promise<AddOn | null> {
    const addOns = await this.getAddOns();
    return addOns.find((addOn) => addOn.id === id) || null;
  }

  async createAddOn(addonData: {
    name: string;
    description?: string;
    price: number;
    category?: string;
    image?: string;
    isVeg?: boolean;
    isActive?: boolean;
  }): Promise<AddOn> {
    const addOns = await this.getAddOns();
    const normalizedCategory: AddOn["category"] = (() => {
      const c = (addonData.category || "").toLowerCase();
      if (c === "snack" || c === "dessert" || c === "beverage" || c === "extra")
        return c as AddOn["category"];
      return "extra";
    })();
    const image =
      addonData.image ||
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&auto=format&fit=crop";
    const newAddOn: AddOn = {
      id: Date.now().toString(),
      name: addonData.name,
      description: addonData.description || "",
      image,
      price: addonData.price,
      category: normalizedCategory,
      isVeg: addonData.isVeg ?? true,
      isActive: addonData.isActive ?? true,
    };
    addOns.unshift(newAddOn);
    await this.setItem("addOns", addOns);
    return newAddOn;
  }

  async updateAddOn(
    id: string,
    updates: Partial<Omit<AddOn, "id">> & {
      category?: string;
      imageUrl?: string;
    }
  ): Promise<AddOn | null> {
    const addOns = await this.getAddOns();
    const idx = addOns.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const next = { ...addOns[idx] } as AddOn;
    if (typeof updates.name !== "undefined") next.name = updates.name as string;
    if (typeof updates.description !== "undefined")
      next.description = updates.description as string;
    if (typeof updates.price !== "undefined")
      next.price = updates.price as number;
    if (typeof updates.isVeg !== "undefined")
      next.isVeg = updates.isVeg as boolean;
    if (typeof updates.isActive !== "undefined")
      next.isActive = updates.isActive as boolean;
    if (typeof updates.image !== "undefined")
      next.image = updates.image as string;
    if (typeof updates.imageUrl !== "undefined")
      next.image = updates.imageUrl as string;
    if (typeof updates.category !== "undefined") {
      const c = (updates.category || "").toLowerCase();
      next.category =
        c === "snack" || c === "dessert" || c === "beverage" || c === "extra"
          ? (c as AddOn["category"])
          : "extra";
    }

    // Update in Firebase
    try {
      const { updateAddOn } = await import("@/services/firebase");
      await updateAddOn(id, updates as Partial<AddOn>);
    } catch (error) {
      console.error("[db] Error updating addon in Firebase:", error);
    }

    // Also update AsyncStorage
    addOns[idx] = next;
    await this.setItem("addOns", addOns);
    return next;
  }

  async deleteAddOn(id: string): Promise<boolean> {
    const addOns = await this.getAddOns();
    const filtered = addOns.filter((a) => a.id !== id);
    const changed = filtered.length !== addOns.length;
    if (changed) {
      // Delete from Firebase
      try {
        const { deleteAddOn } = await import("@/services/firebase");
        await deleteAddOn(id);
      } catch (error) {
        console.error("[db] Error deleting addon from Firebase:", error);
      }

      // Also delete from AsyncStorage
      await this.setItem("addOns", filtered);
    }
    return changed;
  }

  async toggleAddOnActive(id: string): Promise<AddOn | null> {
    const addOns = await this.getAddOns();
    const idx = addOns.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    addOns[idx].isActive = !addOns[idx].isActive;

    // Update in Firebase
    try {
      const { updateAddOn } = await import("@/services/firebase");
      await updateAddOn(id, { isActive: addOns[idx].isActive });
    } catch (error) {
      console.error("[db] Error toggling addon active in Firebase:", error);
    }

    // Also update AsyncStorage
    await this.setItem("addOns", addOns);
    return addOns[idx];
  }

  // Plan methods
  async getPlans(): Promise<Plan[]> {
    return (await this.getItem("plans")) || [];
  }

  async getPlanById(id: string): Promise<Plan | null> {
    const plans = await this.getPlans();
    return plans.find((plan) => plan.id === id) || null;
  }

  // Subscription methods
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      const subs = await fbFetchSubscriptions();
      await this.setItem("subscriptions", subs);
      return subs;
    } catch (e) {
      console.log(
        "[db] fetchSubscriptions from firebase failed, falling back to local storage",
        e
      );
      return (await this.getItem("subscriptions")) || [];
    }
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    const subscriptions = await this.getSubscriptions();
    return subscriptions.filter((sub) => sub.userId === userId);
  }

  async createSubscription(
    subscriptionData: Omit<Subscription, "id" | "createdAt">
  ): Promise<Subscription> {
    const subscriptions = (await this.getItem("subscriptions")) || [];
    const newSubscription: Subscription = {
      ...subscriptionData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    try {
      await fbCreateSubscription(newSubscription);
    } catch (e) {
      console.log(
        "[db] createSubscription on firebase failed, caching locally",
        e
      );
      subscriptions.push(newSubscription);
      await this.setItem("subscriptions", subscriptions);
    }

    if (subscriptionData.planId === "4") {
      await this.creditReferralReward(newSubscription.id);
    }

    return newSubscription;
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return (await this.getItem("orders")) || [];
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.filter((order) => order.userId === userId);
  }

  async createOrder(
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
  ): Promise<Order> {
    const orders = await this.getOrders();
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    orders.push(newOrder);
    await this.setItem("orders", orders);

    // Update streak when order is delivered
    if (newOrder.status === "delivered") {
      await this.updateUserStreak(newOrder.userId);
    }

    return newOrder;
  }

  async updateOrder(
    id: string,
    updates: Partial<Order>
  ): Promise<Order | null> {
    const orders = await this.getOrders();
    const index = orders.findIndex((order) => order.id === id);
    if (index === -1) return null;

    const previousStatus = orders[index].status;
    orders[index] = { ...orders[index], ...updates, updatedAt: new Date() };
    await this.setItem("orders", orders);

    // Auto notifications on status changes
    if (updates.status && updates.status !== previousStatus) {
      const userId = orders[index].userId;
      const status = updates.status;
      let notifTitle = "";
      let notifMessage = "";
      if (status === "confirmed") {
        notifTitle = "Order Confirmed";
        notifMessage = "Your order has been confirmed.";
      } else if (status === "preparing") {
        notifTitle = "We started cooking!";
        notifMessage = "Your meal is being prepared.";
      } else if (status === "ready") {
        notifTitle = "Cooking completed";
        notifMessage = "Your meal is ready and will be dispatched shortly.";
      } else if (status === "out_for_delivery") {
        notifTitle = "Out for delivery";
        notifMessage = "Your order is on the way.";
      } else if (status === "waiting_for_ack") {
        notifTitle = "Please confirm delivery";
        notifMessage =
          "Your order has arrived. Tap to confirm you've received it.";
      } else if (status === "delivered") {
        notifTitle = "Delivered";
        notifMessage = "Enjoy your meal! Order delivered successfully.";
      } else if (status === "cancelled") {
        notifTitle = "Order Cancelled";
        notifMessage =
          "Your order was cancelled. If this is a mistake, contact support.";
      }
      if (notifTitle) {
        await this.createNotification({
          userId,
          title: notifTitle,
          message: notifMessage,
          type:
            status === "out_for_delivery" ||
            status === "delivered" ||
            status === "waiting_for_ack"
              ? "delivery"
              : "order",
          isRead: false,
          data: { orderId: id, status },
        });
      }
      if (status === "waiting_for_ack") {
        await this.scheduleDeliveryAckReminders(id, userId);
      }
      if (status === "delivered") {
        await this.cancelDeliveryAckReminders(id);
      }
    }

    // Update streak when order status changes to delivered
    if (previousStatus !== "delivered" && updates.status === "delivered") {
      await this.updateUserStreak(orders[index].userId);
    }

    return orders[index];
  }

  async updateSubscription(
    id: string,
    updates: Partial<Subscription>
  ): Promise<Subscription | null> {
    try {
      await fbUpdateSubscription(id, updates);
      const refreshed = await this.getSubscriptions();
      return refreshed.find((s) => s.id === id) || null;
    } catch (e) {
      console.log(
        "[db] updateSubscription on firebase failed, updating local cache",
        e
      );
      const subscriptions = (await this.getItem("subscriptions")) || [];
      const index = subscriptions.findIndex(
        (sub: Subscription) => sub.id === id
      );
      if (index === -1) return null;
      subscriptions[index] = { ...subscriptions[index], ...updates };
      await this.setItem("subscriptions", subscriptions);
      return subscriptions[index];
    }
  }

  /**
   * Update kitchen status for a subscription on a given date.
   * Persists to Firestore and appends a log entry for the day.
   */
  async updateSubscriptionKitchenStatus(
    subscriptionId: string,
    dateString: string,
    status: string,
    userId?: string
  ): Promise<Subscription | null> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) return null;
    const kitchenStatusByDate = {
      ...(subscription.kitchenStatusByDate || {}),
      [dateString]: status,
    };
    const logEntry: DeliveryDayLogEntry = {
      type: "kitchen",
      status,
      at: new Date().toISOString(),
      ...(userId ? { userId } : {}),
    };
    const existingLogs = subscription.deliveryDayLogs?.[dateString] ?? [];
    const deliveryDayLogs = {
      ...(subscription.deliveryDayLogs || {}),
      [dateString]: [...existingLogs, logEntry],
    };
    return this.updateSubscription(subscriptionId, {
      kitchenStatusByDate,
      deliveryDayLogs,
    });
  }

  /**
   * Update delivery status for a subscription on a given date.
   * Appends a log entry for the day. When status is delivery_done,
   * decrements remainingDeliveries and sets subscription status to
   * completed when remaining reaches 0.
   */
  async updateSubscriptionDeliveryStatus(
    subscriptionId: string,
    dateString: string,
    status: string,
    userId?: string
  ): Promise<Subscription | null> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) return null;
    const deliveryStatusByDate = {
      ...(subscription.deliveryStatusByDate || {}),
      [dateString]: status,
    };
    const logEntry: DeliveryDayLogEntry = {
      type: "delivery",
      status,
      at: new Date().toISOString(),
      ...(userId ? { userId } : {}),
    };
    const existingLogs = subscription.deliveryDayLogs?.[dateString] ?? [];
    const deliveryDayLogs = {
      ...(subscription.deliveryDayLogs || {}),
      [dateString]: [...existingLogs, logEntry],
    };
    const updates: Partial<Subscription> = {
      deliveryStatusByDate,
      deliveryDayLogs,
    };
    if (status === "delivery_done") {
      const remaining = Math.max(
        0,
        (subscription.remainingDeliveries ?? subscription.totalDeliveries ?? 1) -
          1
      );
      updates.remainingDeliveries = remaining;
      if (remaining === 0) {
        updates.status = "completed";
      }
    }
    return this.updateSubscription(subscriptionId, updates);
  }

  // Skip and Add-on methods
  private isExcludedDay(subscription: Subscription, date: Date): boolean {
    const setting = subscription.weekendExclusion;
    const day = date.getDay();
    if (setting === "both" || (setting as any) === true) {
      return day === 0 || day === 6;
    }
    if (setting === "saturday") return day === 6;
    if (setting === "sunday") return day === 0;
    return false;
  }

  private getNextDeliveryDate(
    subscription: Subscription,
    fromDate: Date
  ): { nextDate: Date; endDateExtended: boolean } {
    const next = new Date(fromDate);
    next.setDate(next.getDate() + 1);
    let endDateExtended = false;
    const endDate = new Date(subscription.endDate);

    while (true) {
      if (this.isExcludedDay(subscription, next)) {
        next.setDate(next.getDate() + 1);
        continue;
      }
      const nextStr = next.toISOString().split("T")[0];
      const isSkipped = (subscription.skippedDates || []).includes(nextStr);
      if (!isSkipped) break;
      next.setDate(next.getDate() + 1);
    }

    if (next > endDate) {
      endDateExtended = true;
    }
    return { nextDate: next, endDateExtended };
  }

  /**
   * Skip a meal for a specific date
   * 
   * This handles:
   * 1. Adding the date to skippedDates array
   * 2. Moving any add-ons from skipped date to the next delivery date
   * 3. Extending subscription end date by 1 delivery day to maintain total count
   * 
   * @param subscriptionId - ID of the subscription
   * @param dateString - Date string in ISO format (YYYY-MM-DD)
   * @returns true if skip was successful, false otherwise
   */
  async skipMealForDate(
    subscriptionId: string,
    dateString: string
  ): Promise<boolean> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) return false;

    // Check if already skipped
    const existingSkipped = subscription.skippedDates || [];
    if (existingSkipped.includes(dateString)) return true;

    // Add to skipped dates
    const skippedDates = Array.from(
      new Set([...(subscription.skippedDates || []), dateString])
    );

    // Move any additional add-ons from skipped date to next delivery date
    const additionalAddOns = {
      ...(subscription.additionalAddOns || {}),
    } as Record<string, string[]>;
    const movedAddOns = additionalAddOns[dateString] || [];
    
    if (movedAddOns.length > 0) {
      // Find the next valid delivery date
      const nextMeta = this.getNextDeliveryDate(
        subscription,
        new Date(dateString)
      );
      const nextStr = nextMeta.nextDate.toISOString().split("T")[0];
      const existingNext = additionalAddOns[nextStr] || [];
      
      // Merge add-ons to next date (avoid duplicates)
      additionalAddOns[nextStr] = Array.from(
        new Set<string>([...existingNext, ...movedAddOns])
      );
      delete additionalAddOns[dateString];
    }

    // Calculate new end date (extend by 1 delivery day to maintain total deliveries)
    let newEndDate = new Date(subscription.endDate);
    const skipDate = new Date(dateString);
    skipDate.setHours(0, 0, 0, 0);

    const subStart = new Date(subscription.startDate);
    const subEnd = new Date(subscription.endDate);
    subStart.setHours(0, 0, 0, 0);
    subEnd.setHours(0, 0, 0, 0);

    const isWithin = skipDate >= subStart && skipDate <= subEnd;

    // Only extend end date if the skip is within the original subscription period
    if (isWithin && !this.isExcludedDay(subscription, skipDate)) {
      // Extend by one valid delivery day (skip weekends if needed)
      do {
        newEndDate.setDate(newEndDate.getDate() + 1);
      } while (this.isExcludedDay(subscription, newEndDate));
    }

    const updatePayload: Partial<Subscription> = {
      skippedDates,
      additionalAddOns,
    };
    if (newEndDate.getTime() !== new Date(subscription.endDate).getTime()) {
      updatePayload.endDate = newEndDate;
    }

    const updated = await this.updateSubscription(
      subscriptionId,
      updatePayload
    );
    if (!updated) {
      const subscriptions = (await this.getItem("subscriptions")) || [];
      const index = subscriptions.findIndex(
        (s: Subscription) => s.id === subscriptionId
      );
      if (index === -1) return false;
      subscriptions[index] = {
        ...subscriptions[index],
        ...updatePayload,
      } as Subscription;
      await this.setItem("subscriptions", subscriptions);
    }

    return true;
  }

  async addAddOnForDate(
    subscriptionId: string,
    dateString: string,
    addOnIds: string[]
  ): Promise<boolean> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) return false;

    const additionalAddOns = {
      ...(subscription.additionalAddOns || {}),
    } as Record<string, string[]>;
    const existing = additionalAddOns[dateString] || [];
    const merged = Array.from(new Set<string>([...existing, ...addOnIds]));
    additionalAddOns[dateString] = merged;

    const updated = await this.updateSubscription(subscriptionId, {
      additionalAddOns,
    });
    if (!updated) {
      const subscriptions = (await this.getItem("subscriptions")) || [];
      const index = subscriptions.findIndex(
        (s: Subscription) => s.id === subscriptionId
      );
      if (index === -1) return false;
      subscriptions[index] = { ...subscriptions[index], additionalAddOns };
      await this.setItem("subscriptions", subscriptions);
    }

    return true;
  }

  async purchaseAddOnsForDate(
    subscriptionId: string,
    dateString: string,
    addOnIds: string[],
    userId: string
  ): Promise<boolean> {
    const success = await this.addAddOnForDate(
      subscriptionId,
      dateString,
      addOnIds
    );
    if (!success) return false;
    const allAddOns: AddOn[] = await this.getAddOns();
    const amount = addOnIds.reduce((sum, id) => {
      const found = allAddOns.find((a) => a.id === id);
      return sum + (found?.price || 0);
    }, 0);
    await this.addWalletTransaction({
      userId,
      type: "debit",
      amount,
      description: `Add-ons for ${dateString}`,
      referenceId: `addons-${subscriptionId}-${dateString}`,
    });
    return true;
  }

  async skipAddOnsForDate(
    subscriptionId: string,
    dateString: string
  ): Promise<boolean> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) return false;
    const additionalAddOns = {
      ...(subscription.additionalAddOns || {}),
    } as Record<string, string[]>;
    const items = additionalAddOns[dateString] || [];
    if (items.length === 0) return true;

    const nextMeta = this.getNextDeliveryDate(
      subscription,
      new Date(dateString)
    );
    const nextStr = nextMeta.nextDate.toISOString().split("T")[0];
    const existingNext = additionalAddOns[nextStr] || [];
    additionalAddOns[nextStr] = Array.from(
      new Set<string>([...existingNext, ...items])
    );
    delete additionalAddOns[dateString];

    const updatePayload: Partial<Subscription> = { additionalAddOns };
    if (nextMeta.endDateExtended) {
      const newEnd = new Date(subscription.endDate);
      do {
        newEnd.setDate(newEnd.getDate() + 1);
      } while (this.isExcludedDay(subscription, newEnd));
      updatePayload.endDate = newEnd;
    }

    const updated = await this.updateSubscription(
      subscriptionId,
      updatePayload
    );
    if (!updated) {
      const subscriptions = (await this.getItem("subscriptions")) || [];
      const index = subscriptions.findIndex(
        (s: Subscription) => s.id === subscriptionId
      );
      if (index === -1) return false;
      subscriptions[index] = {
        ...subscriptions[index],
        ...updatePayload,
      } as Subscription;
      await this.setItem("subscriptions", subscriptions);
    }
    return true;
  }

  async updateAppSettings(
    settings: Partial<AppSettings>
  ): Promise<AppSettings> {
    const currentSettings = await this.getAppSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await this.setItem("appSettings", updatedSettings);
    return updatedSettings;
  }

  // Banner methods
  async getBanners(): Promise<Banner[]> {
    return (await this.getItem("banners")) || [];
  }

  async getActiveBanners(): Promise<Banner[]> {
    const banners = await this.getBanners();
    const now = new Date();
    return banners
      .filter(
        (banner) =>
          banner.isActive &&
          (!banner.startDate || new Date(banner.startDate) <= now) &&
          (!banner.endDate || new Date(banner.endDate) >= now)
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return (await this.getItem("testimonials")) || [];
  }

  async getActiveTestimonials(): Promise<Testimonial[]> {
    const testimonials = await this.getTestimonials();
    return testimonials.filter((testimonial) => testimonial.isActive);
  }

  // Offer methods
  async getOffers(): Promise<Offer[]> {
    return (await this.getItem("offers")) || [];
  }

  async getActiveOffers(): Promise<Offer[]> {
    const offers = await this.getOffers();
    const now = new Date();
    return offers.filter(
      (offer) =>
        offer.isActive &&
        new Date(offer.validFrom) <= now &&
        new Date(offer.validTo) >= now
    );
  }

  // Wallet methods
  async getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    const transactions = (await this.getItem("walletTransactions")) || [];
    return transactions.filter((t: WalletTransaction) => t.userId === userId);
  }

  async addWalletTransaction(
    transactionData: Omit<WalletTransaction, "id" | "createdAt">
  ): Promise<WalletTransaction> {
    try {
      // Validate transaction data
      if (!transactionData.userId) {
        throw new Error("User ID is required for wallet transaction");
      }
      if (transactionData.amount <= 0) {
        throw new Error("Transaction amount must be greater than 0");
      }
      if (!["credit", "debit"].includes(transactionData.type)) {
        throw new Error("Transaction type must be either 'credit' or 'debit'");
      }

      // Get current user to verify they exist and check balance for debits
      const user = await this.getUserById(transactionData.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // For debit transactions, verify sufficient balance
      if (transactionData.type === "debit") {
        if (user.walletBalance < transactionData.amount) {
          throw new Error(
            `Insufficient wallet balance. Available: ₹${user.walletBalance}, Required: ₹${transactionData.amount}`
          );
        }
      }

      const transactions = (await this.getItem("walletTransactions")) || [];
      const newTransaction: WalletTransaction = {
        ...transactionData,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      };
      transactions.push(newTransaction);
      await this.setItem("walletTransactions", transactions);

      // Update user wallet balance atomically
      const newBalance =
        transactionData.type === "credit"
          ? user.walletBalance + transactionData.amount
          : user.walletBalance - transactionData.amount;
      
      const updatedUser = await this.updateUser(user.id, {
        walletBalance: Math.max(0, newBalance),
      });

      if (!updatedUser) {
        // Rollback transaction if user update fails
        const rollbackTransactions = transactions.filter(
          (t: WalletTransaction) => t.id !== newTransaction.id
        );
        await this.setItem("walletTransactions", rollbackTransactions);
        throw new Error("Failed to update user wallet balance");
      }

      console.log(
        `[Wallet] ${transactionData.type === "credit" ? "Credited" : "Debited"} ₹${transactionData.amount} ${transactionData.type === "credit" ? "to" : "from"} user ${user.name}'s wallet. New balance: ₹${newBalance}`
      );

      return newTransaction;
    } catch (error) {
      console.error("[Wallet] Transaction failed:", error);
      throw error;
    }
  }

  // Serviceable Location methods
  async getServiceableLocations(): Promise<ServiceableLocation[]> {
    try {
      // Fetch from Firebase as primary source
      const fbLocations = await fbFetchServiceableLocations();
      if (fbLocations.length > 0) {
        // Cache to AsyncStorage for offline access
        await this.setItem("serviceableLocations", fbLocations);
        return fbLocations;
      }
      // Fall back to AsyncStorage if Firebase is empty
      return (await this.getItem("serviceableLocations")) || [];
    } catch (error) {
      console.error("[db] Error fetching serviceable locations from Firebase:", error);
      // Fall back to AsyncStorage on error
      return (await this.getItem("serviceableLocations")) || [];
    }
  }

  async getActiveServiceableLocations(): Promise<ServiceableLocation[]> {
    const locations = await this.getServiceableLocations();
    return locations.filter((location) => location.isActive);
  }

  // Delivery Person methods
  async getDeliveryPersons(): Promise<DeliveryPerson[]> {
    return (await this.getItem("deliveryPersons")) || [];
  }

  async getAvailableDeliveryPersons(): Promise<DeliveryPerson[]> {
    const persons = await this.getDeliveryPersons();
    return persons.filter((person) => person.isActive && person.isAvailable);
  }

  // Kitchen Staff methods
  async getKitchenStaff(): Promise<KitchenStaff[]> {
    return (await this.getItem("kitchenStaff")) || [];
  }

  // FAQ methods
  async getFAQs(): Promise<FAQ[]> {
    return (await this.getItem("faqs")) || [];
  }

  async getActiveFAQs(): Promise<FAQ[]> {
    const faqs = await this.getFAQs();
    return faqs
      .filter((faq) => faq.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Support Ticket methods
  async getSupportTickets(): Promise<SupportTicket[]> {
    return (await this.getItem("supportTickets")) || [];
  }

  async getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    const tickets = await this.getSupportTickets();
    return tickets.filter((ticket) => ticket.userId === userId);
  }

  async createSupportTicket(
    ticketData: Omit<SupportTicket, "id" | "createdAt" | "updatedAt">
  ): Promise<SupportTicket> {
    const tickets = await this.getSupportTickets();
    const newTicket: SupportTicket = {
      ...ticketData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tickets.push(newTicket);
    await this.setItem("supportTickets", tickets);
    return newTicket;
  }

  async updateSupportTicket(
    id: string,
    updates: Partial<SupportTicket>
  ): Promise<SupportTicket | null> {
    const tickets = await this.getSupportTickets();
    const index = tickets.findIndex((ticket) => ticket.id === id);
    if (index === -1) return null;

    tickets[index] = { ...tickets[index], ...updates, updatedAt: new Date() };
    await this.setItem("supportTickets", tickets);
    return tickets[index];
  }

  async markDeliveryAsReceived(orderId: string): Promise<Order | null> {
    const updated = await this.updateOrder(orderId, { status: "delivered" });
    return updated;
  }

  private async getAckReminders(): Promise<any[]> {
    return (await this.getItem("deliveryAckReminders")) || [];
  }

  private async setAckReminders(reminders: any[]): Promise<void> {
    await this.setItem("deliveryAckReminders", reminders);
  }

  async scheduleDeliveryAckReminders(
    orderId: string,
    userId: string
  ): Promise<void> {
    const now = Date.now();
    const reminders = await this.getAckReminders();
    const filtered = reminders.filter((r: any) => r.orderId !== orderId);
    const r1 = {
      id: `${orderId}-r1`,
      orderId,
      userId,
      dueAt: new Date(now + 2 * 60 * 1000).toISOString(),
      sent: false,
      seq: 1,
    };
    const r2 = {
      id: `${orderId}-r2`,
      orderId,
      userId,
      dueAt: new Date(now + 4 * 60 * 1000).toISOString(),
      sent: false,
      seq: 2,
    };
    filtered.push(r1, r2);
    await this.setAckReminders(filtered);
  }

  async cancelDeliveryAckReminders(orderId: string): Promise<void> {
    const reminders = await this.getAckReminders();
    const filtered = reminders.filter((r: any) => r.orderId !== orderId);
    await this.setAckReminders(filtered);
  }

  async checkAndFireDueReminders(userId: string): Promise<void> {
    const reminders = await this.getAckReminders();
    const now = Date.now();
    let changed = false;
    for (const r of reminders) {
      if (r.userId !== userId) continue;
      if (r.sent) continue;
      const due = new Date(r.dueAt).getTime();
      if (due <= now) {
        const orders = await this.getOrders();
        const order = orders.find((o) => o.id === r.orderId);
        if (order && order.status === "waiting_for_ack") {
          await this.createNotification({
            userId,
            title:
              r.seq === 1
                ? "Reminder: Confirm delivery"
                : "Final reminder: Confirm delivery",
            message:
              r.seq === 1
                ? "Please confirm you've received your order."
                : "Please confirm delivery now, or contact support if there's an issue.",
            type: "delivery",
            isRead: false,
            data: {
              orderId: r.orderId,
              status: "waiting_for_ack",
              reminder: r.seq,
            },
          });
        }
        r.sent = true;
        changed = true;
      }
    }
    if (changed) {
      await this.setAckReminders(reminders);
    }
  }

  // Support Message methods
  async getSupportMessages(ticketId: string): Promise<SupportMessage[]> {
    const messages = (await this.getItem("supportMessages")) || [];
    return messages
      .filter((message: SupportMessage) => message.ticketId === ticketId)
      .sort(
        (a: SupportMessage, b: SupportMessage) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  async createSupportMessage(
    messageData: Omit<SupportMessage, "id" | "createdAt" | "deliveryStatus">
  ): Promise<SupportMessage> {
    const messages = (await this.getItem("supportMessages")) || [];
    const newMessage: SupportMessage = {
      ...messageData,
      id: Date.now().toString(),
      createdAt: new Date(),
      deliveryStatus: "sent",
    };
    messages.push(newMessage);
    await this.setItem("supportMessages", messages);

    // Update ticket's updatedAt timestamp
    await this.updateSupportTicket(messageData.ticketId, {});

    return newMessage;
  }

  async markSupportMessageAsRead(messageId: string): Promise<void> {
    const messages = (await this.getItem("supportMessages")) || [];
    const index = messages.findIndex(
      (message: SupportMessage) => message.id === messageId
    );
    if (index !== -1) {
      messages[index].isRead = true;
      messages[index].deliveryStatus = "read";
      await this.setItem("supportMessages", messages);
    }
  }

  async markSupportMessagesAsDelivered(
    ticketId: string,
    userId: string
  ): Promise<void> {
    const messages = (await this.getItem("supportMessages")) || [];
    let updated = false;

    messages.forEach((message: SupportMessage) => {
      if (
        message.ticketId === ticketId &&
        message.senderId !== userId &&
        message.deliveryStatus === "sent"
      ) {
        message.deliveryStatus = "delivered";
        updated = true;
      }
    });

    if (updated) {
      await this.setItem("supportMessages", messages);
    }
  }

  // Corporate Catering methods
  async createCorporateCateringRequest(
    requestData: Omit<CorporateCateringRequest, "id" | "createdAt">
  ): Promise<CorporateCateringRequest> {
    const requests = (await this.getItem("corporateCateringRequests")) || [];
    const newRequest: CorporateCateringRequest = {
      ...requestData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    requests.push(newRequest);
    await this.setItem("corporateCateringRequests", requests);
    return newRequest;
  }

  // Nutritionist Contact methods
  async createNutritionistContact(
    contactData: Omit<NutritionistContact, "id" | "createdAt">
  ): Promise<NutritionistContact> {
    const contacts = (await this.getItem("nutritionistContacts")) || [];
    const newContact: NutritionistContact = {
      ...contactData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    contacts.push(newContact);
    await this.setItem("nutritionistContacts", contacts);
    return newContact;
  }

  // App Settings methods
  async getAppSettings(): Promise<AppSettings> {
    const settings = await this.getItem("appSettings");
    if (!settings) {
      console.log("No app settings found, returning initial settings");
      const initialSettings = this.getInitialAppSettings();
      await this.setItem("appSettings", initialSettings);
      return initialSettings;
    }
    console.log("App settings loaded:", settings);
    return settings;
  }

  // Notification methods
  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = (await this.getItem("notifications")) || [];
    return notifications.filter((n: Notification) => n.userId === userId);
  }

  async createNotification(
    notificationData: Omit<Notification, "id" | "createdAt">
  ): Promise<Notification> {
    const notifications = (await this.getItem("notifications")) || [];
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    notifications.push(newNotification);
    await this.setItem("notifications", notifications);
    return newNotification;
  }

  async deleteNotification(id: string): Promise<void> {
    const notifications = (await this.getItem("notifications")) || [];
    const filtered = notifications.filter((n: Notification) => n.id !== id);
    await this.setItem("notifications", filtered);
  }

  async clearUserNotifications(userId: string): Promise<void> {
    const notifications = (await this.getItem("notifications")) || [];
    const filtered = notifications.filter(
      (n: Notification) => n.userId !== userId
    );
    await this.setItem("notifications", filtered);
  }

  async createNotificationsForUsers(
    userIds: string[],
    data: Omit<Notification, "id" | "createdAt" | "userId">
  ): Promise<Notification[]> {
    const created: Notification[] = [];
    for (const userId of userIds) {
      const n = await this.createNotification({ ...data, userId });
      created.push(n);
    }
    return created;
  }

  async broadcastNotification(
    data: Omit<Notification, "id" | "createdAt" | "userId"> & {
      role?: UserRole;
    }
  ): Promise<number> {
    const users: User[] = await this.getUsers();
    const filtered = data.role
      ? users.filter((u) => u.role === data.role)
      : users;
    const created = await this.createNotificationsForUsers(
      filtered.map((u) => u.id),
      data
    );
    return created.length;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notifications = (await this.getItem("notifications")) || [];
    const index = notifications.findIndex((n: Notification) => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      await this.setItem("notifications", notifications);
    }
  }

  // Admin methods
  async getAllSubscriptions(): Promise<Subscription[]> {
    return await this.getSubscriptions();
  }

  async assignSubscription(
    subscriptionId: string,
    assigneeId: string,
    role: "kitchen" | "delivery"
  ): Promise<void> {
    const updates: Partial<Subscription> =
      role === "kitchen"
        ? { assignedKitchenId: assigneeId }
        : { assignedDeliveryId: assigneeId };
    try {
      await this.updateSubscription(subscriptionId, updates);
    } catch (e) {
      console.log("[db] assignSubscription firestore failed, updating local", e);
      const subscriptions = await this.getSubscriptions();
      const index = subscriptions.findIndex((sub) => sub.id === subscriptionId);
      if (index !== -1) {
        Object.assign(subscriptions[index], updates);
        await this.setItem("subscriptions", subscriptions);
      }
    }
  }

  async addCategory(categoryData: {
    name: string;
    description: string;
    image?: string;
    group?: Category["group"];
  }): Promise<Category> {
    const categories = await this.getCategories();
    const newCategory: Category = {
      id: Date.now().toString(),
      name: categoryData.name,
      description: categoryData.description,
      image:
        categoryData.image ||
        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
      isActive: true,
      sortOrder: categories.length + 1,
      group: categoryData.group,
    };

    // Save to Firebase
    try {
      const { createCategory } = await import("@/services/firebase");
      await createCategory(newCategory);
    } catch (error) {
      console.error("[db] Error creating category in Firebase:", error);
    }

    // Also save to AsyncStorage as fallback/cache
    categories.push(newCategory);
    await this.setItem("categories", categories);
    return newCategory;
  }

  async updateCategory(
    categoryId: string,
    updates: Partial<Category>
  ): Promise<Category | null> {
    const categories = await this.getCategories();
    const index = categories.findIndex((cat) => cat.id === categoryId);
    if (index === -1) return null;

    categories[index] = { ...categories[index], ...updates };

    // Update in Firebase
    try {
      const { updateCategory } = await import("@/services/firebase");
      await updateCategory(categoryId, updates);
    } catch (error) {
      console.error("[db] Error updating category in Firebase:", error);
    }

    // Also update AsyncStorage
    await this.setItem("categories", categories);
    return categories[index];
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    const categories = await this.getCategories();
    const filtered = categories.filter((cat) => cat.id !== categoryId);
    if (filtered.length === categories.length) return false;

    // Delete from Firebase
    try {
      const { deleteCategory } = await import("@/services/firebase");
      await deleteCategory(categoryId);
    } catch (error) {
      console.error("[db] Error deleting category from Firebase:", error);
    }

    // Also delete from AsyncStorage
    await this.setItem("categories", filtered);
    return true;
  }

  async toggleCategoryActive(categoryId: string): Promise<Category | null> {
    const categories = await this.getCategories();
    const index = categories.findIndex((cat) => cat.id === categoryId);
    if (index === -1) return null;

    categories[index].isActive = !categories[index].isActive;

    // Update in Firebase
    try {
      const { updateCategory } = await import("@/services/firebase");
      await updateCategory(categoryId, {
        isActive: categories[index].isActive,
      });
    } catch (error) {
      console.error("[db] Error toggling category active in Firebase:", error);
    }

    // Also update AsyncStorage
    await this.setItem("categories", categories);
    return categories[index];
  }

  async addAddOn(addonData: {
    name: string;
    description: string;
    price: number;
    category?: string;
    image?: string;
    isVeg?: boolean;
    isActive?: boolean;
  }): Promise<AddOn> {
    const addons = await this.getAddOns();
    const newAddOn: AddOn = {
      id: Date.now().toString(),
      name: addonData.name,
      description: addonData.description,
      price: addonData.price,
      category: addonData.category || "add-ons",
      image:
        addonData.image ||
        "https://images.unsplash.com/photo-1604908176997-431310be8d5e?w=300",
      isVeg: addonData.isVeg ?? true,
      isActive: addonData.isActive ?? true,
    };

    // Save to Firebase
    try {
      const { createAddOn } = await import("@/services/firebase");
      await createAddOn(newAddOn);
    } catch (error) {
      console.error("[db] Error creating addon in Firebase:", error);
    }

    // Also save to AsyncStorage as fallback/cache
    addons.push(newAddOn);
    await this.setItem("addons", addons);
    return newAddOn;
  }

  async addMeal(mealData: {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    categoryId?: string;
    categoryIds?: string[];
    isVeg?: boolean;
    hasEgg?: boolean;
    image?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    isDraft?: boolean;
    preparationTime?: number;
    tags?: string[];
    nutritionInfo?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    isBasicThali?: boolean;
    variantPricing?: { veg?: number; nonveg?: number };
    allowDaySelection?: boolean;
    addonIds?: string[];
    availableTimeSlotIds?: string[];
    availableWeekTypes?: ("mon-fri" | "mon-sat" | "everyday")[];
    ingredients?: string[];
    allergens?: string[];
  }): Promise<Meal> {
    // Use getAllMealsAdmin to include drafts when adding new meals
    const meals = await this.getAllMealsAdmin();
    const defaultImage =
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600";
    const newMeal: Meal = {
      id: Date.now().toString(),
      name: mealData.name,
      description: mealData.description,
      images: [mealData.image || defaultImage],
      categoryId: mealData.categoryId || "1",
      categoryIds:
        mealData.categoryIds ??
        (mealData.categoryId ? [mealData.categoryId] : ["1"]),
      price: mealData.price,
      originalPrice: mealData.originalPrice,
      isVeg: mealData.isVeg ?? true,
      hasEgg: mealData.hasEgg ?? false,
      nutritionInfo: mealData.nutritionInfo || {
        calories: 400,
        protein: 20,
        carbs: 30,
        fat: 15,
        fiber: 5,
      },
      ingredients: mealData.ingredients || ["Fresh ingredients"],
      allergens: mealData.allergens || [],
      isActive: mealData.isActive ?? true,
      isFeatured: mealData.isFeatured ?? false,
      isDraft: mealData.isDraft ?? true,
      rating: 4.0,
      reviewCount: 0,
      preparationTime: mealData.preparationTime ?? 20,
      tags: mealData.tags || ["Healthy"],
      isBasicThali: mealData.isBasicThali ?? false,
      variantPricing: mealData.variantPricing,
      allowDaySelection: mealData.allowDaySelection ?? false,
      addonIds: mealData.addonIds,
      availableTimeSlotIds: mealData.availableTimeSlotIds,
      availableWeekTypes: mealData.availableWeekTypes,
    };

    // Save to Firebase
    try {
      const { createMeal } = await import("@/services/firebase");
      await createMeal(newMeal);
    } catch (error) {
      console.error("[db] Error creating meal in Firebase:", error);
    }

    // Also save to AsyncStorage as fallback/cache
    meals.push(newMeal);
    await this.setItem("meals", meals);
    return newMeal;
  }

  async addLocation(locationData: {
    name: string;
    address: string;
  }): Promise<ServiceableLocation> {
    const locations = await this.getServiceableLocations();
    const newLocation: ServiceableLocation = {
      id: Date.now().toString(),
      name: locationData.name,
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946,
      },
      radius: 5,
      deliveryFee: 29,
      isActive: true,
    };
    locations.push(newLocation);
    await this.setItem("serviceableLocations", locations);
    return newLocation;
  }

  async createManualSubscription(subscriptionData: {
    weekType: string;
    userId: string;
    planId: string;
    mealId: string;
    price: number;
    startDate: string;
    addressId?: string;
    deliveryTimeSlot?: string;
    weekendExclusion?: "both" | "saturday" | "sunday" | "none";
  }): Promise<Subscription> {
    const subscriptions = await this.getSubscriptions();
    const plan = await this.getPlanById(subscriptionData.planId);
    const planDays = plan?.days ?? 0;
    const start = new Date(subscriptionData.startDate);
    const allowedWeekTypes = ["mon-fri", "mon-sat", "everyday"] as const;
    const weekType: "mon-fri" | "mon-sat" | "everyday" = allowedWeekTypes.includes(
      subscriptionData.weekType as any
    )
      ? (subscriptionData.weekType as "mon-fri" | "mon-sat" | "everyday")
      : "mon-fri";
    const end = new Date(start);
    let served = 0;
    while (served < planDays) {
      const day = end.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

      let isWorkingDay = false;
      if (weekType === "everyday") {
        isWorkingDay = true;
      } else if (weekType === "mon-fri") {
        isWorkingDay = day >= 1 && day <= 5; // Mon to Fri
      } else if (weekType === "mon-sat") {
        isWorkingDay = day >= 1 && day <= 6; // Mon to Sat
      }

      if (isWorkingDay) {
        served += 1;
      }

      if (served < planDays) {
        end.setDate(end.getDate() + 1);
      }
    }

    const weekendExclusion =
      weekType === "everyday"
        ? "none"
        : weekType === "mon-sat"
          ? "sunday"
          : "both";

    const newSubscription: Subscription = {
      id: Date.now().toString(),
      userId: subscriptionData.userId,
      planId: subscriptionData.planId,
      mealId: subscriptionData.mealId,
      addOns: [],
      startDate: start,
      endDate: end,
      deliveryTimeSlot:
        subscriptionData.deliveryTimeSlot ?? "12:00 PM - 1:00 PM",
      weekendExclusion,
      weekType: ["mon-fri", "mon-sat", "everyday", "none"].includes(
        subscriptionData?.weekType as any
      )
        ? (subscriptionData?.weekType as "mon-fri" | "mon-sat" | "everyday" | "none")
        : "none",

      totalAmount: subscriptionData.price,
      status: "active",
      paymentStatus: "paid",
      createdAt: new Date(),
      addressId: subscriptionData.addressId,
      totalDeliveries: planDays || undefined,
      remainingDeliveries: planDays || undefined,
    };
    const next = [...subscriptions, newSubscription];
    await this.setItem("subscriptions", next);
    return newSubscription;
  }

  // Notify Me Requests methods
  async getNotifyRequests(): Promise<any[]> {
    return (await this.getItem("notifyRequests")) || [];
  }

  async createNotifyRequest(requestData: {
    name: string;
    phone: string;
    location: string;
    coordinates?: { latitude: number; longitude: number };
  }): Promise<any> {
    const requests = await this.getNotifyRequests();
    const newRequest = {
      id: Date.now().toString(),
      ...requestData,
      createdAt: new Date(),
      status: "pending",
    };
    requests.push(newRequest);
    await this.setItem("notifyRequests", requests);
    return newRequest;
  }

  async addServiceAreaRequest(
    requestData: Omit<import("@/types").ServiceAreaNotificationRequest, "id">
  ): Promise<import("@/types").ServiceAreaNotificationRequest> {
    try {
      const requests =
        (await this.getItem("serviceAreaRequests")) || [];
      const newRequest: import("@/types").ServiceAreaNotificationRequest = {
        ...requestData,
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(requestData.createdAt),
      };
      requests.push(newRequest);
      await this.setItem("serviceAreaRequests", requests);
      
      console.log("[Database] Service area request added:", newRequest.id);
      return newRequest;
    } catch (error) {
      console.error("[Database] Error adding service area request:", error);
      throw error;
    }
  }

  async getServiceAreaRequests(): Promise<import("@/types").ServiceAreaNotificationRequest[]> {
    try {
      const requests = (await this.getItem("serviceAreaRequests")) || [];
      return requests.map((req: any) => ({
        ...req,
        createdAt: new Date(req.createdAt),
        updatedAt: req.updatedAt ? new Date(req.updatedAt) : undefined,
        contactedAt: req.contactedAt ? new Date(req.contactedAt) : undefined,
        fulfilledAt: req.fulfilledAt ? new Date(req.fulfilledAt) : undefined,
      }));
    } catch (error) {
      console.error("[Database] Error getting service area requests:", error);
      return [];
    }
  }

  async updateServiceAreaRequest(
    requestId: string,
    updates: Partial<import("@/types").ServiceAreaNotificationRequest>
  ): Promise<void> {
    try {
      const requests = (await this.getItem("serviceAreaRequests")) || [];
      const index = requests.findIndex((r: any) => r.id === requestId);
      
      if (index === -1) {
        throw new Error("Service area request not found");
      }

      requests[index] = {
        ...requests[index],
        ...updates,
        updatedAt: new Date(),
      };

      await this.setItem("serviceAreaRequests", requests);
      console.log("[Database] Service area request updated:", requestId);
    } catch (error) {
      console.error("[Database] Error updating service area request:", error);
      throw error;
    }
  }

  async addLocationWithPolygon(locationData: {
    name: string;
    address: string;
    polygon: { latitude: number; longitude: number }[];
    deliveryFee?: number;
  }): Promise<ServiceableLocation> {
    const locations = await this.getServiceableLocations();

    // Calculate center point of polygon
    const centerLat =
      locationData.polygon.reduce((sum, point) => sum + point.latitude, 0) /
      locationData.polygon.length;
    const centerLng =
      locationData.polygon.reduce((sum, point) => sum + point.longitude, 0) /
      locationData.polygon.length;

    const newLocation: ServiceableLocation = {
      id: Date.now().toString(),
      name: locationData.name,
      coordinates: {
        latitude: centerLat,
        longitude: centerLng,
      },
      radius: 5, // Default radius
      deliveryFee: locationData.deliveryFee || 29,
      isActive: true,
      polygon: locationData.polygon,
    };

    // Save to Firebase
    try {
      await fbCreateServiceableLocation(newLocation);
      console.log("[db] Serviceable location saved to Firebase:", newLocation.name);
    } catch (error) {
      console.error("[db] Error saving serviceable location to Firebase:", error);
    }

    // Also save to AsyncStorage for offline access
    locations.push(newLocation);
    await this.setItem("serviceableLocations", locations);
    return newLocation;
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Referral methods
  async getUserByReferralCode(referralCode: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((user) => user.referralCode === referralCode) || null;
  }

  async processReferral(
    referralCode: string,
    newUserId: string
  ): Promise<void> {
    const referrer = await this.getUserByReferralCode(referralCode);
    if (!referrer) return;

    const referralRewards = (await this.getItem("referralRewards")) || [];
    const newReward: ReferralReward = {
      id: Date.now().toString(),
      userId: referrer.id,
      referredUserId: newUserId,
      referralCode,
      amount: 500,
      status: "pending",
      createdAt: new Date(),
    };
    referralRewards.push(newReward);
    await this.setItem("referralRewards", referralRewards);

    await this.updateUser(referrer.id, {
      totalReferrals: referrer.totalReferrals + 1,
    });
  }

  async creditReferralReward(subscriptionId: string): Promise<void> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription || subscription.planId !== "4") return;

    const user = await this.getUserById(subscription.userId);
    if (!user || !user.referredBy) return;

    const referralRewards = (await this.getItem("referralRewards")) || [];
    const pendingReward = referralRewards.find(
      (reward: ReferralReward) =>
        reward.referredUserId === user.id && reward.status === "pending"
    );

    if (pendingReward) {
      pendingReward.status = "credited";
      pendingReward.creditedAt = new Date();
      await this.setItem("referralRewards", referralRewards);

      await this.addWalletTransaction({
        userId: pendingReward.userId,
        type: "credit",
        amount: pendingReward.amount,
        description: `Referral bonus for inviting ${user.name || "a friend"}`,
        referenceId: pendingReward.id,
      });

      const referrer = await this.getUserById(pendingReward.userId);
      if (referrer) {
        await this.updateUser(referrer.id, {
          referralEarnings: referrer.referralEarnings + pendingReward.amount,
        });
      }
    }
  }

  async getReferralRewards(userId: string): Promise<ReferralReward[]> {
    const referralRewards = (await this.getItem("referralRewards")) || [];
    return referralRewards.filter(
      (reward: ReferralReward) => reward.userId === userId
    );
  }

  async applyReferralCode(
    userId: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getUserById(userId);
    if (!user) return { success: false, message: "User not found" };
    if (user.referredBy)
      return { success: false, message: "Referral already applied" };
    const referrer = await this.getUserByReferralCode(code);
    if (!referrer) return { success: false, message: "Invalid referral code" };
    if (referrer.id === user.id)
      return { success: false, message: "You cannot use your own code" };

    await this.updateUser(user.id, { referredBy: code });

    const bonus = 200;
    await this.addWalletTransaction({
      userId: user.id,
      type: "credit",
      amount: bonus,
      description: "Referral bonus (welcome)",
      referenceId: `ref-${referrer.id}-${user.id}`,
    });
    await this.addWalletTransaction({
      userId: referrer.id,
      type: "credit",
      amount: bonus,
      description: `Referral bonus for inviting ${user.name || "a friend"}`,
      referenceId: `ref-${user.id}`,
    });

    await this.updateUser(referrer.id, {
      totalReferrals: (referrer.totalReferrals || 0) + 1,
      referralEarnings: (referrer.referralEarnings || 0) + bonus,
    });

    return {
      success: true,
      message: "Referral applied. Bonus credited to both wallets.",
    };
  }

  // Streak methods
  async initializeUserStreak(userId: string): Promise<void> {
    const userStreaks = (await this.getItem("userStreaks")) || [];
    const existingStreak = userStreaks.find(
      (streak: UserStreak) => streak.userId === userId
    );

    if (!existingStreak) {
      const newStreak: UserStreak = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastOrderDate: new Date(),
        streakRewards: [],
      };
      userStreaks.push(newStreak);
      await this.setItem("userStreaks", userStreaks);
    }
  }

  async updateUserStreak(userId: string): Promise<void> {
    const userStreaks = (await this.getItem("userStreaks")) || [];
    const streakIndex = userStreaks.findIndex(
      (streak: UserStreak) => streak.userId === userId
    );

    if (streakIndex === -1) {
      await this.initializeUserStreak(userId);
      return this.updateUserStreak(userId);
    }

    const userStreak = userStreaks[streakIndex];
    const today = new Date();
    const lastOrderDate = new Date(userStreak.lastOrderDate);
    const daysDiff = Math.floor(
      (today.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      // Consecutive day - increment streak
      userStreak.currentStreak += 1;
      userStreak.longestStreak = Math.max(
        userStreak.longestStreak,
        userStreak.currentStreak
      );
    } else if (daysDiff > 1) {
      // Streak broken - reset to 1
      userStreak.currentStreak = 1;
    }
    // If daysDiff === 0, it's the same day, don't change streak

    userStreak.lastOrderDate = today;
    userStreaks[streakIndex] = userStreak;
    await this.setItem("userStreaks", userStreaks);

    // Update user record
    await this.updateUser(userId, {
      currentStreak: userStreak.currentStreak,
      longestStreak: userStreak.longestStreak,
    });

    // Check for streak rewards
    await this.checkStreakRewards(userId, userStreak.currentStreak);
  }

  async checkStreakRewards(
    userId: string,
    currentStreak: number
  ): Promise<void> {
    const rewardMilestones = [
      { streak: 7, amount: 50 },
      { streak: 15, amount: 100 },
      { streak: 30, amount: 200 },
      { streak: 50, amount: 300 },
      { streak: 100, amount: 500 },
    ];

    const milestone = rewardMilestones.find((m) => m.streak === currentStreak);
    if (!milestone) return;

    const streakRewards = (await this.getItem("streakRewards")) || [];
    const existingReward = streakRewards.find(
      (reward: StreakReward) =>
        reward.userId === userId && reward.streakCount === currentStreak
    );

    if (!existingReward) {
      const newReward: StreakReward = {
        id: Date.now().toString(),
        userId,
        streakCount: currentStreak,
        rewardAmount: milestone.amount,
        status: "credited",
        createdAt: new Date(),
        creditedAt: new Date(),
      };
      streakRewards.push(newReward);
      await this.setItem("streakRewards", streakRewards);

      // Add to wallet
      await this.addWalletTransaction({
        userId,
        type: "credit",
        amount: milestone.amount,
        description: `Streak reward for ${currentStreak} consecutive orders`,
        referenceId: newReward.id,
      });
    }
  }

  async getUserStreak(userId: string): Promise<UserStreak | null> {
    const userStreaks = (await this.getItem("userStreaks")) || [];
    return (
      userStreaks.find((streak: UserStreak) => streak.userId === userId) || null
    );
  }

  async getStreakRewards(userId: string): Promise<StreakReward[]> {
    const streakRewards = (await this.getItem("streakRewards")) || [];
    return streakRewards.filter(
      (reward: StreakReward) => reward.userId === userId
    );
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const subscriptions = await this.getSubscriptions();
    return subscriptions.find((sub) => sub.id === id) || null;
  }

  async getSupportTicketById(id: string): Promise<SupportTicket | null> {
    const tickets = await this.getSupportTickets();
    return tickets.find((ticket) => ticket.id === id) || null;
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await this.getSupportTickets();
  }

  async toggleMealDraftStatus(mealId: string): Promise<Meal | null> {
    const meals = await this.getMeals();
    const index = meals.findIndex((meal) => meal.id === mealId);
    if (index === -1) return null;

    meals[index].isDraft = !meals[index].isDraft;
    await this.setItem("meals", meals);
    return meals[index];
  }

  async updateMeal(
    mealId: string,
    updates: Partial<Meal>
  ): Promise<Meal | null> {
    // Use getAllMealsAdmin to get ALL meals including drafts
    const meals = await this.getAllMealsAdmin();
    const index = meals.findIndex((meal) => meal.id === mealId);
    if (index === -1) {
      console.error(`[db] Meal with id ${mealId} not found for update`);
      return null;
    }

    meals[index] = { ...meals[index], ...updates };

    // Update in Firebase
    try {
      const { updateMeal } = await import("@/services/firebase");
      await updateMeal(mealId, updates);
    } catch (error) {
      console.error("[db] Error updating meal in Firebase:", error);
    }

    // Also update AsyncStorage
    await this.setItem("meals", meals);
    return meals[index];
  }

  // Initial data methods
  private getInitialUsers(): User[] {
    return [
      {
        id: "1",
        name: "Admin User",
        email: "admin@foodapp.com",
        phone: "+919999999999",
        role: "admin",
        addresses: [],
        walletBalance: 0,
        referralCode: "ADMIN001",
        createdAt: new Date(),
        isActive: true,
        currentStreak: 0,
        longestStreak: 0,
        totalReferrals: 0,
        referralEarnings: 0,
      },
      {
        id: "2",
        name: "Kitchen Manager",
        email: "kitchen@foodapp.com",
        phone: "+919999999998",
        role: "kitchen",
        addresses: [],
        walletBalance: 0,
        referralCode: "KITCHEN01",
        createdAt: new Date(),
        isActive: true,
        currentStreak: 0,
        longestStreak: 0,
        totalReferrals: 0,
        referralEarnings: 0,
      },
      {
        id: "3",
        name: "Delivery Person",
        email: "delivery@foodapp.com",
        phone: "+919999999997",
        role: "delivery",
        addresses: [],
        walletBalance: 0,
        referralCode: "DELIVERY01",
        createdAt: new Date(),
        isActive: true,
        currentStreak: 0,
        longestStreak: 0,
        totalReferrals: 0,
        referralEarnings: 0,
      },
      {
        id: "4",
        name: "Test Customer",
        email: "customer@test.com",
        phone: "+919999999996",
        role: "customer",
        addresses: [],
        walletBalance: 500,
        referralCode: "CUST001",
        createdAt: new Date(),
        isActive: true,
        currentStreak: 5,
        longestStreak: 12,
        totalReferrals: 3,
        referralEarnings: 1500,
      },
    ];
  }

  private getInitialCategories(): Category[] {
    // Use centralized data from constants/data.ts
    try {
      const { categories } = require("@/constants/data");
      return categories || [];
    } catch (error) {
      console.error(
        "[db] Failed to load categories from constants/data:",
        error
      );
      return [];
    }
  }

  private getInitialMeals(): Meal[] {
    // Use centralized data from constants/data.ts
    try {
      const { Meals } = require("@/constants/data");
      return Meals || [];
    } catch (error) {
      console.error("[db] Failed to load meals from constants/data:", error);
      return [];
    }
  }

  private getInitialAddOns(): AddOn[] {
    // Use centralized data from constants/data.ts
    try {
      const { addOns } = require("@/constants/data");
      return addOns || [];
    } catch (error) {
      console.error("[db] Failed to load add-ons from constants/data:", error);
      return [];
    }
  }
  private getInitialPlans(): Plan[] {
    return [
      {
        id: "1",
        name: "Trial Plan",
        days: 2,
        discount: 0,
        description: "Try our meals for 2 days",
        isActive: true,
      },
      {
        id: "2",
        name: "Weekly Plan",
        days: 6,
        discount: 10,
        description: "6 days meal plan with 10% discount",
        isActive: true,
      },
      {
        id: "3",
        name: "Bi-weekly Plan",
        days: 15,
        discount: 15,
        description: "15 days meal plan with 15% discount",
        isActive: true,
      },
      {
        id: "4",
        name: "Monthly Plan",
        days: 26,
        discount: 20,
        description: "26 days meal plan with 20% discount",
        isActive: true,
      },
    ];
  }

  private getInitialBanners(): Banner[] {
    return [
      {
        id: "1",
        title: "Healthy Meals Delivered",
        subtitle: "Fresh, nutritious meals at your doorstep",
        image:
          "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
        actionType: "category",
        actionValue: "1",
        isActive: true,
        sortOrder: 1,
      },
      {
        id: "2",
        title: "20% Off First Order",
        subtitle: "Use code WELCOME20 for new customers",
        image:
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800",
        actionType: "offer",
        actionValue: "1",
        isActive: true,
        sortOrder: 2,
      },
      {
        id: "3",
        title: "Protein Power Meals",
        subtitle: "High protein meals for fitness goals",
        image:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
        actionType: "category",
        actionValue: "3",
        isActive: true,
        sortOrder: 3,
      },
    ];
  }

  private getInitialTestimonials(): Testimonial[] {
    return [
      {
        id: "1",
        userName: "Priya Sharma",
        userImage:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
        rating: 5,
        comment:
          "Amazing food quality and timely delivery. The meals are fresh and delicious!",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "2",
        userName: "Rahul Kumar",
        userImage:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        rating: 5,
        comment:
          "Perfect for my fitness goals. High protein meals that actually taste great.",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "3",
        userName: "Anita Patel",
        userImage:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        rating: 4,
        comment:
          "Convenient and healthy. Love the variety of vegetarian options available.",
        isActive: true,
        createdAt: new Date(),
      },
    ];
  }

  private getInitialOffers(): Offer[] {
    return [
      {
        id: "1",
        title: "Welcome Offer",
        description: "20% off on your first order",
        image:
          "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400",
        discountType: "percentage",
        discountValue: 20,
        minOrderAmount: 199,
        maxDiscount: 100,
        promoCode: "WELCOME20",
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageLimit: 1000,
        usedCount: 0,
        offerType: "discount",
      },
      {
        id: "2",
        title: "Wallet Cashback",
        description: "Get ₹50 cashback on orders above ₹500",
        image:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
        discountType: "cashback",
        discountValue: 50,
        minOrderAmount: 500,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
        usedCount: 0,
        offerType: "cashback",
      },
    ];
  }

  private getInitialTimeSlots(): TimeSlot[] {
    return [
      {
        id: "1",
        time: "12:00 PM - 1:00 PM",
        label: "Lunch Time",
        isActive: true,
      },
      {
        id: "2",
        time: "1:00 PM - 2:00 PM",
        label: "Afternoon",
        isActive: true,
      },
      {
        id: "3",
        time: "7:00 PM - 8:00 PM",
        label: "Dinner Time",
        isActive: true,
      },
      {
        id: "4",
        time: "8:00 PM - 9:00 PM",
        label: "Late Dinner",
        isActive: true,
      },
    ];
  }

  private getInitialServiceableLocations(): ServiceableLocation[] {
    return [
      {
        id: "1",
        name: "Koramangala",
        coordinates: {
          latitude: 12.9352,
          longitude: 77.6245,
        },
        radius: 5,
        deliveryFee: 29,
        isActive: true,
      },
      {
        id: "2",
        name: "Indiranagar",
        coordinates: {
          latitude: 12.9719,
          longitude: 77.6412,
        },
        radius: 4,
        deliveryFee: 29,
        isActive: true,
      },
      {
        id: "3",
        name: "Whitefield",
        coordinates: {
          latitude: 12.9698,
          longitude: 77.75,
        },
        radius: 6,
        deliveryFee: 39,
        isActive: true,
      },
    ];
  }

  private getInitialDeliveryPersons(): DeliveryPerson[] {
    return [
      {
        id: "1",
        name: "Ravi Kumar",
        phone: "+919876543210",
        email: "ravi@foodapp.com",
        vehicleNumber: "KA01AB1234",
        isActive: true,
        isAvailable: true,
      },
      {
        id: "2",
        name: "Suresh Reddy",
        phone: "+919876543211",
        email: "suresh@foodapp.com",
        vehicleNumber: "KA01CD5678",
        isActive: true,
        isAvailable: true,
      },
    ];
  }

  private getInitialKitchenStaff(): KitchenStaff[] {
    return [
      {
        id: "1",
        name: "Chef Ramesh",
        phone: "+919876543212",
        email: "ramesh@foodapp.com",
        role: "chef",
        isActive: true,
      },
      {
        id: "2",
        name: "Assistant Priya",
        phone: "+919876543213",
        email: "priya@foodapp.com",
        role: "assistant",
        isActive: true,
      },
    ];
  }

  private getInitialFAQs(): FAQ[] {
    return [
      {
        id: "1",
        question: "How do I place an order?",
        answer:
          "You can browse our menu, select your meals, choose a subscription plan, and proceed to checkout.",
        category: "Orders",
        isActive: true,
        sortOrder: 1,
      },
      {
        id: "2",
        question: "What are your delivery timings?",
        answer:
          "We deliver lunch between 12:00 PM - 2:00 PM and dinner between 7:00 PM - 9:00 PM.",
        category: "Delivery",
        isActive: true,
        sortOrder: 2,
      },
      {
        id: "3",
        question: "Can I skip meals?",
        answer:
          "Yes, you can skip meals up to 10:00 AM for lunch and 4:00 PM for dinner on the same day.",
        category: "Subscription",
        isActive: true,
        sortOrder: 3,
      },
    ];
  }

  private getInitialAppSettings(): AppSettings {
    return {
      deliveryRadius: 10,
      minOrderAmount: 199,
      deliveryFee: 29,
      freeDeliveryAbove: 499,
      orderCutoffTime: "10:00",
      skipCutoffTime: "09:00",
      addOnCutoffTime: "08:00",
      kitchenStartTime: "08:30",
      deliveryStartTime: "09:00",
      supportPhone: "+919999999999",
      supportEmail: "support@foodapp.com",
      whatsappNumber: "+919999999999",
    };
  }

  private getInitialSupportTickets(): SupportTicket[] {
    return [
      {
        id: "1",
        userId: "4",
        subject: "Delivery Issue",
        message:
          "My meal was not delivered today. I was waiting at home but no one came.",
        status: "open",
        priority: "high",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "2",
        userId: "4",
        subject: "Meal Quality Concern",
        message:
          "The meal I received yesterday was cold and the taste was not up to the mark.",
        status: "in_progress",
        priority: "medium",
        assignedTo: "1",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        id: "3",
        userId: "4",
        subject: "Subscription Modification",
        message:
          "I want to change my delivery time from lunch to dinner. How can I do this?",
        status: "resolved",
        priority: "low",
        assignedTo: "1",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ];
  }

  private getInitialSupportMessages(): SupportMessage[] {
    return [
      {
        id: "1",
        ticketId: "2",
        senderId: "1",
        senderType: "admin",
        message:
          "Hi! Thank you for reaching out. I'm sorry to hear about the quality issue. We take this very seriously.",
        isRead: true,
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        deliveryStatus: "read",
      },
      {
        id: "2",
        ticketId: "2",
        senderId: "4",
        senderType: "user",
        message: "Thank you for the quick response. I appreciate your concern.",
        isRead: true,
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
        deliveryStatus: "read",
      },
      {
        id: "3",
        ticketId: "2",
        senderId: "1",
        senderType: "admin",
        message:
          "We've credited ₹100 to your wallet as compensation. We've also spoken to our kitchen team to ensure this doesn't happen again.",
        isRead: true,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        deliveryStatus: "delivered",
      },
      {
        id: "4",
        ticketId: "3",
        senderId: "1",
        senderType: "admin",
        message:
          "You can change your delivery time by going to your subscription settings. I've updated it to dinner time (7-8 PM) for you.",
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliveryStatus: "read",
      },
      {
        id: "5",
        ticketId: "3",
        senderId: "4",
        senderType: "user",
        message: "Perfect! Thank you so much for the help.",
        isRead: true,
        createdAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000
        ),
        deliveryStatus: "read",
      },
    ];
  }

  private getInitialSubscriptions(): Subscription[] {
    return [
      {
        id: "1",
        userId: "4",
        planId: "2",
        mealId: "1",
        addOns: [],
        startDate: new Date(),
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        deliveryTimeSlot: "12:00 PM - 1:00 PM",
        weekendExclusion: "sunday",
        weekType: "mon-fri",
        totalAmount: 1499,
        paidAmount: 1499,
        totalDeliveries: 6,
        remainingDeliveries: 4,
        status: "active",
        paymentStatus: "paid",
        createdAt: new Date(),
        skippedDates: [],
        additionalAddOns: {},
      },
      {
        id: "2",
        userId: "4",
        planId: "3",
        mealId: "2",
        addOns: ["1"],
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        deliveryTimeSlot: "7:00 PM - 8:00 PM",
        weekendExclusion: "sunday",
        weekType: "mon-fri",
        totalAmount: 3599,
        paidAmount: 3599,
        totalDeliveries: 15,
        remainingDeliveries: 10,
        status: "active",
        paymentStatus: "paid",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        skippedDates: [],
        additionalAddOns: {},
      },
      {
        id: "3",
        userId: "4",
        planId: "1",
        mealId: "4",
        addOns: [],
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        deliveryTimeSlot: "1:00 PM - 2:00 PM",
        weekendExclusion: "sunday",
        weekType: "mon-fri",
        totalAmount: 299,
        paidAmount: 299,
        totalDeliveries: 2,
        remainingDeliveries: 1,
        status: "active",
        paymentStatus: "paid",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        skippedDates: [],
        additionalAddOns: {},
      },
    ];
  }
}

export default Database.getInstance();
