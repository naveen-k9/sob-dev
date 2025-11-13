# Firebase Functions Implementation - Complete Setup ✅

## What Was Done

### 1. ✅ Project Structure Created

```
functions/
├── src/
│   ├── index.ts          # Main production functions (800 lines)
│   └── test.js           # Local test functions
├── lib/                  # Compiled output (auto-generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .eslintrc.js          # Linting rules
├── .env                  # Environment variables (not committed)
├── .gitignore           # Git ignore rules
├── test-local.js        # Quick test script
└── README.md            # Detailed documentation
```

### 2. ✅ Configuration Files

- `firebase.json` - Firebase project configuration with emulator settings
- `firestore.indexes.json` - Firestore indexes configuration
- `functions/.env` - Environment variables template
- `functions/.gitignore` - Prevents committing sensitive files

### 3. ✅ Dependencies Installed

- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Cloud Functions SDK
- `axios` - HTTP client for WhatsApp API
- `dotenv` - Environment variable management
- TypeScript & ESLint tooling

### 4. ✅ Functions Implemented

#### Callable Functions (HTTP endpoints):

1. **sendWhatsAppOTP** - Send OTP via WhatsApp
2. **verifyWhatsAppOTP** - Verify OTP code
3. **createCustomToken** - Create Firebase auth tokens
4. **sendPromotionalNotification** - Send promotions to users

#### Firestore Triggers (Auto-execute on data changes):

1. **onOrderStatusChange** - Notify on order updates
2. **onSubscriptionStatusChange** - Notify on subscription changes
3. **onPaymentStatusChange** - Notify on payment completion

#### Scheduled Functions (Cron jobs):

1. **sendDailyMenuUpdates** - Daily menu notifications (8 AM)
2. **checkExpiringSubscriptions** - Check & expire subscriptions (9 AM)

### 5. ✅ Test Functions Created

- `testFunction` - HTTP endpoint test
- `testCallable` - Callable function test
- `testFirestoreTrigger` - Database trigger test

## How to Use

### 🚀 Quick Start (5 minutes)

1. **Configure environment variables:**

   ```bash
   cd functions
   # Edit .env file with your Firebase project ID and WhatsApp credentials
   ```

2. **Start emulators:**

   ```bash
   firebase emulators:start
   ```

3. **Test in new terminal:**

   ```bash
   cd functions
   npm test
   ```

4. **View Emulator UI:**
   - Open: http://localhost:4000
   - Test functions, view logs, manage Firestore data

### 📝 Configuration Required

#### Update `functions/.env`:

```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
```

#### For Production (Optional):

Download service account key:

1. Firebase Console > Project Settings > Service Accounts
2. Generate New Private Key
3. Save as `functions/serviceAccountKey.json`

### 🧪 Local Testing Options

#### Option 1: Firebase Emulators (Recommended)

```bash
# Start all emulators
firebase emulators:start

# Or start only functions
firebase emulators:start --only functions

# With specific project
firebase emulators:start --project your-project-id
```

**Emulator Endpoints:**

- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- UI Dashboard: http://localhost:4000

#### Option 2: Functions Shell (Interactive)

```bash
cd functions
npm run shell

# Then test interactively:
> testCallable({name: 'John'})
> sendWhatsAppOTP({phone: '+919876543210'})
```

#### Option 3: Direct Test Script

```bash
cd functions
npm test
```

### 🔨 Development Commands

```bash
# Build TypeScript
cd functions && npm run build

# Watch mode (auto-rebuild on file changes)
cd functions && npm run build:watch

# Start emulators with auto-rebuild
cd functions && npm run serve

# Run linter
cd functions && npm run lint

# Test locally
cd functions && npm test
```

### 🚀 Deployment

#### Deploy all functions:

```bash
firebase deploy --only functions
```

#### Deploy specific function:

```bash
firebase deploy --only functions:sendWhatsAppOTP
firebase deploy --only functions:onOrderStatusChange
```

