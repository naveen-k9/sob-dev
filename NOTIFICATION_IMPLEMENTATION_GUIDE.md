# Notification Implementation Guide

This guide documents the complete implementation of WhatsApp and Push Notifications for all required scenarios.

## 📱 Implementation Status

### WhatsApp Notifications (3 scenarios)
✅ 1. **subscription_activated** - Already implemented
✅ 2. **subscription_expired** - Already implemented  
✅ 3. **wallet_credited** - Already implemented

### Push Notifications (6 scenarios)
✅ 1. **order_confirmed** - Already implemented
✅ 2. **order_preparing** - Already implemented
✅ 3. **order_out_for_delivery** - Already implemented
✅ 4. **order_delivered** - Already implemented
✅ 5. **subscription_expiring** - Already implemented
✅ 6. **daily_menu_update** - Already implemented

---

## 🔧 WhatsApp Templates Required

### 1. subscription_activated
**Template Name:** `subscription_activated`
**Category:** ACCOUNT_UPDATE

**Template Body:**
```
Hi {{1}},

Your {{2}} subscription has been activated successfully! 🎉

Start Date: {{3}}
End Date: {{4}}

You can now enjoy delicious meals delivered to your doorstep. Visit our app to explore the menu.

Thank you for choosing us!
```

**Parameters:**
1. Customer Name
2. Plan Name  
3. Start Date
4. End Date

**Implementation:**
```typescript
await sendWhatsAppSubscriptionNotification(phoneNumber, {
  customerName: "John Doe",
  planName: "Monthly Premium",
  status: "activated",
  startDate: "2025-11-05",
  endDate: "2025-12-05"
});
```

---

### 2. subscription_expired
**Template Name:** `subscription_expired`
**Category:** ACCOUNT_UPDATE

**Template Body:**
```
Hi {{1}},

Your {{2}} subscription has expired. ⚠️

To continue enjoying your daily meals, please renew your subscription.

Renew now through our app and never miss a meal!

Thank you for being with us.
```

**Parameters:**
1. Customer Name
2. Plan Name

**Implementation:**
```typescript
await sendWhatsAppSubscriptionNotification(phoneNumber, {
  customerName: "John Doe",
  planName: "Monthly Premium",
  status: "expired"
});
```

---

### 3. wallet_credited
**Template Name:** `wallet_credited`
**Category:** ACCOUNT_UPDATE

**Template Body:**
```
Hi {{1}},

Your wallet has been credited with ₹{{2}}! 💰

Reason: {{3}}
New Balance: ₹{{4}}

You can use this balance for your next order.

Happy ordering!
```

**Parameters:**
1. Customer Name
2. Amount Credited
3. Reason (e.g., "Referral bonus", "Refund", "Cashback")
4. New Balance

**Implementation:**
```typescript
await sendWhatsAppWalletCreditNotification(phoneNumber, {
  customerName: "John Doe",
  amount: "100",
  reason: "Referral bonus",
  newBalance: "500"
});
```

---

## 📲 Push Notification Implementation

### 1. order_confirmed
**Title:** 🎉 Order Confirmed!
**Body:** Hi {customerName}! Your order #{orderId} has been confirmed.

**Implementation:**
```typescript
await sendOrderNotification({
  orderId: "ORD123456",
  status: "confirmed",
  customerName: "John Doe"
});
```

**Data Payload:**
```typescript
{
  type: "order_update",
  orderId: "ORD123456",
  status: "confirmed",
  screen: "orders"
}
```

---

### 2. order_preparing
**Title:** 👨‍🍳 Preparing Your Order
**Body:** Your order #{orderId} is being prepared with love!

**Implementation:**
```typescript
await sendOrderNotification({
  orderId: "ORD123456",
  status: "preparing",
  customerName: "John Doe"
});
```

**Data Payload:**
```typescript
{
  type: "order_update",
  orderId: "ORD123456",
  status: "preparing",
  screen: "orders"
}
```

---

### 3. order_out_for_delivery
**Title:** 🚚 On the Way!
**Body:** Your order #{orderId} is out for delivery. It will arrive soon!

