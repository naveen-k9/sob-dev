# WhatsApp Confirmation Integration

## Current Status
✅ **Trigger Points Implemented** - Console logging in place  
⚠️ **Actual API Integration** - Requires WhatsApp Business API setup

## Implementation Locations

### 1. Checkout Success (`app/checkout.tsx`)

**Lines 807-809** (After successful subscription creation):
```typescript
// Trigger WhatsApp confirmation (production would integrate with WhatsApp Business API)
console.log(
  `[WhatsApp] Sending confirmation to ${user?.phone || recipientPhone} for subscription ${createdSubscriptionId}`
);
```

## Production Implementation Steps

### Option 1: WhatsApp Business API (Official)
**Recommended for production**

1. **Setup**:
   - Register for WhatsApp Business API access
   - Get approval from Meta/Facebook
   - Set up message templates (pre-approved by WhatsApp)

2. **Message Template Example**:
   ```
   Hello {{name}},

   Your meal subscription is confirmed! 🎉

   Plan: {{planName}}
   Start Date: {{startDate}}
   Delivery Time: {{deliveryTime}}
   Total: ₹{{amount}}

   We'll send you updates about your delivery.

   Thank you for choosing us!
   ```

3. **Implementation**:
   ```typescript
   import axios from 'axios';

   const sendWhatsAppConfirmation = async (subscription: Subscription) => {
     try {
       const response = await axios.post(
         'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages',
         {
           messaging_product: 'whatsapp',
           to: subscription.phone,
           type: 'template',
           template: {
             name: 'subscription_confirmation',
             language: { code: 'en' },
             components: [
               {
                 type: 'body',
                 parameters: [
                   { type: 'text', text: subscription.customerName },
                   { type: 'text', text: subscription.planName },
                   { type: 'text', text: formatDate(subscription.startDate) },
                   { type: 'text', text: subscription.deliveryTime },
                   { type: 'text', text: subscription.totalAmount.toString() }
                 ]
               }
             ]
           }
         },
         {
           headers: {
             'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
             'Content-Type': 'application/json'
           }
         }
       );
       
       console.log('[WhatsApp] Message sent successfully:', response.data);
       return true;
     } catch (error) {
       console.error('[WhatsApp] Failed to send message:', error);
       // Fallback to SMS if WhatsApp fails
       return false;
     }
   };
   ```

4. **Cost**: 
   - Free for first 1,000 conversations/month
   - Then ~₹0.50 per conversation
   - Much cheaper than SMS

### Option 2: Third-Party Services
**Easier to set up, good for MVP**

#### A. Twilio WhatsApp
```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppConfirmation = async (subscription: Subscription) => {
  try {
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio Sandbox or your number
      to: `whatsapp:+91${subscription.phone}`,
      body: `Hello ${subscription.customerName},\n\nYour meal subscription is confirmed!\n\nPlan: ${subscription.planName}\nStart Date: ${formatDate(subscription.startDate)}\nDelivery Time: ${subscription.deliveryTime}\nTotal: ₹${subscription.totalAmount}\n\nWe'll send you updates about your delivery.\n\nThank you for choosing us!`
    });
    
    console.log('[WhatsApp] Message sent:', message.sid);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Send failed:', error);
    return false;
  }
};
```

#### B. Gupshup WhatsApp API
```typescript
import axios from 'axios';

