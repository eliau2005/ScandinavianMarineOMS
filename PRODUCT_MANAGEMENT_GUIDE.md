# Product Management System - Complete Guide

## ✅ 100% Functional - Ready to Use

The Product and Category Management system is now **fully operational**. You can create products and categories entirely through the UI - no manual Appwrite setup needed!

---

## What You Can Do Now

### 1. **Create Product Categories**
Organize your products into categories like Salmon, Cod, Turbot, etc.

### 2. **Create Individual Products**
Add products one at a time with full attribute support (trim type, size, skin type, packaging).

### 3. **Bulk Import Products**
Import multiple products at once using simple text formats.

### 4. **Edit Products & Categories**
Modify any product or category after creation.

### 5. **Delete Products & Categories**
Remove products or categories (with safety checks).

---

## Quick Start Guide

### Step 1: Log in as a Supplier

1. Start your dev server: `npm run dev`
2. Log in with a supplier account
3. You'll see **"Product Management"** as the first menu item

### Step 2: Create Your First Category

1. Click the **"Categories"** tab
2. Click **"New Category"** button
3. Fill in the form:
   - **Name**: e.g., "Salmon"
   - **Display Order**: 1 (lower numbers appear first)
   - **Icon**: Click a suggestion or type a Material Symbol name
   - **Description**: Optional description
4. Click **"Create Category"**

**Example Categories to Create:**
- Salmon (order: 1, icon: set_meal)
- Cod (order: 2, icon: phishing)
- Turbot (order: 3, icon: water_drop)
- Doversoles (order: 4, icon: restaurant)
- Red Mullet (order: 5, icon: lunch_dining)

### Step 3: Create Products (Option A: One at a Time)

1. Switch to the **"Products"** tab
2. Click **"New Product"** button
3. Fill in the form:
   - **Category**: Select a category
   - **Base Name**: e.g., "Salmon Fillet"
   - **Trim Type**: e.g., "A" (optional)
   - **Size Range**: e.g., "1000/1400" (optional)
   - **Skin Type**: e.g., "SCALED" (optional)
   - **Packaging Type**: e.g., "PBI" (optional)
4. Click **"Auto-Generate"** to create the full product name from the fields
5. Adjust the **Full Product Name** if needed
6. Set **Weight Unit**, **Display Order**, and **SKU** (optional)
7. Click **"Create Product"**

### Step 4: Create Products (Option B: Bulk Import)

1. Go to **"Products"** tab
2. Click **"Bulk Import"** button
3. Select a **Category** (all products will be assigned to this category)
4. Paste your product list (one per line):

**Simple Format:**
```
Salmonfillet Trim A 1000/1400 SCALED PBI
Salmonfillet Trim A 1400/1800 SCALED PBI
Salmonfillet Trim B 1000/1400 SCALED PBI
```

**Detailed Format (using | separator):**
```
Salmonfillet Trim A 1000/1400 SCALED PBI | A | 1000/1400 | SCALED | PBI
Salmonfillet Trim B 1000/1400 SCALED PBI | B | 1000/1400 | SCALED | PBI
```

5. Click **"Parse & Preview"** to see how products will be created
6. Review the preview
7. Click **"Import X Products"**

**Pro Tip:** Click "Load Example" in the bulk import modal to see all supported formats!

---

## Features Explained

### Product Categories

**Purpose:** Organize products into logical groups for easier management and display.

**Fields:**
- **Name**: Category name (e.g., "Salmon", "Cod")
- **Display Order**: Controls sort order (lower = earlier)
- **Icon**: Material Symbol for visual identification
- **Description**: Optional details about the category
- **Active**: Whether this category is currently in use

**Category Card Shows:**
- Category name and icon
- Display order
- Number of products in category
- Active/Inactive status
- Edit and Delete buttons

**Safety Feature:** You cannot delete a category that has products. Delete the products first.

---

### Products

**Purpose:** Individual items that appear in price lists.

