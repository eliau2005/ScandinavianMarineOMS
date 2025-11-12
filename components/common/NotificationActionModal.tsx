import React from "react";
import Modal from "./Modal";
import type { Notification } from "../../lib/notificationService";

interface NotificationActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
  onApprove: () => void;
  onView: () => void;
  isProcessing?: boolean;
}

const NotificationActionModal: React.FC<NotificationActionModalProps> = ({
  isOpen,
  onClose,
  notification,
  onApprove,
  onView,
  isProcessing = false,
}) => {
  if (!notification) return null;

  const getActionType = () => {
    if (notification.type === "order_pending_approval") {
      return {
        title: "Order Pending Approval",
        icon: "shopping_cart",
        iconColor: "text-blue-600",
        description: "An order is awaiting your approval.",
      };
    } else {
      return {
        title: "Price List Pending Approval",
        icon: "receipt_long",
        iconColor: "text-purple-600",
        description: "A price list is awaiting your approval.",
      };
    }
  };

  const actionType = getActionType();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={actionType.title}>
      <div className="space-y-4">
        {/* Icon and Description */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-admin-accent bg-opacity-10">
              <span className={`material-symbols-outlined text-2xl ${actionType.iconColor}`}>
                {actionType.icon}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {actionType.description}
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              From: {notification.created_by_name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onView}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            <span>View Details</span>
          </button>
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Approving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Approve</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationActionModal;
