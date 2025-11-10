import React, { useState, useEffect } from "react";
import { account } from "../../../lib/appwrite";
import { orderService } from "../../../lib/orderService";
import type { Order } from "../../../types/order";
import { parseOrderItems, getStatusColor, getStatusLabel } from "../../../types/order";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OrderPDFDocument from "../../pdf/OrderPDFDocument";

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      const ordersData = await orderService.getByCustomer(user.$id);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Order History
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View all your past orders
          </p>
        </div>
        {orders.length > 0 && (
          <PDFDownloadLink
            document={<OrderPDFDocument orders={orders} />}
            fileName={`Order-History-${format(new Date(), "yyyy-MM-dd")}.pdf`}
            className="flex items-center gap-2 px-4 py-2 bg-customer-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            {({ loading }) => (
              <>
                <span className="material-symbols-outlined text-base">
                  picture_as_pdf
                </span>
                <span>{loading ? "Generating..." : "Export All Orders"}</span>
              </>
            )}
          </PDFDownloadLink>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-customer-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            receipt_long
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            No orders yet
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Place your first order to see it here
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
                {orders.map((order) => (
                  <tr
                    key={order.$id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {order.order_number}
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
                        className="text-customer-accent hover:text-opacity-80 text-sm font-medium"
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
            <div className="flex justify-end mb-4">
              <PDFDownloadLink
                document={<OrderPDFDocument order={selectedOrder} />}
                fileName={`Order-${selectedOrder.order_number}.pdf`}
                className="flex items-center gap-2 px-4 py-2 bg-customer-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
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
                        {categoryItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {item.product_name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {item.quantity} × € {item.unit_price.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                              € {item.total.toFixed(2)}
                            </p>
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
                <span className="text-2xl font-bold text-customer-accent">
                  € {selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.customer_notes && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Your Notes
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

export default OrderHistory;
