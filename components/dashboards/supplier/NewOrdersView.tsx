import React, { useState, useEffect } from "react";
import { account } from "../../../lib/appwrite";
import { orderService } from "../../../lib/orderService";
import type { Order } from "../../../types/order";
import { parseOrderItems, getStatusColor, getStatusLabel } from "../../../types/order";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OrderPDFDocument from "../../pdf/OrderPDFDocument";
import OrderHistoryModal from "./OrderHistoryModal";

const NewOrdersView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Order["status"] | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      const ordersData = await orderService.getBySupplier(user.$id);
      // Filter for active orders only (pending, confirmed, processing)
      const activeOrders = ordersData.filter(
        (order) =>
          order.status === "pending" ||
          order.status === "confirmed" ||
          order.status === "processing"
      );
      setOrders(activeOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
      showNotification("error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleManageOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    setUpdatingStatus(true);
    try {
      await orderService.updateStatus(orderId, newStatus);
      await loadOrders();
      showNotification("success", `Order status updated to ${getStatusLabel(newStatus)}`);
      if (selectedOrder?.$id === orderId) {
        const updatedOrder = await orderService.getById(orderId);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification("error", "Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const stats = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    processing: orders.filter((o) => o.status === "processing").length,
  };

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Active Orders
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your active orders from customers
            </p>
          </div>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined text-base">history</span>
            <span>View Order History</span>
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === "all"
                ? "bg-supplier-accent text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All ({stats.all})
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === "pending"
                ? "bg-supplier-accent text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus("confirmed")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === "confirmed"
                ? "bg-supplier-accent text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Confirmed ({stats.confirmed})
          </button>
          <button
            onClick={() => setFilterStatus("processing")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === "processing"
                ? "bg-supplier-accent text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Processing ({stats.processing})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order # or customer name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-supplier-accent"></div>
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
            {filterStatus === "all"
              ? "You haven't received any active orders yet"
              : `No ${filterStatus} orders`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order.$id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-supplier-accent/10 to-supplier-accent/5 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {order.order_number}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="material-symbols-outlined text-base">person</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4 space-y-3">
                {/* Order Date */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    Order Date
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {format(new Date(order.order_date), "MMM dd, yyyy")}
                  </span>
                </div>

                {/* Delivery Date */}
                {order.requested_delivery_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">local_shipping</span>
                      Delivery
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {format(new Date(order.requested_delivery_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}

                {/* Total Amount */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                    <span className="text-xl font-bold text-supplier-accent">
                      € {order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleManageOrder(order)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">settings</span>
                  <span>Manage Order</span>
                </button>
              </div>
            </div>
          ))}
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
            {/* Export Button */}
            <div className="flex justify-end mb-4">
              <PDFDownloadLink
                document={<OrderPDFDocument order={selectedOrder} />}
                fileName={`Order-${selectedOrder.order_number}.pdf`}
                className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
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

            {/* Status Update */}
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    "pending",
                    "confirmed",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled",
                  ] as Order["status"][]
                ).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(selectedOrder.$id!, status)}
                    disabled={updatingStatus || selectedOrder.status === status}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectedOrder.status === status
                        ? `${getStatusColor(status)} cursor-default`
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed capitalize`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
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
                        {categoryItems.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {item.product_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                € {item.unit_price.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800 dark:text-gray-200">
                                € {item.total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Total
                </span>
                <span className="text-2xl font-bold text-supplier-accent">
                  € {selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Customer Notes */}
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
          </div>
        </Modal>
      )}

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
};

export default NewOrdersView;
