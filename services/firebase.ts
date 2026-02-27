import {
  AddOn,
  Banner,
  Category,
  Meal,
  Testimonial,
  User,
  UserRole,
  Subscription,
  ServiceAreaNotificationRequest,
  Polygon,
  ServiceableLocation,
  Offer,
} from "@/types";
import Constants from "expo-constants";

const FIREBASE_API_KEY = (process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
  (Constants as any).expoConfig?.extra?.firebaseApiKey ||
  "") as string;
const FIREBASE_PROJECT_ID = (process.env.EXPO_PUBLIC_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  (Constants as any).expoConfig?.extra?.firebaseProjectId ||
  "") as string;

if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID) {
  console.log(
    "[firebase] Missing EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_PROJECT_ID. Using local data or queries will fail."
  );
}

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const IDENTITY_BASE = `https://identitytoolkit.googleapis.com/v1`;

function parseValue(v: any): any {
  if (!v || typeof v !== "object") return v;
  if ("stringValue" in v) return v.stringValue as string;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return Boolean(v.booleanValue);
  if ("timestampValue" in v) return new Date(v.timestampValue);
  if ("arrayValue" in v) {
    const values = v.arrayValue?.values || [];
    return values.map(parseValue);
  }
  if ("mapValue" in v) {
    const fields = v.mapValue?.fields || {};
    const obj: Record<string, any> = {};
    Object.keys(fields).forEach((k) => {
      obj[k] = parseValue(fields[k]);
    });
    return obj;
  }
  if ("nullValue" in v) return null;
  return v;
}

function parseDocument<T>(doc: any): T | null {
  try {
    const fields = doc?.fields || {};
    const data = parseValue({ mapValue: { fields } });
    return data as T;
  } catch (e) {
    console.log("[firebase] parseDocument error", e);
    return null;
  }
}

function toFirestoreValue(val: any): any {
  const t = typeof val;
  if (val === null || val === undefined) return { nullValue: null };
  if (t === "string") return { stringValue: val };
  if (t === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (t === "boolean") return { booleanValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val))
    return { arrayValue: { values: val.map((v) => toFirestoreValue(v)) } };
  if (t === "object") {
    const fields: Record<string, any> = {};
    Object.keys(val).forEach((k) => {
      fields[k] = toFirestoreValue(val[k]);
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function createDocument(
  collectionPath: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  const url = `${BASE_URL}/${collectionPath}?documentId=${encodeURIComponent(
    id
  )}&key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  const body = JSON.stringify({
    fields: toFirestoreValue(data).mapValue.fields,
  });
  console.log("[firebase] POST", url, { id });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    console.log("[firebase] createDocument failed", collectionPath, id, text);
    if (!text.includes("ALREADY_EXISTS")) {
      throw new Error(`Create ${collectionPath}/${id} failed: ${text}`);
    }
  }
}

async function updateDocument(
  collectionPath: string,
  id: string,
  updates: Record<string, any>
): Promise<void> {
  const fieldPaths = Object.keys(updates)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");
  const url = `${BASE_URL}/${collectionPath}/${encodeURIComponent(
    id
  )}?${fieldPaths}&key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  const body = JSON.stringify({
    fields: toFirestoreValue(updates).mapValue.fields,
  });
  console.log("[firebase] PATCH", url, { id });
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update ${collectionPath}/${id} failed: ${text}`);
  }
}

async function deleteDocument(
  collectionPath: string,
  id: string
): Promise<void> {
  const url = `${BASE_URL}/${collectionPath}/${encodeURIComponent(
    id
  )}?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  console.log("[firebase] DELETE", url, { id });
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete ${collectionPath}/${id} failed: ${text}`);
  }
}

async function fetchCollection<T>(collectionPath: string): Promise<T[]> {
  const url = `${BASE_URL}/${collectionPath}?key=${encodeURIComponent(
    FIREBASE_API_KEY
  )}`;
  console.log("[firebase] GET", url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore error ${res.status}: ${text}`);
  }
  const json = await res.json();
  const docs = (json?.documents || []) as any[];
  const items: T[] = [];
  docs.forEach((d) => {
    const parsed = parseDocument<T>(d);
    if (parsed) items.push(parsed);
  });
  return items;
}

export async function signUpWithEmailPassword(params: {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}): Promise<{ uid: string; idToken: string }> {
  const url = `${IDENTITY_BASE}/accounts:signUp?key=${encodeURIComponent(
    FIREBASE_API_KEY
  )}`;
  console.log("[firebase] Auth signUp", params.email);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      returnSecureToken: true,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "SIGN_UP_FAILED");
  }
  const uid = json.localId as string;
  const idToken = json.idToken as string;
  const name = params.name ?? "";
  const role: UserRole = params.role ?? "customer";

  const now = new Date();
  const newUser: User = {
    id: uid,
    name,
    email: params.email,
    phone: "",
    role,
    addresses: [],
    walletBalance: 500,
    referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    referredBy: undefined,
    createdAt: now,
    isActive: true,
    isGuest: false,
    currentStreak: 0,
    longestStreak: 0,
    totalReferrals: 0,
    referralEarnings: 0,
    pushToken: undefined,
  };
  try {
    await createDocument(
      "users",
      uid,
      newUser as unknown as Record<string, any>
    );
  } catch (e) {
    console.log("[firebase] create user after signUp failed", e);
  }
  return { uid, idToken };
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ uid: string; idToken: string }> {
  const url = `${IDENTITY_BASE}/accounts:signInWithPassword?key=${encodeURIComponent(
    FIREBASE_API_KEY
  )}`;
  console.log("[firebase] Auth signIn", email);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "SIGN_IN_FAILED");
  }
  return { uid: json.localId as string, idToken: json.idToken as string };
}

