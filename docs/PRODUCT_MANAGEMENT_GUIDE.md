# Product Management System - Complete Guide

## ✅ 100% Functional - Ready to Use

The Product and Category Management system is now **fully operational**. You can create products and categories entirely through the UI - no manual Appwrite setup needed!

---

## What You Can Do Now

### 1. **Create Product Categories**
Organize your products into categories like Salmon, Cod, Turbot, etc.

### 2. **Create Individual Products**
Add products one at a time with simple product names.

### 3. **Bulk Import Products**
Import multiple products at once using simple text format (one product name per line).

### 4. **Manage Units of Measure**
Create custom units of measure (kg, box, piece, etc.) for your products.

### 5. **Edit Products & Categories**
Modify any product or category after creation.

### 6. **Delete Products & Categories**
Remove products or categories with built-in safety checks to prevent deletion of items in use.

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
   - **Enable VAC Pricing**: Check if this category needs VAC (vacuum-sealed) pricing
4. Click **"Create Category"**

**Example Categories to Create:**
- Salmon (order: 1, icon: set_meal, VAC: Yes)
- Cod (order: 2, icon: phishing, VAC: Yes)
- Turbot (order: 3, icon: water_drop, VAC: No)
- Doversoles (order: 4, icon: restaurant, VAC: No)
- Red Mullet (order: 5, icon: lunch_dining, VAC: No)

### Step 3: Create Custom Units (Optional)

1. Click **"New Product"** button
2. In the product creation modal, click **"+ Add New Unit"**
3. Enter your custom unit name (e.g., "kg", "piece", "tray")
4. Click **"Create Unit"**

**Note:** The default unit "box" is automatically created for all suppliers.

### Step 4: Create Products (Option A: One at a Time)

1. Switch to the **"Products"** tab
2. Click **"New Product"** button
3. Fill in the form:
   - **Category**: Select a category
   - **Product Name**: e.g., "Salmon Fillet" (the simple fish name)
   - **Unit of Measure**: Select from your available units
   - **Display Order**: Set sort order (optional)
4. Click **"Create Product"**

### Step 5: Create Products (Option B: Bulk Import)

1. Go to **"Products"** tab
2. Click **"Bulk Import"** button
3. Select a **Category** (all products will be assigned to this category)
4. Paste your product list (one product name per line):

**Format:**
```
Salmon Fillet
Cod Fillet
Tuna Steak
Shrimp
Lobster Tail
Crab Meat
Halibut Fillet
Sea Bass Whole
```

5. Click **"Parse & Preview"** to see how products will be created
6. Review the preview
7. Click **"Import X Products"**

**Pro Tip:** Click "Load Example" in the bulk import modal to see the correct format!

---

## Features Explained

### Product Categories

**Purpose:** Organize products into logical groups and control VAC pricing options.

**Fields:**
- **Name**: Category name (e.g., "Salmon", "Cod")
- **Display Order**: Controls sort order (lower = earlier)
- **Icon**: Material Symbol for visual identification
- **Enable VAC Pricing**: Whether products in this category can have vacuum-sealed pricing
- **Active**: Whether this category is currently in use

**Category Card Shows:**
- Category name and icon
- Number of products in category
- Active/Inactive status
- Edit and Delete buttons

**Safety Feature:**
- You cannot delete a category that has products in active, pending approval, or archived price lists
- Delete the products first, or wait until price lists are no longer in use

---

### Products

**Purpose:** Individual items that appear in price lists.

**Fields:**
- **Category**: Which category this product belongs to
- **Name**: Simple product name (e.g., "Salmon Fillet", "Cod Whole", "Tuna Steak")
- **Unit of Measure**: How the product is sold (box, kg, piece, etc.)
- **Display Order**: Sort order within category
- **Active**: Whether this product is available

**Product Display:**
Products are displayed in tables grouped by category with the following columns:
- Product Name
- Unit
- Status (Active/Inactive)
- Actions (Edit/Delete)

**Simplified Structure:**
The product system has been simplified to focus on core data only. Products are identified by their simple name and category, making management easier and more intuitive.

---

### Units of Measure

**Purpose:** Define how products are sold and measured.

**How It Works:**
- Each supplier has their own custom units
- Default unit "box" is auto-created for all suppliers
- Suppliers can add custom units like "kg", "piece", "tray", etc.
- Units can be selected when creating or editing products

**Creating Units:**
1. Open the product creation modal
2. Click **"+ Add New Unit"** button
3. Enter the unit name
4. The unit is immediately available for use

---

### Bulk Import

**Purpose:** Quickly add many products at once.

**Format:**
One product name per line - that's it!

**Example:**
```
Salmon Fillet
Cod Fillet
Tuna Steak
Halibut Fillet
Sea Bass Whole
Shrimp
Lobster Tail
Crab Meat
```

**How It Works:**
1. Select category first (required)
2. Paste your product names (one per line)
3. Click "Parse & Preview"
4. System shows you exactly what will be created
5. Review and confirm
6. All products are imported at once

**Tips:**
- Each line becomes one product
- Empty lines are ignored
- All products get the default unit "box"
- Display order is set automatically based on order in the list
- All products start as "Active"

---

## User Interface

### Products Tab

**Features:**
- Search products by name
- Tables grouped by category
- Two-column layout for better space utilization
- Category headers with icons
- Edit button (pencil icon) for each product
- Delete button (trash icon) for each product
- "New Product" button to add one product
- "Bulk Import" button to add many products

**Empty State:**
When you have no products, you'll see a helpful message with instructions.

### Categories Tab

**Features:**
- Search categories by name
- Scrollable list of category cards
- Each card shows icon, name, product count, status
- Edit button to modify category
- Delete button to remove category (only if not in use)
- "New Category" button to add a category

