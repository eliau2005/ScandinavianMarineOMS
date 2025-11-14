import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Order, OrderItem } from "../../types/order";
import { parseOrderItems, getStatusLabel } from "../../types/order";
import {
  formatCurrency,
  formatPDFDate,
  groupOrderItemsByCategory,
} from "../../lib/pdfHelpers";

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Roboto",
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoBox: {
    width: "48%",
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 20,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  categorySection: {
    marginTop: 15,
  },
  table: {
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  cellHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "uppercase",
  },
  cell: {
    fontSize: 9,
    color: "#111827",
  },
  cellBold: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
  },
  cellSmall: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  productCol: {
    width: "45%",
  },
  breakdownCol: {
    width: "40%",
  },
  totalCol: {
    width: "15%",
    textAlign: "right",
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginRight: 20,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#059669",
  },
  notesSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#78350f",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#78350f",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

interface OrderPDFDocumentProps {
  order?: Order;
  orders?: Order[];
}

const OrderPDFDocument: React.FC<OrderPDFDocumentProps> = ({
  order,
  orders,
}) => {
  // Handle single order or multiple orders
  const ordersToRender = order ? [order] : orders || [];

  if (ordersToRender.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No orders to display</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      {ordersToRender.map((currentOrder) => {
        const items = parseOrderItems(currentOrder.items);
        const groupedItems = groupOrderItemsByCategory(items);

        return (
          <Page key={currentOrder.$id} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.orderNumber}>
                Order #{currentOrder.order_number}
              </Text>

              <Text style={styles.statusBadge}>
                {getStatusLabel(currentOrder.status)}
              </Text>

              {/* Info Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Customer</Text>
                  <Text style={styles.value}>{currentOrder.customer_name}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Supplier</Text>
                  <Text style={styles.value}>{currentOrder.supplier_name}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Order Date</Text>
                  <Text style={styles.value}>
                    {formatPDFDate(currentOrder.order_date)}
                  </Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Delivery Window</Text>
                  <Text style={styles.value}>
                    {formatPDFDate(currentOrder.delivery_start_date)} -{" "}
                    {formatPDFDate(currentOrder.delivery_end_date)}
                  </Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Price List</Text>
                  <Text style={styles.value}>{currentOrder.price_list_name}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Currency</Text>
                  <Text style={styles.value}>{currentOrder.currency}</Text>
                </View>
              </View>
            </View>

            {/* Products Section */}
            <Text style={styles.sectionTitle}>Order Items</Text>

            {/* Tables by Category */}
            {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
              <View key={categoryName} style={styles.categorySection}>
                {/* Table */}
                <View style={styles.table}>
                  {/* Header Row */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.cellHeader, styles.productCol]}>
                      PRODUCT
                    </Text>
                    <Text style={[styles.cellHeader, styles.breakdownCol]}>
                      BREAKDOWN
                    </Text>
                    <Text style={[styles.cellHeader, styles.totalCol]}>
                      TOTAL
                    </Text>
                  </View>

                  {/* Data Rows */}
                  {categoryItems.map((item, rowIndex) => {
                    const hasVac = item.quantity_vac > 0;
                    const hasRegular = item.quantity_regular > 0;
                    const regularTotal = item.quantity_regular * item.unit_price;

                    return (
                    <View
                      key={item.product_id}
                      style={[
                        styles.tableRow,
                        rowIndex % 2 === 1 && styles.tableRowAlt,
                      ]}
                    >
                      <Text style={[styles.cell, styles.productCol]}>
                        {item.product_name}
                      </Text>
                      <View style={styles.breakdownCol}>
                        {hasRegular && (
                          <Text style={styles.cellSmall}>
                            Regular: {item.quantity_regular} × {formatCurrency(item.unit_price, currentOrder.currency)} = {formatCurrency(regularTotal, currentOrder.currency)}
                          </Text>
                        )}
                        {hasVac && (
                          <Text style={[styles.cellSmall, { color: '#ea580c' }]}>
                            VAC: {item.quantity_vac} units - Calculated by supplier
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.cellBold, styles.totalCol]}>
                        {formatCurrency(regularTotal, currentOrder.currency)}
                      </Text>
                    </View>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Total */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>TOTAL:</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(currentOrder.total_amount, currentOrder.currency)}
              </Text>
            </View>

            {/* VAC Surcharge Warning */}
            <View style={{
              marginTop: 10,
              padding: 10,
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: 4
            }}>
              <Text style={{ fontSize: 9, color: '#9a3412', fontWeight: 'bold' }}>
                NOTE: VAC packaging surcharges are not included in the total above. These charges will be calculated by the supplier based on actual weight and included in the final invoice.
              </Text>
            </View>

            {/* Notes */}
            {currentOrder.customer_notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Customer Notes:</Text>
                <Text style={styles.notesText}>
                  {currentOrder.customer_notes}
                </Text>
              </View>
            )}

            {currentOrder.supplier_notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Supplier Notes:</Text>
                <Text style={styles.notesText}>
                  {currentOrder.supplier_notes}
                </Text>
              </View>
            )}

            {currentOrder.admin_notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Admin Notes:</Text>
                <Text style={styles.notesText}>{currentOrder.admin_notes}</Text>
              </View>
            )}

            {/* Footer */}
            <Text
              style={styles.footer}
              render={({ pageNumber, totalPages }) =>
                `Order ${currentOrder.order_number} - Page ${pageNumber} of ${totalPages}`
              }
              fixed
            />
          </Page>
        );
      })}
    </Document>
  );
};

export default OrderPDFDocument;