**Implementation:**
```typescript
await sendOrderNotification({
  orderId: "ORD123456",
  status: "out_for_delivery",
  customerName: "John Doe"
});
```

**Data Payload:**
```typescript
{
  type: "order_update",
  orderId: "ORD123456",
  status: "out_for_delivery",
  screen: "orders"
}
```

---

### 4. order_delivered
**Title:** ✅ Order Delivered
**Body:** Your order #{orderId} has been delivered. Enjoy your meal!

**Implementation:**
```typescript
await sendOrderNotification({
  orderId: "ORD123456",
  status: "delivered",
  customerName: "John Doe"
});
```

**Data Payload:**
```typescript
{
  type: "order_update",
  orderId: "ORD123456",
  status: "delivered",
  screen: "orders"
}
```

---

### 5. subscription_expiring
**Title:** ⏰ Subscription Expiring Soon
**Body:** Your {planName} subscription will expire in {daysRemaining} days.

**Implementation:**
```typescript
await sendSubscriptionNotification({
  planName: "Monthly Premium",
  status: "expiring",
  daysRemaining: 3
});
```

**Data Payload:**
```typescript
{
  type: "subscription_update",
  planName: "Monthly Premium",
  status: "expiring",
  screen: "subscription"
}
```

---

### 6. daily_menu_update
**Title:** 🍽️ Today's Menu
**Body:** Check out today's delicious meals: {menuItems}

**Implementation:**
```typescript
await sendMenuUpdateNotification({
  date: "2025-11-05",
  menuItems: "Paneer Butter Masala, Dal Fry, Roti"
});
```

**Data Payload:**
```typescript
{
  type: "menu_update",
  date: "2025-11-05",
  screen: "menu"
}
```

---

## 🚀 Usage Examples

### Example 1: Complete Order Flow
```typescript
import { notifyOrderUpdate, NotificationRecipient } from '@/utils/notificationTemplates';

const recipient: NotificationRecipient = {
  userId: "user123",
  name: "John Doe",
  phone: "919876543210",
  pushToken: "ExponentPushToken[xxxxx]"
};

// Step 1: Order Confirmed
await notifyOrderUpdate(recipient, {
  orderId: "ORD123456",
  status: "confirmed",
  items: "Paneer Butter Masala, Dal Fry",
  totalAmount: "299",
  deliveryTime: "12:30 PM"
});

// Step 2: Order Preparing
await notifyOrderUpdate(recipient, {
  orderId: "ORD123456",
  status: "preparing"
});

// Step 3: Out for Delivery
await notifyOrderUpdate(recipient, {
  orderId: "ORD123456",
  status: "out_for_delivery",
  deliveryTime: "30 minutes"
});

// Step 4: Delivered
await notifyOrderUpdate(recipient, {
  orderId: "ORD123456",
  status: "delivered"
});
```

### Example 2: Subscription Lifecycle
```typescript
import { notifySubscriptionUpdate } from '@/utils/notificationTemplates';

// Subscription Activated
await notifySubscriptionUpdate(recipient, {
  planName: "Monthly Premium",
  status: "activated",
  startDate: "2025-11-05",
  endDate: "2025-12-05"
});

// Subscription Expiring (3 days before)
await notifySubscriptionUpdate(recipient, {
  planName: "Monthly Premium",
  status: "expiring",
  daysRemaining: 3,
  renewalAmount: "999"
});

// Subscription Expired
await notifySubscriptionUpdate(recipient, {
  planName: "Monthly Premium",
  status: "expired"
});
```

### Example 3: Wallet Credit
```typescript
import { notifyWalletCredit } from '@/utils/notificationTemplates';

// Referral Bonus
await notifyWalletCredit(recipient, {
  amount: "100",
  reason: "Referral bonus",
  newBalance: "500"
});

// Refund
await notifyWalletCredit(recipient, {
  amount: "299",
  reason: "Order cancellation refund",
  newBalance: "799"
});

// Cashback
await notifyWalletCredit(recipient, {
  amount: "50",
  reason: "Cashback on order",
  newBalance: "849"
});
```

