/**
 * WhatsApp OTP Service
 * Handles OTP generation, sending, and verification via Firebase Cloud Functions
 */

import axios from "axios";

const FUNCTIONS_BASE_URL = {
  sendOTP: "https://sendwhatsappotp-nup6zrmsha-uc.a.run.app",
  verifyOTP: "https://verifywhatsappotp-nup6zrmsha-uc.a.run.app",
};

// const FUNCTIONS_BASE_URL = {
//   sendOTP: "http://127.0.0.1:5001/sameoldbox-21666/us-central1/sendWhatsAppOTP",
//   verifyOTP: "http://127.0.0.1:5001/sameoldbox-21666/us-central1/verifyWhatsAppOTP",
// };

interface SendOTPResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface VerifyOTPResponse {
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
 * Send WhatsApp OTP to phone number
 */
export async function sendWhatsAppOTP(phone: string): Promise<SendOTPResponse> {
  try {
    const response = await axios.post(FUNCTIONS_BASE_URL.sendOTP, {
      data: { phone },
    });

    if (response.data.result) {
      return response.data.result;
    }

    return response.data;
  } catch (error: any) {
    console.error("Send OTP error:", error.response?.data || error.message);
    return {
      success: false,
      error:
        error.response?.data?.error?.message ||
        "Failed to send OTP. Please try again.",
    };
  }
}

/**
 * Verify WhatsApp OTP
 */
export async function verifyWhatsAppOTP(
  phone: string,
  otp: string
): Promise<VerifyOTPResponse> {
  try {
    const response = await axios.post(FUNCTIONS_BASE_URL.verifyOTP, {
      data: { phone, otp },
    });

    if (response.data.result) {
      return response.data.result;
    }

    return response.data;
  } catch (error: any) {
    console.error("Verify OTP error:", error.response?.data || error.message);
    return {
      success: false,
      verified: false,
      error:
        error.response?.data?.error?.message ||
        "Invalid OTP. Please try again.",
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
