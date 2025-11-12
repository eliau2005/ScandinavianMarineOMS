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

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingZip, setGeneratingZip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistoricalOrders();
    }
  }, [isOpen]);

  const loadHistoricalOrders = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      const ordersData = await orderService.getBySupplier(user.$id);
      // Filter for completed/historical orders only (shipped, delivered, cancelled)
      // NOTE: pending_approval orders are excluded - suppliers should NOT see these
      const historicalOrders = ordersData.filter(
        (order) =>
          order.status === "shipped" ||
          order.status === "delivered" ||
          order.status === "cancelled"
      );
      setOrders(historicalOrders);
    } catch (error) {
      console.error("Error loading historical orders:", error);
    } finally {
      setLoading(false);
    }
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
      link.download = `Order-History-${format(new Date(), "yyyy-MM-dd")}.zip`;
      link.click();

      // Clean up
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating ZIP file:", error);
      alert("Failed to generate ZIP file. Please try again.");
    } finally {
      setGeneratingZip(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Order History" wide>
        <div className="space-y-4">
          {/* Search Bar and Download Button */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
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

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-supplier-accent"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading historical orders...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
                history
              </span>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
                No order history found
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                Completed orders will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="text-supplier-accent hover:text-opacity-80 text-sm font-medium"
                          >
                            View Details
                          </button>
                          <PDFDownloadLink
                            document={<OrderPDFDocument order={order} />}
                            fileName={`Order-${order.order_number}.pdf`}
                            className="text-supplier-accent hover:text-opacity-80 text-sm font-medium"
                          >
                            Export PDF
                          </PDFDownloadLink>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

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
    </>
  );
};

export default OrderHistoryModal;
