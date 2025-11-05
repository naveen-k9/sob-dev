# 🔔 Push Notifications & WhatsApp Integration Setup Guide

Complete setup guide for implementing push notifications (iOS/Android) and WhatsApp Business API with custom OTP authentication in your meal subscription app.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Push Notifications Setup](#push-notifications-setup)
3. [WhatsApp Business API Setup](#whatsapp-business-api-setup)
4. [Firebase Configuration](#firebase-configuration)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This implementation provides:

- ✅ **Push Notifications** (iOS & Android) via Expo Notifications & Firebase Cloud Messaging
- ✅ **WhatsApp Business API** for OTP and order/subscription notifications
- ✅ **Custom OTP Authentication** via WhatsApp with Firebase Custom Tokens
- ✅ **Automatic Notifications** for order updates, subscriptions, payments
- ✅ **Scheduled Notifications** for daily menus and expiring subscriptions
- ✅ **APNs Support** for iOS with proper certificates

---

## 📱 Push Notifications Setup

### 1. Install Dependencies

Already completed:

```bash
npm install expo-notifications axios firebase-admin
```

### 2. iOS Configuration (APNs)

#### A. Create APNs Key in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Click **Keys** → **Create a key** (+)
3. Name: `Meal Subscription Push Notifications`
4. Enable: **Apple Push Notifications service (APNs)**
5. Click **Continue** → **Register**
6. **Download the .p8 file** (save it securely, you can't download again)
7. Note the **Key ID** (e.g., `ABC123DEFG`)
8. Note your **Team ID** (top right corner)

#### B. Upload APNs Key to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Cloud Messaging**
4. Under **Apple app configuration**:
   - Click **Upload** in the APNs Authentication Key section
   - Upload your `.p8` file
   - Enter **Key ID**
   - Enter **Team ID**
5. Click **Upload**

#### C. Update iOS App Configuration

Your `app.json` is already configured with:

```json
{
  "ios": {
    "bundleIdentifier": "app.rork.meal-subscription-service",
    "infoPlist": {
      "UIBackgroundModes": ["location", "remote-notification"]
    },
    "entitlements": {
      "aps-environment": "production"
    }
  }
}
```

### 4. Android Configuration

   - Package name: `com.sameoldbox.app`
   - Download `google-services.json`

#### B. Verify app.json Configuration

Already configured:

```json
```json
{
  "expo": {
    "android": {
    "package": "com.sameoldbox.app",
    "googleServicesFile": "./google-services.json"
    },
```

### 4. Notification Icons & Sounds

Create notification assets:

```bash
# Create directories
mkdir -p assets/images
mkdir -p assets/sounds
```

Add these files:

- `assets/images/notification-icon.png` - 96x96px white icon on transparent background (Android)
- `assets/sounds/notification.wav` - Notification sound (optional)

---

## 💬 WhatsApp Business API Setup

### 1. Create WhatsApp Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create or select a Business Account
3. Go to [WhatsApp Business Platform](https://business.facebook.com/wa/manage/)
4. Click **Get Started**
5. Follow the setup wizard to:
   - Verify your business
   - Add a phone number
   - Verify the phone number

### 2. Get WhatsApp API Credentials

1. In Meta Business Suite, go to **WhatsApp** → **Getting Started**
2. Note these credentials:
   - **Phone Number ID**: Found under "Send and receive messages"
   - **WhatsApp Business Account ID**: Top of the page
   - **Access Token**: Click "Copy" next to the temporary token

⚠️ **Important**: The temporary token expires. You'll need to create a permanent token:

#### Create Permanent Access Token

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Note your **App ID** and **App Secret**
5. Go to **WhatsApp** → **Configuration**
6. Under **Permanent Tokens**, click **Generate Token**
7. Select permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
8. Copy and save the permanent token

### 3. Create WhatsApp Message Templates

You must create templates in WhatsApp Business Manager before sending messages.

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Go to **WhatsApp** → **Message Templates**
3. Create these templates (exact names must match code):

#### Template: `otp_verification`

```
Category: Authentication
Language: English

Body:
Your OTP for Meal Subscription Service is {{1}}. Valid for {{2}} minutes. Don't share this code.

Button: Copy Code ({{1}})
```

#### Template: `order_confirmed`

```
Category: Order Update
Language: English

Body:
Hi {{1}}, your order #{{2}} has been confirmed!

Items: {{3}}
Total: {{4}}
Delivery Time: {{5}}

Thank you for choosing us! 🎉
```

#### Template: `order_preparing`

```
Category: Order Update
Language: English

Body:
Hi {{1}}, good news! Your order #{{2}} is being prepared with love by our chefs 👨‍🍳
```

#### Template: `order_out_for_delivery`

```
Category: Order Update
Language: English

Body:
Hi {{1}}, your order #{{2}} is on the way! 🚚

Estimated delivery: {{3}}
```

#### Template: `order_delivered`

```
Category: Order Update
Language: English

Body:
Hi {{1}}, your order #{{2}} has been delivered! ✅

Enjoy your meal! Rate your experience in the app.
```

#### Template: `order_cancelled`

```
Category: Order Update
Language: English

Body:
Hi {{1}}, your order #{{2}} has been cancelled. ❌

If you didn't request this, please contact support.
```

#### Template: `subscription_activated`

```
Category: Subscription Update
Language: English

Body:
Hi {{1}}, your {{2}} subscription is now active! 🎊

Start Date: {{3}}
End Date: {{4}}

Enjoy your meals!
```

#### Template: `subscription_renewal`

```
Category: Subscription Update
Language: English

Body:
Hi {{1}}, your {{2}} subscription has been renewed successfully! 🔄

Amount: {{3}}
```

#### Template: `subscription_expiring`

```
Category: Subscription Update
Language: English

Body:
Hi {{1}}, reminder: Your {{2}} subscription expires in {{3}} days. ⏰

Renew now to continue enjoying delicious meals!
```

#### Template: `subscription_expired`

```
Category: Subscription Update
Language: English

Body:
Hi {{1}}, your {{2}} subscription has expired. ⚠️

Renew now to continue your meal plan!
```

#### Template: `payment_success`

```
Category: Payment Update
Language: English

Body:
Hi {{1}}, payment successful! ✅

Amount: {{2}}
Order ID: {{3}}
Transaction ID: {{4}}

Thank you!
```

#### Template: `payment_failed`

```
Category: Payment Update
Language: English

Body:
Hi {{1}}, payment failed. ❌

Amount: {{2}}
Order ID: {{3}}
Reason: {{4}}

Please try again or contact support.
```

#### Template: `daily_menu_update`

```
Category: Marketing
Language: English

Body:
Hi {{1}}, check out today's menu for {{2}}! 🍽️

{{3}}

Order now in the app!
```

#### Template: `promotional_offer`

```
Category: Marketing
Language: English

Body:
Hi {{1}}, {{2}}! 🎁

{{3}}

Use code: {{4}}
Valid till: {{5}}

Order now!
```

#### Template: `wallet_credited`

```
Category: Account Update
Language: English

Body:
Hi {{1}}, your wallet has been credited! 💰

Amount: {{2}}
Reason: {{3}}
New Balance: {{4}}
```

---

## 🔥 Firebase Configuration

### 1. Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project or select existing
3. Enable these services:
   - **Authentication** (Enable Email/Password and Custom Token)
   - **Firestore Database**
   - **Cloud Functions**
   - **Cloud Messaging**

### 2. Initialize Firebase Functions

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Functions in your project
firebase init functions

# Select:
# - TypeScript
# - ESLint: Yes
# - Install dependencies: Yes
```

### 3. Deploy Firebase Functions

1. Copy `backend/firebase-functions.ts` to `functions/src/index.ts`

2. Update `functions/package.json`:

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "axios": "^1.6.0"
  }
}
```

3. Set Firebase config:

```bash
# Set WhatsApp credentials
firebase functions:config:set \
  whatsapp.api_url="https://graph.facebook.com/v18.0" \
  whatsapp.phone_number_id="YOUR_PHONE_NUMBER_ID" \
  whatsapp.access_token="YOUR_PERMANENT_ACCESS_TOKEN"

# View config
firebase functions:config:get
```

4. Deploy:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Set Up Firestore Indexes

Create indexes for efficient queries:

1. Go to Firebase Console → Firestore Database → Indexes
2. Create composite indexes:
   - Collection: `subscriptions`
     - Fields: `status` (Ascending), `endDate` (Ascending)
   - Collection: `orders`
     - Fields: `userId` (Ascending), `createdAt` (Descending)

---

## 🔐 Environment Variables

### 1. Create `.env` file in project root:

```bash
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# WhatsApp Business API
EXPO_PUBLIC_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
EXPO_PUBLIC_WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Razorpay (existing)
EXPO_PUBLIC_RAZORPAY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret
```

### 2. Add to `.gitignore`:

```bash
# Environment variables
.env
.env.local
.env.production

# Firebase
google-services.json
GoogleService-Info.plist
firebase-debug.log
.firebase/

# APNs certificates
*.p8
*.p12
*.cer
```

---

## 🧪 Testing

### Test Push Notifications

1. Run app on physical device (push notifications don't work on emulators):

```bash
npm run android
# or
npm run ios
```

2. Test notification permissions:

```typescript
import { useNotifications } from "@/contexts/NotificationsContext";

const { requestPermissions, expoPushToken } = useNotifications();

// Request permissions
await requestPermissions();

// View token
console.log("Push Token:", expoPushToken);
```

3. Send test push notification using Expo:

```bash
curl -H "Content-Type: application/json" -X POST https://exp.host/--/api/v2/push/send -d '{
  "to": "ExponentPushToken[YOUR_TOKEN]",
  "title":"Test Notification",
  "body": "This is a test"
}'
```

### Test WhatsApp OTP

1. Update your phone number in the code
2. Test OTP flow:

```typescript
import { useAuth } from "@/contexts/AuthContext";

const { sendWhatsAppOTPForAuth, verifyWhatsAppOTP } = useAuth();

// Send OTP
const result = await sendWhatsAppOTPForAuth("+919876543210");

// Verify OTP (check WhatsApp for code)
const verified = await verifyWhatsAppOTP("+919876543210", "123456");
```

### Test Order Notifications

1. Create a test order in Firestore:

```javascript
// In Firebase Console → Firestore
orders/{orderId}
{
  userId: "test_user_id",
  status: "confirmed",
  items: "Chicken Biryani, Raita",
  totalAmount: "299",
  deliveryTime: "30 mins",
  createdAt: timestamp
}
```

2. Update status to trigger notifications:

```javascript
// Change status field
status: "preparing"; // Will trigger notification
```

---

## 🚀 Deployment

### 1. Build Production App

#### Android

```bash
# Build APK
eas build -p android --profile production

# Or build AAB for Google Play
eas build -p android --profile production:aab
```

#### iOS

```bash
# Build IPA
eas build -p ios --profile production

# Make sure you have:
# - Apple Developer account
# - APNs certificate uploaded to Firebase
# - Provisioning profile configured
```

### 2. Configure EAS Build

Update `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_API_KEY": "your_key",
        "EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN": "your_token"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

### 3. Submit to Stores

#### Google Play Store

1. Upload APK/AAB
2. Add privacy policy mentioning:
   - Push notifications
   - WhatsApp messaging
   - Phone number collection
3. Request notification permission rationale

#### Apple App Store

1. Upload IPA via Xcode or Transporter
2. Add App Privacy details:
   - Contact Info (Phone number)
   - User Content (Messages)
3. Request notification permission in app

---

## 🔧 Troubleshooting

### Push Notifications Not Working

**iOS:**

- ✅ Check APNs certificate uploaded to Firebase
- ✅ Verify bundle ID matches exactly
- ✅ Test on physical device (not simulator)
- ✅ Check iOS Settings → Notifications → Your App is enabled
- ✅ Verify `aps-environment` in entitlements

**Android:**

- ✅ Verify `google-services.json` is in project root
- ✅ Check notification permission granted
- ✅ Test on physical device
- ✅ Verify FCM registration token generated
- ✅ Check Android settings → Notifications enabled

### WhatsApp Messages Not Sending

- ✅ Verify WhatsApp Business account verified
- ✅ Check access token is permanent (not temporary)
- ✅ Verify phone numbers include country code (no + or spaces)
- ✅ Confirm templates approved and names match exactly
- ✅ Check WhatsApp Business account has credits/billing set up
- ✅ Template language matches (usually 'en')

### OTP Not Received

- ✅ Phone number format: `919876543210` (country code + number, no + or spaces)
- ✅ Check WhatsApp template `otp_verification` is approved
- ✅ Verify phone number can receive WhatsApp messages
- ✅ Check Firebase Functions logs for errors
- ✅ Ensure OTP document created in Firestore

### Firebase Functions Errors

```bash
# View logs
firebase functions:log

# Common issues:
# - Missing environment config
firebase functions:config:get

# - Billing not enabled (Blaze plan required for external API calls)
# Go to Firebase Console → Upgrade to Blaze plan

# - Incorrect permissions
# Check IAM roles in Firebase/Google Cloud Console
```

---

## 📊 Usage in Your App

### Send Order Update

```typescript
import { notifyOrderUpdate } from "@/utils/notificationTemplates";

await notifyOrderUpdate(
  {
    userId: user.id,
    name: user.name,
    phone: user.phone,
    pushToken: user.pushToken,
  },
  {
    orderId: "ORD123",
    status: "confirmed",
    items: "Chicken Biryani, Raita",
    totalAmount: "₹299",
    deliveryTime: "30 mins",
  }
);
```

### WhatsApp OTP Login

```typescript
import { useAuth } from "@/contexts/AuthContext";

const { sendWhatsAppOTPForAuth, verifyWhatsAppOTP } = useAuth();

// Step 1: Send OTP
const sendResult = await sendWhatsAppOTPForAuth(phoneNumber);

// Step 2: User enters OTP from WhatsApp
const verifyResult = await verifyWhatsAppOTP(phoneNumber, otpCode);

if (verifyResult.success) {
  // User authenticated with Firebase custom token
  console.log("Logged in:", verifyResult.user);
}
```

### Request Push Notification Permission

```typescript
import { useNotifications } from "@/contexts/NotificationsContext";

const { requestPermissions, notificationPermission } = useNotifications();

if (notificationPermission !== "granted") {
  await requestPermissions();
}
```

---

## 📞 Support

For issues or questions:

- Firebase: [Firebase Support](https://firebase.google.com/support)
- WhatsApp Business: [Meta Business Help](https://business.facebook.com/business/help)
- Expo Notifications: [Expo Docs](https://docs.expo.dev/push-notifications/overview/)

---

## 🎉 Summary

You now have:

- ✅ **Push notifications** for iOS and Android
- ✅ **WhatsApp Business API** integration
- ✅ **Custom OTP authentication** via WhatsApp
- ✅ **Automatic notifications** for orders, subscriptions, payments
- ✅ **Scheduled notifications** for daily menus
- ✅ **Firebase Cloud Functions** for backend processing

**Next Steps:**

1. Complete WhatsApp template creation
2. Upload APNs certificate to Firebase
3. Test on physical devices
4. Deploy Firebase Functions
5. Submit apps to stores

Good luck! 🚀
