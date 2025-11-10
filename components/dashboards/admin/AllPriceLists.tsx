import React, { useState, useEffect } from "react";
import { priceListService } from "../../../lib/priceListService";
import type { PriceList } from "../../../types/priceList";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import PriceTable from "../../priceList/PriceTable";
import type { PriceListTableRow } from "../../../types/priceList";
import { markAsRead } from "../../../lib/notificationService";

const AllPriceLists = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [priceListItems, setPriceListItems] = useState<PriceListTableRow[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "pending_approval" | "active" | "archived">("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadPriceLists();
  }, []);

  const loadPriceLists = async () => {
    setLoading(true);
    try {
      const priceListsData = await priceListService.getAll();
      setPriceLists(priceListsData);
    } catch (error) {
      console.error("Error loading price lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (priceList: PriceList) => {
    try {
      const items = await priceListService.getItems(priceList.$id!);
      setPriceListItems(items);
      setSelectedPriceList(priceList);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error loading price list items:", error);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApprovePriceList = async (priceList: PriceList) => {
    setProcessing(priceList.$id!);
    try {
      // Activate the price list
      await priceListService.activate(priceList.$id!);

      // Reload price lists
      await loadPriceLists();

      showNotification("success", `Price list "${priceList.name}" has been activated successfully`);
    } catch (error) {
      console.error("Error approving price list:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to approve price list";
      showNotification("error", errorMessage);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectPriceList = async (priceList: PriceList) => {
    setProcessing(priceList.$id!);
    try {
      // Set status back to draft
      await priceListService.update(priceList.$id!, {
        status: "draft",
      });

      // Reload price lists
      await loadPriceLists();

      showNotification("success", `Price list "${priceList.name}" has been rejected and set back to draft`);
    } catch (error) {
      console.error("Error rejecting price list:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reject price list";
      showNotification("error", errorMessage);
    } finally {
      setProcessing(null);
    }
  };

  // Get unique suppliers for filter
  const uniqueSuppliers = Array.from(
    new Set(priceLists.map((pl) => pl.supplier_name))
  ).sort();

  // Filter price lists
  const filteredPriceLists = priceLists.filter((priceList) => {
    const matchesSearch =
      priceList.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      priceList.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier =
      filterSupplier === "" || priceList.supplier_name === filterSupplier;
    const matchesStatus =
      filterStatus === "all" || priceList.status === filterStatus;
    return matchesSearch && matchesSupplier && matchesStatus;
  });

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

  const getStatusLabel = (status: string) => {
    if (status === "pending_approval") {
      return "Pending Approval";
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Group by supplier
  const groupedBySupplier = uniqueSuppliers.map((supplierName) => ({
    supplierName,
    priceLists: filteredPriceLists.filter(
      (pl) => pl.supplier_name === supplierName
    ),
  }));

  // Count pending approvals
  const pendingApprovalsCount = priceLists.filter(
    (pl) => pl.status === "pending_approval"
  ).length;

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          All Price Lists
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View and compare price lists from all suppliers
          {pendingApprovalsCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {pendingApprovalsCount} Pending Approval
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search price lists or suppliers..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent"
              />
            </div>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Supplier
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent"
            >
              <option value="">All Suppliers</option>
              {uniqueSuppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval ({pendingApprovalsCount})</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-admin-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading price lists...</p>
          </div>
        </div>
      ) : filteredPriceLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            receipt_long
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            No price lists found
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedBySupplier
            .filter((group) => group.priceLists.length > 0)
            .map(({ supplierName, priceLists: supplierPriceLists }) => (
              <div
                key={supplierName}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
              >
                {/* Supplier Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                      store
                    </span>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {supplierName}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({supplierPriceLists.length}{" "}
                      {supplierPriceLists.length === 1 ? "price list" : "price lists"})
                    </span>
                  </div>
                </div>

                {/* Price Lists Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Effective Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Expiry Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {supplierPriceLists.map((priceList) => (
                        <tr
                          key={priceList.$id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                            {priceList.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(priceList.effective_date), "MMM dd, yyyy")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {priceList.expiry_date
                              ? format(new Date(priceList.expiry_date), "MMM dd, yyyy")
                              : "No expiry"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                                priceList.status
                              )}`}
                            >
                              {getStatusLabel(priceList.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {priceList.status === "pending_approval" ? (
                                <>
                                  <button
                                    onClick={() => handleApprovePriceList(priceList)}
                                    disabled={processing === priceList.$id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {processing === priceList.$id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        <span>Approving...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="material-symbols-outlined text-sm">
                                          check_circle
                                        </span>
                                        <span>Approve</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRejectPriceList(priceList)}
                                    disabled={processing === priceList.$id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {processing === priceList.$id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        <span>Rejecting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="material-symbols-outlined text-sm">
                                          cancel
                                        </span>
                                        <span>Reject</span>
                                      </>
                                    )}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleViewDetails(priceList)}
                                  className="text-admin-accent hover:text-opacity-80 text-sm font-medium"
                                >
                                  View Details
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedPriceList && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPriceList(null);
            setPriceListItems([]);
          }}
          title={selectedPriceList.name}
          wide
        >
          <div className="space-y-4">
            {/* Price List Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Supplier</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {selectedPriceList.supplier_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                    selectedPriceList.status
                  )}`}
                >
                  {selectedPriceList.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Effective Date</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {format(new Date(selectedPriceList.effective_date), "MMMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Expiry Date</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {selectedPriceList.expiry_date
                    ? format(new Date(selectedPriceList.expiry_date), "MMMM dd, yyyy")
                    : "No expiry"}
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedPriceList.notes && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {selectedPriceList.notes}
                </p>
              </div>
            )}

            {/* Price Table */}
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Products & Pricing
              </h4>
              {priceListItems.length > 0 ? (
                <PriceTable
                  data={priceListItems}
                  showVacPricing={selectedPriceList.show_vac_pricing || false}
                  editable={false}
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No products in this price list
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AllPriceLists;
