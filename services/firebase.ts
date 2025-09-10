import { AddOn, Banner, Category, Meal, Testimonial, User, UserRole, Subscription } from '@/types';
import Constants from 'expo-constants';

const FIREBASE_API_KEY = (process.env.EXPO_PUBLIC_FIREBASE_API_KEY || (Constants as any).expoConfig?.extra?.firebaseApiKey || '') as string;
const FIREBASE_PROJECT_ID = (process.env.EXPO_PUBLIC_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || (Constants as any).expoConfig?.extra?.firebaseProjectId || '') as string;

if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID) {
  console.log('[firebase] Missing EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_PROJECT_ID. Using local data or queries will fail.');
}

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const IDENTITY_BASE = `https://identitytoolkit.googleapis.com/v1`;

function parseValue(v: any): any {
  if (!v || typeof v !== 'object') return v;
  if ('stringValue' in v) return v.stringValue as string;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('timestampValue' in v) return new Date(v.timestampValue);
  if ('arrayValue' in v) {
    const values = v.arrayValue?.values || [];
    return values.map(parseValue);
  }
  if ('mapValue' in v) {
    const fields = v.mapValue?.fields || {};
    const obj: Record<string, any> = {};
    Object.keys(fields).forEach((k) => {
      obj[k] = parseValue(fields[k]);
    });
    return obj;
  }
  if ('nullValue' in v) return null;
  return v;
}

function parseDocument<T>(doc: any): T | null {
  try {
    const fields = doc?.fields || {};
    const data = parseValue({ mapValue: { fields } });
    return data as T;
  } catch (e) {
    console.log('[firebase] parseDocument error', e);
    return null;
  }
}

