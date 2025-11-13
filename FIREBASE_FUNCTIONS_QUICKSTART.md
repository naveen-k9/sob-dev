# 🚀 Quick Start - Firebase Functions Local Testing

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

## Step 3: Set Your Project

```bash
# From project root (sob-dev)
firebase use --add

# Select your Firebase project from the list
# Give it an alias like "default" or "production"
```

## Step 4: Configure Environment Variables

Edit `functions/.env`:

```bash
FIREBASE_PROJECT_ID=your-actual-firebase-project-id
WHATSAPP_API_URL=https://graph.facebook.com/v22.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
```

## Step 5: Start Firebase Emulators

**Option A - From project root:**

```bash
firebase emulators:start
```

**Option B - From functions directory:**

```bash
cd functions
npm run serve
```

This will start:

- 🔥 Functions Emulator: http://localhost:5001
- 📁 Firestore Emulator: http://localhost:8080
- 🔐 Auth Emulator: http://localhost:9099
- 🎨 Emulator UI: http://localhost:4000

## Step 6: Test Your Functions

**Open a NEW terminal** and run:

```bash
cd functions
npm test
```

Or test manually:

```bash
# Test HTTP function in browser
http://localhost:5001/YOUR_PROJECT_ID/us-central1/testFunction

# Or using curl
curl http://localhost:5001/YOUR_PROJECT_ID/us-central1/testFunction
```

## Step 7: View Emulator UI

Open in browser: http://localhost:4000

Here you can:

- View all deployed functions
- Check Firestore data
- See function logs
- Test triggers manually

## Common Commands

```bash
# Build TypeScript
cd functions && npm run build

# Watch mode (auto-rebuild on changes)
cd functions && npm run build:watch

# Start emulators
firebase emulators:start

# Start only functions emulator
firebase emulators:start --only functions

# Test functions
cd functions && npm test

# Interactive shell
cd functions && npm run shell

# Deploy to production
firebase deploy --only functions

# View production logs
firebase functions:log
```

## Troubleshooting

### Emulator won't start - port in use

```bash
# Kill process on port
npx kill-port 5001 4000 8080 9099

# Or specify different ports in firebase.json
```

### Functions not showing up

```bash
# Make sure you built the TypeScript
cd functions
npm run build

# Check for compilation errors
```

### Can't connect to emulator

```bash
# Make sure emulators are running
firebase emulators:start

# Check if ports are accessible
curl http://localhost:5001
```

## Testing Production Functions

### 1. Update Status for Testing

Instead of using admin SDK in tests, you can manually trigger functions by:

**Using Firestore Emulator UI:**

1. Open http://localhost:4000
2. Go to Firestore tab
3. Create/Update documents to trigger functions

**Example - Test Order Notification:**

1. Create a document in `users/{userId}`:

   ```json
   {
     "name": "Test User",
     "phone": "+919876543210",
     "pushToken": "test-token-123"
   }
   ```

2. Create a document in `orders/{orderId}`:

   ```json
   {
     "userId": "test-user-id",
     "status": "confirmed",
     "items": "Chicken Biryani x2",
     "totalAmount": 500,
     "deliveryTime": "7:00 PM"
   }
   ```

3. Update the order status to trigger notification:

   ```json
   {
     "status": "preparing"
   }
   ```

4. Check the functions logs in your terminal!

### 2. Test Callable Functions

From your app or using Firebase SDK in test script:

```javascript
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const sendOTP = httpsCallable(functions, "sendWhatsAppOTP");

const result = await sendOTP({ phone: "+919876543210" });
console.log(result.data);
```

## Next Steps

1. ✅ Test all functions locally
2. ✅ Configure WhatsApp API credentials
3. ✅ Test notification flows
4. ✅ Deploy to Firebase: `firebase deploy --only functions`
5. ✅ Monitor production logs: `firebase functions:log`

## Need Help?

Check the detailed README in `functions/README.md` for more information.
