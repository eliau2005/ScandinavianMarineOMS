import { databases, appwriteConfig } from "./appwrite";
import { Query } from "appwrite";
import type { UnitOfMeasure } from "../types/priceList";
import { ID } from "appwrite";

/**
 * Unit of Measure Service
 * Handles CRUD operations for custom units of measure
 */
export const unitOfMeasureService = {
  /**
   * Get all units for a supplier
   */
  async getBySupplier(supplierId: string): Promise<UnitOfMeasure[]> {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.unitsOfMeasureCollectionId,
        [
          Query.equal("supplier_id", supplierId),
          Query.equal("is_active", true),
          Query.orderAsc("display_order"),
          Query.orderAsc("unit_name"),
        ]
      );
      return response.documents as unknown as UnitOfMeasure[];
    } catch (error) {
      console.error("Error fetching units:", error);
      throw error;
    }
  },

  /**
   * Create a new unit of measure
   */
  async create(data: Omit<UnitOfMeasure, "$id">): Promise<UnitOfMeasure> {
    try {
      // Check if unit already exists for this supplier
      const existing = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.unitsOfMeasureCollectionId,
        [
          Query.equal("supplier_id", data.supplier_id),
          Query.equal("unit_name", data.unit_name),
        ]
      );

      if (existing.documents.length > 0) {
        throw new Error("This unit of measure already exists");
      }

      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.unitsOfMeasureCollectionId,
        ID.unique(),
        data
      );
      return response as unknown as UnitOfMeasure;
    } catch (error) {
      console.error("Error creating unit:", error);
      throw error;
    }
  },

  /**
   * Update a unit of measure
   */
  async update(
    id: string,
    data: Partial<UnitOfMeasure>
  ): Promise<UnitOfMeasure> {
    try {
      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.unitsOfMeasureCollectionId,
        id,
        data
      );
      return response as unknown as UnitOfMeasure;
    } catch (error) {
      console.error("Error updating unit:", error);
      throw error;
    }
  },

  /**
   * Delete a unit of measure
   */
  async delete(id: string): Promise<void> {
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.unitsOfMeasureCollectionId,
        id
      );
    } catch (error) {
      console.error("Error deleting unit:", error);
      throw error;
    }
  },

  /**
   * Create default "box" unit for a supplier
   */
  async createDefaultUnit(
    supplierId: string,
    supplierName: string
  ): Promise<UnitOfMeasure> {
    try {
      // Check if box already exists
      const existing = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.unitsOfMeasureCollectionId,
        [
          Query.equal("supplier_id", supplierId),
          Query.equal("unit_name", "box"),
        ]
      );

      if (existing.documents.length > 0) {
        return existing.documents[0] as unknown as UnitOfMeasure;
      }

      return await this.create({
        supplier_id: supplierId,
        supplier_name: supplierName,
        unit_name: "box",
        is_default: true,
        display_order: 0,
        is_active: true,
      });
    } catch (error) {
      console.error("Error creating default unit:", error);
      throw error;
    }
  },
};
