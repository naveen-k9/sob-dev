# WhatsApp Business Templates - Submission Guide

This document contains the exact templates you need to create in Meta Business Suite for WhatsApp notifications.

## 📋 Required Templates

You need to create and get approved **4 WhatsApp templates** for the following scenarios:
1. subscription_activated
2. subscription_expired
3. subscription_expiring (renew link; same CTA as subscription_expired)
4. wallet_credited

---

## 🔧 How to Create Templates

1. Go to **Meta Business Suite** (https://business.facebook.com)
2. Navigate to **WhatsApp Manager**
3. Click on **Message Templates**
4. Click **Create Template**
5. Follow the specifications below for each template

---

## Template 1: subscription_activated

### Basic Information
- **Template Name:** `subscription_activated`
- **Category:** `ACCOUNT_UPDATE`
- **Language:** `English`

### Header (Optional)
- Type: **Text**
- Content: `Subscription Activated`

### Body (Required)
```
Hi {{1}},

Your {{2}} subscription has been activated successfully! 🎉

Start Date: {{3}}
End Date: {{4}}

You can now enjoy delicious meals delivered to your doorstep. Visit our app to explore the menu.

Thank you for choosing us!
```

### Variables in Body:
1. `{{1}}` - Customer Name (TEXT)
2. `{{2}}` - Plan Name (TEXT)
3. `{{3}}` - Start Date (TEXT)
4. `{{4}}` - End Date (TEXT)

### Footer (Optional)
```
Reply STOP to unsubscribe
```

### Buttons (Optional)
- Button 1: **Call to Action** → URL
  - Button Text: `Open App`
  - URL: `https://yourapp.com/subscription`
  - URL Type: Dynamic (with variable `{{1}}` for user ID)

### Sample Content for Approval
```
Hi John Doe,

Your Monthly Premium subscription has been activated successfully! 🎉

Start Date: 05 Nov 2025
End Date: 05 Dec 2025

You can now enjoy delicious meals delivered to your doorstep. Visit our app to explore the menu.

Thank you for choosing us!
```

---

## Template 2: subscription_expired

### Basic Information
- **Template Name:** `subscription_expired`
- **Category:** `ACCOUNT_UPDATE`
- **Language:** `English`

### Header (Optional)
- Type: **Text**
- Content: `Subscription Expired`

### Body (Required)
```
Hi {{1}},

Your {{2}} subscription has expired. ⚠️

To continue enjoying your daily meals, please renew your subscription.

Renew now through our app and never miss a meal!

Thank you for being with us.
```

### Variables in Body:
1. `{{1}}` - Customer Name (TEXT)
2. `{{2}}` - Plan Name (TEXT)

### Footer (Optional)
```
Reply STOP to unsubscribe
```

### Buttons (Optional) – for renew same meal
- Button 1: **Call to Action** → URL
  - Button Text: `Renew Now`
  - URL: `https://sameoldbox.com/renew?sid={{1}}`
  - URL Type: **Dynamic** – one parameter for the button: `{{1}}` = subscription ID (backend will pass this so the app opens the correct subscription to renew).

### Sample Content for Approval
```
Hi John Doe,

Your Monthly Premium subscription has expired. ⚠️

To continue enjoying your daily meals, please renew your subscription.

Renew now through our app and never miss a meal!

Thank you for being with us.
```

---

## Template 2b: subscription_expiring

Use this template when a subscription is about to expire (e.g. within 3 days). Same "Renew Now" button as subscription_expired for consistency.

### Basic Information
- **Template Name:** `subscription_expiring`
- **Category:** `ACCOUNT_UPDATE`
- **Language:** `English`

### Body (Required)
```
Hi {{1}},

Reminder: Your {{2}} subscription expires in {{3}} days. ⏰

Renew now to continue enjoying delicious meals!
```

### Variables in Body:
1. `{{1}}` - Customer Name (TEXT)
2. `{{2}}` - Plan Name (TEXT)
3. `{{3}}` - Days Remaining (TEXT, e.g. "3")

### Buttons (Optional) – for renew same meal
- Button 1: **Call to Action** → URL
  - Button Text: `Renew Now`
  - URL: `https://sameoldbox.com/renew?sid={{1}}`
  - URL Type: **Dynamic** – one parameter for the button: `{{1}}` = subscription ID.

### Sample Content for Approval
```
Hi John Doe,

Reminder: Your Monthly Premium subscription expires in 3 days. ⏰

Renew now to continue enjoying delicious meals!
```

---

## Template 3: wallet_credited

### Basic Information
- **Template Name:** `wallet_credited`
- **Category:** `ACCOUNT_UPDATE`
- **Language:** `English`

### Header (Optional)
- Type: **Text**
- Content: `Wallet Credited`

### Body (Required)
```
Hi {{1}},

Your wallet has been credited with ₹{{2}}! 💰

Reason: {{3}}
New Balance: ₹{{4}}

You can use this balance for your next order.

Happy ordering!
```

### Variables in Body:
1. `{{1}}` - Customer Name (TEXT)
2. `{{2}}` - Amount Credited (TEXT)
3. `{{3}}` - Reason (TEXT)
4. `{{4}}` - New Balance (TEXT)

### Footer (Optional)
```
Reply STOP to unsubscribe
```

### Buttons (Optional)
- Button 1: **Call to Action** → URL
  - Button Text: `View Wallet`
  - URL: `https://yourapp.com/wallet`
  - URL Type: Static

### Sample Content for Approval
```
Hi John Doe,

Your wallet has been credited with ₹100! 💰

Reason: Referral bonus
New Balance: ₹500

You can use this balance for your next order.

Happy ordering!
```

---

## 📝 Template Submission Guidelines

### Do's:
✅ Use clear and concise language
✅ Include variable placeholders ({{1}}, {{2}}, etc.)
✅ Provide realistic sample content
✅ Follow WhatsApp's content policies
✅ Include opt-out option in footer
✅ Keep messages under 1024 characters
✅ Use emojis appropriately (not excessive)

### Don'ts:
❌ Use spammy or promotional language
❌ Include misleading information
❌ Use excessive emojis
❌ Include external links in body (use buttons instead)
❌ Request sensitive information
❌ Use abbreviations or unclear language

---

## 🎯 Template Categories Explained

### ACCOUNT_UPDATE
Use this for:
- Account status changes
- Subscription updates
- Wallet/balance updates
- Profile changes
- Account verification

**Why we use ACCOUNT_UPDATE:**
All three templates (subscription_activated, subscription_expired, wallet_credited) are account-related notifications informing users about changes to their account status.

---

## ⏱️ Approval Timeline

- **Typical Approval Time:** 24-48 hours
- **Priority Review:** Available for verified businesses
- **Rejection Reasons:** Policy violations, unclear content, misleading information

---

## 🔄 After Approval

Once your templates are approved:

1. **Note Template Names:** Make sure they match exactly:
   - `subscription_activated`
   - `subscription_expired`
   - `subscription_expiring`
   - `wallet_credited`

2. **Update Environment Variables:**
   ```bash
   EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN=your_access_token
   EXPO_PUBLIC_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
   ```

3. **Test the Templates:**
   ```typescript
   // Test subscription_activated
   await sendWhatsAppSubscriptionNotification('919876543210', {
     customerName: 'Test User',
     planName: 'Monthly Premium',
     status: 'activated',
     startDate: '2025-11-05',
     endDate: '2025-12-05'
   });

   // Test subscription_expired
   await sendWhatsAppSubscriptionNotification('919876543210', {
     customerName: 'Test User',
     planName: 'Monthly Premium',
     status: 'expired'
   });

   // Test wallet_credited
   await sendWhatsAppWalletCreditNotification('919876543210', {
     customerName: 'Test User',
     amount: '100',
     reason: 'Test credit',
     newBalance: '500'
   });
   ```

---

## 📊 Template Variable Mapping

### subscription_activated
```typescript
{
  {{1}}: customerName,      // "John Doe"
  {{2}}: planName,          // "Monthly Premium"
  {{3}}: startDate,         // "05 Nov 2025"
  {{4}}: endDate            // "05 Dec 2025"
}
```

### subscription_expired
```typescript
{
  {{1}}: customerName,      // "John Doe"
  {{2}}: planName           // "Monthly Premium"
}
```

### wallet_credited
```typescript
{
  {{1}}: customerName,      // "John Doe"
  {{2}}: amount,            // "100"
  {{3}}: reason,            // "Referral bonus"
  {{4}}: newBalance         // "500"
}
```

---

## 🚨 Common Rejection Reasons & Solutions

### 1. "Template contains promotional content"
**Solution:** Remove any sales language, use neutral informative tone

### 2. "Variable examples not clear"
**Solution:** Provide realistic sample data in submission

### 3. "Button URL doesn't match domain"
**Solution:** Ensure URL matches your verified business domain

### 4. "Missing opt-out option"
**Solution:** Add "Reply STOP to unsubscribe" in footer

### 5. "Excessive use of emojis"
**Solution:** Limit to 1-2 appropriate emojis per template

---

## 📱 Testing Your Templates

### Test Checklist:
- [ ] Send to test phone number
- [ ] Verify all variables populate correctly
- [ ] Check message formatting
- [ ] Test button clicks (if any)
- [ ] Verify opt-out works
- [ ] Check delivery time
- [ ] Test with different phone number formats

### Test Script:
```typescript
import { 
  sendWhatsAppSubscriptionNotification,
  sendWhatsAppWalletCreditNotification 
} from '@/services/whatsapp';

async function testWhatsAppTemplates() {
  const testPhone = '919876543210'; // Replace with your test number
  
  console.log('Testing subscription_activated...');
  const result1 = await sendWhatsAppSubscriptionNotification(testPhone, {
    customerName: 'Test User',
    planName: 'Monthly Premium',
    status: 'activated',
    startDate: '2025-11-05',
    endDate: '2025-12-05'
  });
  console.log('Result:', result1);
  
  console.log('\nTesting subscription_expired...');
  const result2 = await sendWhatsAppSubscriptionNotification(testPhone, {
    customerName: 'Test User',
    planName: 'Monthly Premium',
    status: 'expired'
  });
  console.log('Result:', result2);
  
  console.log('\nTesting wallet_credited...');
  const result3 = await sendWhatsAppWalletCreditNotification(testPhone, {
    customerName: 'Test User',
    amount: '100',
    reason: 'Referral bonus',
    newBalance: '500'
  });
  console.log('Result:', result3);
}

testWhatsAppTemplates();
```

---

## 🔐 Security Best Practices

1. **Never hardcode tokens** - Use environment variables
2. **Rotate tokens regularly** - Update every 60-90 days
3. **Validate phone numbers** - Check format before sending
4. **Rate limiting** - Respect WhatsApp API limits
5. **Error handling** - Log failures for debugging
6. **User consent** - Only send to opted-in users

---

## 📞 Support Resources

- **WhatsApp Business API Docs:** https://developers.facebook.com/docs/whatsapp
- **Meta Business Suite:** https://business.facebook.com
- **Template Guidelines:** https://developers.facebook.com/docs/whatsapp/message-templates/guidelines

---

## ✅ Pre-Submission Checklist

Before submitting templates for approval:

- [ ] Templates follow WhatsApp content policies
- [ ] Sample content is realistic and complete
- [ ] Variable placeholders are clearly defined
- [ ] Category is appropriate (ACCOUNT_UPDATE)
- [ ] Opt-out mechanism included
- [ ] Language is professional and clear
- [ ] Emojis used appropriately (not excessive)
- [ ] Character count under 1024
- [ ] Business domain verified
- [ ] Contact information up to date

---

**Last Updated:** November 5, 2025

**Need Help?** Contact Meta Business Support or refer to the WhatsApp Business API documentation.
