# 📋 Setup Checklist - Push Notifications & WhatsApp

## Pre-Deployment Checklist

### 🔐 Environment Setup

- [ ] Create `.env` file with all credentials
- [ ] Add `.env` to `.gitignore`
- [ ] Never commit API keys or tokens

### 💬 WhatsApp Business Configuration

- [ ] Create WhatsApp Business account at business.facebook.com
- [ ] Verify business information
- [ ] Add and verify phone number
- [ ] Get Phone Number ID
- [ ] Get Business Account ID
- [ ] Generate permanent access token (not temporary!)
- [ ] Save credentials to `.env`

### 📝 WhatsApp Message Templates (Required!)

Create these 14 templates in Meta Business Suite → WhatsApp → Message Templates:

- [ ] `otp_verification` - Authentication OTP
- [ ] `order_confirmed` - Order confirmed notification
- [ ] `order_preparing` - Order being prepared
- [ ] `order_out_for_delivery` - Order out for delivery
- [ ] `order_delivered` - Order delivered
- [ ] `order_cancelled` - Order cancelled
- [ ] `subscription_activated` - Subscription activated
- [ ] `subscription_renewal` - Subscription renewed
- [ ] `subscription_expiring` - Subscription expiring soon
- [ ] `subscription_expired` - Subscription expired
- [ ] `payment_success` - Payment successful
- [ ] `payment_failed` - Payment failed
- [ ] `daily_menu_update` - Daily menu notification
- [ ] `promotional_offer` - Promotional messages
- [ ] `wallet_credited` - Wallet credit notification

### 🍎 iOS (Apple) Configuration

- [ ] Create APNs key in Apple Developer Portal
  - [ ] Download `.p8` file
  - [ ] Note Key ID
  - [ ] Note Team ID
- [ ] Upload APNs key to Firebase Console
  - [ ] Go to Project Settings → Cloud Messaging
  - [ ] Upload `.p8` file
  - [ ] Enter Key ID and Team ID
- [ ] Verify bundle ID matches: `app.rork.meal-subscription-service`
- [ ] Add notification assets:
  - [ ] Notification icon (optional for iOS)

### 🤖 Android Configuration

- [ ] Download `google-services.json` from Firebase
- [ ] Place `google-services.json` in project root
### Android Setup

- [ ] Verify package name: `com.sameoldbox.app`
- [ ] Add `google-services.json` to root directory
- [ ] Create notification icon:
  - [ ] `assets/images/notification-icon.png` (96x96px, white on transparent)
- [ ] Add to `.gitignore`: `google-services.json`

### 🔥 Firebase Setup

- [ ] Create/select Firebase project
- [ ] Enable Authentication
  - [ ] Enable Email/Password sign-in
  - [ ] Enable Custom Token authentication
- [ ] Enable Firestore Database
- [ ] Enable Cloud Messaging
- [ ] Enable Cloud Functions
- [ ] Upgrade to Blaze plan (required for external API calls)
- [ ] Create Firestore indexes:
  - [ ] `subscriptions` collection: `status`, `endDate`
  - [ ] `orders` collection: `userId`, `createdAt`

### ☁️ Firebase Functions Deployment

- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login: `firebase login`
- [ ] Initialize: `firebase init functions` (if not already)
- [ ] Copy `backend/firebase-functions.ts` to `functions/src/index.ts`
- [ ] Update `functions/package.json` dependencies
- [ ] Set WhatsApp config:
  ```bash
  firebase functions:config:set \
    whatsapp.api_url="https://graph.facebook.com/v18.0" \
    whatsapp.phone_number_id="YOUR_ID" \
    whatsapp.access_token="YOUR_TOKEN"
  ```
- [ ] Deploy: `firebase deploy --only functions`
- [ ] Verify functions deployed successfully
- [ ] Check logs: `firebase functions:log`

### 📱 App Testing

