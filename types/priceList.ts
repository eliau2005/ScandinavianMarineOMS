import { z } from "zod";

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const PriceListStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export const Currency = {
  EUR: "EUR",
  USD: "USD",
  GBP: "GBP",
} as const;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

// Product Category Schema
export const ProductCategorySchema = z.object({
  $id: z.string().optional(),
  name: z.string().min(1, "Category name is required").max(255),
  enable_vac_pricing: z.boolean().default(false), // Controls VAC pricing columns for this category
  display_order: z.number().int().min(0).default(0),
  icon: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
});

// Product Schema (Simplified)
export const ProductSchema = z.object({
  $id: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Product name is required").max(255), // Fish name only
  unit_of_measure: z.string().min(1, "Unit of measure is required").max(50).default("box"), // Custom units
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
});

// Unit of Measure Schema
export const UnitOfMeasureSchema = z.object({
  $id: z.string().optional(),
  supplier_id: z.string().min(1, "Supplier ID is required"),
  supplier_name: z.string().min(1, "Supplier name is required").max(255),
  unit_name: z.string().min(1, "Unit name is required").max(50),
  is_default: z.boolean().default(false), // kg is default
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
});

// Price List Schema
export const PriceListSchema = z.object({
  $id: z.string().optional(),
  name: z.string().min(1, "Price list name is required").max(255), // Auto-generated from dates
  supplier_id: z.string().min(1, "Supplier ID is required"),
  supplier_name: z.string().min(1, "Supplier name is required").max(255),
  effective_date: z.string().min(1, "Start date is required"), // ISO date string (delivery start)
  expiry_date: z.string().min(1, "End date is required"), // ISO date string (delivery end) - REQUIRED
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  notes: z.string().max(1000).optional().nullable(),
  is_default: z.boolean().default(false),
  created_by: z.string().min(1, "Creator ID is required"),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
});

// Price List Item Schema
export const PriceListItemSchema = z.object({
  $id: z.string().optional(),
  price_list_id: z.string().min(1, "Price list ID is required"),
  product_id: z.string().min(1, "Product ID is required"),
  price_box: z.number().min(0, "Price must be positive"),
  price_box_vac: z.number().min(0).optional().nullable(),
  vac_surcharge: z.number().min(0).optional().nullable(),
  currency: z.enum(["EUR", "USD", "GBP"]).default("EUR"),
  min_quantity: z.number().int().min(0).optional().nullable(),
  max_quantity: z.number().int().min(0).optional().nullable(),
  is_available: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
});

// ============================================================================
// TYPESCRIPT TYPES (Inferred from Zod)
// ============================================================================

export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type Product = z.infer<typeof ProductSchema>;
export type UnitOfMeasure = z.infer<typeof UnitOfMeasureSchema>;
export type PriceList = z.infer<typeof PriceListSchema>;
export type PriceListItem = z.infer<typeof PriceListItemSchema>;

// ============================================================================
// EXTENDED TYPES FOR UI
// ============================================================================

// Product with category information
export interface ProductWithCategory extends Product {
  category?: ProductCategory;
}

// Price list item with product and category details
export interface PriceListItemWithDetails extends PriceListItem {
  product?: ProductWithCategory;
}

// Complete price list with all items
export interface PriceListWithItems extends PriceList {
  items?: PriceListItemWithDetails[];
}

// ============================================================================
// FORM TYPES
// ============================================================================

// Form data for creating/editing a product category
export type ProductCategoryFormData = z.infer<typeof ProductCategorySchema>;

// Form data for creating/editing a product
export type ProductFormData = z.infer<typeof ProductSchema>;

// Form data for creating/editing a unit of measure
export type UnitOfMeasureFormData = z.infer<typeof UnitOfMeasureSchema>;

// Form data for creating/editing a price list
export type PriceListFormData = z.infer<typeof PriceListSchema>;

// Form data for creating/editing a price list item
export type PriceListItemFormData = z.infer<typeof PriceListItemSchema>;

// Bulk price update
export const BulkPriceUpdateSchema = z.object({
  price_list_id: z.string().min(1),
  updates: z.array(
    z.object({
      product_id: z.string().min(1),
      price_box: z.number().min(0),
      price_box_vac: z.number().min(0).optional().nullable(),
    })
  ),
});

export type BulkPriceUpdate = z.infer<typeof BulkPriceUpdateSchema>;

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface PriceListStats {
  total_products: number;
  total_categories: number;
  last_updated: string | null;
  active_items: number;
}

export interface CategoryWithProducts {
  category: ProductCategory;
  products: ProductWithCategory[];
}

export interface PriceListTableRow {
  product: Product;
  category: ProductCategory;
  price_box: number | null;
  price_box_vac: number | null;
  vac_surcharge: number | null;
  is_available: boolean;
  item_id?: string; // Price list item ID if exists
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateProductCategory = (data: unknown): ProductCategory => {
  return ProductCategorySchema.parse(data);
};

export const validateProduct = (data: unknown): Product => {
  return ProductSchema.parse(data);
};

export const validateUnitOfMeasure = (data: unknown): UnitOfMeasure => {
  return UnitOfMeasureSchema.parse(data);
};

export const validatePriceList = (data: unknown): PriceList => {
  return PriceListSchema.parse(data);
};

export const validatePriceListItem = (data: unknown): PriceListItem => {
  return PriceListItemSchema.parse(data);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate price list name from start and end dates
 * Format: "PRICES ETA TUE/WED 12-11-2025"
 * @param startDate - ISO date string for delivery start
 * @param endDate - ISO date string for delivery end
 * @returns Formatted price list name
 */
export const generatePriceListName = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get day names (short form: MON, TUE, WED, etc.)
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const startDay = dayNames[start.getDay()];
  const endDay = dayNames[end.getDay()];

  // Format date as DD-MM-YYYY
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Use the end date for the date part
  const formattedDate = formatDate(end);

  return `PRICES ETA ${startDay}/${endDay} ${formattedDate}`;
};
