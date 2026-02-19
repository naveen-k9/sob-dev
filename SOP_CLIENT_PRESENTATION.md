# Standard Operating Procedure (SOP)
## Meal Subscription Platform — Client Feature Guide

**Prepared for:** Client Presentation  
**Version:** 1.0  
**Covers:** User Subscription Journey · Kitchen Operations · Delivery Operations

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles](#2-user-roles)
3. [User Subscription Journey](#3-user-subscription-journey)
4. [Kitchen Operations (Chef Dashboard)](#4-kitchen-operations-chef-dashboard)
5. [Delivery Operations (Delivery Dashboard)](#5-delivery-operations-delivery-dashboard)
6. [Admin Control Panel](#6-admin-control-panel)
7. [Order Lifecycle — End to End](#7-order-lifecycle--end-to-end)
8. [Key Features Summary](#8-key-features-summary)

---

## 1. Platform Overview

This is a **daily meal subscription platform** built for home-cooked-style food delivery. Customers subscribe to a meal plan of their choice, choose a delivery time slot, and receive meals every day (or on their chosen days). The platform coordinates three teams in real time:

- **Customers** — subscribe, track, skip meals, and add items
- **Kitchen Staff** — cook and fulfil orders based on the day's list
- **Delivery Staff** — pick up cooked meals and deliver to customers

All three roles use the **same mobile app** — each role sees its own dashboard after login.

---

## 2. User Roles

| Role | Access | What They Do |
|---|---|---|
| **Customer** | Customer tabs (Home, Menu, Orders, Profile) | Browse meals, subscribe, manage plan, pay, track |
| **Kitchen Staff** | Kitchen Dashboard | View today's cooking list, update cooking status |
| **Delivery Person** | Delivery Dashboard | View delivery list, update delivery status, call customers |
| **Admin** | Admin Dashboard | Manage all subscriptions, users, meals, add-ons, locations, staff |

> **How roles are assigned:** On first login, a user selects their role (Customer / Kitchen / Delivery). The admin can also assign or change roles from the admin panel.

---

## 3. User Subscription Journey

### Step 1 — Discover

The **Home Screen** shows:
- Location-aware service availability check (polygon-based delivery zones)
- Promotional banners (seasonal offers, new meals)
- Meal categories (Lunch, Dinner, Diet, etc.)
- Active subscription card ("Today's Meal") with quick Add Items shortcut
- Testimonials and referral section

---

### Step 2 — Browse & Select a Meal

- Customer taps a **meal category** → sees all meals in that category
- Taps a meal → opens **Meal Detail Screen** with:
  - Photos, description, nutritional info
  - Available subscription plans (e.g., 6-Day Plan, 20-Day Plan, 30-Day Plan)
  - Add-On selection (extra items like soup, salad, dessert — with images and prices)
  - Trial mode option (50% off for first plan)

---

### Step 3 — Checkout

The **Checkout Screen** collects:

| Field | Details |
|---|---|
| **Delivery Address** | Select from saved addresses or add new (with map pin support) |
| **Delivery Time Slot** | Choose from admin-configured time slots (e.g., 12–2 PM, 7–9 PM) |
| **Start Date** | Defaults to tomorrow; can be changed |
| **Week Schedule** | Mon–Fri / Mon–Sat / Every Day |
| **Add-Ons** | Optional items added to every delivery |
| **Promo / Referral Code** | Discount codes and referral rewards |
| **Wallet Balance** | Option to apply available wallet credits |
| **Order for Someone Else** | Enter recipient's name + phone (plan is named after them) |
| **Special Instructions** | Dietary notes, gate codes, etc. |

**Payment options:**
- **Razorpay** (UPI, Credit/Debit Card, Net Banking, Wallets)
- **In-app Wallet** balance (if sufficient)
- Wallet + Razorpay combo (partial wallet, rest via Razorpay)

On success → **Acknowledgment Screen** shown with plan summary and WhatsApp confirmation message sent.

---

### Step 4 — Manage My Orders (Orders Screen)

After subscribing, the customer can view and manage all plans from the **Orders Screen**.

#### Active Plans Cards
- Each subscription shows as a card with:
  - **Plan name** (auto-named as e.g., "Priyanka's Plan 1" — long press to rename)
  - Status badge (Active / Paused / Cancelled)
  - Days total / Days remaining / Delivery time slot
  - Meal name and date range (Start → End)

#### Calendar View
- Monthly calendar showing every day color-coded:
  - 🟢 **Green** — Delivered
  - 🟣 **Purple** — Upcoming delivery
  - 🟡 **Yellow** — Weekend / vacation skip
  - ⚫ **Grey** — Skipped by customer

- Tap any date → shows the **Day Delivery Card** for that date:
  - Meal photo, name, delivery time
  - Status badge (Cooking / Ready / Out for Delivery / Delivered)
  - Add-ons with thumbnail images
  - Kitchen staff / delivery person info
  - **Two action buttons:**
    - **Skip Meal** (available until cut-off time)
    - **Add Items** (add extra items for that specific day — paid separately)

---

### Step 5 — Skip a Meal

- Customer opens the calendar, taps an upcoming date
- Taps **Skip Meal**
- System checks if the **skip cut-off time** has passed (configured by admin)
- If allowed → date is marked as skipped (grey on calendar), no delivery

---

### Step 6 — Add Items for a Day (Date-Specific Add-Ons)

- Customer taps **Add Items** on any upcoming date
- A bottom-sheet modal opens with all available add-ons (image, name, price)
- Customer selects items → sees total
- **Payment:**
  - **Pay with Wallet** — one-tap if wallet balance ≥ total; logged in wallet history
  - **UPI / Card / Net Banking** — via Razorpay
- On success → add-ons saved for that specific date, WhatsApp notification sent

---

### Step 7 — Wallet

- Each customer has an in-app **Wallet**
- Balance is shown on the Wallet screen with full transaction history
- Credits: referral rewards, admin top-ups, refunds
- Debits: add-on payments via wallet
- Wallet balance is always shown on the Checkout and Add-Ons screens

---

### Step 8 — Referrals

- Each customer gets a unique referral code
- Share with friends via WhatsApp / copy link
- When a referred friend subscribes → both get wallet credits
- Refer screen shows: referral code, share button, reward amount, referred-friend count

---

### Step 9 — Profile & Support

**Profile Screen:**
- Edit name, phone, email
- Manage saved addresses (add/edit/delete, set default)
- View wallet balance (shortcut to wallet)
- Notifications settings
- Logout

**Support:**
- Raise a support ticket with subject + description
- View ticket status and admin replies
- Option to contact nutritionist (request callback)

---

## 4. Kitchen Operations (Chef Dashboard)

The Kitchen Dashboard is designed to be used **every morning** before cooking starts.

### Dashboard Overview

The kitchen staff sees four live counter tiles at the top:

| Tile | Meaning |
|---|---|
| **Total Orders** | Number of meals to cook today |
| **Pending** | Not yet started |
| **Cooking** | In progress |
| **Ready** | Cooked and ready to pack |

A **live clock** runs at the top so staff always knows the time.

---

### Cooking List

Below the counters is the **full list of today's orders**, each showing:
- Customer name
- Meal name
- Delivery time slot
- Special instructions (dietary notes, allergies)
- Add-ons for that day
- Current status with color code

---

### Status Workflow (Per Order)

```
PENDING  →  COOKING STARTED  →  COOKING DONE  →  READY FOR DELIVERY
```

Each order card has a single action button that advances the status:

| Current Status | Button | Next Status |
|---|---|---|
| Pending | Start Cooking | Cooking Started |
| Cooking Started | Mark Cooking Done | Cooking Done |
| Cooking Done | Ready for Delivery | Ready for Delivery |

> Status updates sync instantly to Firebase and are visible to the delivery team and admin in real time.

---

### Bulk Actions

For efficiency, the kitchen staff can update **all orders at once**:
- **Mark All: Cooking Started** — start of morning shift
- **Mark All: Cooking Done** — when all meals are cooked
- **Mark All: Ready for Delivery** — when all meals are packed

---

### CSV Export (Procurement Planning)

Two CSV export buttons for the kitchen manager:

| Export | Contents |
|---|---|
| **Initial Requirements CSV** | Snapshot of today's orders as loaded at start of day (before any skips/additions) |
| **Final Revised List CSV** | Current list after all customer skips and last-minute add-ons |

CSV format: `Meal, Quantity, Add-Ons`  
Used for raw material planning, vendor orders, and record keeping.

---

### Role Switching (RoleSelector)

Kitchen staff can switch their view between Kitchen / Delivery / Customer without logging out — useful for multi-role staff.

---

## 5. Delivery Operations (Delivery Dashboard)

The Delivery Dashboard is used by the **delivery person** to manage all deliveries for the day.

### Dashboard Overview

Four counter tiles at the top:

| Tile | Meaning |
|---|---|
| **Total Deliveries** | All deliveries assigned today |
| **Pending** | Not yet delivered |
| **Completed** | Successfully delivered |
| **Total Value** | Combined order value for the day (₹) |

---

### Delivery List

Each delivery card shows:
- Customer name + phone number
- Delivery address (formatted: Street, City - Pincode)
- Meal name + delivery time slot
- Current status with color-coded badge
- Order value + payment status (Paid / Pending)
- Special instructions (if any)

---

### Status Workflow (Per Delivery)

```
PACKAGING  →  PACKAGING DONE  →  DELIVERY STARTED  →  REACHED  →  DELIVERY DONE
```

| Current Status | Button | Next Status |
|---|---|---|
| Packaging | Packaging Done | Packaging Done |
| Packaging Done | Start Delivery | Delivery Started |
| Delivery Started | Reached Destination | Reached |
| Reached | Mark Delivered | Delivery Done |

> Each status update requires a **confirmation tap** to prevent accidental changes.  
> Statuses sync to Firebase in real time — customer and admin see live updates.

---

### Quick Actions on Each Order

| Button | Action |
|---|---|
| 📞 **Call** | Opens phone dialler with customer's number pre-filled |
| 📍 **Navigate** | Opens Google Maps with the delivery address |

---

### Acknowledgment by Customer (Optional)

After reaching the customer, the delivery person can request a **digital acknowledgment** — the customer signs off on delivery from their phone.

---

## 6. Admin Control Panel

The Admin Dashboard provides full operational control. Key sections:

### Subscriptions Management
- View all subscriptions (filter by status: Active / Paused / Cancelled / Completed)
- Search by customer name, phone, or subscription ID
- Quick-edit status inline or open full edit screen
- Full Subscription Edit: change meal, plan, dates, delivery time, weekdays, amount, add-ons, assigned kitchen/delivery staff

### Manual Subscription Creation
- Admin can create a subscription on behalf of a customer (phone/counter orders)

### Users & Staff
- View all users
- Assign roles (Customer / Kitchen / Delivery / Admin)
- View user wallet balance and transaction history

### Meals & Add-Ons
- Add / edit / deactivate meals (with images, price, nutritional info, categories)
- Add / edit / deactivate add-on items
- Manage meal categories

### Location & Delivery Zones
- Define serviceable areas using **polygon drawing on map**
- Add / remove / activate delivery polygons
- Handle service area requests from new customers outside current zones

### App Settings
- Configure cut-off times (order cutoff, skip cutoff, add-on cutoff)
- Delivery fee, free delivery threshold, minimum order amount
- Kitchen start time, delivery start time
- Support phone, email, WhatsApp number

### Promotions & Content
- Upload banners (promotional images shown on home screen)
- Create and manage offer codes (% discount, flat discount)
- Manage testimonials (customer reviews shown on home)
- Push notification center (broadcast to all users or specific segments)

### Support Tickets
- View all customer support tickets
- Reply to tickets, update status (Open / In Progress / Resolved)
- View nutritionist contact requests

---

## 7. Order Lifecycle — End to End

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE ORDER LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────────────┘

CUSTOMER           SYSTEM              KITCHEN             DELIVERY
   │                  │                   │                   │
   │  Subscribes +    │                   │                   │
   │  Pays ──────────►│ Creates           │                   │
   │                  │ Subscription      │                   │
   │                  │ in Firebase       │                   │
   │                  │                   │                   │
   │  (Morning of     │                   │                   │
   │   delivery day)  │                   │                   │
   │                  │──────────────────►│ Loads cooking     │
   │                  │                   │ list for today    │
   │                  │                   │                   │
   │  Can Skip ──────►│ Marks date        │                   │
   │  (before cutoff) │ as skipped        │ Skipped order     │
   │                  │                   │ removed from list │
   │                  │                   │                   │
   │  Can Add Items ─►│ Payment           │                   │
   │  (before cutoff) │ processed         │ Add-on appears    │
   │                  │                   │ on order card     │
   │                  │                   │                   │
   │                  │                   │ Starts Cooking ──►│
   │                  │                   │ [COOKING STARTED] │
   │                  │                   │                   │
   │                  │                   │ Cooking Done ────►│
   │                  │                   │ [COOKING DONE]    │
   │                  │                   │                   │
   │                  │                   │ Ready for ───────►│ Sees order
   │                  │                   │ Delivery          │ as PACKAGING
   │                  │                   │ [READY]           │
   │                  │                   │                   │ Packs →
   │                  │                   │                   │ [PACKAGING DONE]
   │                  │                   │                   │
   │                  │                   │                   │ Picks up →
   │                  │                   │                   │ [DELIVERY STARTED]
   │◄─────────────────│                   │                   │
   │ Customer sees    │                   │                   │
   │ "Out for Del."   │                   │                   │
   │                  │                   │                   │ Reached →
   │                  │                   │                   │ [REACHED]
   │                  │                   │                   │
   │                  │                   │                   │ Delivers →
   │◄─────────────────│                   │                   │ [DELIVERY DONE]
   │ Calendar shows   │                   │                   │
   │ GREEN (Delivered)│                   │                   │
   │                  │                   │                   │
```

---

## 8. Key Features Summary

### For Customers
| Feature | Description |
|---|---|
| Plan Subscription | Multiple duration plans (6 / 20 / 30 days etc.) |
| Flexible Schedule | Mon–Fri, Mon–Sat, or Every Day |
| Skip Meals | Skip any upcoming delivery before cut-off |
| Date-Specific Add-Ons | Add extra items for specific days |
| Dual Payment | Wallet or Razorpay (UPI/Card/Net Banking) |
| Plan Renaming | Custom plan names (long press to edit) |
| Calendar Tracking | Visual calendar with color-coded delivery status |
| Wallet | In-app credits with full transaction history |
| Referrals | Earn wallet credits for referring friends |
| Order for Others | Subscribe on behalf of someone else (named plan) |
| Real-Time Status | Live cooking and delivery status updates |
| Support Tickets | In-app support chat with the team |

### For Kitchen
| Feature | Description |
|---|---|
| Today's Cooking List | Auto-generated from all active subscriptions |
| Status Tracking | Pending → Cooking → Done → Ready |
| Bulk Status Update | Update all orders at once with one tap |
| Add-On Visibility | See all per-date add-ons on each order card |
| CSV Export | Initial requirements + final revised list for procurement |
| Real-Time Sync | Statuses sync live to Firebase |

### For Delivery
| Feature | Description |
|---|---|
| Day's Delivery List | All active subscriptions for today |
| Step-by-Step Status | Packaging → Delivery Started → Reached → Done |
| One-Tap Call | Direct phone dialler from order card |
| One-Tap Navigate | Opens Google Maps for the address |
| Payment Visibility | See paid vs pending for each order |
| Live Sync | All status updates sync instantly |

### For Admin
| Feature | Description |
|---|---|
| Full Subscription CRUD | Create, read, update, cancel any subscription |
| Manual Subscriptions | Create orders from counter/phone |
| Staff Management | Assign kitchen / delivery roles |
| Delivery Zone Drawing | Draw polygon zones on live map |
| Cut-Off Time Config | Set skip, add-on, order cut-off times |
| Push Notifications | Broadcast messages to users |
| Banners & Offers | Manage promotional content |
| Support Management | View and reply to tickets |

---

*End of SOP — Version 1.0*

> **Note for Presenter:** Walk through Section 7 (the lifecycle diagram) as the central narrative. Start with a customer placing an order, follow it through the kitchen, then delivery, back to the customer seeing "Delivered." All other sections are supporting detail for Q&A.
