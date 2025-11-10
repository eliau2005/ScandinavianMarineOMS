import type { OrderItem } from "../types/order";

/**
 * Open a PDF blob in a new browser tab
 * @param blob - The PDF blob to open
 * @param filename - The filename for the PDF
 */
export const openPDFInNewTab = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();

  // Clean up the URL object after a delay
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Group order items by category
 * @param items - Array of order items
 * @returns Object with category names as keys and arrays of items as values
 */
export const groupOrderItemsByCategory = (
  items: OrderItem[]
): Record<string, OrderItem[]> => {
  return items.reduce((acc, item) => {
    const categoryName = item.category_name || "Other";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);
};

/**
 * Format currency value
 * @param amount - The amount to format
 * @param currency - The currency code (default: EUR)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = "EUR"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date for display in PDFs
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatPDFDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

/**
 * Get day name from date string
 * @param dateString - ISO date string
 * @returns Day name (e.g., "MON", "TUE")
 */
export const getDayName = (dateString: string): string => {
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  try {
    const date = new Date(dateString);
    return dayNames[date.getDay()];
  } catch {
    return "";
  }
};
