# Appwrite Database Setup for Price List System

This document contains step-by-step instructions for setting up the Appwrite database collections required for the Price List Management system.

## Collections Overview

You need to create **4 collections** in your Appwrite database:

1. **price_lists** - Main price list documents
2. **product_categories** - Fish/product categories (Salmon, Cod, etc.)
3. **products** - Individual products with attributes
4. **price_list_items** - Prices for specific products in a price list

---

## Collection 1: `price_lists`

### Collection Settings
- **Collection ID**: `price_lists`
- **Collection Name**: Price Lists
- **Permissions**:
  - Read: `role:supplier`, `role:customer`, `role:admin`
  - Create/Update/Delete: `role:supplier`, `role:admin`

### Attributes

| Attribute Name | Type | Size | Required | Default | Array | Description |
|---------------|------|------|----------|---------|-------|-------------|
| `name` | String | 255 | Yes | - | No | Price list name (e.g., "Weekly Price List 12-11-2025") |
| `supplier_id` | String | 255 | Yes | - | No | User ID of the supplier who owns this list |
| `supplier_name` | String | 255 | Yes | - | No | Name of the supplier company |
| `effective_date` | DateTime | - | Yes | - | No | When this price list becomes effective |
| `expiry_date` | DateTime | - | No | - | No | When this price list expires (optional) |
| `status` | String | 50 | Yes | `draft` | No | Status: `draft`, `active`, `archived` |
| `notes` | String | 1000 | No | - | No | Internal notes about this price list |
| `is_default` | Boolean | - | Yes | `false` | No | Whether this is the default price list for the supplier |
| `created_by` | String | 255 | Yes | - | No | User ID who created this price list |

### Indexes
- **Index 1**: `supplier_id` (ascending) - for querying by supplier
- **Index 2**: `status` (ascending) - for filtering active/draft lists
- **Index 3**: `effective_date` (descending) - for sorting by date

---

## Collection 2: `product_categories`

### Collection Settings
- **Collection ID**: `product_categories`
- **Collection Name**: Product Categories
- **Permissions**:
  - Read: `role:supplier`, `role:customer`, `role:admin`
  - Create/Update/Delete: `role:admin`

### Attributes

| Attribute Name | Type | Size | Required | Default | Array | Description |
|---------------|------|------|----------|---------|-------|-------------|
| `name` | String | 255 | Yes | - | No | Category name (e.g., "Salmon", "Cod", "Turbot") |
| `display_order` | Integer | - | Yes | `0` | No | Order in which to display categories |
| `icon` | String | 100 | No | - | No | Material icon name for UI |
| `description` | String | 500 | No | - | No | Category description |
| `is_active` | Boolean | - | Yes | `true` | No | Whether this category is active |

### Indexes
- **Index 1**: `display_order` (ascending) - for ordering categories
- **Index 2**: `name` (ascending) - for searching by name

---

## Collection 3: `products`

### Collection Settings
- **Collection ID**: `products`
- **Collection Name**: Products
- **Permissions**:
  - Read: `role:supplier`, `role:customer`, `role:admin`
  - Create/Update/Delete: `role:admin`, `role:supplier`

### Attributes

| Attribute Name | Type | Size | Required | Default | Array | Description |
|---------------|------|------|----------|---------|-------|-------------|
| `category_id` | String | 255 | Yes | - | No | Reference to product_categories collection |
| `name` | String | 255 | Yes | - | No | Product name (e.g., "Salmonfillet Trim A 1000/1400 SCALED PBI") |
| `base_name` | String | 255 | Yes | - | No | Base product name (e.g., "Salmon Fillet") |
| `trim_type` | String | 50 | No | - | No | Trim type: `A`, `B`, `D`, `E` (for salmon) |
| `size_range` | String | 100 | No | - | No | Size range (e.g., "1000/1400", "2-3", "300/+") |
| `weight_unit` | String | 20 | Yes | `kg` | No | Unit: `kg`, `gr` |
| `skin_type` | String | 100 | No | - | No | Skin type (e.g., "SCALED", "SILVERSKIN", "DEEPSKIN", "Skin On", "Skinless") |
| `packaging_type` | String | 50 | No | - | No | Packaging: `PBI`, `PBO`, `SUP`, etc. |
| `attributes` | String | 500 | No | - | No | JSON string for additional attributes |
| `display_order` | Integer | - | Yes | `0` | No | Order within category |
| `is_active` | Boolean | - | Yes | `true` | No | Whether this product is available |
| `sku` | String | 100 | No | - | No | Stock Keeping Unit (optional) |

### Indexes
- **Index 1**: `category_id` (ascending) - for querying by category
- **Index 2**: `name` (ascending) - for searching products
- **Index 3**: `is_active` (ascending) - for filtering active products

---

## Collection 4: `price_list_items`

### Collection Settings
- **Collection ID**: `price_list_items`
- **Collection Name**: Price List Items
- **Permissions**:
  - Read: `role:supplier`, `role:customer`, `role:admin`
  - Create/Update/Delete: `role:supplier`, `role:admin`

### Attributes

