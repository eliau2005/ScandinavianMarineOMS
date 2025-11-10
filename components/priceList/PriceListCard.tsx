import React from "react";
import { format } from "date-fns";
import type { PriceList } from "../../types/priceList";

interface PriceListCardProps {
  priceList: PriceList;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSetActive?: () => void;
}

const PriceListCard: React.FC<PriceListCardProps> = ({
  priceList,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onSetActive,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
              {priceList.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {priceList.supplier_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                priceList.status
              )}`}
            >
              {priceList.status}
            </span>
            {priceList.is_default && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Default
              </span>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="material-symbols-outlined text-base">
              calendar_today
            </span>
            <span>
              Effective: <strong>{formatDate(priceList.effective_date)}</strong>
            </span>
          </div>
          {priceList.expiry_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="material-symbols-outlined text-base">
                event_busy
              </span>
              <span>
                Expires: <strong>{formatDate(priceList.expiry_date)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {priceList.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {priceList.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onView && (
            <button
              onClick={onView}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-supplier-accent bg-supplier-accent bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                visibility
              </span>
              <span>View</span>
            </button>
          )}
          {onEdit && priceList.status !== "archived" && (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              <span>Edit</span>
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Duplicate"
            >
              <span className="material-symbols-outlined text-base">
                content_copy
              </span>
            </button>
          )}
          {onSetActive && priceList.status === "draft" && (
            <button
              onClick={onSetActive}
              className="px-3 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              title="Set Active"
            >
              <span className="material-symbols-outlined text-base">
                check_circle
              </span>
            </button>
          )}
          {onDelete && priceList.status !== "active" && (
            <button
              onClick={onDelete}
              className="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              title="Delete"
            >
              <span className="material-symbols-outlined text-base">
                delete
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceListCard;
