# 🎯 FIREBASE FUNCTIONS - TEST NOW!

## ✅ Setup Complete!

Your Firebase Functions are ready to test. Everything is configured and built.

## 🚀 Start Testing in 3 Steps

### Step 1: Update Configuration (30 seconds)

Edit `functions/.env`:

```bash
FIREBASE_PROJECT_ID=your-actual-firebase-project-id
```

Get your project ID:

```bash
firebase projects:list
```

### Step 2: Start Emulators (1 minute)

**Windows:**

```bash
# Double-click this file:
test-firebase-functions.bat

# Or run in terminal:
firebase emulators:start
```

**Mac/Linux:**

```bash
./test-firebase-functions.sh

# Or:
firebase emulators:start
```

### Step 3: Test Functions (30 seconds)

Open a **NEW terminal** and run:

```bash
cd functions
npm test
```

## 📊 What You'll See

When emulators start, you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://localhost:4000                │
└─────────────────────────────────────────────────────────────┘

┌───────────┬────────────────┬─────────────────────────────────┐
│ Emulator  │ Host:Port      │ View in Emulator UI             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Functions │ localhost:5001 │ http://localhost:4000/functions │
│ Firestore │ localhost:8080 │ http://localhost:4000/firestore │
│ Auth      │ localhost:9099 │ http://localhost:4000/auth      │
└───────────┴────────────────┴─────────────────────────────────┘
```

## 🧪 Test Your Functions

### Test 1: HTTP Function

```bash
# In browser or terminal:
curl http://localhost:5001/YOUR_PROJECT_ID/us-central1/testFunction
```

### Test 2: Callable Function

```bash
cd functions
npm test
```

### Test 3: Firestore Trigger

1. Open Emulator UI: http://localhost:4000
2. Go to Firestore tab
3. Create collection: `test`
4. Add a document with any data
5. Check terminal logs - you'll see the trigger fired!

### Test 4: Real Order Notification

1. **Create User:**

   - Collection: `users`
   - Document ID: `test-user-123`
   - Data:
     ```json
     {
       "name": "Test User",
       "phone": "+919876543210",
       "pushToken": "test-token"
     }
     ```

2. **Create Order:**

   - Collection: `orders`
   - Document ID: `order-123`
   - Data:
     ```json
     {
       "userId": "test-user-123",
       "status": "pending",
       "items": "Chicken Biryani x2",
       "totalAmount": 500,
       "deliveryTime": "7:00 PM"
     }
     ```

3. **Update Order Status:**
   - Edit the order document
   - Change `status` to `confirmed`
   - Watch the logs - notification function fires!

## 📱 Available Functions

### Production Functions (in src/index.ts):

#### 🔐 Authentication:

- `sendWhatsAppOTP` - Send OTP via WhatsApp
- `verifyWhatsAppOTP` - Verify OTP code
- `createCustomToken` - Create auth tokens

#### 📦 Order Management:

- `onOrderStatusChange` - Auto-notify on order updates

#### 💳 Subscriptions:

- `onSubscriptionStatusChange` - Auto-notify on subscription changes
- `checkExpiringSubscriptions` - Daily check at 9 AM

#### 💰 Payments:

- `onPaymentStatusChange` - Auto-notify on payments

#### 📢 Marketing:

- `sendPromotionalNotification` - Send bulk promotions
- `sendDailyMenuUpdates` - Daily menu at 8 AM

#### 🧪 Test Functions (in src/test.js):

- `testFunction` - Simple HTTP test
- `testCallable` - Callable function test
- `testFirestoreTrigger` - Firestore trigger test

## 🎨 Emulator UI

Open: http://localhost:4000

Features:

- ✅ View all deployed functions
- ✅ See function logs in real-time
- ✅ Create/edit Firestore documents
- ✅ Test authentication
- ✅ Trigger functions manually

## 🔍 View Logs

Logs appear in the terminal where emulators are running.

Look for:

```
>  functions[us-central1-testFunction]: http request received
i  functions[us-central1-testFunction]: Test function called!
>  functions[us-central1-testFunction]: Finished with status: 200
```

## 🛠️ Common Commands

```bash
# Start emulators
firebase emulators:start

# Start only functions
firebase emulators:start --only functions

# Start with fresh data
firebase emulators:start --clear-data

# Build TypeScript
cd functions && npm run build

# Watch mode (auto-rebuild)
cd functions && npm run build:watch

# Run tests
cd functions && npm test

# Interactive shell
cd functions && npm run shell
```

## ⚡ Quick Troubleshooting

### Emulator won't start?

```bash
# Kill processes on ports
npx kill-port 5001 4000 8080 9099

# Try again
firebase emulators:start
```

### Functions not showing?

```bash
# Rebuild
cd functions
npm run build
```

### Can't connect?

```bash
# Check if running
curl http://localhost:5001

# Check project ID
firebase projects:list
```

## 📚 Documentation

- **Detailed Guide:** `functions/README.md`
- **Setup Summary:** `FIREBASE_FUNCTIONS_SETUP.md`
- **Quick Start:** `FIREBASE_FUNCTIONS_QUICKSTART.md`

## 🎯 Next Steps

1. ✅ Test locally (you're here!)
2. ⚠️ Configure WhatsApp API credentials
3. ⚠️ Test all notification flows
4. ⚠️ Deploy to production:
   ```bash
   firebase deploy --only functions
   ```

## 🚨 Before Production

Update `functions/.env` with real values:

```bash
WHATSAPP_PHONE_NUMBER_ID=your_actual_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_actual_access_token
```

Set environment variables in Firebase:

```bash
firebase functions:config:set whatsapp.phone_number_id="123456789"
firebase functions:config:set whatsapp.access_token="your_token"
```

## ✨ Status

- ✅ Functions implemented (800+ lines)
- ✅ TypeScript compiled
- ✅ Dependencies installed
- ✅ Test functions created
- ✅ Documentation complete
- ✅ Ready for local testing

## 🎉 YOU'RE READY!

Start testing now:

**Windows:**

```bash
test-firebase-functions.bat
```

**Mac/Linux:**

```bash
firebase emulators:start
```

Then open: http://localhost:4000

Happy Testing! 🚀
