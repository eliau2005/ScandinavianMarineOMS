import { databases, appwriteConfig } from "./appwrite";
import { ID, Query } from "appwrite";
import type {
  Order,
  OrderWithItems,
  CustomerSupplierAssociation,
  OrderItem,
} from "../types/order";
import {
  parseOrderItems,
  stringifyOrderItems,
  calculateOrderTotal,
  generateOrderNumber,
} from "../types/order";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATABASE_ID = appwriteConfig.databaseId;

const COLLECTIONS = {
  CUSTOMER_SUPPLIER_ASSOCIATIONS:
    appwriteConfig.customerSupplierAssocCollectionId ||
    import.meta.env.VITE_APPWRITE_CUSTOMER_SUPPLIER_ASSOC_COLLECTION_ID ||
    "customer_supplier_associations",
  ORDERS:
    appwriteConfig.ordersCollectionId ||
    import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID ||
    "orders",
};

// Debug logging
console.log("Order Service Configuration:", {
  DATABASE_ID,
  COLLECTIONS,
  appwriteConfig,
});

// ============================================================================
// CUSTOMER-SUPPLIER ASSOCIATIONS
// ============================================================================

export const associationService = {
  /**
   * Get all associations
   */
  async getAll(): Promise<CustomerSupplierAssociation[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CUSTOMER_SUPPLIER_ASSOCIATIONS,
        [Query.limit(1000)]
      );
      return response.documents as CustomerSupplierAssociation[];
    } catch (error) {
      console.error("Error fetching associations:", error);
      throw error;
    }
  },

  /**
   * Get associations by customer
   */
  async getByCustomer(customerId: string): Promise<CustomerSupplierAssociation[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CUSTOMER_SUPPLIER_ASSOCIATIONS,
        [Query.equal("customer_id", customerId), Query.equal("is_active", true)]
      );
      return response.documents as CustomerSupplierAssociation[];
    } catch (error) {
      console.error("Error fetching customer associations:", error);
      throw error;
    }
  },

  /**
   * Get associations by supplier
   */
  async getBySupplier(supplierId: string): Promise<CustomerSupplierAssociation[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CUSTOMER_SUPPLIER_ASSOCIATIONS,
        [Query.equal("supplier_id", supplierId), Query.equal("is_active", true)]
      );
      return response.documents as CustomerSupplierAssociation[];
    } catch (error) {
      console.error("Error fetching supplier associations:", error);
      throw error;
    }
  },

  /**
   * Check if customer can order from supplier
   */
  async canCustomerOrderFromSupplier(
    customerId: string,
    supplierId: string
  ): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CUSTOMER_SUPPLIER_ASSOCIATIONS,
        [
          Query.equal("customer_id", customerId),
          Query.equal("supplier_id", supplierId),
          Query.equal("is_active", true),
        ]
      );
      return response.documents.length > 0;
    } catch (error) {
      console.error("Error checking association:", error);
      return false;
    }
  },

  /**
   * Create a new association
   */
  async create(
    data: Omit<CustomerSupplierAssociation, "$id">
  ): Promise<CustomerSupplierAssociation> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CUSTOMER_SUPPLIER_ASSOCIATIONS,
        ID.unique(),
        data
      );
      return response as CustomerSupplierAssociation;
    } catch (error) {
      console.error("Error creating association:", error);
      throw error;
    }
  },

  /**
   * Update an association
   */
  async update(
    id: string,
    data: Partial<CustomerSupplierAssociation>
  ): Promise<CustomerSupplierAssociation> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CUSTOMER_SUPPLIER_ASSOCIATIONS,
        id,
        data
      );
      return response as CustomerSupplierAssociation;
    } catch (error) {
      console.error("Error updating association:", error);
      throw error;
    }
  },

  /**
   * Delete an association
   */
  async delete(id: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.CUSTOMER_SUPPLIER_ASSOCIATIONS,
        id
      );
    } catch (error) {
      console.error("Error deleting association:", error);
      throw error;
    }
  },

  /**
   * Deactivate an association (soft delete)
   */
  async deactivate(id: string): Promise<CustomerSupplierAssociation> {
    return this.update(id, { is_active: false });
  },

  /**
   * Activate an association
   */
  async activate(id: string): Promise<CustomerSupplierAssociation> {
    return this.update(id, { is_active: true });
  },
};

