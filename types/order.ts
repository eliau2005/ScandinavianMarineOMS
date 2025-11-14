import { z } from "zod";

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const OrderStatus = {
  PENDING_APPROVAL: "pending_approval",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

// Customer-Supplier Association Schema
export const CustomerSupplierAssociationSchema = z.object({
  $id: z.string().optional(),
  customer_id: z.string().min(1, "Customer ID is required"),
  customer_name: z.string().min(1, "Customer name is required").max(255),
  supplier_id: z.string().min(1, "Supplier ID is required"),
  supplier_name: z.string().min(1, "Supplier name is required").max(255),
  is_active: z.boolean().default(true),
  created_by: z.string().min(1, "Creator ID is required"),
  notes: z.string().max(1000).optional().nullable(),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
});

// Order Item Schema (individual line item)
export const OrderItemSchema = z.object({
  product_id: z.string().min(1),
  product_name: z.string().min(1),
  category_id: z.string().optional(), // Category at time of order
  category_name: z.string().optional(), // Category name at time of order
  quantity_regular: z.number().min(0).default(0), // Quantity for regular packaging
  quantity_vac: z.number().min(0).default(0), // Quantity for VAC packaging
  unit_price: z.number().min(0), // Regular packaging price (per unit)
  total: z.number().min(0), // Total for regular packaging only (VAC calculated by supplier)
  notes: z.string().optional(),
});

// Order Schema
export const OrderSchema = z.object({
  $id: z.string().optional(),
  order_number: z.string().min(1, "Order number is required").max(50),
  customer_id: z.string().min(1, "Customer ID is required"),
  customer_name: z.string().min(1, "Customer name is required").max(255),
  supplier_id: z.string().min(1, "Supplier ID is required"),
  supplier_name: z.string().min(1, "Supplier name is required").max(255),
  price_list_id: z.string().min(1, "Price list ID is required"),
  price_list_name: z.string().min(1, "Price list name is required").max(255),
  status: z.enum([
    "pending_approval",
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]).default("pending_approval"),
  order_date: z.string().min(1, "Order date is required"),
  delivery_start_date: z.string().min(1, "Delivery start date is required"), // From price list effective_date
  delivery_end_date: z.string().min(1, "Delivery end date is required"), // From price list expiry_date
  total_amount: z.number().min(0).default(0),
  currency: z.string().max(10).default("EUR"),
  items: z.string().min(1, "Order must have items"), // JSON string
  customer_notes: z.string().max(2000).optional().nullable(),
  supplier_notes: z.string().max(2000).optional().nullable(),
  admin_notes: z.string().max(2000).optional().nullable(),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
});

// ============================================================================
// TYPESCRIPT TYPES (Inferred from Zod)
// ============================================================================

export type CustomerSupplierAssociation = z.infer<
  typeof CustomerSupplierAssociationSchema
>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;

// ============================================================================
// EXTENDED TYPES FOR UI
// ============================================================================

// Order with parsed items
export interface OrderWithItems extends Omit<Order, "items"> {
  items: OrderItem[];
}

// Order summary for lists
export interface OrderSummary {
  order_id: string;
  order_number: string;
  customer_name: string;
  supplier_name: string;
  order_date: string;
  status: OrderStatusType;
  total_amount: number;
  item_count: number;
}

// Customer with their suppliers
export interface CustomerWithSuppliers {
  customer_id: string;
  customer_name: string;
  suppliers: Array<{
    supplier_id: string;
    supplier_name: string;
    association_id: string;
    is_active: boolean;
  }>;
}

// Supplier with their customers
export interface SupplierWithCustomers {
  supplier_id: string;
  supplier_name: string;
  customers: Array<{
    customer_id: string;
    customer_name: string;
    association_id: string;
    is_active: boolean;
  }>;
}

// ============================================================================
// FORM TYPES
// ============================================================================

// Form data for creating an association
export type CustomerSupplierAssociationFormData = Omit<
  CustomerSupplierAssociation,
  "$id" | "$createdAt" | "$updatedAt"
>;

// Form data for creating an order (before converting items to JSON)
export interface OrderFormData {
  customer_id: string;
  customer_name: string;
  supplier_id: string;
  supplier_name: string;
  price_list_id: string;
  price_list_name: string;
  requested_delivery_date?: string;
  items: OrderItem[];
  customer_notes?: string;
}

// Shopping cart item (for building orders)
export interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity_regular: number; // Quantity for regular packaging
  quantity_vac: number; // Quantity for VAC packaging
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export interface StatusBadgeProps {
  status: OrderStatusType;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateCustomerSupplierAssociation = (
  data: unknown
): CustomerSupplierAssociation => {
  return CustomerSupplierAssociationSchema.parse(data);
};

export const validateOrder = (data: unknown): Order => {
  return OrderSchema.parse(data);
};

export const validateOrderItem = (data: unknown): OrderItem => {
  return OrderItemSchema.parse(data);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse order items from JSON string
 */
export const parseOrderItems = (itemsJson: string): OrderItem[] => {
  try {
    const items = JSON.parse(itemsJson);
    return Array.isArray(items) ? items.map(validateOrderItem) : [];
  } catch (error) {
    console.error("Error parsing order items:", error);
    return [];
  }
};

/**
 * Convert order items to JSON string
 */
export const stringifyOrderItems = (items: OrderItem[]): string => {
  return JSON.stringify(items);
};

/**
 * Calculate order total from items (regular quantities only)
 * VAC quantities are not included in the system calculation
 */
export const calculateOrderTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => {
    const regularTotal = (item.quantity_regular || 0) * item.unit_price;
    return sum + regularTotal;
  }, 0);
};

/**
 * Generate order number
 */
export const generateOrderNumber = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `ORD-${year}${month}${day}-${random}`;
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status: OrderStatusType): string => {
  switch (status) {
    case OrderStatus.PENDING_APPROVAL:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case OrderStatus.PENDING:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case OrderStatus.CONFIRMED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case OrderStatus.PROCESSING:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case OrderStatus.SHIPPED:
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
    case OrderStatus.DELIVERED:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case OrderStatus.CANCELLED:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

/**
 * Get status label
 */
export const getStatusLabel = (status: OrderStatusType): string => {
  if (status === OrderStatus.PENDING_APPROVAL) {
    return "Pending Approval";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};
