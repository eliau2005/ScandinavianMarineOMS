# Quick Start Guide - Price List System

## 🚀 Get Up and Running in 30 Minutes

This guide will get your Price List Management System operational quickly.

---

## Step 1: Verify Installation (2 minutes)

The required libraries are already installed. Verify by running:

```bash
npm list @tanstack/react-table zod jspdf
```

You should see all packages listed. ✅

---

## Step 2: Set Up Appwrite Collections (20 minutes)

### Open Appwrite Console

1. Go to your Appwrite Console: https://cloud.appwrite.io
2. Select your project: **Scandinavian Marine OMS**
3. Navigate to **Databases** → Select your database

### Create Collections (Quick Method)

#### Collection 1: `product_categories`

1. Click **Create Collection**
2. **Collection ID**: `product_categories`
3. **Permissions**:
   - Read: `role:supplier`, `role:customer`, `role:admin`
   - Create/Update/Delete: `role:admin`
4. **Attributes**:
   ```
   name          | String  | 255  | Required
   display_order | Integer |      | Required | Default: 0
   icon          | String  | 100  | Optional
   description   | String  | 500  | Optional
   is_active     | Boolean |      | Required | Default: true
   ```

#### Collection 2: `products`

1. Click **Create Collection**
2. **Collection ID**: `products`
3. **Permissions**:
   - Read: `role:supplier`, `role:customer`, `role:admin`
   - Create/Update/Delete: `role:admin`, `role:supplier`
4. **Attributes**:
   ```
   category_id      | String  | 255 | Required
   name             | String  | 255 | Required
   base_name        | String  | 255 | Required
   trim_type        | String  | 50  | Optional
   size_range       | String  | 100 | Optional
   weight_unit      | String  | 20  | Required | Default: "kg"
   skin_type        | String  | 100 | Optional
   packaging_type   | String  | 50  | Optional
   attributes       | String  | 500 | Optional
   display_order    | Integer |     | Required | Default: 0
   is_active        | Boolean |     | Required | Default: true
   sku              | String  | 100 | Optional
   ```

#### Collection 3: `price_lists`

1. Click **Create Collection**
2. **Collection ID**: `price_lists`
3. **Permissions**:
   - Read: `role:supplier`, `role:customer`, `role:admin`
   - Create/Update/Delete: `role:supplier`, `role:admin`
4. **Attributes**:
   ```
   name            | String   | 255  | Required
   supplier_id     | String   | 255  | Required
   supplier_name   | String   | 255  | Required
   effective_date  | DateTime |      | Required
   expiry_date     | DateTime |      | Optional
   status          | String   | 50   | Required | Default: "draft"
   notes           | String   | 1000 | Optional
   is_default      | Boolean  |      | Required | Default: false
   created_by      | String   | 255  | Required
   ```

#### Collection 4: `price_list_items`

1. Click **Create Collection**
2. **Collection ID**: `price_list_items`
3. **Permissions**:
   - Read: `role:supplier`, `role:customer`, `role:admin`
   - Create/Update/Delete: `role:supplier`, `role:admin`
4. **Attributes**:
   ```
   price_list_id  | String  | 255 | Required
   product_id     | String  | 255 | Required
   price_box      | Float   |     | Required
   price_box_vac  | Float   |     | Optional
   vac_surcharge  | Float   |     | Optional
   currency       | String  | 10  | Required | Default: "EUR"
   min_quantity   | Integer |     | Optional
   max_quantity   | Integer |     | Optional
   is_available   | Boolean |     | Required | Default: true
   notes          | String  | 500 | Optional
   ```

---

## Step 3: Add Environment Variables (1 minute)

Add to your `.env` file:

```env
VITE_PRICE_LISTS_COLLECTION_ID=price_lists
VITE_PRODUCT_CATEGORIES_COLLECTION_ID=product_categories
VITE_PRODUCTS_COLLECTION_ID=products
VITE_PRICE_LIST_ITEMS_COLLECTION_ID=price_list_items
```

---

## Step 4: Seed Sample Data (5 minutes)

### Add Categories

In Appwrite Console → `product_categories` collection:

| name | display_order | is_active |
|------|---------------|-----------|
| Salmon | 1 | true |
| Cod | 2 | true |
| Turbot | 3 | true |
| Doversoles | 4 | true |
| Red Mullet | 5 | true |

### Add Sample Products

In Appwrite Console → `products` collection:

Example for Salmon:
```
category_id: [ID of Salmon category]
name: Salmonfillet Trim A 1000/1400 SCALED PBI
base_name: Salmon Fillet
trim_type: A
size_range: 1000/1400
weight_unit: kg
skin_type: SCALED
packaging_type: PBI
display_order: 1
is_active: true
```

Add 5-10 products to start. You can add more later.

---

## Step 5: Test the System (2 minutes)

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Log in as a supplier** (create a supplier account if needed)

3. **Navigate to**: Supplier Portal → Price List Management

4. **You should see**:
   - Empty state with "No price lists yet"
   - "New Price List" button

5. **Click "New Price List"**:
   - Name: "Test Price List"
   - Effective Date: Today
   - Click "Create"

6. **You should now see**:
   - Your products in the table
   - Empty price fields
   - "Save Prices" button

7. **Add some prices** and click "Save Prices"

8. **Export to PDF** to verify PDF generation works

---

## ✅ You're Done!

Your Price List Management System is now operational.

---

## Next Steps

### Customize Products

Add products matching your actual inventory:
- Go to Appwrite → `products` collection
- Add products with correct attributes
- Link to appropriate categories

### Create Real Price Lists

- Create price lists for each week/month
- Set appropriate effective dates
- Activate price lists when ready

### Share with Customers

Once active, customers can view price lists through their portal (feature to be implemented).

---

## Common Issues

### "Failed to load price lists"
- **Check**: Appwrite credentials in `.env`
- **Check**: Collection IDs match environment variables
- **Check**: Permissions are set correctly

### "No products showing"
- **Check**: Products exist in `products` collection
- **Check**: Products are marked as `is_active: true`
- **Check**: Categories exist and are linked

### PDF export not working
- **Check**: Browser console for errors
- **Check**: Price list has at least one item with prices

---

## Need Help?

1. **Check the complete docs**: `PRICE_LIST_SYSTEM_README.md`
2. **Check Appwrite setup**: `APPWRITE_PRICE_LIST_SETUP.md`
3. **Check implementation details**: `IMPLEMENTATION_SUMMARY.md`

---

**Estimated Setup Time**: 30 minutes
**Difficulty**: Easy (just follow the steps)
**Result**: Fully functional price list system
