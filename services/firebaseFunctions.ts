/**
 * Firebase Callable Functions client.
 * Uses Firebase SDK httpsCallable (onCall) — no manual URL.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFunctions, httpsCallable, type Functions } from "firebase/functions";
import Constants from "expo-constants";

const PROJECT_ID =
  process.env.EXPO_PUBLIC_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  (Constants as any).expoConfig?.extra?.firebaseProjectId ||
  "sameoldbox-21666";

const REGION = "us-central1";

const API_KEY =
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
  (Constants as any).expoConfig?.extra?.firebaseApiKey ||
  "";

/** App name used only for OTP callables; no one signs in to this app, so SDK sends no auth token. */
const OTP_CALLABLE_APP_NAME = "__otp_callable__";

function getOtpCallableApp(): FirebaseApp {
  try {
    return getApp(OTP_CALLABLE_APP_NAME);
  } catch {
    return initializeApp(
      { apiKey: API_KEY, projectId: PROJECT_ID },
      OTP_CALLABLE_APP_NAME
    );
  }
}

/**
 * Call a callable that allows unauthenticated access (e.g. sendWhatsAppOTP, verifyWhatsAppOTP).
 * Uses a dedicated Firebase app that is never signed in, so the SDK does not send
 * any Authorization header and the backend does not return 16 UNAUTHENTICATED.
 */
function getPublicCallableFunctions(): Functions {
  return getFunctions(getOtpCallableApp(), REGION);
}

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp({ apiKey: API_KEY, projectId: PROJECT_ID });
}

function getFunctionsInstance(): Functions {
  return getFunctions(getFirebaseApp(), REGION);
}

/**
 * Invoke a Firebase onCall function by name (direct callable).
 */
export async function callFirebaseCallable<T = unknown, R = unknown>(
  name: string,
  data: T
): Promise<R> {
  const functions = getFunctionsInstance();
  const callable = httpsCallable<T, R>(functions, name);
  const result = await callable(data);
  return result.data;
}

// --- Auth (WhatsApp OTP) ---

export interface SendWhatsAppOTPResult {
  success: boolean;
  messageId?: string;
  error?: string;
  otpStored?: boolean;
}

export async function sendWhatsAppOTPCallable(
  phone: string
): Promise<SendWhatsAppOTPResult> {
  const functions = getPublicCallableFunctions();
  const callable = httpsCallable<
    { phone: string },
    SendWhatsAppOTPResult
  >(functions, "sendWhatsAppOTP");
  const result = await callable({ phone });
  return result.data;
}

export interface VerifyWhatsAppOTPResult {
  success: boolean;
  verified: boolean;
  token?: string;
  uid?: string;
  isNewUser?: boolean;
  user?: {
    uid: string;
    phone: string;
    name: string;
    email: string;
    role: string;
    addresses: any[];
  };
  error?: string;
}

export async function verifyWhatsAppOTPCallable(
  phone: string,
  otp: string
): Promise<VerifyWhatsAppOTPResult> {
  const functions = getPublicCallableFunctions();
  const callable = httpsCallable<
    { phone: string; otp: string },
    VerifyWhatsAppOTPResult
  >(functions, "verifyWhatsAppOTP");
  const result = await callable({ phone, otp });
  return result.data;
}

// --- Add-on purchase notification ---

export interface SendAddonPurchaseNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendAddonPurchaseNotificationCallable(params: {
  phone: string;
  customerName: string;
  addonNames: string[];
  date: string;
  totalAmount: string;
  orderId: string;
  meal?: string;
  deliveryTime?: string;
}): Promise<SendAddonPurchaseNotificationResult> {
  return callFirebaseCallable<
    typeof params,
    SendAddonPurchaseNotificationResult
  >("sendAddonPurchaseNotification", params);
}

// --- Admin: test WhatsApp ---

export interface SendTestWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendTestWhatsAppCallable(params: {
  phone: string;
  templateName?: string;
  parameters?: Array<{ type: string; text?: string }>;
}): Promise<SendTestWhatsAppResult> {
  return callFirebaseCallable<typeof params, SendTestWhatsAppResult>(
    "sendTestWhatsApp",
    params
  );
}