### Example 4: Daily Menu Update (Batch Notification)
```typescript
import { notifyBatch } from '@/utils/notificationTemplates';

// Get all active subscribers
const subscribers = await db.collection('users')
  .where('subscriptionStatus', '==', 'active')
  .get();

const recipients = subscribers.docs.map(doc => {
  const data = doc.data();
  return {
    userId: doc.id,
    name: data.name,
    phone: data.phone,
    pushToken: data.pushToken
  };
});

// Send daily menu update to all
await notifyBatch(recipients, 'menu', {
  date: new Date().toISOString().split('T')[0],
  menuItems: "Paneer Butter Masala, Dal Fry, Jeera Rice, Roti, Salad"
});
```

---

## 🔥 Firebase Cloud Functions Integration

### Order Status Update Trigger
```typescript
export const onOrderStatusUpdate = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    if (before?.status !== after?.status) {
      const userDoc = await db.collection('users').doc(after.userId).get();
      const user = userDoc.data();
      
      // Send both WhatsApp and Push notification
      await notifyOrderUpdate(
        {
          userId: after.userId,
          name: user?.name || 'Customer',
          phone: user?.phone,
          pushToken: user?.pushToken
        },
        {
          orderId: event.params.orderId,
          status: after.status,
          items: after.items?.join(', '),
          totalAmount: after.totalAmount?.toString(),
          deliveryTime: after.deliveryTime
        }
      );
    }
  }
);
```

### Subscription Status Trigger
```typescript
export const onSubscriptionUpdate = onDocumentUpdated(
  "subscriptions/{subscriptionId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    if (before?.status !== after?.status && 
        ['activated', 'expired'].includes(after?.status)) {
      const userDoc = await db.collection('users').doc(after.userId).get();
      const user = userDoc.data();
      
      await notifySubscriptionUpdate(
        {
          userId: after.userId,
          name: user?.name || 'Customer',
          phone: user?.phone,
          pushToken: user?.pushToken
        },
        {
          planName: after.planName,
          status: after.status,
          startDate: after.startDate,
          endDate: after.endDate
        }
      );
    }
  }
);
```

### Wallet Credit Trigger
```typescript
export const onWalletTransaction = onDocumentCreated(
  "walletTransactions/{transactionId}",
  async (event) => {
    const transaction = event.data?.data();
    
    if (transaction?.type === 'credit') {
      const userDoc = await db.collection('users').doc(transaction.userId).get();
      const user = userDoc.data();
      
      await notifyWalletCredit(
        {
          userId: transaction.userId,
          name: user?.name || 'Customer',
          phone: user?.phone,
          pushToken: user?.pushToken
        },
        {
          amount: transaction.amount.toString(),
          reason: transaction.reason,
          newBalance: user?.walletBalance?.toString() || '0'
        }
      );
    }
  }
);
```

### Daily Menu Scheduled Function
```typescript
export const sendDailyMenuUpdate = onSchedule(
  {
    schedule: "0 8 * * *", // Every day at 8 AM
    timeZone: "Asia/Kolkata"
  },
  async (event) => {
    // Get today's menu
    const today = new Date().toISOString().split('T')[0];
    const menuDoc = await db.collection('dailyMenus').doc(today).get();
    const menu = menuDoc.data();
    
    if (!menu) return;
    
    // Get all active subscribers
    const subscribers = await db.collection('users')
      .where('subscriptionStatus', '==', 'active')
      .where('notificationPreferences.dailyMenu', '==', true)
      .get();
    
    const recipients = subscribers.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        name: data.name,
        phone: data.phone,
        pushToken: data.pushToken
      };
    });
    
    // Batch send
    await notifyBatch(recipients, 'menu', {
      date: today,
      menuItems: menu.items.map((item: any) => item.name).join(', ')
    });
  }
);
```