- [ ] Test on physical iOS device (push notifications don't work on simulators)
- [ ] Test on physical Android device
- [ ] Request notification permissions
- [ ] Send test WhatsApp OTP
- [ ] Verify WhatsApp OTP received
- [ ] Test OTP verification
- [ ] Create test order and verify notifications
- [ ] Update order status and verify push + WhatsApp
- [ ] Test subscription notifications
- [ ] Test payment notifications
- [ ] Verify push token saved to user profile
- [ ] Test notification tap navigation

### 🏗️ Build & Deploy

- [ ] Update `eas.json` with environment variables
- [ ] Build Android: `eas build -p android --profile production`
- [ ] Build iOS: `eas build -p ios --profile production`
- [ ] Test production builds on physical devices
- [ ] Submit to Google Play Store
  - [ ] Add privacy policy
  - [ ] Explain notification permission usage
  - [ ] Explain phone number collection
- [ ] Submit to Apple App Store
  - [ ] Add App Privacy details
  - [ ] Explain notification usage
  - [ ] Request notification permissions properly

### 📄 Documentation

- [ ] Read `NOTIFICATIONS_SETUP.md` completely
- [ ] Review `IMPLEMENTATION_SUMMARY.md` for quick reference
- [ ] Update your app's privacy policy
- [ ] Document WhatsApp template names for team
- [ ] Save APNs certificate backup securely
- [ ] Save WhatsApp credentials securely (use password manager)

### 🔒 Security

- [ ] Never commit `.env` file
- [ ] Never commit `google-services.json`
- [ ] Never commit `.p8` APNs certificate
- [ ] Use permanent WhatsApp access tokens (not temporary)
- [ ] Store Firebase service account keys securely
- [ ] Enable Firebase App Check (optional but recommended)
- [ ] Set up Firebase Security Rules for Firestore
- [ ] Rotate tokens periodically
- [ ] Monitor Firebase usage & billing

### 🎯 Production Readiness

- [ ] All WhatsApp templates approved
- [ ] Firebase Functions deployed
- [ ] APNs certificate uploaded
- [ ] google-services.json added
- [ ] Environment variables set
- [ ] Tested on physical devices
- [ ] Production builds created
- [ ] App submitted to stores

---

## Quick Test Commands

### Test Push Notification (Expo)

```bash
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN]",
    "title": "Test",
    "body": "This is a test"
  }'
```

### Test Firebase Function Locally

```bash
cd functions
npm run serve
```

### View Firebase Logs

```bash
firebase functions:log --only sendWhatsAppOTP
firebase functions:log --only onOrderStatusChange
```

### Deploy Single Function

```bash
firebase deploy --only functions:sendWhatsAppOTP
firebase deploy --only functions:onOrderStatusChange
```

---

## Common Issues & Solutions

### ❌ WhatsApp messages not sending

- ✅ Check template names match exactly
- ✅ Verify templates are approved
- ✅ Confirm access token is permanent
- ✅ Check phone number format (no + or spaces)
- ✅ Verify billing/credits in WhatsApp Business

### ❌ Push notifications not working on iOS

- ✅ Test on physical device (not simulator)
- ✅ Verify APNs certificate uploaded
- ✅ Check bundle ID matches exactly
- ✅ Confirm notification permissions granted
- ✅ Check `aps-environment` entitlement

### ❌ Push notifications not working on Android

- ✅ Verify google-services.json in root
- ✅ Check notification permission granted (Android 13+)
- ✅ Test on physical device
- ✅ Verify FCM token generated
- ✅ Check notification channel created

### ❌ Firebase Functions failing

- ✅ Upgrade to Blaze plan (required for external APIs)
- ✅ Check functions config: `firebase functions:config:get`
- ✅ View logs: `firebase functions:log`
- ✅ Verify IAM permissions
- ✅ Check function timeout settings

### ❌ OTP not received

- ✅ Verify OTP template approved
- ✅ Check phone number format
- ✅ Confirm WhatsApp can reach the number
- ✅ Check Firebase Functions logs
- ✅ Verify OTP stored in Firestore

---

## Support Resources

- **Firebase**: https://firebase.google.com/support
- **WhatsApp Business**: https://business.facebook.com/business/help
- **Expo Notifications**: https://docs.expo.dev/push-notifications/
- **Meta for Developers**: https://developers.facebook.com/

---

## 🎉 Completion

Once all items are checked:

- ✅ Your app has full push notification support
- ✅ WhatsApp Business integration is complete
- ✅ OTP authentication is working
- ✅ Automated notifications are running
- ✅ App is production-ready

**Need help?** Refer to `NOTIFICATIONS_SETUP.md` for detailed instructions.

Good luck with your launch! 🚀
