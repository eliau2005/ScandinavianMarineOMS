import React, { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import {
  getUnreadNotifications,
  markAsRead,
  type Notification,
} from "../../../lib/notificationService";
import { priceListService } from "../../../lib/priceListService";
import { orderService } from "../../../lib/orderService";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocalNotification {
  type: "success" | "error" | "info";
  message: string;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [localNotification, setLocalNotification] =
    useState<LocalNotification | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const unreadNotifs = await getUnreadNotifications();
      setNotifications(unreadNotifs);
    } catch (error) {
      console.error("Error loading notifications:", error);
      showLocalNotification("error", "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const showLocalNotification = (
    type: LocalNotification["type"],
    message: string
  ) => {
    setLocalNotification({ type, message });
    setTimeout(() => setLocalNotification(null), 3000);
  };

  const handleApprove = async (notification: Notification) => {
    setProcessing(notification.$id!);
    try {
      if (notification.type === "price_list_pending_approval") {
        // Approve price list - activate it
        await priceListService.activate(notification.related_item_id);
        showLocalNotification("success", "Price list activated successfully");
      } else if (notification.type === "order_pending_approval") {
        // Approve order - change status to pending
        await orderService.updateStatus(notification.related_item_id, "pending");
        showLocalNotification(
          "success",
          "Order approved and sent to supplier"
        );
      }

      // Mark notification as read
      await markAsRead(notification.$id!);

      // Reload notifications
      await loadNotifications();
    } catch (error) {
      console.error("Error approving:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to approve";
      showLocalNotification("error", errorMessage);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (notification: Notification) => {
    setProcessing(notification.$id!);
    try {
      if (notification.type === "price_list_pending_approval") {
        // Reject price list - set back to draft
        await priceListService.update(notification.related_item_id, {
          status: "draft",
        });
        showLocalNotification("success", "Price list rejected and set to draft");
      } else if (notification.type === "order_pending_approval") {
        // Reject order - cancel it
        await orderService.updateStatus(
          notification.related_item_id,
          "cancelled"
        );
        showLocalNotification("success", "Order rejected and cancelled");
      }

      // Mark notification as read
      await markAsRead(notification.$id!);

      // Reload notifications
      await loadNotifications();
    } catch (error) {
      console.error("Error rejecting:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reject";
      showLocalNotification("error", errorMessage);
    } finally {
      setProcessing(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type === "price_list_pending_approval") {
      return "receipt_long";
    } else if (type === "order_pending_approval") {
      return "shopping_cart";
    }
    return "notifications";
  };

  const getNotificationColor = (type: string) => {
    if (type === "price_list_pending_approval") {
      return "text-purple-600 dark:text-purple-400";
    } else if (type === "order_pending_approval") {
      return "text-blue-600 dark:text-blue-400";
    }
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pending Approvals" wide>
      {/* Local Notification */}
      {localNotification && (
        <div className="mb-4">
          <div
            className={`px-4 py-3 rounded-lg ${
              localNotification.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : localNotification.type === "error"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            }`}
          >
            <p className="text-sm font-medium">{localNotification.message}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-admin-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading notifications...
            </p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            notifications_none
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            No pending approvals
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            All caught up! Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.$id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span
                    className={`material-symbols-outlined text-3xl ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    From: {notification.created_by_name}
                  </p>
                  {notification.$createdAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(notification.$createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => handleApprove(notification)}
                  disabled={processing === notification.$id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === notification.$id ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-base">
                        progress_activity
                      </span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">
                        check_circle
                      </span>
                      <span>Approve</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(notification)}
                  disabled={processing === notification.$id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === notification.$id ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-base">
                        progress_activity
                      </span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">
                        cancel
                      </span>
                      <span>Reject</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default NotificationsModal;
