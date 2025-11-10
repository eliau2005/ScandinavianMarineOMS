import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { PriceListWithItems, PriceListTableRow } from "../types/priceList";

/**
 * Export a price list to PDF matching the original layout
 */
export const exportPriceListToPDF = (
  priceList: PriceListWithItems,
  tableData: PriceListTableRow[]
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Header Section
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER NAME:", margin, 15);
  doc.setFont("helvetica", "normal");
  doc.rect(45, 12, 100, 6);

  doc.setFont("helvetica", "bold");
  doc.text("ORDER DATE (DATE ONLY):", margin, 23);
  doc.setFont("helvetica", "normal");
  doc.rect(55, 20, 50, 6);

  doc.setFont("helvetica", "bold");
  doc.text("ORDER ETA (DAY+DATE):", margin, 31);
  doc.setFont("helvetica", "normal");
  doc.rect(55, 28, 50, 6);

  // Price list info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `PRICES ETA ${format(new Date(priceList.effective_date), "EEE/EEEE dd-MM-yyyy")}`,
    pageWidth - margin - 80,
    15
  );

  // Supplier Logo/Name (right side)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38); // Red color
  doc.text(priceList.supplier_name.toUpperCase(), pageWidth - margin, 25, {
    align: "right",
  });
  doc.setTextColor(0, 0, 0); // Reset to black

  // Organize data by category
  const categorizedData: { [categoryName: string]: PriceListTableRow[] } = {};
  tableData.forEach((row) => {
    const categoryName = row.category?.name || "Uncategorized";
    if (!categorizedData[categoryName]) {
      categorizedData[categoryName] = [];
    }
    categorizedData[categoryName].push(row);
  });

  let currentY = 40;
  const columnWidth = (pageWidth - 2 * margin - 5) / 2; // Two columns with gap

  Object.entries(categorizedData).forEach(([categoryName, items], index) => {
    // Check if we need a new page
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 15;
    }

    // Add spacing between categories (no title header)
    if (index > 0) {
      currentY += 3; // Extra spacing between category tables
    }

    // Prepare table data for this category
    const hasVacPricing = items.some((item) => item.price_box_vac !== null);

    const tableHeaders = hasVacPricing
      ? ["Product", "Price/Box", "Price/Box (VAC)"]
      : ["Product", "Price/Box"];

    const tableRows = items
      .filter((item) => item.price_box !== null || item.price_box_vac !== null)
      .map((item) => {
        const row = [
          item.product.name,
          item.price_box ? `€ ${item.price_box.toFixed(2)}` : "-",
        ];
        if (hasVacPricing) {
          let vacCell = item.price_box_vac
            ? `€ ${item.price_box_vac.toFixed(2)}`
            : "-";
          if (item.vac_surcharge && item.vac_surcharge > 0) {
            vacCell += ` (+€${item.vac_surcharge.toFixed(2)}/kg)`;
          }
          row.push(vacCell);
        }
        return row;
      });

    // Skip empty categories
    if (tableRows.length === 0) {
      return;
    }

    // Create table
    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: hasVacPricing ? 60 : 100 },
        1: { cellWidth: hasVacPricing ? 30 : 40, halign: "right" },
        2: hasVacPricing ? { cellWidth: 45, halign: "right" } : undefined,
      },
      margin: { left: margin, right: pageWidth - margin - columnWidth },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `${priceList.name} - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `${priceList.name.replace(/[^a-z0-9]/gi, "_")}_${format(
    new Date(),
    "yyyy-MM-dd"
  )}.pdf`;
  doc.save(fileName);
};

/**
 * Export a simplified price list (single column, all products)
 */
export const exportSimplePriceListToPDF = (
  priceList: PriceListWithItems,
  tableData: PriceListTableRow[]
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(priceList.name, pageWidth / 2, 20, { align: "center" });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Effective Date: ${format(new Date(priceList.effective_date), "MMMM dd, yyyy")}`,
    pageWidth / 2,
    27,
    { align: "center" }
  );
  doc.text(priceList.supplier_name, pageWidth / 2, 32, { align: "center" });

  // Organize data by category
  const categorizedData: { [categoryName: string]: PriceListTableRow[] } = {};
  tableData.forEach((row) => {
    const categoryName = row.category?.name || "Uncategorized";
    if (!categorizedData[categoryName]) {
      categorizedData[categoryName] = [];
    }
    categorizedData[categoryName].push(row);
  });

  let currentY = 40;
  const hasVacPricing = tableData.some((item) => item.price_box_vac !== null);

  Object.entries(categorizedData).forEach(([categoryName, items], index) => {
    // Check if we need a new page
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 15;
    }

    // Add spacing between categories (no title header)
    if (index > 0) {
      currentY += 5;
    }

    const tableHeaders = ["Product", "Price/Box"];
    if (hasVacPricing) {
      tableHeaders.push("Price/Box (VAC)");
    }

    const tableRows = items
      .filter((item) => item.price_box !== null || item.price_box_vac !== null)
      .map((item) => {
        const row = [
          item.product.name,
          item.price_box ? `€ ${item.price_box.toFixed(2)}` : "-",
        ];
        if (hasVacPricing) {
          row.push(
            item.price_box_vac ? `€ ${item.price_box_vac.toFixed(2)}` : "-"
          );
        }
        return row;
      });

    // Skip empty categories
    if (tableRows.length === 0) {
      return;
    }

    // Create table for this category
    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows,
      theme: "striped",
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: hasVacPricing ? 100 : 130 },
        1: { cellWidth: 30, halign: "right" },
        2: hasVacPricing ? { cellWidth: 35, halign: "right" } : undefined,
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 3;
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Page ${i} of ${pageCount} - Generated on ${format(new Date(), "MMMM dd, yyyy")}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `${priceList.name.replace(/[^a-z0-9]/gi, "_")}_Simple_${format(
    new Date(),
    "yyyy-MM-dd"
  )}.pdf`;
  doc.save(fileName);
};