**Fields:**
- **Category**: Which category this product belongs to
- **Base Name**: Short name (e.g., "Salmon Fillet")
- **Full Product Name**: Complete name as it appears on price lists
- **Trim Type**: Quality grade (A, B, D, E, etc.)
- **Size Range**: Weight or size range (1000/1400, 2-3 KG, etc.)
- **Skin Type**: Skin preparation (SCALED, Skin On, Skinless, etc.)
- **Packaging Type**: How it's packaged (PBI, PBO, SUP, etc.)
- **Weight Unit**: kg or gr
- **Display Order**: Sort order within category
- **SKU**: Stock Keeping Unit (optional)
- **Active**: Whether this product is available

**Auto-Generate Feature:**
The "Auto-Generate" button creates the full product name by combining:
```
Base Name + Trim Type + Size Range + Skin Type + Packaging Type
```

Example:
- Base Name: "Salmon Fillet"
- Trim: "A"
- Size: "1000/1400"
- Skin: "SCALED"
- Packaging: "PBI"

Auto-generates: "Salmon Fillet A 1000/1400 SCALED PBI"

---

### Bulk Import

**Purpose:** Quickly add many products at once.

**Supported Formats:**

#### 1. Simple (Product Name Only)
```
Salmonfillet Trim A 1000/1400 SCALED PBI
Cod Fillet Skin On 200/400 GR
Doversoles 2/300 GR
```

#### 2. Pipe-Separated (Name | Trim | Size | Skin | Packaging | SKU)
```
Salmonfillet Trim A | A | 1000/1400 | SCALED | PBI | SAL-A-1014
Salmon HOG 2-3 | | 2-3 | | SUP | SAL-HOG-23
```

#### 3. CSV (Comma-Separated)
```
Salmonfillet Trim A,A,1000/1400,SCALED,PBI,SAL-A-1014
Doversoles 2/300 GR,,,,,DOV-2-300
```

**How It Works:**
1. Select category first (required)
2. Paste your product data
3. Click "Parse & Preview"
4. System shows you exactly what will be created
5. Review and confirm
6. All products are imported at once

**Tips:**
- Leave fields empty by using extra commas or pipes
- The system auto-generates base names
- Display order is set automatically based on order in the list
- All products start as "Active"

---

## User Interface

### Products Tab

**Features:**
- Search products by name, base name, or SKU
- Table showing: Product Name, Category, SKU, Status
- Edit button (pencil icon) for each product
- Delete button (trash icon) for each product
- "New Product" button to add one product
- "Bulk Import" button to add many products

**Empty State:**
When you have no products, you'll see a helpful message with instructions.

### Categories Tab

**Features:**
- Search categories by name
- Grid of category cards
- Each card shows icon, name, product count, status
- Edit button to modify category
- Delete button to remove category (only if empty)
- "New Category" button to add a category

---

## Workflow Examples

### Example 1: Setting Up From Scratch

1. **Create Categories:**
   - Salmon (order: 1)
   - Cod (order: 2)
   - Turbot (order: 3)

2. **Add Salmon Products (Bulk):**
   - Select "Salmon" category
   - Paste all salmon product names
   - Import them all at once

3. **Add Cod Products (Individual):**
   - Create each cod product manually
   - Use auto-generate for names

4. **Review & Edit:**
   - Check all products
   - Edit any that need adjustments
   - Set proper display orders

### Example 2: Importing from Price List PDF

You have a price list PDF with products listed.

1. Create all your categories first
2. Copy products from PDF (one category at a time)
3. Use bulk import for each category
4. Review imported products
5. Edit any that didn't parse correctly

### Example 3: Adding New Product Variant

You want to add "Salmonfillet Trim A 2400/3000 SCALED PBI":

1. Go to Products tab
2. Click "New Product"
3. Select "Salmon" category
4. Base Name: "Salmon Fillet"
5. Trim: "A"
6. Size: "2400/3000"
7. Skin: "SCALED"
8. Packaging: "PBI"
9. Click "Auto-Generate"
10. Review and create

---

## Integration with Price Lists

Once you have products and categories set up:

1. **Go to "Price List Management"**
2. **Create a new price list**
3. **All your products appear in the table**
4. **Add prices** for each product
5. **Save and export to PDF**