| Attribute Name | Type | Size | Required | Default | Array | Description |
|---------------|------|------|----------|---------|-------|-------------|
| `price_list_id` | String | 255 | Yes | - | No | Reference to price_lists collection |
| `product_id` | String | 255 | Yes | - | No | Reference to products collection |
| `price_box` | Float | - | Yes | - | No | Base price per box/kg |
| `price_box_vac` | Float | - | No | - | No | Price for vacuum packed (if applicable) |
| `vac_surcharge` | Float | - | No | - | No | Vacuum packing surcharge amount (e.g., 0.70, 1.00) |
| `currency` | String | 10 | Yes | `EUR` | No | Currency code |
| `min_quantity` | Integer | - | No | - | No | Minimum order quantity |
| `max_quantity` | Integer | - | No | - | No | Maximum order quantity |
| `is_available` | Boolean | - | Yes | `true` | No | Whether this item is currently available |
| `notes` | String | 500 | No | - | No | Special notes for this item |

### Indexes
- **Index 1**: `price_list_id` (ascending) - for querying items in a price list
- **Index 2**: `product_id` (ascending) - for finding prices for a product
- **Index 3**: Compound: `price_list_id` + `product_id` - for fast lookups

---

## Step-by-Step Creation Instructions

### 1. Log into Appwrite Console
1. Go to your Appwrite Console (https://cloud.appwrite.io or your self-hosted URL)
2. Select your project: **Scandinavian Marine OMS**
3. Navigate to **Databases** in the left sidebar
4. Select your database (or create one if you haven't already)

### 2. Create Collections

For each collection above:

#### Step 2.1: Create the Collection
1. Click **"Create Collection"**
2. Enter the **Collection ID** exactly as specified (e.g., `price_lists`)
3. Enter the **Collection Name**
4. Click **"Create"**

#### Step 2.2: Set Permissions
1. Click on the newly created collection
2. Go to the **"Settings"** tab
3. Scroll to **"Permissions"**
4. Click **"Add Role"**
5. Add permissions as specified in each collection's settings:
   - For **Read**: Add `role:supplier`, `role:customer`, `role:admin`
   - For **Create**: Add `role:supplier`, `role:admin` (varies by collection)
   - For **Update**: Add `role:supplier`, `role:admin` (varies by collection)
   - For **Delete**: Add `role:admin` (or as specified)

#### Step 2.3: Add Attributes
1. Go to the **"Attributes"** tab
2. Click **"Create Attribute"**
3. For each attribute in the table:
   - Select the **Type** (String, Integer, Float, Boolean, DateTime)
   - Enter the **Attribute Key** (exact name from table)
   - Set the **Size** (for String types)
   - Check **Required** if marked "Yes"
   - Set **Default Value** if specified
   - Check **Array** if marked "Yes"
   - Click **"Create"**
4. Wait for each attribute to finish creating before adding the next

#### Step 2.4: Create Indexes
1. Go to the **"Indexes"** tab
2. Click **"Create Index"**
3. For each index listed:
   - Enter an **Index Key** (e.g., `supplier_id_index`)
   - Select the **Attribute** to index
   - Choose **Order**: Ascending or Descending
   - For compound indexes, add multiple attributes
   - Click **"Create"**

### 3. Verify Collections

After creating all collections, verify:
- [ ] All 4 collections are created
- [ ] Each collection has all attributes
- [ ] Permissions are set correctly
- [ ] Indexes are created

---

## Sample Data Structure

### Example Price List Document
```json
{
  "$id": "unique_id_here",
  "name": "Weekly Price List 12-11-2025",
  "supplier_id": "supplier_user_id",
  "supplier_name": "Day2Day Fresh and Frozen Fish Products",
  "effective_date": "2025-11-12T00:00:00.000Z",
  "expiry_date": null,
  "status": "active",
  "notes": "Standard weekly pricing",
  "is_default": true,
  "created_by": "supplier_user_id"
}
```

### Example Product Category
```json
{
  "$id": "category_salmon_id",
  "name": "Salmon",
  "display_order": 1,
  "icon": "set_meal",
  "description": "Salmon products including fillets and portions",
  "is_active": true
}
```

### Example Product
```json
{
  "$id": "product_id_here",
  "category_id": "category_salmon_id",
  "name": "Salmonfillet Trim A 1000/1400 SCALED PBI",
  "base_name": "Salmon Fillet",
  "trim_type": "A",
  "size_range": "1000/1400",
  "weight_unit": "kg",
  "skin_type": "SCALED",
  "packaging_type": "PBI",
  "attributes": "{}",
  "display_order": 1,
  "is_active": true,
  "sku": "SAL-A-1014-PBI"
}
```

### Example Price List Item
```json
{
  "$id": "item_id_here",
  "price_list_id": "price_list_id_here",
  "product_id": "product_id_here",
  "price_box": 12.34,
  "price_box_vac": 13.04,
  "vac_surcharge": 0.70,
  "currency": "EUR",
  "min_quantity": null,
  "max_quantity": null,
  "is_available": true,
  "notes": null
}
```

---

## Environment Variables

Add to your `.env` file (if not already present):

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_DATABASE_ID=your_database_id
VITE_PRICE_LISTS_COLLECTION_ID=price_lists
VITE_PRODUCT_CATEGORIES_COLLECTION_ID=product_categories
VITE_PRODUCTS_COLLECTION_ID=products
VITE_PRICE_LIST_ITEMS_COLLECTION_ID=price_list_items
```

---

## Migration Notes

If you need to import existing price lists:

1. Export data from your current system (Excel/PDF)
2. Create a migration script using the Appwrite SDK
3. Use batch operations for better performance
4. Validate data with Zod schemas before insertion

---

## Support

For issues with Appwrite setup:
- Appwrite Documentation: https://appwrite.io/docs
- Appwrite Discord: https://appwrite.io/discord

---

**Last Updated**: 2025-11-10
**Version**: 1.0