#### View deployment status:

```bash
firebase functions:list
```

### 📊 Monitoring

#### View logs locally:

- Check terminal where emulators are running
- Or open Emulator UI: http://localhost:4000

#### View production logs:

```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only sendWhatsAppOTP

# Follow logs (live)
firebase functions:log --follow

# Last N lines
firebase functions:log -n 100
```

## Testing Scenarios

### Test Order Notifications

1. **Start emulators**
2. **Open Emulator UI:** http://localhost:4000
3. **Create test user** in Firestore `users` collection:
   ```json
   {
     "name": "Test User",
     "phone": "+919876543210",
     "pushToken": "test-token"
   }
   ```
4. **Create test order** in `orders` collection:
   ```json
   {
     "userId": "test-user-id",
     "status": "pending",
     "items": "Biryani x2",
     "totalAmount": 500
   }
   ```
5. **Update order status** to `confirmed` - notification triggers!
6. **Check logs** in terminal

### Test Subscription Expiry

1. Create subscription with near expiry:
   ```json
   {
     "userId": "test-user-id",
     "status": "active",
     "planName": "Monthly Plan",
     "endDate": "2025-11-15T00:00:00.000Z"
   }
   ```
2. Trigger scheduled function manually or wait for cron

### Test WhatsApp OTP

```javascript
// In your app or test script
import { httpsCallable } from "firebase/functions";

const sendOTP = httpsCallable(functions, "sendWhatsAppOTP");
const result = await sendOTP({ phone: "+919876543210" });
console.log(result.data); // { success: true, messageId: "..." }
```

## Project Files Overview

### Main Function Files

- **functions/src/index.ts** - All production functions (800 lines)
- **functions/src/test.js** - Test functions for local development

### Configuration

- **firebase.json** - Main Firebase configuration
- **functions/package.json** - Node.js dependencies
- **functions/tsconfig.json** - TypeScript compiler settings
- **functions/.env** - Environment variables (create from template)

### Documentation

- **functions/README.md** - Detailed documentation
- **FIREBASE_FUNCTIONS_QUICKSTART.md** - Quick start guide
- **FIREBASE_FUNCTIONS_SETUP.md** - This file

## Next Steps

### Immediate:

1. ✅ Update `.env` with your Firebase project ID
2. ✅ Start emulators: `firebase emulators:start`
3. ✅ Test functions: `cd functions && npm test`
4. ✅ Explore Emulator UI: http://localhost:4000

### Before Production:

1. ⚠️ Configure WhatsApp API credentials in `.env`
2. ⚠️ Test all notification flows locally
3. ⚠️ Set up Firebase project properly (if not done)
4. ⚠️ Configure environment variables in Firebase:
   ```bash
   firebase functions:config:set whatsapp.api_url="..."
   firebase functions:config:set whatsapp.phone_number_id="..."
   firebase functions:config:set whatsapp.access_token="..."
   ```

### Deploy:

```bash
# First deployment
firebase deploy --only functions

# Subsequent deployments
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendWhatsAppOTP
```

## Troubleshooting

### Build errors

```bash
cd functions
npm run build
# Fix any TypeScript errors shown
```

### Emulator won't start

```bash
# Kill processes on used ports
npx kill-port 5001 4000 8080 9099

# Or change ports in firebase.json
```

### Functions not appearing

```bash
# Rebuild
cd functions && npm run build

# Check for errors
cd functions && npm run lint
```

### Can't connect to emulator

```bash
# Verify emulators are running
curl http://localhost:5001

# Restart emulators
firebase emulators:start --clear-data
```

## Resources

- 📚 [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- 🧪 [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- 💬 [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- 🔔 [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

## Status: ✅ READY FOR TESTING

Everything is set up and ready to go! Start with:

```bash
firebase emulators:start
```

Then in a new terminal:

```bash
cd functions && npm test
```