function toFirestoreValue(val: any): any {
  const t = typeof val;
  if (val === null || val === undefined) return { nullValue: null };
  if (t === 'string') return { stringValue: val };
  if (t === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (t === 'boolean') return { booleanValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) return { arrayValue: { values: val.map((v) => toFirestoreValue(v)) } };
  if (t === 'object') {
    const fields: Record<string, any> = {};
    Object.keys(val).forEach((k) => {
      fields[k] = toFirestoreValue(val[k]);
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function createDocument(collectionPath: string, id: string, data: Record<string, any>): Promise<void> {
  const url = `${BASE_URL}/${collectionPath}?documentId=${encodeURIComponent(id)}&key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  const body = JSON.stringify({ fields: toFirestoreValue(data).mapValue.fields });
  console.log('[firebase] POST', url, { id });
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  if (!res.ok) {
    const text = await res.text();
    console.log('[firebase] createDocument failed', collectionPath, id, text);
    if (!text.includes('ALREADY_EXISTS')) {
      throw new Error(`Create ${collectionPath}/${id} failed: ${text}`);
    }
  }
}

async function updateDocument(collectionPath: string, id: string, updates: Record<string, any>): Promise<void> {
  const fieldPaths = Object.keys(updates).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const url = `${BASE_URL}/${collectionPath}/${encodeURIComponent(id)}?${fieldPaths}&key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  const body = JSON.stringify({ fields: toFirestoreValue(updates).mapValue.fields });
  console.log('[firebase] PATCH', url, { id });
  const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update ${collectionPath}/${id} failed: ${text}`);
  }
}

async function fetchCollection<T>(collectionPath: string): Promise<T[]> {
  const url = `${BASE_URL}/${collectionPath}?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  console.log('[firebase] GET', url);
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

export async function signUpWithEmailPassword(params: { email: string; password: string; name?: string; role?: UserRole }): Promise<{ uid: string; idToken: string }> {
  const url = `${IDENTITY_BASE}/accounts:signUp?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  console.log('[firebase] Auth signUp', params.email);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: params.email, password: params.password, returnSecureToken: true }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || 'SIGN_UP_FAILED');
  }
  const uid = json.localId as string;
  const idToken = json.idToken as string;
  const name = params.name ?? '';
  const role: UserRole = params.role ?? 'customer';

  const now = new Date();
  const newUser: User = {
    id: uid,
    name,
    email: params.email,
    phone: '',
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
    await createDocument('users', uid, newUser as unknown as Record<string, any>);
  } catch (e) {
    console.log('[firebase] create user after signUp failed', e);
  }
  return { uid, idToken };
}

export async function signInWithEmailPassword(email: string, password: string): Promise<{ uid: string; idToken: string }> {
  const url = `${IDENTITY_BASE}/accounts:signInWithPassword?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  console.log('[firebase] Auth signIn', email);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || 'SIGN_IN_FAILED');
  }
  return { uid: json.localId as string, idToken: json.idToken as string };
}

export async function fetchBanners(): Promise<Banner[]> {
  const items = await fetchCollection<Banner>('banners');
  return items.filter((b) => (b?.isActive ?? true)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function fetchCategories(): Promise<Category[]> {
  const items = await fetchCollection<Category>('categories');
  return items.filter((c) => (c?.isActive ?? true)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function fetchMeals(): Promise<Meal[]> {
  const items = await fetchCollection<Meal>('meals');
  return items.filter((m) => (m?.isActive ?? true) && !(m as any)?.isDraft);
}

export async function fetchAddOns(): Promise<AddOn[]> {
  const items = await fetchCollection<AddOn>('addons');
  return items.filter((a) => (a?.isActive ?? true));
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const items = await fetchCollection<Testimonial>('testimonials');
  return items.filter((t) => (t?.isActive ?? true));
}

export async function fetchUsers(): Promise<User[]> {
  const items = await fetchCollection<User>('users');
  return items;
}

export async function createUser(user: User): Promise<void> {
  await createDocument('users', user.id, user);
}

export async function getUserDoc(id: string): Promise<User | null> {
  const url = `${BASE_URL}/users/${encodeURIComponent(id)}?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  console.log('[firebase] GET user doc', id);
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) return null;
  const json = await res.json();
  const parsed = parseDocument<User>(json);
  return parsed;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  await updateDocument('users', id, updates as Record<string, any>);
}

export async function seedIfEmpty(): Promise<{ seeded: boolean }[]> {
  const tasks: Array<Promise<{ seeded: boolean }>> = [];
  const { banners, categories, featuredMeals, testimonials, addOns } = await import('@/constants/data');

  async function ensureCollection<T>(name: string, fetcher: () => Promise<T[]>, records: any[], idKey: string = 'id') {
    try {
      const existing = await fetcher();
      if ((existing?.length ?? 0) > 0) {
        console.log(`[firebase] ${name} already present: ${existing.length}`);
        return { seeded: false };
      }
      console.log(`[firebase] Seeding ${name} with ${records.length} docs...`);
      for (const rec of records) {
        const id = (rec?.[idKey] ?? `${Date.now()}-${Math.random()}`).toString();
        await createDocument(name, id, rec);
      }
      return { seeded: true };
    } catch (e) {
      console.log(`[firebase] ensureCollection error for ${name}`, e);
      return { seeded: false };
    }
  }

  tasks.push(ensureCollection<Banner>('banners', fetchBanners, banners as Banner[]));
  tasks.push(ensureCollection<Category>('categories', fetchCategories, categories as Category[]));
  tasks.push(ensureCollection<Meal>('meals', fetchMeals, (featuredMeals as Meal[]).map((m) => ({ ...m, isDraft: false }))));
  tasks.push(ensureCollection<Testimonial>('testimonials', fetchTestimonials, testimonials as Testimonial[]));
  tasks.push(ensureCollection<AddOn>('addons', fetchAddOns, (addOns as AddOn[]).map((a) => ({ ...a, isActive: true }))));

  const initialUsers: User[] = [
    {
      id: 'u-admin-1',
      name: 'Admin User',
      email: 'admin@foodapp.com',
      phone: '+919999999999',
      role: 'admin',
      addresses: [],
      walletBalance: 0,
      referralCode: 'ADMIN001',
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
      id: 'u-kitchen-1',
      name: 'Kitchen Manager',
      email: 'kitchen@foodapp.com',
      phone: '+919999999998',
      role: 'kitchen',
      addresses: [],
      walletBalance: 0,
      referralCode: 'KITCHEN01',
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
      id: 'u-delivery-1',
      name: 'Delivery Person',
      email: 'delivery@foodapp.com',
      phone: '+919999999997',
      role: 'delivery',
      addresses: [],
      walletBalance: 0,
      referralCode: 'DELIVERY01',
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
      id: 'u-customer-1',
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '+919999999996',
      role: 'customer',
      addresses: [],
      walletBalance: 500,
      referralCode: 'CUST001',
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

  tasks.push(ensureCollection<User>('users', fetchUsers, initialUsers as User[]));

  return Promise.all(tasks);
}

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const items = await fetchCollection<Subscription>('subscriptions');
  return items;
}

export async function createSubscription(sub: Subscription): Promise<void> {
  await createDocument('subscriptions', sub.id, sub as Record<string, any>);
}

export async function updateSubscriptionDoc(id: string, updates: Partial<Subscription>): Promise<void> {
  await updateDocument('subscriptions', id, updates as Record<string, any>);
}
