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
  onCancelRequest?: () => void;
  onCreateNewDraft?: () => void;
  disableSetActive?: boolean;
  disableSetActiveReason?: string;
}

const PriceListCard: React.FC<PriceListCardProps> = ({
  priceList,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onSetActive,
  onCancelRequest,
  onCreateNewDraft,
  disableSetActive = false,
  disableSetActiveReason,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "pending_approval":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
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
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-supplier-accent">
      <div className="p-6 flex flex-col h-full">
        {/* Status Badges - Top Right */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
              priceList.status
            )}`}
          >
            {priceList.status === "pending_approval" ? "Pending Approval" : priceList.status}
          </span>
          {priceList.is_default && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Default
            </span>
          )}
        </div>

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {priceList.name}
          </h3>
          <div className="h-1 w-12 bg-supplier-accent rounded"></div>
        </div>

        {/* Supplier Name */}
        <div className="flex-1 mb-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Supplier
          </p>
          <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {priceList.supplier_name}
          </p>
        </div>

        {/* Dates */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
              schedule
            </span>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Validity Period
            </h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Effective:
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {formatDate(priceList.effective_date)}
              </span>
            </div>
            {priceList.expiry_date && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Expires:
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {formatDate(priceList.expiry_date)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {priceList.notes && (
          <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {priceList.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-100 dark:border-gray-700">
          {onView && (
            <button
              onClick={onView}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-supplier-accent rounded-lg hover:bg-opacity-90 hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-base">
                visibility
              </span>
              <span>View</span>
            </button>
          )}
          {onEdit && priceList.status === "draft" && (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              <span>Edit</span>
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md transition-all"
              title="Duplicate"
            >
              <span className="material-symbols-outlined text-base">
                content_copy
              </span>
            </button>
          )}
          {onSetActive && priceList.status === "draft" && (
            <button
              onClick={disableSetActive ? undefined : onSetActive}
              disabled={disableSetActive}
              className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                disableSetActive
                  ? "text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  : "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 hover:shadow-md"
              }`}
              title={disableSetActive ? disableSetActiveReason : "Set Active"}
            >
              <span className="material-symbols-outlined text-base">
                check_circle
              </span>
            </button>
          )}
          {onCancelRequest && priceList.status === "pending_approval" && (
            <button
              onClick={onCancelRequest}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 hover:shadow-md transition-all"
              title="Cancel Approval Request"
            >
              <span className="material-symbols-outlined text-base">
                cancel
              </span>
              <span>Cancel Request</span>
            </button>
          )}
          {onCreateNewDraft && priceList.status === "active" && (
            <button
              onClick={onCreateNewDraft}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 hover:shadow-md transition-all"
              title="Create New Draft"
            >
              <span className="material-symbols-outlined text-base">
                content_copy
              </span>
              <span>Create New Draft</span>
            </button>
          )}
          {onDelete && priceList.status === "draft" && (
            <button
              onClick={onDelete}
              className="px-3 py-2.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 hover:shadow-md transition-all"
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