### Subscription Expiry Check (Daily)
```typescript
export const checkExpiringSubscriptions = onSchedule(
  {
    schedule: "0 9 * * *", // Every day at 9 AM
    timeZone: "Asia/Kolkata"
  },
  async (event) => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Get subscriptions expiring in 3 days
    const expiringSubscriptions = await db.collection('subscriptions')
      .where('status', '==', 'active')
      .where('endDate', '<=', threeDaysFromNow.toISOString())
      .get();
    
    for (const subDoc of expiringSubscriptions.docs) {
      const subscription = subDoc.data();
      const userDoc = await db.collection('users').doc(subscription.userId).get();
      const user = userDoc.data();
      
      const endDate = new Date(subscription.endDate);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      await notifySubscriptionUpdate(
        {
          userId: subscription.userId,
          name: user?.name || 'Customer',
          phone: user?.phone,
          pushToken: user?.pushToken
        },
        {
          planName: subscription.planName,
          status: 'expiring',
          daysRemaining: daysRemaining,
          renewalAmount: subscription.amount?.toString()
        }
      );
    }
  }
);
```

---

## 🎯 Notification Channels (Android)

The following notification channels are configured:

### 1. Orders Channel
- **ID:** `orders`
- **Name:** Order Updates
- **Importance:** HIGH
- **Vibration:** [0, 250, 250, 250]
- **Color:** Green (#4CAF50)
- **Use Cases:** order_confirmed, order_preparing, order_out_for_delivery, order_delivered

### 2. Subscriptions Channel
- **ID:** `subscriptions`
- **Name:** Subscription Updates
- **Importance:** DEFAULT
- **Vibration:** [0, 250]
- **Color:** Blue (#2196F3)
- **Use Cases:** subscription_expiring, subscription_activated, subscription_expired

### 3. Promotions Channel
- **ID:** `promotions`
- **Name:** Offers & Promotions
- **Importance:** LOW
- **Vibration:** [0, 250]
- **Color:** Orange (#FF9800)
- **Use Cases:** daily_menu_update, promotional offers

---

## ✅ Setup Checklist

### WhatsApp Configuration
- [ ] Create WhatsApp Business Account
- [ ] Register phone number
- [ ] Create and approve all 3 WhatsApp templates:
  - [ ] subscription_activated
  - [ ] subscription_expired
  - [ ] wallet_credited
- [ ] Add environment variables:
  - [ ] `EXPO_PUBLIC_WHATSAPP_API_URL`
  - [ ] `EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID`
  - [ ] `EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN`

### Push Notifications
- [ ] Configure Expo push notification credentials
- [ ] Set up FCM for Android
- [ ] Set up APNs for iOS
- [ ] Test push notifications on both platforms

### Firebase Functions
- [ ] Deploy all Cloud Functions
- [ ] Set up scheduled functions for:
  - [ ] Daily menu updates (8 AM daily)
  - [ ] Subscription expiry checks (9 AM daily)
- [ ] Test all triggers:
  - [ ] Order status updates
  - [ ] Subscription updates
  - [ ] Wallet transactions

---

## 📊 Testing

### Test Scenarios

1. **Order Flow Test**
   ```bash
   # Test all order states
   confirmed → preparing → out_for_delivery → delivered
   ```

2. **Subscription Test**
   ```bash
   # Test subscription lifecycle
   activated → expiring (3 days) → expired
   ```

3. **Wallet Test**
   ```bash
   # Test different credit scenarios
   - Referral bonus
   - Refund
   - Cashback
   ```

4. **Daily Menu Test**
   ```bash
   # Test scheduled notification
   Run at 8 AM daily for active subscribers
   ```

---

## 🔧 Troubleshooting

### WhatsApp Issues
- **Template not approved:** Contact WhatsApp support
- **Message not sent:** Check phone number format (must be international)
- **Token expired:** Regenerate access token in Meta Business Suite

### Push Notification Issues
- **Not received on Android:** Check FCM configuration
- **Not received on iOS:** Verify APNs certificate
- **Device not registered:** Ensure `registerForPushNotificationsAsync()` is called

---

## 📞 Support

For any issues or questions regarding notifications:
1. Check console logs for error messages
2. Verify environment variables are set correctly
3. Test with the provided examples
4. Check Firebase Functions logs for server-side issues

---

**Last Updated:** November 5, 2025
