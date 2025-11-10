import { databases, appwriteConfig } from "./appwrite";
import { ID, Query, Permission, Role } from "appwrite";
import type {
  PriceList,
  PriceListItem,
  Product,
  ProductCategory,
  PriceListWithItems,
  ProductWithCategory,
  PriceListItemWithDetails,
} from "../types/priceList";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATABASE_ID = appwriteConfig.databaseId;

// Collection IDs - these should be added to your .env file
const COLLECTIONS = {
  PRICE_LISTS: import.meta.env.VITE_PRICE_LISTS_COLLECTION_ID || "price_lists",
  PRODUCTS: import.meta.env.VITE_PRODUCTS_COLLECTION_ID || "products",
  PRODUCT_CATEGORIES:
    import.meta.env.VITE_PRODUCT_CATEGORIES_COLLECTION_ID ||
    "product_categories",
  PRICE_LIST_ITEMS:
    import.meta.env.VITE_PRICE_LIST_ITEMS_COLLECTION_ID || "price_list_items",
};

// ============================================================================
// PRODUCT CATEGORIES
// ============================================================================

export const productCategoryService = {
  /**
   * Get all product categories
   */
  async getAll(): Promise<ProductCategory[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCT_CATEGORIES,
        [Query.orderAsc("display_order"), Query.equal("is_active", true)]
      );
      return response.documents as ProductCategory[];
    } catch (error) {
      console.error("Error fetching product categories:", error);
      throw error;
    }
  },

  /**
   * Get a single product category by ID
   */
  async getById(id: string): Promise<ProductCategory> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCT_CATEGORIES,
        id
      );
      return response as ProductCategory;
    } catch (error) {
      console.error("Error fetching product category:", error);
      throw error;
    }
  },

  /**
   * Create a new product category
   */
  async create(data: Omit<ProductCategory, "$id">): Promise<ProductCategory> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCT_CATEGORIES,
        ID.unique(),
        data
      );
      return response as ProductCategory;
    } catch (error) {
      console.error("Error creating product category:", error);
      throw error;
    }
  },

  /**
   * Update a product category
   */
  async update(
    id: string,
    data: Partial<ProductCategory>
  ): Promise<ProductCategory> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCT_CATEGORIES,
        id,
        data
      );
      return response as ProductCategory;
    } catch (error) {
      console.error("Error updating product category:", error);
      throw error;
    }
  },

  /**
   * Delete a product category
   */
  async delete(id: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCT_CATEGORIES,
        id
      );
    } catch (error) {
      console.error("Error deleting product category:", error);
      throw error;
    }
  },
};

// ============================================================================
// PRODUCTS
// ============================================================================

export const productService = {
  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [Query.orderAsc("display_order"), Query.equal("is_active", true)]
      );
      return response.documents as Product[];
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  /**
   * Get products by category
   */
  async getByCategory(categoryId: string): Promise<Product[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [
          Query.equal("category_id", categoryId),
          Query.equal("is_active", true),
          Query.orderAsc("display_order"),
        ]
      );
      return response.documents as Product[];
    } catch (error) {
      console.error("Error fetching products by category:", error);
      throw error;
    }
  },

  /**
   * Get a single product by ID
   */
  async getById(id: string): Promise<Product> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id
      );
      return response as Product;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },

  /**
   * Create a new product
   */
  async create(data: Omit<Product, "$id">): Promise<Product> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        ID.unique(),
        data
      );
      return response as Product;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  /**
   * Update a product
   */
  async update(id: string, data: Partial<Product>): Promise<Product> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id,
        data
      );
      return response as Product;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  /**
   * Get products with their category information
   */
  async getAllWithCategories(): Promise<ProductWithCategory[]> {
    try {
      const [products, categories] = await Promise.all([
        this.getAll(),
        productCategoryService.getAll(),
      ]);

      const categoryMap = new Map(
        categories.map((cat) => [cat.$id!, cat])
      );

      return products.map((product) => ({
        ...product,
        category: categoryMap.get(product.category_id),
      }));
    } catch (error) {
      console.error("Error fetching products with categories:", error);
      throw error;
    }
  },
};

// ============================================================================
// PRICE LISTS
// ============================================================================

