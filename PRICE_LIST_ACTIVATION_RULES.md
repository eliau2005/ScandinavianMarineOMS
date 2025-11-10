# Price List Activation Rules

## Business Logic Overview

Each supplier can only have **ONE active price list** displayed to customers at any given time. This ensures clarity for customers and prevents confusion about which prices are current.

---

## Rules for Price List Status

### 1. **Draft Status**
- Default status when a price list is created
- **Fully editable** - suppliers can change dates, prices, and all other fields
- Not visible to customers
- Suppliers can prepare future price lists in draft mode
- No restrictions on the number of draft price lists
- Can be deleted if no longer needed

### 2. **Active Status**
- **Only ONE price list can be active per supplier at a time**
- Visible to customers for placing orders
- Cannot be activated until ALL active products have prices
- When activating a new price list, the previously active one is automatically archived
- **Cannot be edited** once active (prices can be updated in-place, but dates cannot be changed)
- Cannot be deleted while active

### 3. **Archived Status**
- Not visible to customers
- Cannot be edited (read-only)
- Automatically applied to the previous active price list when a new one is activated
- Can be manually set by supplier to retire a price list

---

## Activation Requirements

Before a price list can be activated, the system validates:

### ✅ All Active Products Must Have Prices

The system checks that every product marked as "active" has a price entry in the price list being activated.

**Validation Logic:**
```
1. Get all products where is_active = true
2. Get all price list items for this price list
3. Check if every active product has a corresponding price list item
4. If any active products are missing prices, activation is blocked
```

**Error Message Example:**
```
Cannot activate price list. The following active products do not have prices:
Salmon, Cod, Tuna
```

### ✅ Only One Active Price List Per Supplier

When activating a price list:
```
1. System checks for any existing active price lists from this supplier
2. If found, automatically changes their status to "archived"
3. Then activates the new price list
```

This happens automatically - the supplier doesn't need to manually archive the old price list first.

---

## Workflow Examples

### Example 1: Activating First Price List

**Scenario:** Supplier has no active price list yet

1. Supplier creates a new price list (status: draft)
2. Adds prices for all active products
3. Clicks "Set Active"
4. System validates all active products have prices ✅
5. Price list becomes active ✅
6. Customers can now see this price list and place orders

---

### Example 2: Activating New Price List (Replacing Current)

**Scenario:** Supplier already has an active price list

**Current State:**
- Price List A: status = "active" (for week of Jan 1-7)

**Action:**
1. Supplier creates Price List B (status: draft) for week of Jan 8-14
2. Adds prices for all active products
3. Clicks "Set Active" on Price List B
4. System validates all active products have prices ✅
5. System automatically archives Price List A ✅
6. Price List B becomes active ✅
7. Customers now see Price List B instead of A

**Final State:**
- Price List A: status = "archived"
- Price List B: status = "active"

---

### Example 3: Activation Blocked - Missing Prices

**Scenario:** Trying to activate incomplete price list

1. Supplier creates a new price list (status: draft)
2. Adds prices for only 15 out of 20 active products
3. Clicks "Set Active"
4. System validates prices ❌
5. **Activation blocked** with error message:
   ```
   Cannot activate price list. 5 active products do not have prices
   (Tuna, Mackerel, Herring and 2 more)
   ```
6. Price list remains in draft status
7. Supplier must add missing prices before activation

---

### Example 4: Preparing Future Price Lists

**Scenario:** Supplier wants to prepare next week's prices

**Current State:**
- Price List A: status = "active" (current week)

**Action:**
1. Supplier creates Price List B (status: draft) for next week
2. Adds prices for all products
3. **Leaves it in draft status** until ready
4. When the time comes, clicks "Set Active"
5. Price List B becomes active, Price List A gets archived

**Benefits:**
- Can prepare prices in advance
- No rush to complete all prices immediately
- Can review and adjust before making active

---

## UI Indicators

### Price List Card - Status Badges

**Draft (Yellow):**
```
🟡 Draft
```
- Shows "Edit" button - can change dates, prices, all fields
- Shows "Set Active" button
- Shows "Delete" button
- Shows "Duplicate" button

**Active (Green):**
```
🟢 Active
```
- No "Edit" button (dates are locked once active)
- Shows "View" button to see/update prices inline
- Shows "Duplicate" button to create a new draft based on this one
- Cannot be deleted while active

**Archived (Gray):**
```
⚫ Archived
```
- Shows "View" button only
- Read-only, cannot be edited or deleted

---

## Technical Implementation

### Service Method: `priceListService.activate(id)`

**What it does:**
1. Validates all active products have prices in this price list
2. Archives any currently active price lists for this supplier
3. Sets the target price list status to "active"

**Error Handling:**
- Throws descriptive error if products are missing prices
- Lists up to 3 product names in error message
- Transaction-safe: if activation fails, no changes are made

**Code Location:**
- Service: `lib/priceListService.ts` → `activate()` method
- Component: `components/dashboards/supplier/PriceListManagement.tsx` → `handleSetActive()`

---

## Benefits of This Approach

### For Suppliers:
- ✅ Clear workflow for managing price lists
- ✅ Can prepare future price lists without affecting current pricing
- ✅ System prevents accidentally publishing incomplete price lists
- ✅ Automatic archiving - no manual cleanup needed

### For Customers:
- ✅ Always see only one current, complete price list
- ✅ No confusion about which prices are valid
- ✅ Confidence that all products have defined prices

### For System:
- ✅ Data integrity enforced at service layer
- ✅ Single source of truth for current pricing
- ✅ Clear audit trail (draft → active → archived)
- ✅ Prevents invalid states

---

## Future Enhancements (Optional)

### Scheduling:
- Add `activation_date` field to price lists
- Automatically activate price list on specified date
- Send notification to supplier when activation occurs

### Batch Pricing:
- Import prices from CSV
- Copy prices from previous price list
- Apply percentage increase/decrease to all prices

### Notifications:
- Alert supplier when price list is about to expire
- Remind supplier to prepare next week's price list
- Notify customers when new prices are available

---

**Last Updated:** 2025
**Version:** 1.0 (Single Active Price List System)