// ============================================================================
// ORDERS
// ============================================================================

export const orderService = {
  /**
   * Get all orders (admin only)
   */
  async getAll(): Promise<Order[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [Query.orderDesc("order_date"), Query.limit(1000)]
      );
      return response.documents as Order[];
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  /**
   * Get orders by customer
   */
  async getByCustomer(customerId: string): Promise<Order[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [Query.equal("customer_id", customerId), Query.orderDesc("order_date")]
      );
      return response.documents as Order[];
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      throw error;
    }
  },

  /**
   * Get orders by supplier (incoming orders)
   */
  async getBySupplier(supplierId: string): Promise<Order[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [Query.equal("supplier_id", supplierId), Query.orderDesc("order_date")]
      );
      return response.documents as Order[];
    } catch (error) {
      console.error("Error fetching supplier orders:", error);
      throw error;
    }
  },

  /**
   * Get a single order by ID
   */
  async getById(id: string): Promise<Order> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        id
      );
      return response as Order;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  },

  /**
   * Get order with parsed items
   */
  async getByIdWithItems(id: string): Promise<OrderWithItems> {
    try {
      const order = await this.getById(id);
      return {
        ...order,
        items: parseOrderItems(order.items),
      };
    } catch (error) {
      console.error("Error fetching order with items:", error);
      throw error;
    }
  },

  /**
   * Create a new order
   */
  async create(
    data: Omit<Order, "$id"> & { items: OrderItem[] }
  ): Promise<Order> {
    try {
      // Calculate total
      const total_amount = calculateOrderTotal(data.items);

      // Convert items to JSON string
      const items = stringifyOrderItems(data.items);

      // Generate order number if not provided
      const order_number = data.order_number || generateOrderNumber();

      const orderData = {
        ...data,
        order_number,
        items,
        total_amount,
        order_date: data.order_date || new Date().toISOString(),
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        ID.unique(),
        orderData
      );
      return response as Order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  /**
   * Update an order
   */
  async update(
    id: string,
    data: Partial<Order> & { items?: OrderItem[] }
  ): Promise<Order> {
    try {
      const updateData: any = { ...data };

      // If items are provided, calculate new total and convert to JSON
      if (data.items) {
        updateData.total_amount = calculateOrderTotal(data.items);
        updateData.items = stringifyOrderItems(data.items);
      }

      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        id,
        updateData
      );
      return response as Order;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },

  /**
   * Update order status
   */
  async updateStatus(
    id: string,
    status: Order["status"]
  ): Promise<Order> {
    return this.update(id, { status });
  },

  /**
   * Delete an order
   */
  async delete(id: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ORDERS, id);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },

  /**
   * Get orders by status
   */
  async getByStatus(status: Order["status"]): Promise<Order[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [Query.equal("status", status), Query.orderDesc("order_date")]
      );
      return response.documents as Order[];
    } catch (error) {
      console.error("Error fetching orders by status:", error);
      throw error;
    }
  },

  /**
   * Get orders by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [
          Query.greaterThanEqual("order_date", startDate),
          Query.lessThanEqual("order_date", endDate),
          Query.orderDesc("order_date"),
        ]
      );
      return response.documents as Order[];
    } catch (error) {
      console.error("Error fetching orders by date range:", error);
      throw error;
    }
  },

  /**
   * Get order statistics
   */
  async getStats(orders: Order[]): Promise<{
    total_orders: number;
    pending_orders: number;
    confirmed_orders: number;
    total_revenue: number;
    average_order_value: number;
  }> {
    const total_orders = orders.length;
    const pending_orders = orders.filter((o) => o.status === "pending").length;
    const confirmed_orders = orders.filter((o) => o.status === "confirmed").length;
    const total_revenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const average_order_value = total_orders > 0 ? total_revenue / total_orders : 0;

    return {
      total_orders,
      pending_orders,
      confirmed_orders,
      total_revenue,
      average_order_value,
    };
  },
};
