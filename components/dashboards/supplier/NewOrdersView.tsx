import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { account } from "../../../lib/appwrite";
import { orderService } from "../../../lib/orderService";
import type { Order } from "../../../types/order";
import { parseOrderItems, getStatusColor, getStatusLabel } from "../../../types/order";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OrderPDFDocument from "../../pdf/OrderPDFDocument";

const NewOrdersView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Order["status"] | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      const ordersData = await orderService.getBySupplier(user.$id);
      // Filter for active orders only (pending, confirmed, processing)
      // NOTE: pending_approval orders are excluded - suppliers should NOT see these
      const activeOrders = ordersData.filter(
        (order) =>
          order.status === "pending" ||
          order.status === "confirmed" ||
          order.status === "processing"
      );
      setOrders(activeOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
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
      toast.success(`Order status updated to ${getStatusLabel(newStatus)}`);
      if (selectedOrder?.$id === orderId) {
        const updatedOrder = await orderService.getById(orderId);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status");
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

  const statusCards = [
    {
      status: "all" as const,
      label: "All Active",
      count: stats.all,
      icon: "shopping_cart",
      color: "border-blue-500",
    },
    {
      status: "pending" as const,
      label: "Pending",
      count: stats.pending,
      icon: "schedule",
      color: "border-yellow-500",
    },
    {
      status: "confirmed" as const,
      label: "Confirmed",
      count: stats.confirmed,
      icon: "check_circle",
      color: "border-green-500",
    },
    {
      status: "processing" as const,
      label: "Processing",
      count: stats.processing,
      icon: "sync",
      color: "border-purple-500",
    },
  ];

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">
          Active Orders
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Manage your active orders from customers
        </p>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
        {statusCards.map((card) => (
          <Card
            key={card.status}
            onClick={() => setFilterStatus(card.status)}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-l-4 ${card.color} ${filterStatus === card.status ? "ring-2 ring-supplier-accent transform scale-105" : "hover:scale-105"
              } !p-4`}
            glass
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`material-symbols-outlined text-xl ${filterStatus === card.status ? "text-supplier-accent" : "text-gray-400"}`}>
                {card.icon}
              </span>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {card.count}
              </p>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {card.label}
            </p>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-8 animate-fade-in">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by order # or customer name..."
          leftIcon={<span className="material-symbols-outlined">search</span>}
          className="bg-white dark:bg-gray-800 shadow-sm"
        />
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
        <Card className="flex flex-col items-center justify-center py-16 animate-fade-in" glass>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full mb-4">
            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500">
              receipt_long
            </span>
          </div>
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            No orders found
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filterStatus === "all"
              ? "You haven't received any active orders yet"
              : `No ${filterStatus} orders`}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {filteredOrders.map((order) => (
            <Card
              key={order.$id}
              className="hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group !p-0"
              glass
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-supplier-accent/10 to-supplier-accent/5 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 group-hover:text-supplier-accent transition-colors">
                    {order.order_number}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(
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
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    Order Date
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {format(new Date(order.order_date), "MMM dd, yyyy")}
                  </span>
                </div>

                {/* Delivery Date */}
                {order.requested_delivery_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-base">local_shipping</span>
                      Delivery
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {format(new Date(order.requested_delivery_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}

                {/* Total Amount */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
                    <span className="text-xl font-bold text-supplier-accent">
                      € {order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
                <Button
                  onClick={() => handleManageOrder(order)}
                  className="w-full bg-supplier-accent hover:bg-supplier-accent/90 text-white shadow-md"
                  leftIcon={<span className="material-symbols-outlined">settings</span>}
                >
                  Manage Order
                </Button>
              </div>
            </Card>
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
          <div className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <PDFDownloadLink
                document={<OrderPDFDocument order={selectedOrder} />}
                fileName={`Order-${selectedOrder.order_number}.pdf`}
                className="inline-block"
              >
                {({ loading }) => (
                  <Button
                    variant="primary"
                    isLoading={loading}
                    className="bg-supplier-accent hover:bg-supplier-accent/90 shadow-md"
                    leftIcon={<span className="material-symbols-outlined">picture_as_pdf</span>}
                  >
                    {loading ? "Generating..." : "Export PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>

            {/* Order Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-50/50 dark:bg-gray-700/30 border-none shadow-none">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                      {selectedOrder.customer_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Price List</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedOrder.price_list_name}
                    </p>
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
                  {selectedOrder.requested_delivery_date && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
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
              </Card>
            </div>

            {/* Status Update */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Update Order Status
              </label>
              <div className="flex flex-wrap gap-2">
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
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${selectedOrder.status === status
                      ? `${getStatusColor(status)} shadow-md transform scale-105 cursor-default ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-opacity-50`
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200"
                      } disabled:opacity-50 disabled:cursor-not-allowed capitalize tracking-wide`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-supplier-accent">inventory_2</span>
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
                                {hasVac && (
                                  <div className="flex justify-between text-gray-600 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/10 p-2 rounded border border-orange-100 dark:border-orange-900/30">
                                    <span className="font-medium flex items-center gap-1">
                                      <span className="material-symbols-outlined text-orange-500 text-sm">science</span>
                                      VAC Packaging
                                    </span>
                                    <div className="text-right">
                                      <div>{item.quantity_vac} units</div>
                                      {item.vac_surcharge_at_order && (
                                        <div className="text-orange-600 dark:text-orange-400 text-xs font-medium mt-0.5">
                                          Surcharge @ €{item.vac_surcharge_at_order.toFixed(2)}/kg
                                        </div>
                                      )}
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
                <span className="text-3xl font-bold text-supplier-accent">
                  € {selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>

              {/* VAC Surcharge Note */}
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3">
                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-2xl flex-shrink-0">
                  info
                </span>
                <div>
                  <p className="text-sm font-bold text-orange-800 dark:text-orange-200 mb-1">
                    VAC Surcharge Notice
                  </p>
                  <p className="text-xs text-orange-800 dark:text-orange-200 leading-relaxed">
                    VAC packaging surcharges are not included in the total above. Please calculate these charges based on the actual weight of VAC items and include them in your final invoice.
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {selectedOrder.customer_notes && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Customer Notes
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

export default NewOrdersView;
