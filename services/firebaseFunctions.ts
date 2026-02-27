/**
 * Firebase Callable Functions client (HTTP).
 * Invokes Firebase callables without embedding tokens in the app.
 */

import axios from "axios";
import Constants from "expo-constants";

const PROJECT_ID =
  process.env.EXPO_PUBLIC_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  (Constants as any).expoConfig?.extra?.firebaseProjectId ||
  "sameoldbox-21666";

const REGION = "us-central1";

const FUNCTIONS_BASE_URL =
  process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_URL ||
  `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

/**
 * Invoke a Firebase callable function by name.
 * Request body: { data: T }. Response: { result: R } or { error: { message, code } }.
 */
export async function callFirebaseCallable<T = unknown, R = unknown>(
  name: string,
  data: T
): Promise<R> {
  const url = `${FUNCTIONS_BASE_URL}/${name}`;
  const response = await axios.post<{ result?: R; error?: { message?: string; code?: string } }>(
    url,
    { data },
    { headers: { "Content-Type": "application/json" }, timeout: 30000 }
  );

  if (response.data?.error) {
    const msg = response.data.error.message || "Request failed";
    throw new Error(msg);
  }

  return response.data?.result as R;
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
  return callFirebaseCallable<{ phone: string }, SendWhatsAppOTPResult>(
    "sendWhatsAppOTP",
    { phone }
  );
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
  return callFirebaseCallable<{ phone: string; otp: string }, VerifyWhatsAppOTPResult>(
    "verifyWhatsAppOTP",
    { phone, otp }
  );
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
  subscriptionId: string;
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