const sendWhatsAppConfirmation = async (subscription: Subscription) => {
  try {
    const response = await axios.post(
      'https://api.gupshup.io/sm/api/v1/msg',
      {
        channel: 'whatsapp',
        source: process.env.GUPSHUP_PHONE_NUMBER,
        destination: `91${subscription.phone}`,
        message: {
          type: 'text',
          text: `Hello ${subscription.customerName},\n\nYour meal subscription is confirmed!\n\nPlan: ${subscription.planName}\nStart Date: ${formatDate(subscription.startDate)}\nDelivery Time: ${subscription.deliveryTime}\nTotal: ₹${subscription.totalAmount}`
        }
      },
      {
        headers: {
          'apikey': process.env.GUPSHUP_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('[WhatsApp] Message sent:', response.data);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Send failed:', error);
    return false;
  }
};
```

### Option 3: SMS Fallback
**Reliable fallback option**

```typescript
import * as SMS from 'expo-sms';

const sendSMSConfirmation = async (subscription: Subscription) => {
  const message = `Hello ${subscription.customerName}, Your meal subscription is confirmed! Plan: ${subscription.planName}, Start: ${formatDate(subscription.startDate)}. We'll keep you updated!`;
  
  const { result } = await SMS.sendSMSAsync(
    [subscription.phone],
    message
  );
  
  return result === 'sent';
};
```

## Integration Points

### Messages to Send

1. **Subscription Confirmation** (✅ Trigger in place)
   - When: After successful payment
   - Template: Subscription details, start date, plan
   - Location: `checkout.tsx` line 807

2. **Daily Meal Reminder** (⚠️ To implement)
   - When: 1 hour before delivery
   - Template: Today's meal, delivery time, delivery person

3. **Cooking Started** (⚠️ To implement)
   - When: Kitchen starts preparing
   - Template: "Your meal is being prepared"

4. **Out for Delivery** (⚠️ To implement)
   - When: Delivery person picks up
   - Template: Delivery person name, phone, ETA

5. **Delivered** (⚠️ To implement)
   - When: Order marked as delivered
   - Template: Thank you message, rating request

6. **Skip Confirmation** (⚠️ To implement)
   - When: User skips a meal
   - Template: Skip confirmation, next delivery date

## Implementation Checklist

- [ ] Choose WhatsApp provider (Official API / Twilio / Gupshup)
- [ ] Set up account and get API credentials
- [ ] Create and get approval for message templates
- [ ] Add environment variables for API keys
- [ ] Create WhatsApp service file (`services/whatsapp.ts`)
- [ ] Replace console.log with actual API calls
- [ ] Add error handling and SMS fallback
- [ ] Test with real phone numbers
- [ ] Add opt-in/opt-out functionality
- [ ] Track message delivery status
- [ ] Set up webhook for delivery reports
- [ ] Add rate limiting
- [ ] Monitor costs and usage

## Environment Variables Needed

```env
# WhatsApp Business API (Official)
WHATSAPP_API_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# OR Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OR Gupshup
GUPSHUP_API_KEY=your_api_key
GUPSHUP_PHONE_NUMBER=your_gupshup_number
```

## Testing

### Sandbox Testing (Before Production)
- Use WhatsApp Sandbox numbers for testing
- Test all message templates
- Verify message delivery and formatting
- Test error scenarios (invalid numbers, blocked users)

### Production Checklist
- ✅ Message templates approved by WhatsApp
- ✅ Phone number verified
- ✅ Business verification completed
- ✅ Opt-in mechanism implemented
- ✅ Rate limits configured
- ✅ Error logging set up
- ✅ Fallback to SMS working

## Cost Estimation (for 1000 orders/month)

### WhatsApp Business API
- 1000 orders × 5 messages each = 5000 messages
- Free tier: 1000 conversations
- Paid: 4000 conversations × ₹0.50 = ₹2,000/month

### Twilio
- 5000 messages × ₹0.60 = ₹3,000/month

### SMS Fallback
- 5000 messages × ₹0.25 = ₹1,250/month

## Recommended Approach

1. **MVP Stage**: Use Twilio WhatsApp Sandbox for quick testing
2. **Beta Stage**: Set up Gupshup for reliable delivery
3. **Production**: Migrate to official WhatsApp Business API for best rates

## Current Code to Replace

Find and replace all instances of:
```typescript
console.log(`[WhatsApp] Sending confirmation to...`)
```

With:
```typescript
await sendWhatsAppConfirmation({
  phone: user.phone,
  name: user.name,
  subscriptionDetails: { ... }
});
```
