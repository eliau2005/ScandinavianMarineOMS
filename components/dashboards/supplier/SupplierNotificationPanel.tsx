import React, { useState, useEffect } from "react";
import { account } from "../../../lib/appwrite";
import { getUnreadNotifications, markAsRead, type Notification } from "../../../lib/notificationService";
import { format } from "date-fns";

interface SupplierNotificationPanelProps {
  onNotificationClick?: (notification: Notification) => void;
}

const SupplierNotificationPanel: React.FC<SupplierNotificationPanelProps> = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUserId]);

  const loadCurrentUser = async () => {
    try {
      const user = await account.get();
      setCurrentUserId(user.$id);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const unreadNotifications = await getUnreadNotifications();

      // Filter notifications relevant to this supplier
      // For now, we'll show all unread notifications
      // You can add additional filtering logic here if needed
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (notification.$id) {
        await markAsRead(notification.$id);
        // Remove from local state
        setNotifications((prev) => prev.filter((n) => n.$id !== notification.$id));
      }

      // Call parent handler if provided
      if (onNotificationClick) {
        onNotificationClick(notification);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
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
    <div className="w-80 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h3>
          {notifications.length > 0 && (
            <span className="flex items-center justify-center h-6 min-w-6 px-2 bg-supplier-accent text-white text-xs font-bold rounded-full">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-supplier-accent"></div>
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
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-supplier-accent bg-opacity-10">
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
                      <div className="w-2 h-2 rounded-full bg-supplier-accent"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierNotificationPanel;
