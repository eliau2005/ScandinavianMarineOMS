import { ID, Permission, Role, Query } from "appwrite";
import { databases, appwriteConfig } from "./appwrite";

// ============================================================================
// TYPES
// ============================================================================

export interface Notification {
  $id?: string;
  type:
    | "order_pending_approval"
    | "price_list_pending_approval"
    | "price_list_approved"
    | "order_status_changed";
  message: string;
  related_item_id: string;
  created_by_name: string;
  recipient_id: string; // User ID of the recipient
  is_read: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

/**
 * Create a new notification
 * @param type - Type of notification
 * @param message - Notification message
 * @param related_item_id - ID of the related item
 * @param created_by_name - Name of the user who triggered the notification
 * @param recipient_id - User ID of the recipient
 * @returns The created notification document
 */
export const createNotification = async (
  type: Notification["type"],
  message: string,
  related_item_id: string,
  created_by_name: string,
  recipient_id: string
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
        recipient_id,
        is_read: false,
      },
      [
        Permission.read(Role.user(recipient_id)),
        Permission.update(Role.user(recipient_id)),
        Permission.delete(Role.user(recipient_id)),
      ]
    );

    return notification as Notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get all unread notifications for a specific user
 * @param userId - The ID of the user to fetch notifications for
 * @returns Array of unread notifications
 */
export const getUnreadNotifications = async (
  userId: string
): Promise<Notification[]> => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      [
        Query.equal("recipient_id", userId),
        Query.equal("is_read", false),
        Query.orderDesc("$createdAt"),
      ]
    );
    return response.documents as Notification[];
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
