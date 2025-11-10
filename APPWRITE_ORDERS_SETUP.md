# Appwrite Database Setup for Orders & Customer-Supplier Associations

This document contains step-by-step instructions for setting up the additional Appwrite collections required for the order management and customer-supplier association system.

## Collections Overview

You need to create **2 new collections**:

1. **customer_supplier_associations** - Links customers to suppliers they can order from
2. **orders** - Customer orders with line items

---

## Collection 1: `customer_supplier_associations`

### Collection Settings
- **Collection ID**: `customer_supplier_associations`
- **Collection Name**: Customer Supplier Associations
- **Permissions**:
  - Read: `users`
  - Create/Update/Delete: `users` (we'll handle admin-only in code)

### Attributes

| Attribute Name | Type | Size | Required | Default | Array | Description |
|---------------|------|------|----------|---------|-------|-------------|
| `customer_id` | String | 255 | Yes | - | No | User ID of the customer |
| `customer_name` | String | 255 | Yes | - | No | Name of the customer |
| `supplier_id` | String | 255 | Yes | - | No | User ID of the supplier |
| `supplier_name` | String | 255 | Yes | - | No | Name of the supplier |
| `is_active` | Boolean | - | Yes | `true` | No | Whether this association is active |
| `created_by` | String | 255 | Yes | - | No | Admin user ID who created this |
| `notes` | String | 1000 | No | - | No | Admin notes about this association |

### Indexes
- **Index 1**: `customer_id` (ascending) - for querying by customer
- **Index 2**: `supplier_id` (ascending) - for querying by supplier
- **Index 3**: Compound: `customer_id` + `supplier_id` - for unique association lookup

---

## Collection 2: `orders`

### Collection Settings
- **Collection ID**: `orders`
- **Collection Name**: Orders
- **Permissions**:
  - Read: `users`
  - Create: `users`
  - Update: `users`
  - Delete: `users` (we'll restrict in code)

### Attributes

| Attribute Name | Type | Size | Required | Default | Array | Description |
|---------------|------|------|----------|---------|-------|-------------|
| `order_number` | String | 50 | Yes | - | No | Unique order number (e.g., ORD-20251110-001) |
| `customer_id` | String | 255 | Yes | - | No | User ID of the customer who placed the order |
| `customer_name` | String | 255 | Yes | - | No | Name of the customer |
| `supplier_id` | String | 255 | Yes | - | No | User ID of the supplier |
| `supplier_name` | String | 255 | Yes | - | No | Name of the supplier |
| `price_list_id` | String | 255 | Yes | - | No | Price list used for this order |
| `price_list_name` | String | 255 | Yes | - | No | Name of the price list |
| `status` | String | 50 | Yes | `pending` | No | Order status: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` |
| `order_date` | DateTime | - | Yes | - | No | When the order was placed |
| `requested_delivery_date` | DateTime | - | No | - | No | Customer's requested delivery date |
| `total_amount` | Float | - | Yes | `0` | No | Total order amount in EUR |
| `currency` | String | 10 | Yes | `EUR` | No | Currency code |
| `items` | String | 50000 | Yes | - | No | JSON string of order items (array of {product_id, product_name, quantity, unit_price, total}) |
| `customer_notes` | String | 2000 | No | - | No | Notes from customer |
| `supplier_notes` | String | 2000 | No | - | No | Internal notes from supplier |
| `admin_notes` | String | 2000 | No | - | No | Internal notes from admin |

### Indexes
- **Index 1**: `customer_id` (ascending) - for customer order history
- **Index 2**: `supplier_id` (ascending) - for supplier incoming orders
- **Index 3**: `status` (ascending) - for filtering by status
- **Index 4**: `order_date` (descending) - for sorting by date
- **Index 5**: `order_number` (ascending) - for unique lookup

---

## Step-by-Step Creation Instructions

### 1. Log into Appwrite Console
1. Go to your Appwrite Console
2. Select your project: **Scandinavian Marine OMS**
3. Navigate to **Databases**
4. Select your database

### 2. Create Collections

For each collection above:

#### Step 2.1: Create the Collection
1. Click **"Create Collection"**
2. Enter the **Collection ID** exactly as specified
3. Enter the **Collection Name**
4. Click **"Create"**

#### Step 2.2: Set Permissions
1. Click on the newly created collection
2. Go to **Settings** → **Permissions**
3. Add permissions:
   - **Read**: `users` (any authenticated user)
   - **Create**: `users`
   - **Update**: `users`
   - **Delete**: `users`

#### Step 2.3: Add Attributes
1. Go to the **"Attributes"** tab
2. Click **"Create Attribute"**
3. For each attribute in the table:
   - Select the **Type**
   - Enter the **Attribute Key**
   - Set the **Size** (for String types)
   - Check **Required** if marked "Yes"
   - Set **Default Value** if specified
   - Click **"Create"**
4. Wait for each attribute to finish creating before adding the next

#### Step 2.4: Create Indexes
1. Go to the **"Indexes"** tab
2. Click **"Create Index"**
3. For each index listed:
   - Enter an **Index Key** (e.g., `customer_id_index`)
   - Select the **Attribute** to index
   - Choose **Order**: Ascending or Descending
   - For compound indexes, add multiple attributes
   - Click **"Create"**

---

## Environment Variables

Add to your `.env` file:

```env
VITE_CUSTOMER_SUPPLIER_ASSOCIATIONS_COLLECTION_ID=customer_supplier_associations
VITE_ORDERS_COLLECTION_ID=orders
```

---

## Sample Data Structure

### Example Customer-Supplier Association
```json
{
  "$id": "unique_id_here",
  "customer_id": "customer_user_id",
  "customer_name": "Restaurant ABC",
  "supplier_id": "supplier_user_id",
  "supplier_name": "Day2Day Fresh Fish",
  "is_active": true,
  "created_by": "admin_user_id",
  "notes": "Primary supplier for this customer"
}
```

### Example Order
```json
{
  "$id": "unique_id_here",
  "order_number": "ORD-20251110-001",
  "customer_id": "customer_user_id",
  "customer_name": "Restaurant ABC",
  "supplier_id": "supplier_user_id",
  "supplier_name": "Day2Day Fresh Fish",
  "price_list_id": "price_list_id",
  "price_list_name": "Weekly Price List 12-11-2025",
  "status": "pending",
  "order_date": "2025-11-10T14:30:00.000Z",
  "requested_delivery_date": "2025-11-12T00:00:00.000Z",
  "total_amount": 1250.50,
  "currency": "EUR",
  "items": "[{\"product_id\":\"prod1\",\"product_name\":\"Salmon Fillet A 1000/1400\",\"quantity\":10,\"unit_price\":12.34,\"total\":123.40},{\"product_id\":\"prod2\",\"product_name\":\"Cod Fillet Skin On\",\"quantity\":5,\"unit_price\":21.25,\"total\":106.25}]",
  "customer_notes": "Please deliver early morning",
  "supplier_notes": null,
  "admin_notes": null
}
```

---

## Order Status Workflow

1. **pending** - Customer placed order, waiting for supplier confirmation
2. **confirmed** - Supplier confirmed the order
3. **processing** - Supplier is preparing the order
4. **shipped** - Order has been shipped
5. **delivered** - Order delivered to customer
6. **cancelled** - Order was cancelled

---

## Notes

### Customer-Supplier Associations
- Admin creates these associations
- Customers can only see price lists from their associated suppliers
- Customers can only order from their associated suppliers
- Associations can be deactivated without deletion (for history)

### Orders
- Order items stored as JSON string (Appwrite doesn't support native arrays of objects)
- Order number format: `ORD-YYYYMMDD-XXX` (sequential per day)
- Total amount calculated from items before saving
- All parties (customer, supplier, admin) can add notes in their respective fields

---

**Last Updated**: 2025-11-10
**Version**: 1.0
