import { ID, Permission, Role } from "appwrite";
import { databases, appwriteConfig } from "./appwrite";

// ============================================================================
// TYPES
// ============================================================================

export interface Notification {
  $id?: string;
  type: "order_pending_approval" | "price_list_pending_approval";
  message: string;
  related_item_id: string; // Order ID or Price List ID
  created_by_name: string;
  is_read: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

/**
 * Create a new notification
 * @param type - Type of notification (order_pending_approval or price_list_pending_approval)
 * @param message - Notification message
 * @param related_item_id - ID of the related order or price list
 * @param created_by_name - Name of the user who triggered the notification
 * @returns The created notification document
 */
export const createNotification = async (
  type: "order_pending_approval" | "price_list_pending_approval",
  message: string,
  related_item_id: string,
  created_by_name: string
): Promise<Notification> => {
  try {
    const notification = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      ID.unique(),
      {
        type,
        message,
        related_item_id,
        created_by_name,
        is_read: false,
      },
      [
        Permission.read(Role.any()), // All authenticated users can read
        Permission.update(Role.any()), // All authenticated users can update (mark as read)
        Permission.delete(Role.any()), // All authenticated users can delete
      ]
    );

    return notification as Notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get all unread notifications
 * @returns Array of unread notifications
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId
    );

    // Filter for unread notifications
    const unreadNotifications = response.documents.filter(
      (doc) => doc.is_read === false
    );

    return unreadNotifications as Notification[];
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param notificationId - ID of the notification to mark as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      notificationId,
      {
        is_read: true,
      }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param notificationId - ID of the notification to delete
 */
export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      notificationId
    );
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

/**
 * Get all notifications (read and unread)
 * @returns Array of all notifications
 */
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId
    );

    return response.documents as Notification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};
