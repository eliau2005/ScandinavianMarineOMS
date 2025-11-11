# Product System Update - Database Setup Guide

This document provides step-by-step instructions for updating the Appwrite database to support the simplified product management system.

## Overview of Changes

The product and category system has been simplified to focus on core functionality:

### What Changed:
- **Categories**: Now only control VAC pricing and organize products into separate tables
- **Products**: Simplified to just name and unit of measure
- **Units of Measure**: New customizable system per supplier
- **VAC Pricing**: Controlled at category level instead of per item

---

## Step 1: Create Units of Measure Collection

### 1.1 Create New Collection

1. Go to your Appwrite Console → Databases → Your Database
2. Click "Add Collection"
3. **Collection ID**: `units_of_measure`
4. **Collection Name**: Units of Measure
5. Click "Create"

### 1.2 Add Attributes

Add the following attributes to the `units_of_measure` collection:

| Attribute Key | Type | Size | Required | Default | Description |
|--------------|------|------|----------|---------|-------------|
| `supplier_id` | String | 100 | ✅ Yes | - | Supplier who owns this unit |
| `supplier_name` | String | 255 | ✅ Yes | - | Supplier name for display |
| `unit_name` | String | 50 | ✅ Yes | - | Unit name (e.g., "box", "kg", "piece") |
| `is_default` | Boolean | - | ✅ Yes | `false` | Whether this is the default unit |
| `display_order` | Integer | - | ❌ No | `0` | Display order in dropdown |
| `is_active` | Boolean | - | ✅ Yes | `true` | Whether unit is active |

### 1.3 Create Indexes

1. **Index on supplier_id**:
   - Key: `supplier_id_idx`
   - Type: Key
   - Attributes: `supplier_id` (ASC)

2. **Unique index on supplier + unit**:
   - Key: `supplier_unit_unique`
   - Type: Unique
   - Attributes: `supplier_id` (ASC), `unit_name` (ASC)

### 1.4 Set Permissions

Use the same permissions as other collections (e.g., "users" with application-layer authorization)

### 1.5 Insert Default Data

For each existing supplier, insert a default "box" unit:

```javascript
{
  supplier_id: "<supplier_id>",
  supplier_name: "<supplier_name>",
  unit_name: "box",
  is_default: true,
  display_order: 0,
  is_active: true
}
```

**Note**: The application will automatically create the default "box" unit when suppliers first access the product management page.

---

## Step 2: Update Product Categories Collection

### 2.1 Add enable_vac_pricing Attribute

1. Go to `product_categories` collection
2. Click "Add Attribute"
3. Select "Boolean"
4. **Attribute Key**: `enable_vac_pricing`
5. **Required**: Yes
6. **Default**: `false`
7. Click "Create"

### 2.2 Existing Data

All existing categories will have `enable_vac_pricing = false` by default. You'll need to manually enable VAC pricing for relevant categories through the UI after the update.

---

## Step 3: Update Products Collection

### 3.1 Create New Attribute: unit_of_measure

1. Go to `products` collection
2. Click "Add Attribute"
3. Select "String"
4. **Attribute Key**: `unit_of_measure`
5. **Size**: 50
6. **Required**: Yes
7. **Default**: `box`
8. Click "Create"

### 3.2 Migrate Existing Data

If you have existing products with `weight_unit`:

**Option A**: Manual migration via Appwrite Console
1. Export all documents from `products` collection
2. For each document, copy the value from `weight_unit` to `unit_of_measure`
3. Update all documents

**Option B**: Use Appwrite API script
```javascript
// Script to migrate weight_unit to unit_of_measure
const { databases } = require('./lib/appwrite');

async function migrateProducts() {
  const products = await databases.listDocuments(
    'DATABASE_ID',
    'products',
    []
  );

  for (const product of products.documents) {
    const unit = product.weight_unit === 'gr' ? 'kg' : product.weight_unit;
    await databases.updateDocument(
      'DATABASE_ID',
      'products',
      product.$id,
      { unit_of_measure: unit }
    );
  }
}
```

### 3.3 Delete Old Attributes

After confirming the migration worked, delete these attributes:

1. `base_name` - No longer used
2. `trim_type` - No longer used
3. `size_range` - No longer used
4. `skin_type` - No longer used
5. `packaging_type` - No longer used
6. `attributes` - No longer used
7. `sku` - No longer used
8. `weight_unit` - Replaced by `unit_of_measure`

**⚠️ Warning**: Make sure to backup your database before deleting attributes!

**To delete an attribute**:
1. Go to the attribute in Appwrite Console
2. Click the three dots (⋮)
3. Select "Delete"
4. Confirm deletion