The price list automatically organizes products by category and displays them professionally.

---

## Tips & Best Practices

### Naming Conventions

**Be Consistent:**
- Use the same format for all similar products
- Example: Always use "1000/1400" not "1000-1400" or "1kg-1.4kg"

**Use Clear Abbreviations:**
- PBI, PBO, SUP for packaging
- SCALED, Skin On, Skinless for skin types
- A, B, D, E for trim types

### Display Orders

**Lower Numbers First:**
- Categories: 1, 2, 3, 4, 5...
- Products: Arrange by popularity or size

**Keep Gaps:**
- Use 10, 20, 30... instead of 1, 2, 3...
- Makes it easier to insert items later

### SKUs (Optional but Recommended)

**Format Ideas:**
- `SAL-A-1014` (Salmon, Trim A, 1000-1400)
- `COD-SK-24` (Cod, Skin On, 2-4 kg)
- `TUR-W-13` (Turbot, Wild, 1-3 kg)

**Benefits:**
- Easier to track in systems
- Unique identifiers
- Better for inventory management

### Categories

**Create All Categories First:**
- Plan your category structure
- Create them all before adding products
- Easier to bulk import products when categories exist

**Use Icons:**
- Visual differentiation
- Easier to scan
- More professional appearance

---

## Troubleshooting

### "Failed to create product/category"

**Possible Causes:**
1. **Appwrite permissions not set correctly**
   - Solution: Set all collection permissions to `users`

2. **Network error**
   - Solution: Check your internet connection

3. **Invalid data**
   - Solution: Check that category name/product name is not empty

### Bulk Import Shows "No valid products found"

**Causes:**
1. **Category not selected**
   - Solution: Select a category first

2. **Empty lines or wrong format**
   - Solution: Remove empty lines, use one of the supported formats

3. **Parsing error**
   - Solution: Click "Load Example" to see correct formats

### Can't Delete Category

**Cause:** Category has products assigned to it

**Solution:**
1. Delete all products in that category first, OR
2. Reassign products to another category (edit each product)
3. Then delete the empty category

### Products Not Showing in Price List

**Possible Causes:**
1. **Products are inactive**
   - Solution: Edit products and check "Active"

2. **No products created yet**
   - Solution: Create some products first

---

## Advanced Features

### Search

**Products:**
- Searches in: Name, Base Name, SKU
- Real-time filtering
- Case-insensitive

**Categories:**
- Searches in: Name
- Real-time filtering

### Editing

**Products:**
- Click pencil icon in the products table
- All fields are editable
- Changes save immediately

**Categories:**
- Click pencil icon on category card
- All fields are editable
- Changes save immediately

### Deleting

**Safety Features:**
- Confirmation dialog for all deletions
- Cannot delete categories with products
- Clear warning messages

---

## Next Steps

After setting up products and categories:

1. **Create Price Lists**
   - Go to "Price List Management"
   - Create a new price list
   - Add prices for your products
   - Save and export to PDF

2. **Manage Orders**
   - Go to "Incoming Orders" (coming soon)
   - View orders from customers
   - Process orders based on your price lists

3. **Update Products**
   - Regularly review your product catalog
   - Add new products as inventory changes
   - Deactivate discontinued products

---

## Summary

✅ **Full CRUD Operations**
- Create categories and products
- Read/view all data
- Update any field
- Delete with safety checks

✅ **Multiple Input Methods**
- Manual one-by-one creation
- Bulk import with preview
- Auto-generate names

✅ **User-Friendly Interface**
- Tabbed navigation
- Search functionality
- Clear feedback messages
- Loading states

✅ **Safety Features**
- Confirmation dialogs
- Cannot delete categories with products
- Input validation
- Error handling

✅ **Professional Features**
- Icons for categories
- Display order control
- SKU support
- Active/inactive status

The Product Management System is production-ready and fully integrated with the Price List System!

---

**Last Updated:** November 10, 2025
**Version:** 1.0.0
**Status:** ✅ 100% Functional