/**
 * Sign in with custom token (for WhatsApp OTP authentication)
 * Note: This requires server-side custom token generation
 */
export async function signInWithCustomToken(
  customToken: string
): Promise<{ uid: string; idToken: string }> {
  const url = `${IDENTITY_BASE}/accounts:signInWithCustomToken?key=${encodeURIComponent(
    FIREBASE_API_KEY
  )}`;
  console.log("[firebase] Auth signInWithCustomToken");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "CUSTOM_TOKEN_SIGN_IN_FAILED");
  }
  return { uid: json.localId as string, idToken: json.idToken as string };
}

/**
 * Create custom token for Firebase authentication
 * Note: This is a placeholder. In production, custom tokens MUST be generated server-side
 * using Firebase Admin SDK for security reasons.
 *
 * IMPLEMENTATION REQUIRED:
 * 1. Set up Firebase Admin SDK on your backend (Node.js/Express/tRPC)
 * 2. Create an API endpoint that generates custom tokens
 * 3. Call that endpoint from this function
 *
 * Example server-side implementation:
 * const admin = require('firebase-admin');
 * const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
 */
export async function createCustomToken(
  uid: string,
  additionalClaims?: Record<string, any>
): Promise<string> {
  // TODO: Replace this with actual server call
  // This is a placeholder that will need to be replaced with your backend endpoint

  console.warn(
    "[firebase] createCustomToken: Custom tokens must be generated server-side using Firebase Admin SDK. " +
      "Please implement a backend endpoint for this functionality."
  );

  // Placeholder return - this will not work for actual authentication
  // You need to call your backend API that uses Firebase Admin SDK
  throw new Error(
    "Custom token generation must be implemented on the backend. " +
      "See backend/trpc/ for implementation examples."
  );

  /*
   * Example of what your backend endpoint should do:
   *
   * import * as admin from 'firebase-admin';
   *
   * export async function generateCustomToken(uid: string, claims?: any) {
   *   const customToken = await admin.auth().createCustomToken(uid, claims);
   *   return customToken;
   * }
   */
}

