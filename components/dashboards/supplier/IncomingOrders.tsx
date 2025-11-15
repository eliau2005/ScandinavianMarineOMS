import React, { useState, useEffect } from "react";
import { account } from "../../../lib/appwrite";
import { orderService } from "../../../lib/orderService";
import type { Order } from "../../../types/order";
import { parseOrderItems, getStatusColor, getStatusLabel } from "../../../types/order";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import OrderPDFDocument from "../../pdf/OrderPDFDocument";
import JSZip from "jszip";
interface OrderStats {
  all: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

const IncomingOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Order["status"] | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<OrderStats>({
    all: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingZip, setGeneratingZip] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      const ordersData = await orderService.getBySupplier(user.$id);

      // Filter out orders pending admin approval - suppliers should NOT see these
      const approvedOrders = ordersData.filter(
        (order) => order.status !== "pending_approval"
      );

      setOrders(approvedOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
      showNotification("error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const newStats: OrderStats = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      if (order.status === "pending") newStats.pending++;
      else if (order.status === "confirmed") newStats.confirmed++;
      else if (order.status === "processing") newStats.processing++;
      else if (order.status === "shipped") newStats.shipped++;
      else if (order.status === "delivered") newStats.delivered++;
      else if (order.status === "cancelled") newStats.cancelled++;
    });

    setStats(newStats);
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleDownloadAllAsZip = async () => {
    setGeneratingZip(true);
    try {
      // Initialize JSZip
      const zip = new JSZip();

      // Generate PDFs for all filtered orders
      for (const order of filteredOrders) {
        // Generate PDF blob for this order
        const pdfDoc = <OrderPDFDocument order={order} />;
        const blob = await pdf(pdfDoc).toBlob();

        // Add the PDF to the ZIP file with a sanitized filename
        const fileName = `Order-${order.order_number.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        zip.file(fileName, blob);
      }

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Trigger download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = `All-Orders-${format(new Date(), "yyyy-MM-dd")}.zip`;
      link.click();

      // Clean up
      URL.revokeObjectURL(link.href);

      showNotification("success", `Successfully exported ${filteredOrders.length} orders to ZIP`);
    } catch (error) {
      console.error("Error generating ZIP file:", error);
      showNotification("error", "Failed to generate ZIP file. Please try again.");
    } finally {
      setGeneratingZip(false);
    }
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

  const statusCards = [
    {
      status: "all" as const,
      label: "All Orders",
      count: stats.all,
      icon: "shopping_cart",
      color: "border-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      status: "pending" as const,
      label: "Pending",
      count: stats.pending,
      icon: "schedule",
      color: "border-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      status: "confirmed" as const,
      label: "Confirmed",
      count: stats.confirmed,
      icon: "check_circle",
      color: "border-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      status: "processing" as const,
      label: "Processing",
      count: stats.processing,
      icon: "sync",
      color: "border-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      status: "shipped" as const,
      label: "Shipped",
      count: stats.shipped,
      icon: "local_shipping",
      color: "border-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      status: "delivered" as const,
      label: "Delivered",
      count: stats.delivered,
      icon: "task_alt",
      color: "border-teal-500",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
      status: "cancelled" as const,
      label: "Cancelled",
      count: stats.cancelled,
      icon: "cancel",
      color: "border-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ];

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            All Orders
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete order history and management for your supplier account
          </p>
        </div>
        {filteredOrders.length > 0 && (
          <button
            onClick={handleDownloadAllAsZip}
            disabled={generatingZip}
            className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {generatingZip ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating ZIP...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">folder_zip</span>
                <span>Download All as ZIP</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {statusCards.map((card) => (
          <button
            key={card.status}
            onClick={() => setFilterStatus(card.status)}
            className={`${card.bgColor} rounded-lg shadow-md p-4 border-l-4 ${card.color} transition-all hover:shadow-lg ${
              filterStatus === card.status ? "ring-2 ring-supplier-accent" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-xl">
                {card.icon}
              </span>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {card.count}
              </p>
            </div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {card.label}
            </p>
          </button>
        ))}
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
              ? "You haven't received any orders yet"
              : `No ${filterStatus} orders`}
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
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Delivery Date
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
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(order.order_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {order.requested_delivery_date
                        ? format(
                            new Date(order.requested_delivery_date),
                            "MMM dd, yyyy"
                          )
                        : "N/A"}
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
                        className="text-supplier-accent hover:text-opacity-80 text-sm font-medium"
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
            {/* Export Button */}
            {selectedOrder.status !== "pending_approval" && (
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
            )}
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
              <div className="flex gap-2">
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
                <span className="text-2xl font-bold text-supplier-accent">
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
                    <strong>Note:</strong> VAC packaging surcharges are not included in the total above. Calculate these charges based on the actual weight of VAC items and include them in your final invoice.
                  </p>
                </div>
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
    </div>
  );
};

export default IncomingOrders;
