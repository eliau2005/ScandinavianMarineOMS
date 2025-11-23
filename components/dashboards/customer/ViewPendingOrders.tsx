import React, { useState, useEffect } from "react";
import { account } from "../../../lib/appwrite";
import { orderService } from "../../../lib/orderService";
import type { Order } from "../../../types/order";
import { parseOrderItems, getStatusColor, getStatusLabel, OrderStatus } from "../../../types/order";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import Button from "../../ui/Button";
import Card from "../../ui/Card";

const ViewPendingOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      const allOrders = await orderService.getByCustomer(user.$id);

      // Filter for pending approval and pending orders only
      const pendingOrders = allOrders.filter(
        (order) =>
          order.status === OrderStatus.PENDING_APPROVAL ||
          order.status === OrderStatus.PENDING
      );

      setOrders(pendingOrders);
    } catch (error) {
      console.error("Error loading pending orders:", error);
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
      <div className="mb-8 animate-fade-in">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">
          Pending Orders
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Orders awaiting confirmation or approval
        </p>
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
        <Card className="flex flex-col items-center justify-center py-16 animate-fade-in" glass>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full mb-4">
            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500">
              check_circle
            </span>
          </div>
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            No pending orders
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            All your orders have been processed
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden !p-0 animate-slide-up" glass>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr
                    key={order.$id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {order.supplier_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(order.order_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-gray-200 text-right">
                      € {order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                        className="text-customer-accent hover:text-customer-accent hover:bg-customer-accent/10"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
          <div className="space-y-6">
            {/* Order Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-50/50 dark:bg-gray-700/30 border-none shadow-none">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Supplier</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                      {selectedOrder.supplier_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(
                        selectedOrder.status
                      )}`}
                    >
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="bg-gray-50/50 dark:bg-gray-700/30 border-none shadow-none">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Order Date</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {format(new Date(selectedOrder.order_date), "MMMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Delivery Window
                    </p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {format(new Date(selectedOrder.delivery_start_date), "MMM dd")} - {format(new Date(selectedOrder.delivery_end_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-customer-accent">inventory_2</span>
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
                    <div key={categoryName} className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                      <h5 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                        {categoryName}
                      </h5>
                      <div className="space-y-3">
                        {categoryItems.map((item, index) => {
                          const hasVac = item.quantity_vac > 0;
                          const hasRegular = item.quantity_regular > 0;
                          const regularTotal = item.quantity_regular * item.unit_price;
                          const vacTotal = item.quantity_vac * (item.unit_price_vac || 0);

                          return (
                            <div
                              key={index}
                              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                                  {item.product_name}
                                </p>
                                <p className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                                  € {item.total.toFixed(2)}
                                </p>
                              </div>
                              <div className="space-y-2 text-sm">
                                {hasRegular && (
                                  <div className="flex justify-between text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-2 rounded">
                                    <span className="font-medium">Regular Packaging</span>
                                    <span>{item.quantity_regular} × €{item.unit_price.toFixed(2)}</span>
                                  </div>
                                )}
                                {hasVac && item.unit_price_vac && (
                                  <div className="flex justify-between text-gray-600 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/10 p-2 rounded border border-orange-100 dark:border-orange-900/30">
                                    <span className="font-medium flex items-center gap-1">
                                      <span className="material-symbols-outlined text-orange-500 text-sm">science</span>
                                      VAC Packaging
                                    </span>
                                    <div>
                                      <span>{item.quantity_vac} × €{item.unit_price_vac.toFixed(2)}</span>
                                    </div>
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
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Total Amount
                </span>
                <span className="text-3xl font-bold text-customer-accent">
                  € {selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.customer_notes && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Your Notes
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-sm text-gray-800 dark:text-gray-200 italic">
                  "{selectedOrder.customer_notes}"
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ViewPendingOrders;
