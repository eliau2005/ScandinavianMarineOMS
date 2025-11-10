import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { PriceListWithItems, PriceListTableRow } from "../../types/priceList";
import { formatCurrency, formatPDFDate, getDayName } from "../../lib/pdfHelpers";

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
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#dc2626",
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: "#6b7280",
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
  },
  categorySection: {
    marginTop: 20,
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
  productCol: {
    width: "45%",
  },
  unitCol: {
    width: "15%",
  },
  priceCol: {
    width: "20%",
    textAlign: "right",
  },
  priceVACCol: {
    width: "20%",
    textAlign: "right",
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

interface PriceListPDFDocumentProps {
  priceList: PriceListWithItems;
  tableData: PriceListTableRow[];
}

const PriceListPDFDocument: React.FC<PriceListPDFDocumentProps> = ({
  priceList,
  tableData,
}) => {
  // Group products by category
  const categorizedData = tableData.reduce((acc, row) => {
    const categoryName = row.category?.name || "Other";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(row);
    return acc;
  }, {} as Record<string, PriceListTableRow[]>);

  // Check if any product has VAC pricing
  const hasVACPricing = tableData.some((row) => row.price_box_vac !== null);

  // Format dates
  const startDay = getDayName(priceList.effective_date);
  const endDay = getDayName(priceList.expiry_date!);
  const endDate = formatPDFDate(priceList.expiry_date!);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            PRICES ETA {startDay}/{endDay} {endDate}
          </Text>
          <Text style={styles.supplierName}>{priceList.supplier_name}</Text>

          <View style={{ marginTop: 12 }}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Effective Date:</Text>
              <Text style={styles.value}>{formatPDFDate(priceList.effective_date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Expiry Date:</Text>
              <Text style={styles.value}>{formatPDFDate(priceList.expiry_date!)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{priceList.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Tables by Category */}
        {Object.entries(categorizedData).map(([categoryName, products], index) => (
          <View key={categoryName} style={styles.categorySection}>
            {/* Table */}
            <View style={styles.table}>
              {/* Header Row */}
              <View style={styles.tableHeader}>
                <Text style={[styles.cellHeader, styles.productCol]}>
                  PRODUCT
                </Text>
                <Text style={[styles.cellHeader, styles.unitCol]}>
                  UNIT
                </Text>
                <Text style={[styles.cellHeader, styles.priceCol]}>
                  PRICE/BOX
                </Text>
                {hasVACPricing && (
                  <Text style={[styles.cellHeader, styles.priceVACCol]}>
                    PRICE/BOX (VAC)
                  </Text>
                )}
              </View>

              {/* Data Rows */}
              {products.map((row, rowIndex) => (
                <View
                  key={row.product.$id}
                  style={[
                    styles.tableRow,
                    rowIndex % 2 === 1 && styles.tableRowAlt,
                  ]}
                >
                  <Text style={[styles.cell, styles.productCol]}>
                    {row.product.name}
                  </Text>
                  <Text style={[styles.cell, styles.unitCol]}>
                    {row.product.unit_of_measure}
                  </Text>
                  <Text style={[styles.cellBold, styles.priceCol]}>
                    {row.price_box ? formatCurrency(row.price_box) : "-"}
                  </Text>
                  {hasVACPricing && (
                    <Text style={[styles.cellBold, styles.priceVACCol]}>
                      {row.price_box_vac
                        ? `${formatCurrency(row.price_box_vac)}${
                            row.vac_surcharge
                              ? ` (+${formatCurrency(row.vac_surcharge)})`
                              : ""
                          }`
                        : "-"}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${priceList.name} - Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default PriceListPDFDocument;