export const priceListService = {
  /**
   * Get all price lists for a supplier
   */
  async getBySupplier(supplierId: string): Promise<PriceList[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRICE_LISTS,
        [
          Query.equal("supplier_id", supplierId),
          Query.orderDesc("effective_date"),
        ]
      );
      return response.documents as PriceList[];
    } catch (error) {
      console.error("Error fetching price lists:", error);
      throw error;
    }
  },

  /**
   * Get active price lists for a supplier
   */
  async getActiveBySupplier(supplierId: string): Promise<PriceList[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRICE_LISTS,
        [
          Query.equal("supplier_id", supplierId),
          Query.equal("status", "active"),
          Query.orderDesc("effective_date"),
        ]
      );
      return response.documents as PriceList[];
    } catch (error) {
      console.error("Error fetching active price lists:", error);
      throw error;
    }
  },

  /**
   * Get a single price list by ID
   */
  async getById(id: string): Promise<PriceList> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PRICE_LISTS,
        id
      );
      return response as PriceList;
    } catch (error) {
      console.error("Error fetching price list:", error);
      throw error;
    }
  },

  /**
   * Create a new price list
   */
  async create(data: Omit<PriceList, "$id">): Promise<PriceList> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRICE_LISTS,
        ID.unique(),
        data
      );
      return response as PriceList;
    } catch (error) {
      console.error("Error creating price list:", error);
      throw error;
    }
  },

  /**
   * Update a price list
   */
  async update(id: string, data: Partial<PriceList>): Promise<PriceList> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRICE_LISTS,
        id,
        data
      );
      return response as PriceList;
    } catch (error) {
      console.error("Error updating price list:", error);
      throw error;
    }
  },

  /**
   * Delete a price list
   */
  async delete(id: string): Promise<void> {
    try {
      // First, delete all items in this price list
      const items = await priceListItemService.getByPriceList(id);
      await Promise.all(items.map((item) => priceListItemService.delete(item.$id!)));

      // Then delete the price list itself
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRICE_LISTS, id);
    } catch (error) {
      console.error("Error deleting price list:", error);
      throw error;
    }
  },

  /**
   * Get price list with all items and product details
   */
  async getWithItems(id: string): Promise<PriceListWithItems> {
    try {
      const [priceList, items, products, categories] = await Promise.all([
        this.getById(id),
        priceListItemService.getByPriceList(id),
        productService.getAll(),
        productCategoryService.getAll(),
      ]);

      const productMap = new Map(products.map((p) => [p.$id!, p]));
      const categoryMap = new Map(categories.map((c) => [c.$id!, c]));

      const itemsWithDetails: PriceListItemWithDetails[] = items.map(
        (item) => {
          const product = productMap.get(item.product_id);
          return {
            ...item,
            product: product
              ? {
                  ...product,
                  category: categoryMap.get(product.category_id),
                }
              : undefined,
          };
        }
      );

      return {
        ...priceList,
        items: itemsWithDetails,
      };
    } catch (error) {
      console.error("Error fetching price list with items:", error);
      throw error;
    }
  },

  /**
   * Duplicate a price list
   */
  async duplicate(
    id: string,
    newName: string,
    newEffectiveDate: string
  ): Promise<PriceList> {
    try {
      const original = await this.getWithItems(id);

      // Create new price list
      const newPriceList = await this.create({
        name: newName,
        supplier_id: original.supplier_id,
        supplier_name: original.supplier_name,
        effective_date: newEffectiveDate,
        expiry_date: original.expiry_date,
        status: "draft",
        notes: original.notes,
        is_default: false,
        created_by: original.created_by,
      });

      // Copy all items
      if (original.items) {
        await Promise.all(
          original.items.map((item) =>
            priceListItemService.create({
              price_list_id: newPriceList.$id!,
              product_id: item.product_id,
              price_box: item.price_box,
              price_box_vac: item.price_box_vac,
              vac_surcharge: item.vac_surcharge,
              currency: item.currency,
              min_quantity: item.min_quantity,
              max_quantity: item.max_quantity,
              is_available: item.is_available,
              notes: item.notes,
            })
          )
        );
      }

      return newPriceList;
    } catch (error) {
      console.error("Error duplicating price list:", error);
      throw error;
    }
  },
};

// ============================================================================
// PRICE LIST ITEMS
// ============================================================================

export const priceListItemService = {
  /**
   * Get all items for a price list
   */
  async getByPriceList(priceListId: string): Promise<PriceListItem[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRICE_LIST_ITEMS,
        [Query.equal("price_list_id", priceListId), Query.limit(1000)]
      );
      return response.documents as PriceListItem[];
    } catch (error) {
      console.error("Error fetching price list items:", error);
      throw error;
    }
  },

  /**
   * Get a single price list item by ID
   */
  async getById(id: string): Promise<PriceListItem> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PRICE_LIST_ITEMS,
        id
      );
      return response as PriceListItem;
    } catch (error) {
      console.error("Error fetching price list item:", error);
      throw error;
    }
  },

  /**
   * Create a new price list item
   */
  async create(data: Omit<PriceListItem, "$id">): Promise<PriceListItem> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRICE_LIST_ITEMS,
        ID.unique(),
        data
      );
      return response as PriceListItem;
    } catch (error) {
      console.error("Error creating price list item:", error);
      throw error;
    }
  },

  /**
   * Update a price list item
   */
  async update(
    id: string,
    data: Partial<PriceListItem>
  ): Promise<PriceListItem> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRICE_LIST_ITEMS,
        id,
        data
      );
      return response as PriceListItem;
    } catch (error) {
      console.error("Error updating price list item:", error);
      throw error;
    }
  },

  /**
   * Delete a price list item
   */
  async delete(id: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.PRICE_LIST_ITEMS,
        id
      );
    } catch (error) {
      console.error("Error deleting price list item:", error);
      throw error;
    }
  },

  /**
   * Bulk create price list items
   */
  async bulkCreate(
    items: Omit<PriceListItem, "$id">[]
  ): Promise<PriceListItem[]> {
    try {
      const promises = items.map((item) => this.create(item));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error bulk creating price list items:", error);
      throw error;
    }
  },

  /**
   * Bulk update price list items
   */
  async bulkUpdate(
    updates: Array<{ id: string; data: Partial<PriceListItem> }>
  ): Promise<PriceListItem[]> {
    try {
      const promises = updates.map(({ id, data }) => this.update(id, data));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error bulk updating price list items:", error);
      throw error;
    }
  },
};
