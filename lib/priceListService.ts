import { databases, appwriteConfig, account } from "./appwrite";
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
import { associationService } from "./orderService";
import { createNotification } from "./notificationService";

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
        [Query.orderAsc("display_order")]
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
        [Query.orderAsc("display_order"), Query.limit(100)]
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
      console.log("Creating product with data:", data); // Debugging line
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
   * Get all price lists (admin only)
   */
  async getAll(): Promise<PriceList[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRICE_LISTS,
        [Query.orderDesc("effective_date"), Query.limit(1000)]
      );
      return response.documents as PriceList[];
    } catch (error) {
      console.error("Error fetching all price lists:", error);
      throw error;
    }
  },

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
   * Activate a price list (set status to 'active')
   * - Validates that all active products have prices
   * - Automatically archives any currently active price list for this supplier
   * - Only one price list can be active at a time per supplier
   */
  async activate(id: string): Promise<PriceList> {
    try {
      // Get the price list being activated
      const priceList = await this.getById(id);

      // Get all items in this price list
      const items = await priceListItemService.getByPriceList(id);

      // Get all active products
      const allProducts = await productService.getAll();
      const activeProducts = allProducts.filter((p) => p.is_active);

      // Check if all active products have prices in this price list
      const productsWithPrices = new Set(items.map((item) => item.product_id));
      const productsWithoutPrices = activeProducts.filter(
        (product) => !productsWithPrices.has(product.$id!)
      );

      if (productsWithoutPrices.length > 0) {
        const productNames = productsWithoutPrices
          .slice(0, 3)
          .map((p) => p.name)
          .join(", ");
        const moreCount = productsWithoutPrices.length - 3;
        const errorMsg =
          productsWithoutPrices.length <= 3
            ? `Cannot activate price list. The following active products do not have prices: ${productNames}`
            : `Cannot activate price list. ${productsWithoutPrices.length} active products do not have prices (${productNames}${moreCount > 0 ? ` and ${moreCount} more` : ""})`;
        throw new Error(errorMsg);
      }

      // Archive any currently active price lists for this supplier
      const activePriceLists = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRICE_LISTS,
        [
          Query.equal("supplier_id", priceList.supplier_id),
          Query.equal("status", "active"),
        ]
      );

      // Archive all currently active price lists
      await Promise.all(
        activePriceLists.documents.map((activeList) =>
          this.update(activeList.$id, { status: "archived" })
        )
      );

      // Activate the new price list
      const activatedPriceList = await this.update(id, { status: "active" });

      // Get current admin user for notification
      let adminName = "Admin";
      let adminId = "";
      try {
        const currentUser = await account.get();
        adminName = currentUser.name;
        adminId = currentUser.$id;
      } catch (error) {
        console.error("Could not get current user for notification:", error);
      }

      // Create notifications
      try {
        // 1. Notify the supplier that their price list was approved
        // IMPORTANT: Only supplier_id is set, NO customer_id
        await createNotification(
          "price_list_approved",
          `Your price list "${priceList.name}" has been approved and is now active`,
          id,
          adminName,
          adminId,
          priceList.supplier_id, // Set supplier_id so it's fetched by supplier query
          undefined // NO customer_id - supplier notification only
        );

        // 2. Notify all customers associated with this supplier about the new price list
        // IMPORTANT: Only customer_id is set, NO supplier_id
        const associations = await associationService.getBySupplier(priceList.supplier_id);
        await Promise.all(
          associations.map((association) =>
            createNotification(
              "price_list_approved",
              `Updated price list "${priceList.name}" from ${priceList.supplier_name} is now available`,
              id,
              adminName,
              adminId,
              undefined, // NO supplier_id - customer notification only
              association.customer_id // Set customer_id so it's fetched by customer query
            )
          )
        );
      } catch (error) {
        console.error("Error creating price list approval notifications:", error);
        // Don't fail the activation if notification creation fails
      }

      return activatedPriceList;
    } catch (error) {
      console.error("Error activating price list:", error);
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
   * Get price list items formatted for display in PriceTable
   */
  async getItems(id: string): Promise<any[]> {
    try {
      const [items, products, categories] = await Promise.all([
        priceListItemService.getByPriceList(id),
        productService.getAll(),
        productCategoryService.getAll(),
      ]);

      const productMap = new Map(products.map((p) => [p.$id!, p]));
      const categoryMap = new Map(categories.map((c) => [c.$id!, c]));

      return items
        .map((item) => {
          const product = productMap.get(item.product_id);
          if (!product) return null;

          const category = categoryMap.get(product.category_id);

          return {
            product,
            category,
            price_box: item.price_box,
            vac_surcharge_per_kg: item.vac_surcharge_per_kg,
            is_available: item.is_available,
            notes: item.notes,
          };
        })
        .filter((item) => item !== null);
    } catch (error) {
      console.error("Error fetching price list items:", error);
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
   * Check if products are being used in non-draft price lists
   * Returns an error if products are in use, otherwise returns null
   */
  async checkProductsInUse(productIds: string[]): Promise<{
    inUse: boolean;
    priceListNames: string[];
    statuses: string[];
  }> {
    try {
      if (productIds.length === 0) {
        return { inUse: false, priceListNames: [], statuses: [] };
      }

      // Get all non-draft price lists (active, pending_approval, archived)
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRICE_LISTS,
        [
          Query.notEqual("status", "draft"),
          Query.limit(1000)
        ]
      );

      const nonDraftPriceLists = response.documents as PriceList[];
      const foundInPriceLists: { name: string; status: string }[] = [];

      // Check each non-draft price list for the products
      for (const priceList of nonDraftPriceLists) {
        const items = await priceListItemService.getByPriceList(priceList.$id!);
        const hasProduct = items.some((item) => productIds.includes(item.product_id));

        if (hasProduct) {
          foundInPriceLists.push({
            name: priceList.name,
            status: priceList.status,
          });
        }
      }

      return {
        inUse: foundInPriceLists.length > 0,
        priceListNames: foundInPriceLists.map((pl) => pl.name),
        statuses: foundInPriceLists.map((pl) => pl.status),
      };
    } catch (error) {
      console.error("Error checking products in use:", error);
      throw error;
    }
  },

  /**
   * Duplicate a price list
   */
  async duplicate(
    id: string,
    newEffectiveDate: string,
    newExpiryDate: string
  ): Promise<PriceList> {
    try {
      const original = await this.getWithItems(id);

      // Auto-generate name from dates
      const { generatePriceListName } = await import("../types/priceList");
      const newName = generatePriceListName(newEffectiveDate, newExpiryDate);

      // Create new price list
      const newPriceList = await this.create({
        name: newName,
        supplier_id: original.supplier_id,
        supplier_name: original.supplier_name,
        effective_date: newEffectiveDate,
        expiry_date: newExpiryDate,
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
              vac_surcharge_per_kg: item.vac_surcharge_per_kg,
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

// Export unit of measure service
export { unitOfMeasureService } from "./unitOfMeasureService";
