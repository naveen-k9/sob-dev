# Order Status Flow Documentation

## Overview
This document describes the order status flow implemented in the app. The status transitions are managed across multiple screens and components.

## Status Progression

### Complete Status Flow
```
scheduled → cooking_started → cooking_done → ready_for_delivery → 
packaging_done → delivery_started → reached → delivery_done
```

### Simplified User-Facing Flow
```
Scheduled → Cooking → Ready → Out for Delivery → Delivered
```

## Status Definitions

### 1. `scheduled`
- **When**: Order is confirmed and scheduled for future delivery
- **User Message**: "Scheduled"
- **Color**: Gray (#6B7280)
- **Icon**: Calendar
- **Cancellation**: Allowed (before cut-off time)

### 2. `cooking_started`
- **When**: Kitchen has started preparing the meal (typically after 8 AM)
- **User Message**: "Cooking Started" / "Cooking"
- **Color**: Orange (#F59E0B)
- **Icon**: ChefHat
- **Cancellation**: **NOT ALLOWED** - Meal preparation in progress

### 3. `cooking_done`
- **When**: Cooking is complete, meal ready for packaging
- **User Message**: "Cooking Done" / "Ready"
- **Color**: Green (#10B981)
- **Icon**: CheckCircle
- **Cancellation**: NOT ALLOWED

### 4. `ready_for_delivery`
- **When**: Meal is packaged and ready for pickup by delivery person
- **User Message**: "Ready for Delivery"
- **Color**: Blue (#3B82F6)
- **Icon**: Package
- **Cancellation**: NOT ALLOWED

### 5. `packaging_done`
- **When**: Packaging completed, awaiting delivery assignment
- **User Message**: "Packaged"
- **Color**: Blue (#3B82F6)
- **Icon**: Package
- **Cancellation**: NOT ALLOWED

### 6. `delivery_started` / `out_for_delivery`
- **When**: Delivery person has picked up and is on the way
- **User Message**: "Out for Delivery"
- **Color**: Purple (#48479B)
- **Icon**: Truck
- **Cancellation**: NOT ALLOWED
- **Shows**: Delivery person name, phone, estimated time

### 7. `reached`
- **When**: Delivery person has reached the delivery location
- **User Message**: "Reached"
- **Color**: Indigo (#6366F1)
- **Icon**: Navigation
- **Cancellation**: NOT ALLOWED

### 8. `delivery_done` / `delivered`
- **When**: Order successfully delivered to customer
- **User Message**: "Delivered"
- **Color**: Green (#10B981)
- **Icon**: CheckCircle
- **Cancellation**: NOT ALLOWED (completed)

## Implementation Locations

### 1. TodayMealSlider Component (`components/TodayMealSlider.tsx`)
Shows today's meals with current status:
- Lines 169-213: `getStatusInfo()` function maps status to UI elements
- Displays status badge on meal cards
- Shows delivery time and add-on availability

### 2. Orders Screen (`app/(tabs)/orders.tsx`)
Full calendar and order management:
- Lines 328-333: Status determination based on time of day (demo logic)
- Lines 617-634: `getCalendarStatusColor()` - Maps status to calendar colors
- Lines 1088-1108: `getTodayOrderStatusColor()` - Status colors for today's orders
- Lines 1109-1134: `getStatusIcon()` - Icons for each status
- Lines 1136-1156: `getStatusText()` - User-friendly status labels
- Lines 652-668: **Prevents cancellation after cooking starts**

### 3. Checkout Screen (`app/checkout.tsx`)
Initial order creation:
- Creates subscription with status: "active"
- Order items start with status: "scheduled"

## Cancellation Rules

### Allowed Cancellation
- **Status**: `scheduled` only
- **Time Constraint**: Before skip cut-off time (configured in AppSettings)
- **Implementation**: `orders.tsx` lines 652-668

### Blocked Cancellation
```typescript
// Prevent skip if cooking has started (for today's meal)
if (selectedDateCopy.getTime() === today.getTime()) {
  const currentHour = new Date().getHours();
  // If cooking has started (typically after 8 AM), prevent cancellation
  if (currentHour >= 8 && selectedDateDelivery.status !== "scheduled") {
    Alert.alert(
      "Cannot Skip",
      "This meal cannot be skipped as preparation has already started. Please contact support for assistance.",
      [{ text: "OK" }]
    );
    return;
  }
}
```

## Time-Based Status Updates (Demo Logic)

Current implementation uses time-of-day for demo purposes:
```typescript
const currentHour = new Date().getHours();
let status = "cooking_started";

if (currentHour >= 11) status = "cooking_done";
if (currentHour >= 12) status = "ready_for_delivery";
if (currentHour >= 13) status = "delivery_started";
if (currentHour >= 14) status = "delivery_done";
```

**Production Recommendation**: Replace with backend-driven status updates from kitchen/delivery apps.

## Admin/Kitchen Integration

### Kitchen App Updates
The kitchen app should update order status at these points:
1. When chef starts cooking → `cooking_started`
2. When cooking is complete → `cooking_done`
3. When packaging is done → `packaging_done`
4. When ready for pickup → `ready_for_delivery`

### Delivery App Updates
The delivery app should update order status at these points:
1. When driver picks up → `delivery_started`
2. When driver reaches location → `reached`
3. When delivery is completed → `delivery_done`

### Real-time Updates
Status changes should be:
1. Updated in Firebase Realtime Database
2. Reflected immediately in customer app via Firebase listeners
3. Push notification sent to customer for key transitions:
   - Cooking Started
   - Out for Delivery
   - Delivered

## Calendar Indicators

### Visual Markers
- **Delivered**: Green dot (#10B981)
- **Upcoming**: Purple dot (#48479B)
- **Skipped**: Yellow dot (#F59E0B)
- **Vacation**: Orange dot (#F59E0B)

### Implementation
- `orders.tsx` lines 804-815: Renders colored indicator dots on calendar days
- `orders.tsx` lines 584-585: Sets status to "delivered" for past dates with deliveries

## Testing Checklist

- [ ] Order starts as "scheduled"
- [ ] Status progresses through cooking stages
- [ ] User cannot cancel after cooking starts
- [ ] Delivery status shows delivery person details
- [ ] Delivered status shows in calendar with green indicator
- [ ] Status badges display correct colors and icons
- [ ] Cut-off time validation works for cancellation

## Future Enhancements

1. **Real-time Firebase Integration**: Replace time-based demo logic with actual backend updates
2. **Push Notifications**: Send notifications on status changes
3. **Live Tracking**: Show delivery person location on map during delivery
4. **Photo Proof**: Add delivery photo confirmation
5. **Rating Prompt**: Trigger rating request after "delivered" status
6. **Order History**: Show complete status timeline for each order
