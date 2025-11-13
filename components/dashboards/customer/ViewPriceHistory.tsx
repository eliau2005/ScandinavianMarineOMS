import React, { useState, useEffect } from "react";
import { account } from "../../../lib/appwrite";
import { associationService } from "../../../lib/orderService";
import {
  priceListService,
  productService,
  productCategoryService
} from "../../../lib/priceListService";
import type {
  PriceList,
  PriceListItemWithDetails,
  PriceListWithItems,
  PriceListTableRow
} from "../../../types/priceList";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PriceListPDFDocument from "../../pdf/PriceListPDFDocument";

interface SupplierPriceLists {
  supplierId: string;
  supplierName: string;
  priceLists: PriceList[];
}

interface PriceListPDFData {
  priceList: PriceListWithItems;
  tableData: PriceListTableRow[];
}

const ViewPriceHistory = () => {
  const [supplierPriceLists, setSupplierPriceLists] = useState<SupplierPriceLists[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [priceListItems, setPriceListItems] = useState<PriceListItemWithDetails[]>([]);
  const [pdfData, setPdfData] = useState<PriceListPDFData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    loadPriceHistory();
  }, []);

  const loadPriceHistory = async () => {
    setLoading(true);
    try {
      const user = await account.get();

      // Get all suppliers associated with this customer
      const associations = await associationService.getByCustomer(user.$id);

      // For each supplier, get their archived price lists
      const supplierData: SupplierPriceLists[] = [];

      for (const association of associations) {
        const allPriceLists = await priceListService.getBySupplier(association.supplier_id);

        // Filter for archived price lists only
        const archivedPriceLists = allPriceLists.filter(
          (pl) => pl.status === "archived"
        );

        if (archivedPriceLists.length > 0) {
          supplierData.push({
            supplierId: association.supplier_id,
            supplierName: association.supplier_name,
            priceLists: archivedPriceLists,
          });
        }
      }

      setSupplierPriceLists(supplierData);
    } catch (error) {
      console.error("Error loading price history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPriceList = async (priceList: PriceList) => {
    setSelectedPriceList(priceList);
    setShowDetailsModal(true);
    setLoadingItems(true);
    setPdfData(null);

    try {
      // Load full price list details with items
      const details = await priceListService.getWithItems(priceList.$id!);

      // Set items for display
      setPriceListItems(details.items || []);

      // Build table data for PDF
      const [products, categories] = await Promise.all([
        productService.getAll(),
        productCategoryService.getAll(),
      ]);

      const categoryMap = new Map(categories.map((c) => [c.$id!, c]));
      const itemMap = new Map(
        details.items?.map((item) => [item.product_id, item]) || []
      );

      const rows: PriceListTableRow[] = products.map((product) => {
        const item = itemMap.get(product.$id!);
        return {
          product,
          category: categoryMap.get(product.category_id)!,
          price_box: item?.price_box || null,
          price_box_vac: item?.price_box_vac || null,
          vac_surcharge: item?.vac_surcharge || null,
          is_available: item?.is_available ?? true,
          item_id: item?.$id,
        };
      });

      setPdfData({ priceList: details, tableData: rows });
    } catch (error) {
      console.error("Error loading price list items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      archived: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
          statusColors[status as keyof typeof statusColors] || statusColors.draft
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Price History
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View archived price lists from your suppliers
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-customer-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading price history...</p>
          </div>
        </div>
      ) : supplierPriceLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            history
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            No price history available
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Archived price lists from your suppliers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {supplierPriceLists.map((supplierData) => (
            <div
              key={supplierData.supplierId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              {/* Supplier Header */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {supplierData.supplierName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {supplierData.priceLists.length} archived price{" "}
                  {supplierData.priceLists.length === 1 ? "list" : "lists"}
                </p>
              </div>

              {/* Price Lists Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Price List Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Delivery Window
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {supplierData.priceLists.map((priceList) => (
                      <tr
                        key={priceList.$id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                          {priceList.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(priceList.effective_date), "MMM dd")} -{" "}
                          {format(new Date(priceList.expiry_date), "MMM dd, yyyy")}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(priceList.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleViewPriceList(priceList)}
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
              <div className="block md:hidden space-y-4 p-4">
                {supplierData.priceLists.map((priceList) => (
                  <div key={priceList.$id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{priceList.name}</h3>
                      {getStatusBadge(priceList.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Delivery: {format(new Date(priceList.effective_date), "MMM dd")} -{" "}
                      {format(new Date(priceList.expiry_date), "MMM dd, yyyy")}
                    </p>
                    <div className="flex justify-end gap-2 border-t pt-2">
                      <button
                        onClick={() => handleViewPriceList(priceList)}
                        className="text-customer-accent hover:text-opacity-80 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price List Details Modal */}
      {selectedPriceList && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPriceList(null);
            setPriceListItems([]);
            setPdfData(null);
          }}
          title={selectedPriceList.name}
          wide
        >
          <div className="space-y-4">
            {/* Export Button */}
            <div className="flex justify-end mb-4">
              {pdfData ? (
                <PDFDownloadLink
                  document={
                    <PriceListPDFDocument
                      priceList={pdfData.priceList}
                      tableData={pdfData.tableData}
                    />
                  }
                  fileName={`${selectedPriceList.name.replace(/[^a-z0-9]/gi, '_')}.pdf`}
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
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-customer-accent text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base">
                    picture_as_pdf
                  </span>
                  <span>Loading...</span>
                </button>
              )}
            </div>

            {/* Price List Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Supplier</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {selectedPriceList.supplier_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                {getStatusBadge(selectedPriceList.status)}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Delivery Window
                </p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {format(new Date(selectedPriceList.effective_date), "MMM dd")} -{" "}
                  {format(new Date(selectedPriceList.expiry_date), "MMM dd, yyyy")}
                </p>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Products & Prices
              </h4>

              {loadingItems ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-customer-accent"></div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Loading products...
                    </p>
                  </div>
                </div>
              ) : priceListItems.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 py-4 text-center">
                  No products in this price list
                </p>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    // Group items by category
                    const grouped = priceListItems.reduce((acc, item) => {
                      const categoryName = item.product?.category?.name || "Other";
                      if (!acc[categoryName]) {
                        acc[categoryName] = [];
                      }
                      acc[categoryName].push(item);
                      return acc;
                    }, {} as Record<string, typeof priceListItems>);

                    return Object.entries(grouped).map(([categoryName, items]) => (
                      <div key={categoryName}>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Product
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Price
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  VAC Price
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {items.map((item) => (
                                <tr
                                  key={item.$id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                                    {item.product?.name || "Unknown Product"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right text-gray-800 dark:text-gray-200">
                                    {item.price_box !== null && item.price_box !== undefined
                                      ? `€ ${item.price_box.toFixed(2)}`
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right text-gray-800 dark:text-gray-200">
                                    {item.price_box_vac !== null && item.price_box_vac !== undefined
                                      ? `€ ${item.price_box_vac.toFixed(2)}`
                                      : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ViewPriceHistory;