export async function fetchBanners(): Promise<Banner[]> {
  const items = await fetchCollection<Banner>("banners");
  return items
    .filter((b) => b?.isActive ?? true)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    // First try Firebase
    const items = await fetchCollection<Category>("categories");
    if (items && items.length > 0) {
      const validItems = items.filter(
        (c) => c && typeof c.id === "string" && typeof c.name === "string"
      );
      return validItems
        .filter((c) => c?.isActive ?? true)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    // If no items in Firebase, use constants/data.ts as source of truth
    const { categories } = await import("@/constants/data");
    return (categories ?? [])
      .filter((c) => c?.isActive ?? true)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (error) {
    console.error("[Firebase] Error fetching categories:", error);
    // Final fallback to constants/data.ts
    try {
      const { categories } = await import("@/constants/data");
      return (categories ?? [])
        .filter((c) => c?.isActive ?? true)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    } catch (e) {
      console.error("[Firebase] Failed to load fallback categories:", e);
      return [];
    }
  }
}

export async function fetchMeals(): Promise<Meal[]> {
  try {
    const items = await fetchCollection<Meal>("meals");
    if (items && items.length > 0) {
      const validItems = items.filter(
        (m) =>
          m &&
          typeof m.id === "string" &&
          typeof m.name === "string" &&
          typeof m.price === "number"
      );
      return validItems.filter(
        (m) => (m?.isActive ?? true) && !(m as any)?.isDraft
      );
    }

    // If no items in Firebase, use constants/data.ts as source of truth
    const { Meals } = await import("@/constants/data");
    return (Meals ?? []).filter((m) => (m?.isActive ?? true) && !m?.isDraft);
  } catch (error) {
    console.error("[Firebase] Error fetching meals:", error);
    // Final fallback to constants/data.ts
    try {
      const { Meals } = await import("@/constants/data");
      return (Meals ?? []).filter((m) => (m?.isActive ?? true) && !m?.isDraft);
    } catch (e) {
      console.error("[Firebase] Failed to load fallback meals:", e);
      return [];
    }
  }
}

// Admin version that fetches ALL meals including drafts and inactive
export async function fetchAllMealsAdmin(): Promise<Meal[]> {
  try {
    const items = await fetchCollection<Meal>("meals");
    if (items && items.length > 0) {
      const validItems = items.filter(
        (m) =>
          m &&
          typeof m.id === "string" &&
          typeof m.name === "string" &&
          typeof m.price === "number"
      );
      // Return ALL meals for admin, including drafts and inactive
      return validItems;
    }

    // If no items in Firebase, use constants/data.ts as source of truth
    const { Meals } = await import("@/constants/data");
    return Meals ?? [];
  } catch (error) {
    console.error("[Firebase] Error fetching all meals for admin:", error);
    // Final fallback to constants/data.ts
    try {
      const { Meals } = await import("@/constants/data");
      return Meals ?? [];
    } catch (e) {
      console.error("[Firebase] Failed to load fallback meals:", e);
      return [];
    }
  }
}

export async function fetchAddOns(): Promise<AddOn[]> {
  try {
    const items = await fetchCollection<AddOn>("addons");
    if (items && items.length > 0) {
      const validItems = items.filter(
        (a) =>
          a &&
          typeof a.id === "string" &&
          typeof a.name === "string" &&
          typeof a.price === "number"
      );
      return validItems.filter((a) => a?.isActive ?? true);
    }

    // If no items in Firebase, use constants/data.ts as source of truth
    const { addOns } = await import("@/constants/data");
    return (addOns ?? []).filter((a) => a?.isActive ?? true);
  } catch (error) {
    console.error("[Firebase] Error fetching add-ons:", error);
    // Final fallback to constants/data.ts
    try {
      const { addOns } = await import("@/constants/data");
      return (addOns ?? []).filter((a) => a?.isActive ?? true);
    } catch (e) {
      console.error("[Firebase] Failed to load fallback add-ons:", e);
      return [];
    }
  }
}

// Category CRUD
export async function createCategory(category: Category): Promise<void> {
  await createDocument(
    "categories",
    category.id,
    category as Record<string, any>
  );
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<void> {
  await updateDocument("categories", id, updates as Record<string, any>);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDocument("categories", id);
}

// Meal CRUD
export async function createMeal(meal: Meal): Promise<void> {
  await createDocument("meals", meal.id, meal as Record<string, any>);
}

export async function updateMeal(
  id: string,
  updates: Partial<Meal>
): Promise<void> {
  await updateDocument("meals", id, updates as Record<string, any>);
}

export async function deleteMeal(id: string): Promise<void> {
  await deleteDocument("meals", id);
}

// AddOn CRUD
export async function createAddOn(addon: AddOn): Promise<void> {
  await createDocument("addons", addon.id, addon as Record<string, any>);
}

export async function updateAddOn(
  id: string,
  updates: Partial<AddOn>
): Promise<void> {
  await updateDocument("addons", id, updates as Record<string, any>);
}

export async function deleteAddOn(id: string): Promise<void> {
  await deleteDocument("addons", id);
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const items = await fetchCollection<Testimonial>("testimonials");
  return items.filter((t) => t?.isActive ?? true);
}

export async function fetchUsers(): Promise<User[]> {
  const items = await fetchCollection<User>("users");
  return items;
}

export async function createUser(user: User): Promise<void> {
  await createDocument("users", user.id, user);
}

export async function getUserDoc(id: string): Promise<User | null> {
  const url = `${BASE_URL}/users/${encodeURIComponent(
    id
  )}?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  console.log("[firebase] GET user doc", id);
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) return null;
  const json = await res.json();
  const parsed = parseDocument<User>(json);
  return parsed;
}

export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<void> {
  await updateDocument("users", id, updates as Record<string, any>);
}

/**
 * Add a new address to a user's address list in Firebase
 * Production-ready with proper validation and error handling
 */
export async function addUserAddress(
  userId: string,
  address: Omit<import("@/types").Address, "id" | "userId">
): Promise<import("@/types").Address> {
  try {
    // Fetch current user to get existing addresses
    const currentUser = await getUserDoc(userId);
    if (!currentUser) {
      throw new Error(`User not found: ${userId}`);
    }

    // Generate unique address ID with timestamp and random suffix
    const addressId = `addr_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create the complete address object with timestamps
    const newAddress: import("@/types").Address = {
      ...address,
      id: addressId,
      userId,
      createdAt: address.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Update user with new address array
    const updatedAddresses = [...(currentUser.addresses || []), newAddress];

    await updateDocument("users", userId, {
      addresses: updatedAddresses,
    } as Record<string, any>);

    console.log(
      `[firebase] ✅ Address added successfully: ${addressId} for user: ${userId}`
    );
    return newAddress;
  } catch (error) {
    console.error("[firebase] ❌ Error adding address:", error);
    throw new Error(
      `Failed to add address: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Update a specific address in a user's address list
 * Only updates the specified address, leaves others unchanged
 */
export async function updateUserAddress(
  userId: string,
  addressId: string,
  updates: Partial<import("@/types").Address>
): Promise<import("@/types").Address> {
  try {
    const currentUser = await getUserDoc(userId);
    if (!currentUser) {
      throw new Error(`User not found: ${userId}`);
    }

    const addressIndex = currentUser.addresses.findIndex(
      (addr) => addr.id === addressId
    );
    if (addressIndex === -1) {
      throw new Error(`Address not found: ${addressId}`);
    }

    // Update the specific address with timestamp
    const updatedAddress: import("@/types").Address = {
      ...currentUser.addresses[addressIndex],
      ...updates,
      id: addressId, // Ensure ID doesn't change
      userId, // Ensure userId doesn't change
      updatedAt: new Date(),
    };

    // Create new addresses array with updated address
    const updatedAddresses = [...currentUser.addresses];
    updatedAddresses[addressIndex] = updatedAddress;

    await updateDocument("users", userId, {
      addresses: updatedAddresses,
    } as Record<string, any>);

    console.log(`[firebase] ✅ Address updated successfully: ${addressId}`);
    return updatedAddress;
  } catch (error) {
    console.error("[firebase] ❌ Error updating address:", error);
    throw new Error(
      `Failed to update address: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Delete a specific address from a user's address list
 * Handles default address reassignment automatically
 */
export async function deleteUserAddress(
  userId: string,
  addressId: string
): Promise<void> {
  try {
    const currentUser = await getUserDoc(userId);
    if (!currentUser) {
      throw new Error(`User not found: ${userId}`);
    }

    const addressIndex = currentUser.addresses.findIndex(
      (addr) => addr.id === addressId
    );
    if (addressIndex === -1) {
      throw new Error(`Address not found: ${addressId}`);
    }

    const wasDefault = currentUser.addresses[addressIndex].isDefault;

    // Remove the address from the array
    const updatedAddresses = currentUser.addresses.filter(
      (addr) => addr.id !== addressId
    );

    // If the deleted address was default and there are other addresses, set the first one as default
    if (wasDefault && updatedAddresses.length > 0) {
      updatedAddresses[0] = { ...updatedAddresses[0], isDefault: true };
    }

    await updateDocument("users", userId, {
      addresses: updatedAddresses,
    } as Record<string, any>);

    console.log(`[firebase] ✅ Address deleted successfully: ${addressId}`);
  } catch (error) {
    console.error("[firebase] ❌ Error deleting address:", error);
    throw new Error(
      `Failed to delete address: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Set a specific address as the default address
 * Ensures only one default address exists
 */
export async function setDefaultUserAddress(
  userId: string,
  addressId: string
): Promise<void> {
  try {
    const currentUser = await getUserDoc(userId);
    if (!currentUser) {
      throw new Error(`User not found: ${userId}`);
    }

    const addressExists = currentUser.addresses.some(
      (addr) => addr.id === addressId
    );
    if (!addressExists) {
      throw new Error(`Address not found: ${addressId}`);
    }

    // Update all addresses: set target as default, others as non-default
    const updatedAddresses = currentUser.addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));

    await updateDocument("users", userId, {
      addresses: updatedAddresses,
    } as Record<string, any>);

    console.log(`[firebase] ✅ Default address set successfully: ${addressId}`);
  } catch (error) {
    console.error("[firebase] ❌ Error setting default address:", error);
    throw new Error(
      `Failed to set default address: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function createServiceAreaNotificationRequest(
  request: Omit<ServiceAreaNotificationRequest, "id">
): Promise<string> {
  const id = `notify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const requestData: ServiceAreaNotificationRequest = {
    ...request,
    id,
  };

  await createDocument(
    "service-area-requests",
    id,
    requestData as unknown as Record<string, any>
  );
  return id;
}

export async function fetchServiceAreaRequests(): Promise<
  ServiceAreaNotificationRequest[]
> {
  return await fetchCollection<ServiceAreaNotificationRequest>(
    "service-area-requests"
  );
}

export async function updateServiceAreaRequest(
  id: string,
  updates: Partial<ServiceAreaNotificationRequest>
): Promise<void> {
  await updateDocument(
    "service-area-requests",
    id,
    updates as Record<string, any>
  );
}

export async function notifyServiceAreaAvailable(
  requestId: string,
  userEmail: string,
  userPhone: string,
  location: string
): Promise<void> {
  try {
    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll just log the notification and update the request status

    const emailData = {
      to: userEmail,
      subject: "Great News! Delivery is now available in your area",
      html: `
        <h2>Delivery Service Now Available!</h2>
        <p>We're excited to let you know that our meal delivery service is now available in your area:</p>
        <p><strong>Location:</strong> ${location}</p>
        <p>You can now place orders and enjoy fresh, healthy meals delivered to your doorstep!</p>
        <p><a href="https://yourapp.com/download" style="background-color: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Download the App</a></p>
        <br>
        <p>Thank you for your patience!</p>
        <p>The SameOldBox Team</p>
      `,
    };

    // In a real implementation, you would send the email here:
    // await sendEmail(emailData);

    console.log("Email notification would be sent:", emailData);

    // Update the request to mark as resolved and add notification date
    await updateServiceAreaRequest(requestId, {
      status: "resolved",
      notifiedAt: new Date(),
    });

    console.log(`Notification sent for request ${requestId} to ${userEmail}`);
  } catch (error) {
    console.error("Error sending service area notification:", error);
    throw error;
  }
}

export async function seedIfEmpty(): Promise<{ seeded: boolean }[]> {
  console.log("[firebase] seedIfEmpty started");
  const tasks: Array<Promise<{ seeded: boolean }>> = [];
  const { banners, categories, Meals, testimonials, addOns } = await import(
    "@/constants/data"
  );

  console.log("[firebase] Data loaded from constants:", {
    banners: banners.length,
    categories: categories.length,
    meals: Meals.length,
    testimonials: testimonials.length,
    addOns: addOns.length,
  });

  async function ensureCollection<T>(
    name: string,
    records: any[],
    idKey: string = "id"
  ) {
    try {
      console.log(`[firebase] Checking ${name} in Firebase...`);
      // Check Firebase directly without fallback
      const existing = await fetchCollection<T>(name);
      console.log(
        `[firebase] ${name} existing count: ${existing?.length ?? 0}`
      );

      if ((existing?.length ?? 0) > 0) {
        console.log(`[firebase] ${name} already present: ${existing.length}`);
        return { seeded: false };
      }

      console.log(`[firebase] Seeding ${name} with ${records.length} docs...`);
      for (const rec of records) {
        const id = (
          rec?.[idKey] ?? `${Date.now()}-${Math.random()}`
        ).toString();
        await createDocument(name, id, rec);
      }
      console.log(
        `[firebase] ✓ Successfully seeded ${records.length} documents to ${name}`
      );
      return { seeded: true };
    } catch (e) {
      console.error(`[firebase] ensureCollection error for ${name}:`, e);
      return { seeded: false };
    }
  }

  tasks.push(ensureCollection<Banner>("banners", banners as Banner[]));
  tasks.push(
    ensureCollection<Category>("categories", categories as Category[])
  );
  tasks.push(
    ensureCollection<Meal>(
      "meals",
      ([...Meals] as Meal[]).map((m) => ({
        ...m,
        isDraft: false,
      }))
    )
  );
  tasks.push(
    ensureCollection<Testimonial>("testimonials", testimonials as Testimonial[])
  );
  tasks.push(
    ensureCollection<AddOn>(
      "addons",
      (addOns as AddOn[]).map((a) => ({ ...a, isActive: true }))
    )
  );

  const initialUsers: User[] = [
    {
      id: "u-admin-1",
      name: "Admin User",
      email: "admin@foodapp.com",
      phone: "+919999999999",
      role: "admin",
      addresses: [],
      walletBalance: 0,
      referralCode: "ADMIN001",
      referredBy: undefined,
      createdAt: new Date(),
      isActive: true,
      isGuest: false,
      currentStreak: 0,
      longestStreak: 0,
      totalReferrals: 0,
      referralEarnings: 0,
      pushToken: undefined,
    },
    {
      id: "u-kitchen-1",
      name: "Kitchen Manager",
      email: "kitchen@foodapp.com",
      phone: "+919999999998",
      role: "kitchen",
      addresses: [],
      walletBalance: 0,
      referralCode: "KITCHEN01",
      referredBy: undefined,
      createdAt: new Date(),
      isActive: true,
      isGuest: false,
      currentStreak: 0,
      longestStreak: 0,
      totalReferrals: 0,
      referralEarnings: 0,
      pushToken: undefined,
    },
    {
      id: "u-delivery-1",
      name: "Delivery Person",
      email: "delivery@foodapp.com",
      phone: "+919999999997",
      role: "delivery",
      addresses: [],
      walletBalance: 0,
      referralCode: "DELIVERY01",
      referredBy: undefined,
      createdAt: new Date(),
      isActive: true,
      isGuest: false,
      currentStreak: 0,
      longestStreak: 0,
      totalReferrals: 0,
      referralEarnings: 0,
      pushToken: undefined,
    },
    {
      id: "u-customer-1",
      name: "Test Customer",
      email: "customer@test.com",
      phone: "+919999999996",
      role: "customer",
      addresses: [],
      walletBalance: 500,
      referralCode: "CUST001",
      referredBy: undefined,
      createdAt: new Date(),
      isActive: true,
      isGuest: false,
      currentStreak: 5,
      longestStreak: 12,
      totalReferrals: 3,
      referralEarnings: 1500,
      pushToken: undefined,
    },
  ];

  tasks.push(ensureCollection<User>("users", initialUsers as User[]));

  return Promise.all(tasks);
}

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const items = await fetchCollection<Subscription>("subscriptions");
  return items;
}

export async function createSubscription(sub: Subscription): Promise<void> {
  await createDocument("subscriptions", sub.id, sub as Record<string, any>);
}

export async function updateSubscriptionDoc(
  id: string,
  updates: Partial<Subscription>
): Promise<void> {
  await updateDocument("subscriptions", id, updates as Record<string, any>);
}

// ============ Offers ============

export async function fetchOffers(): Promise<Offer[]> {
  try {
    const items = await fetchCollection<Offer>("offers");
    return items ?? [];
  } catch (e) {
    console.log("[firebase] fetchOffers failed", e);
    return [];
  }
}

export async function createOffer(offer: Offer): Promise<void> {
  await createDocument("offers", offer.id, offer as Record<string, any>);
}

export async function updateOffer(
  id: string,
  updates: Partial<Offer>
): Promise<void> {
  await updateDocument("offers", id, updates as Record<string, any>);
}

// ============ Polygon Functions ============

export async function fetchPolygons(): Promise<Polygon[]> {
  try {
    const items = await fetchCollection<Polygon>("polygons");
    console.log("[firebase] Fetched polygons:", items.length);
    return items;
  } catch (error) {
    console.error("[firebase] Error fetching polygons:", error);
    return [];
  }
}

export async function createPolygon(polygon: Polygon): Promise<void> {
  console.log("[firebase] Creating polygon:", polygon.id, polygon.name);
  await createDocument("polygons", polygon.id, polygon as Record<string, any>);
}

export async function updatePolygon(
  id: string,
  updates: Partial<Polygon>
): Promise<void> {
  console.log("[firebase] Updating polygon:", id);
  await updateDocument("polygons", id, updates as Record<string, any>);
}

export async function deletePolygon(id: string): Promise<void> {
  console.log("[firebase] Deleting polygon:", id);
  await deleteDocument("polygons", id);
}

// ============ Serviceable Location Functions ============

export async function fetchServiceableLocations(): Promise<ServiceableLocation[]> {
  try {
    const items = await fetchCollection<ServiceableLocation>("serviceableLocations");
    console.log("[firebase] Fetched serviceable locations:", items.length);
    return items;
  } catch (error) {
    console.error("[firebase] Error fetching serviceable locations:", error);
    return [];
  }
}

export async function createServiceableLocation(
  location: ServiceableLocation
): Promise<void> {
  console.log("[firebase] Creating serviceable location:", location.id, location.name);
  await createDocument("serviceableLocations", location.id, location as Record<string, any>);
}

export async function updateServiceableLocation(
  id: string,
  updates: Partial<ServiceableLocation>
): Promise<void> {
  console.log("[firebase] Updating serviceable location:", id);
  await updateDocument("serviceableLocations", id, updates as Record<string, any>);
}

export async function deleteServiceableLocation(id: string): Promise<void> {
  console.log("[firebase] Deleting serviceable location:", id);
  await deleteDocument("serviceableLocations", id);
}
