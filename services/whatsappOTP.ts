/**
 * WhatsApp OTP Service
 * Handles OTP send and verify via Firebase Callable Functions (no tokens in app)
 */

import {
  sendWhatsAppOTPCallable,
  verifyWhatsAppOTPCallable,
} from "@/services/firebaseFunctions";

export interface SendOTPResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface VerifyOTPResponse {
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

/**
 * Send WhatsApp OTP to phone number (via Firebase callable)
 */
export async function sendWhatsAppOTP(phone: string): Promise<SendOTPResponse> {
  try {
    const result = await sendWhatsAppOTPCallable(phone);
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error: any) {
    console.error("Send OTP error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Failed to send OTP. Please try again.",
    };
  }
}

/**
 * Verify WhatsApp OTP (via Firebase callable; returns token and user)
 */
export async function verifyWhatsAppOTP(
  phone: string,
  otp: string
): Promise<VerifyOTPResponse> {
  try {
    const result = await verifyWhatsAppOTPCallable(phone, otp);
    return {
      success: result.success,
      verified: result.verified,
      token: result.token,
      uid: result.uid,
      isNewUser: result.isNewUser,
      user: result.user,
      error: result.error,
    };
  } catch (error: any) {
    console.error("Verify OTP error:", error?.message || error);
    return {
      success: false,
      verified: false,
      error: error?.message || "Invalid OTP. Please try again.",
    };
  }
}

/**
 * Format phone number to E.164 format (for India +91)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // If it starts with 91, return as is with +
  if (cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }

  // Otherwise, add +91 prefix
  return `+91${cleaned}`;
}

/**
 * Validate Indian phone number
 */
export function isValidIndianPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");

  // Check if it's a 10-digit number or 12-digit with country code
  if (cleaned.length === 10) {
    return /^[6-9]\d{9}$/.test(cleaned);
  } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return /^91[6-9]\d{9}$/.test(cleaned);
  }

  return false;
}