---

## Step 4: Update Orders Collection

### 4.1 Delete requested_delivery_date

1. Go to `orders` collection
2. Find `requested_delivery_date` attribute
3. Click the three dots (⋮) → Delete

### 4.2 Add delivery_start_date

1. Click "Add Attribute"
2. Select "String"
3. **Attribute Key**: `delivery_start_date`
4. **Size**: 50
5. **Required**: Yes
6. Click "Create"

### 4.3 Add delivery_end_date

1. Click "Add Attribute"
2. Select "String"
3. **Attribute Key**: `delivery_end_date`
4. **Size**: 50
5. **Required**: Yes
6. Click "Create"

### 4.4 Migrate Existing Orders (if any)

If you have existing orders with `requested_delivery_date`:

```javascript
// Before deleting requested_delivery_date, migrate the data
const orders = await databases.listDocuments('DATABASE_ID', 'orders', []);

for (const order of orders.documents) {
  if (order.requested_delivery_date) {
    await databases.updateDocument(
      'DATABASE_ID',
      'orders',
      order.$id,
      {
        delivery_start_date: order.requested_delivery_date,
        delivery_end_date: order.requested_delivery_date
      }
    );
  }
}
```

---

## Step 5: Update Price Lists Collection

### 5.1 Make expiry_date Required

1. Go to `price_lists` collection
2. Find `expiry_date` attribute
3. Click to edit it
4. **Required**: Change to Yes
5. Save

**⚠️ Warning**: Before making this required, ensure all existing price lists have an `expiry_date` value!

### 5.2 Update Existing Price Lists

If you have price lists with `null` expiry_date:

```javascript
const priceLists = await databases.listDocuments('DATABASE_ID', 'price_lists', []);

for (const priceList of priceLists.documents) {
  if (!priceList.expiry_date) {
    // Set expiry date to 7 days after effective date
    const effectiveDate = new Date(priceList.effective_date);
    const expiryDate = new Date(effectiveDate);
    expiryDate.setDate(expiryDate.getDate() + 7);

    await databases.updateDocument(
      'DATABASE_ID',
      'price_lists',
      priceList.$id,
      {
        expiry_date: expiryDate.toISOString()
      }
    );
  }
}
```

---

## Step 6: Update Environment Variables

Add the new collection ID to your `.env` file:

```env
VITE_APPWRITE_UNITS_OF_MEASURE_COLLECTION_ID=units_of_measure
```

---

## Step 7: Verification Checklist

After completing all updates, verify:

- [ ] `units_of_measure` collection created with all attributes
- [ ] Indexes created on `units_of_measure`
- [ ] `product_categories` has `enable_vac_pricing` attribute
- [ ] `products` has `unit_of_measure` attribute
- [ ] Old product attributes deleted (`base_name`, `trim_type`, etc.)
- [ ] `orders` has `delivery_start_date` and `delivery_end_date`
- [ ] `orders` no longer has `requested_delivery_date`
- [ ] `price_lists` `expiry_date` is required
- [ ] All existing price lists have `expiry_date` values
- [ ] Environment variable added for units collection
- [ ] Application starts without errors

---

## Summary of Database Changes

### Collections Modified:

| Collection | Changes |
|------------|---------|
| `product_categories` | **Added**: `enable_vac_pricing` (Boolean) |
| `products` | **Added**: `unit_of_measure` (String)<br>**Deleted**: `base_name`, `trim_type`, `size_range`, `skin_type`, `packaging_type`, `attributes`, `sku`, `weight_unit` |
| `units_of_measure` | **NEW COLLECTION** with 6 attributes |
| `price_lists` | **Updated**: `expiry_date` now required |
| `orders` | **Added**: `delivery_start_date`, `delivery_end_date`<br>**Deleted**: `requested_delivery_date` |

### Total Changes:
- **1 new collection** created
- **4 attributes added**
- **9 attributes removed**
- **1 attribute requirement changed**
- **1 environment variable added**

---

## Rollback Plan (if needed)

If you need to rollback these changes:

1. **Do NOT delete** the old attributes immediately - wait until you've tested the new system
2. Keep a backup of your database before making changes
3. Document the state of existing data before migration
4. Test with a copy of the production database first

---

## Next Steps

After completing the database setup:

1. Deploy the updated code
2. Test product creation with new UI
3. Test creating custom units of measure
4. Enable VAC pricing for relevant categories
5. Test price list creation with auto-generated names
6. Test order placement with delivery windows

---

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Confirm all database attributes match this guide
4. Check Appwrite logs for permission errors

---

**Last Updated**: 2025
**Version**: 2.0 (Simplified Product System)
