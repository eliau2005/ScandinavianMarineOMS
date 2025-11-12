import React, { useState, useEffect } from "react";
import { getUnreadNotifications, markAsRead, type Notification } from "../../../lib/notificationService";
import { orderService } from "../../../lib/orderService";
import { priceListService } from "../../../lib/priceListService";
import NotificationActionModal from "../../common/NotificationActionModal";
import { format } from "date-fns";

interface AdminNotificationPanelProps {
  onNotificationClick?: (notification: Notification) => void;
  onViewItem?: (notification: Notification) => void;
}

const AdminNotificationPanel: React.FC<AdminNotificationPanelProps> = ({
  onNotificationClick,
  onViewItem
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const unreadNotifications = await getUnreadNotifications();
      // Admin sees all unread notifications (order and price list approvals)
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowActionModal(true);
  };

  const handleApprove = async () => {
    if (!selectedNotification) return;

    setIsProcessing(true);
    try {
      if (selectedNotification.type === "order_pending_approval") {
        // Approve order - change status to pending (sent to supplier)
        await orderService.updateStatus(
          selectedNotification.related_item_id,
          "pending"
        );
      } else if (selectedNotification.type === "price_list_pending_approval") {
        // Approve price list - activate it
        await priceListService.activate(selectedNotification.related_item_id);
      }

      // Mark notification as read
      if (selectedNotification.$id) {
        await markAsRead(selectedNotification.$id);
      }

      // Remove from local state
      setNotifications((prev) =>
        prev.filter((n) => n.$id !== selectedNotification.$id)
      );

      // Close modal
      setShowActionModal(false);
      setSelectedNotification(null);

      // Reload notifications
      await loadNotifications();
    } catch (error) {
      console.error("Error approving:", error);
      alert("Failed to approve. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleView = () => {
    if (!selectedNotification) return;

    // Mark as read
    if (selectedNotification.$id) {
      markAsRead(selectedNotification.$id).then(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.$id !== selectedNotification.$id)
        );
      });
    }

    // Close action modal
    setShowActionModal(false);

    // Call parent handlers to navigate and open detail modal
    if (onViewItem) {
      onViewItem(selectedNotification);
    }

    setSelectedNotification(null);
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order_pending_approval":
        return "shopping_cart";
      case "price_list_pending_approval":
        return "receipt_long";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "order_pending_approval":
        return "text-blue-600 dark:text-blue-400";
      case "price_list_pending_approval":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h3>
          {notifications.length > 0 && (
            <span className="flex items-center justify-center h-6 min-w-6 px-2 bg-admin-accent text-white text-xs font-bold rounded-full">
              {notifications.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 px-4">
            <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-600 mb-2">
              notifications_off
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              No new notifications
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <button
                key={notification.$id}
                onClick={() => handleNotificationClick(notification)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-admin-accent bg-opacity-10">
                      <span className={`material-symbols-outlined text-xl ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {notification.created_by_name}
                      </span>
                      {notification.$createdAt && (
                        <>
                          <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(notification.$createdAt), "MMM dd, h:mm a")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-admin-accent"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notification Action Modal */}
      <NotificationActionModal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedNotification(null);
        }}
        notification={selectedNotification}
        onApprove={handleApprove}
        onView={handleView}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default AdminNotificationPanel;
