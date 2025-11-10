import { z } from "zod";

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const PriceListStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export const TrimType = {
  A: "A",
  B: "B",
  D: "D",
  E: "E",
} as const;

export const PackagingType = {
  PBI: "PBI",
  PBO: "PBO",
  SUP: "SUP",
} as const;

export const WeightUnit = {
  KG: "kg",
  GR: "gr",
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
  display_order: z.number().int().min(0).default(0),
  icon: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
});

// Product Schema
export const ProductSchema = z.object({
  $id: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Product name is required").max(255),
  base_name: z.string().min(1, "Base name is required").max(255),
  trim_type: z.string().max(50).optional().nullable(),
  size_range: z.string().max(100).optional().nullable(),
  weight_unit: z.enum(["kg", "gr"]).default("kg"),
  skin_type: z.string().max(100).optional().nullable(),
  packaging_type: z.string().max(50).optional().nullable(),
  attributes: z.string().max(500).optional().nullable(), // JSON string
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  sku: z.string().max(100).optional().nullable(),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
});

// Price List Schema
export const PriceListSchema = z.object({
  $id: z.string().optional(),
  name: z.string().min(1, "Price list name is required").max(255),
  supplier_id: z.string().min(1, "Supplier ID is required"),
  supplier_name: z.string().min(1, "Supplier name is required").max(255),
  effective_date: z.string().min(1, "Effective date is required"), // ISO date string
  expiry_date: z.string().optional().nullable(),
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

export const validatePriceList = (data: unknown): PriceList => {
  return PriceListSchema.parse(data);
};

export const validatePriceListItem = (data: unknown): PriceListItem => {
  return PriceListItemSchema.parse(data);
};