---

## Workflow Examples

### Example 1: Setting Up From Scratch

1. **Create Categories:**
   - Salmon (order: 1, enable VAC)
   - Cod (order: 2, enable VAC)
   - Turbot (order: 3, no VAC)

2. **Add Salmon Products (Bulk):**
   - Select "Salmon" category
   - Paste all salmon product names
   - Import them all at once

3. **Add Cod Products (Individual):**
   - Create each cod product manually
   - Select appropriate unit for each

4. **Review & Edit:**
   - Check all products
   - Edit any that need adjustments
   - Set proper display orders

### Example 2: Importing from a Simple List

You have a list of fish products:

1. Create all your categories first
2. Copy products from your list (one category at a time)
3. Use bulk import for each category
4. Review imported products
5. Edit units if needed (default is "box")

### Example 3: Adding a New Product

You want to add "Mackerel Whole":

1. Go to Products tab
2. Click "New Product"
3. Select appropriate category
4. Name: "Mackerel Whole"
5. Unit: "box" (or select custom unit)
6. Click "Create Product"

---

## Integration with Price Lists

Once you have products and categories set up:

1. **Go to "Price List Management"**
2. **Create a new price list**
3. **All your active products appear in separate tables by category**
4. **Add prices** for each product
5. **Save and export to PDF**

The price list automatically organizes products by category with visual separation between categories.

---

## Tips & Best Practices

### Naming Conventions

**Be Clear and Consistent:**
- Use simple, descriptive names
- Example: "Salmon Fillet" not "Salmonfillet Trim A 1000/1400 SCALED PBI"
- Keep it readable and easy to understand

**Product Name Examples:**
- Salmon Fillet
- Cod Whole
- Tuna Steak
- Shrimp (medium)
- Lobster Tail
- Sea Bass Fillet

### Display Orders

**Lower Numbers First:**
- Categories: 1, 2, 3, 4, 5...
- Products: Arrange by popularity or preference

**Keep Gaps:**
- Use 10, 20, 30... instead of 1, 2, 3...
- Makes it easier to insert items later

### Categories

**Create All Categories First:**
- Plan your category structure
- Create them all before adding products
- Easier to bulk import products when categories exist

**VAC Pricing:**
- Enable VAC pricing for categories where vacuum-sealed products are common
- This adds an extra price column in price lists
- Only enable when needed to keep price lists simple

**Use Icons:**
- Visual differentiation
- Easier to scan
- More professional appearance

### Units of Measure

**Create Units Before Products:**
- Add all custom units you'll need first
- Then assign them when creating products
- Common units: box, kg, piece, tray, lb

---

## Safety Features

### Deletion Protection

**Products:**
- Cannot delete products that are used in active, pending approval, or archived price lists
- System will show which price lists contain the product
- Remove from price lists first, or wait until price lists are drafts

**Categories:**
- Cannot delete categories whose products are used in active, pending approval, or archived price lists
- System will show which price lists contain products from this category
- Must remove products from price lists first

**Error Messages:**
You'll see clear messages like:
- "Cannot delete product. It is used in price list 'PRICES ETA TUE/WED 12-11-2025' (active). Remove it from those price lists first."
- "Cannot delete category. Products in this category are used in 2 price lists (active, pending approval). Remove them from those price lists first."

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

2. **Empty input**
   - Solution: Enter at least one product name

3. **All lines are empty**
   - Solution: Remove blank lines, enter product names

### Can't Delete Product or Category

**Cause:** Product/category is in use in non-draft price lists

**Solution:**
1. Check the error message to see which price lists contain the product
2. Go to those price lists and remove the product
3. Wait until price lists are archived or in draft status
4. Then delete the product/category

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
- Searches in product name
- Real-time filtering
- Case-insensitive

**Categories:**
- Searches in category name
- Real-time filtering

### Editing

**Products:**
- Click pencil icon in the products table
- All fields are editable
- Can change category, name, unit, display order, and status
- Changes save immediately

**Categories:**
- Click pencil icon on category card
- All fields are editable
- Changes save immediately

### Two-Column Layout

**Products View:**
- Products are displayed in two columns
- Even-indexed categories in left column
- Odd-indexed categories in right column
- Better use of screen space
- Easier to compare categories

---

## Next Steps

After setting up products and categories:

1. **Create Price Lists**
   - Go to "Price List Management"
   - Create a new price list
   - Add prices for your products
   - Submit for approval or save as draft

2. **Manage Orders**
   - Go to "Incoming Orders"
   - View orders from customers
   - Update order status
   - Process orders based on your price lists

3. **Update Products**
   - Regularly review your product catalog
   - Add new products as inventory changes
   - Deactivate discontinued products (don't delete if in use)

---

## Summary

✅ **Simplified Product Model**
- Focus on core data only
- Simple product names
- Easy to understand and manage
- No complex attributes

✅ **Full CRUD Operations**
- Create categories and products
- Read/view all data
- Update any field
- Delete with safety checks

✅ **Multiple Input Methods**
- Manual one-by-one creation
- Bulk import with preview
- Simple text format (one per line)

✅ **User-Friendly Interface**
- Tabbed navigation
- Two-column layout for products
- Search functionality
- Clear feedback messages
- Loading states

✅ **Safety Features**
- Confirmation dialogs
- Cannot delete products/categories in use
- Detailed error messages showing which price lists contain products
- Input validation
- Error handling

✅ **Professional Features**
- Icons for categories
- Display order control
- Custom units of measure
- VAC pricing control per category
- Active/inactive status
- Category-based grouping

The Product Management System is production-ready and fully integrated with the Price List System!

---

**Last Updated:** November 14, 2025
**Version:** 2.0.0 (Simplified Product Model)
**Status:** ✅ 100% Functional
