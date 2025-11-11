import React, { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import { orderService } from "../../../lib/orderService";
import type { Order } from "../../../types/order";
import { format } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OrderPDFDocument from "../../pdf/OrderPDFDocument";
import OrderDetailModal from "./OrderDetailModal";

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose, supplierId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOrderHistory();
    }
  }, [isOpen]);

  const loadOrderHistory = async () => {
    setLoading(true);
    try {
      const allOrders = await orderService.getBySupplier(supplierId);
      const nonActiveOrders = allOrders.filter(
        (order) =>
          order.status === "shipped" ||
          order.status === "delivered" ||
          order.status === "cancelled"
      );
      setOrders(nonActiveOrders);
    } catch (error) {
      console.error("Error loading order history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Order History" wide>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supplier-accent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.$id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{order.order_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{order.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{format(new Date(order.order_date), "MMM dd, yyyy")}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleViewDetails(order)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">View Details</button>
                      <PDFDownloadLink
                        document={<OrderPDFDocument order={order} />}
                        fileName={`order-${order.order_number}.pdf`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {({ loading }) => (loading ? 'Loading...' : 'Export PDF')}
                      </PDFDownloadLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
      {selectedOrder && (
        <OrderDetailModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      )}
    </>
  );
};

export default OrderHistoryModal;
