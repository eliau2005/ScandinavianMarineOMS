import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { orderService } from "../../../lib/orderService";
import type { Order } from "../../../types/order";
import { parseOrderItems, getStatusColor, getStatusLabel } from "../../../types/order";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OrderPDFDocument from "../../pdf/OrderPDFDocument";

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

interface OrdersOverviewProps {
  openOrderId?: string | null;
  onOrderModalClosed?: () => void;
}

const OrdersOverview: React.FC<OrdersOverviewProps> = ({
  openOrderId,
  onOrderModalClosed,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState<Order["status"] | "all">("all");
  const [isApproving, setIsApproving] = useState(false);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [orders]);

  // Auto-open modal when openOrderId is provided
  useEffect(() => {
    if (openOrderId && orders.length > 0) {
      const order = orders.find((o) => o.$id === openOrderId);
      if (order) {
        handleViewDetails(order);
      }
      // Clear the openOrderId after attempting to open
      if (onOrderModalClosed) {
        onOrderModalClosed();
      }
    }
  }, [openOrderId, orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const ordersData = await orderService.getAll();
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const newStats: OrderStats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
    };

    orders.forEach((order) => {
      newStats[order.status]++;
      if (order.status !== "cancelled") {
        newStats.totalRevenue += order.total_amount;
      }
    });

    setStats(newStats);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;

    setIsApproving(true);
    try {
      // Approve order - change status to pending (sent to supplier)
      await orderService.updateStatus(selectedOrder.$id!, "pending");

      // Reload orders
      await loadOrders();

      // Close modal
      setShowDetailsModal(false);
      setSelectedOrder(null);

      // Show success toast
      toast.success("Order approved successfully!");
    } catch (error) {
      console.error("Error approving order:", error);
      toast.error("Failed to approve order. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  // Get unique customers and suppliers for filters
  const uniqueCustomers = Array.from(
    new Set(orders.map((o) => o.customer_name))
  ).sort();
  const uniqueSuppliers = Array.from(
    new Set(orders.map((o) => o.supplier_name))
  ).sort();

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer =
      filterCustomer === "" || order.customer_name === filterCustomer;
    const matchesSupplier =
      filterSupplier === "" || order.supplier_name === filterSupplier;
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesCustomer && matchesSupplier && matchesStatus;
  });

  const statCards = [
    {
      label: "Total Orders",
      value: stats.total,
      icon: "shopping_cart",
      color: "bg-blue-500",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: "schedule",
      color: "bg-yellow-500",
    },
    {
      label: "In Progress",
      value: stats.confirmed + stats.processing + stats.shipped,
      icon: "local_shipping",
      color: "bg-purple-500",
    },
    {
      label: "Delivered",
      value: stats.delivered,
      icon: "check_circle",
      color: "bg-green-500",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: "cancel",
      color: "bg-red-500",
    },
    {
      label: "Total Revenue",
      value: `€ ${stats.totalRevenue.toFixed(2)}`,
      icon: "euro",
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Orders Overview
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage all orders across the system
          </p>
        </div>
        {filteredOrders.length > 0 && (
          <PDFDownloadLink
            document={<OrderPDFDocument orders={filteredOrders} />}
            fileName={`Admin-Orders-${format(new Date(), "yyyy-MM-dd")}.pdf`}
            className="flex items-center gap-2 px-4 py-2 bg-admin-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            {({ loading }) => (
              <>
                <span className="material-symbols-outlined text-base">
                  picture_as_pdf
                </span>
                <span>{loading ? "Generating..." : "Export Filtered Orders"}</span>
              </>
            )}
          </PDFDownloadLink>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`${card.color} text-white p-2 rounded-lg material-symbols-outlined text-base`}
              >
                {card.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {card.value}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                placeholder="Order #, customer, supplier..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent"
              />
            </div>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer
            </label>
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent"
            >
              <option value="">All Customers</option>
              {uniqueCustomers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-admin-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            receipt_long
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            No orders found
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.$id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                      {order.supplier_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(order.order_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">
                      € {order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-admin-accent hover:text-opacity-80 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          title={`Order ${selectedOrder.order_number}`}
          wide
        >
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mb-4">
              {selectedOrder.status === "pending_approval" && (
                <button
                  onClick={handleApproveOrder}
                  disabled={isApproving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApproving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">
                        check_circle
                      </span>
                      <span>Approve Order</span>
                    </>
                  )}
                </button>
              )}
              <PDFDownloadLink
                document={<OrderPDFDocument order={selectedOrder} />}
                fileName={`Order-${selectedOrder.order_number}.pdf`}
                className="flex items-center gap-2 px-4 py-2 bg-admin-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
              >
                {({ loading }) => (
                  <>
                    <span className="material-symbols-outlined text-base">
                      picture_as_pdf
                    </span>
                    <span>{loading ? "Generating..." : "Export PDF"}</span>
                  </>
                )}
              </PDFDownloadLink>
            </div>
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {selectedOrder.customer_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Supplier</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {selectedOrder.supplier_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Price List</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {selectedOrder.price_list_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Order Date</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {format(new Date(selectedOrder.order_date), "MMMM dd, yyyy")}
                </p>
              </div>
              {selectedOrder.requested_delivery_date && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Requested Delivery
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {format(
                      new Date(selectedOrder.requested_delivery_date),
                      "MMMM dd, yyyy"
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Order Items
              </h4>
              <div className="space-y-6">
                {(() => {
                  // Group items by category
                  const items = parseOrderItems(selectedOrder.items);
                  const grouped = items.reduce((acc, item) => {
                    const categoryName = item.category_name || "Other";
                    if (!acc[categoryName]) {
                      acc[categoryName] = [];
                    }
                    acc[categoryName].push(item);
                    return acc;
                  }, {} as Record<string, typeof items>);

                  return Object.entries(grouped).map(([categoryName, categoryItems]) => (
                    <div key={categoryName}>
                      <div className="space-y-2">
                        {categoryItems.map((item, index) => {
                          const hasVac = item.quantity_vac > 0;
                          const hasRegular = item.quantity_regular > 0;
                          const regularTotal = item.quantity_regular * item.unit_price;

                          return (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {item.product_name}
                              </p>
                              <p className="font-semibold text-gray-800 dark:text-gray-200">
                                € {regularTotal.toFixed(2)}
                              </p>
                            </div>
                            <div className="space-y-1 text-xs">
                              {hasRegular && (
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                  <span>Regular: {item.quantity_regular} × €{item.unit_price.toFixed(2)}</span>
                                  <span>€{regularTotal.toFixed(2)}</span>
                                </div>
                              )}
                              {hasVac && (
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                  <span>VAC: {item.quantity_vac} units</span>
                                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                                    Surcharge @ {item.vac_surcharge_at_order ? `€${item.vac_surcharge_at_order.toFixed(2)}` : 'N/A'}/kg
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Total
                </span>
                <span className="text-2xl font-bold text-admin-accent">
                  € {selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>

              {/* VAC Surcharge Note */}
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-lg mt-0.5">
                    info
                  </span>
                  <p className="text-xs text-orange-800 dark:text-orange-200">
                    <strong>Note:</strong> VAC packaging surcharges are not included in the total above. These charges will be calculated by the supplier based on actual weight.
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.customer_notes && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Customer Notes
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {selectedOrder.customer_notes}
                </p>
              </div>
            )}

            {selectedOrder.supplier_notes && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Supplier Notes
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {selectedOrder.supplier_notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrdersOverview;
