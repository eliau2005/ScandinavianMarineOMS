import React from "react";
import type { Order } from "../../../types/order";
import { parseOrderItems } from "../../../types/order";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OrderPDFDocument from "../../pdf/OrderPDFDocument";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order ${order.order_number}`}
      wide
    >
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <PDFDownloadLink
            document={<OrderPDFDocument order={order} />}
            fileName={`Order-${order.order_number}.pdf`}
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
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {order.customer_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Price List
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {order.price_list_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Order Date
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {format(new Date(order.order_date), "MMMM dd, yyyy")}
            </p>
          </div>
          {order.requested_delivery_date && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Requested Delivery
              </p>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {format(
                  new Date(order.requested_delivery_date),
                  "MMMM dd, yyyy"
                )}
              </p>
            </div>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Order Items
          </h4>
          <div className="space-y-6">
            {(() => {
              const items = parseOrderItems(order.items);
              const grouped = items.reduce((acc, item) => {
                const categoryName = item.category_name || "Other";
                if (!acc[categoryName]) {
                  acc[categoryName] = [];
                }
                acc[categoryName].push(item);
                return acc;
              }, {} as Record<string, typeof items>);

              return Object.entries(grouped).map(
                ([categoryName, categoryItems]) => (
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
                )
              );
            })()}
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Total
            </span>
            <span className="text-2xl font-bold text-supplier-accent">
              € {order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>
        {order.customer_notes && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Customer Notes
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {order.customer_notes}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OrderDetailModal;
