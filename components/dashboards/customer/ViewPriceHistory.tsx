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
import { parseCategoryVacSurcharges } from "../../../types/priceList";
import { format } from "date-fns";
import Modal from "../../common/Modal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PriceListPDFDocument from "../../pdf/PriceListPDFDocument";
import PriceListDetailView from "../../priceList/PriceListDetailView";

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
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [selectedPriceList, setSelectedPriceList] = useState<PriceListWithItems | null>(null);
  const [tableData, setTableData] = useState<PriceListTableRow[]>([]);
  const [categoryVacSurcharges, setCategoryVacSurcharges] = useState<Map<string, number>>(new Map());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    loadPriceHistory();
  }, []);

  // Set initial selected category when table data is loaded
  useEffect(() => {
    if (tableData.length > 0 && !selectedCategoryId) {
      const firstCategory = tableData[0]?.category;
      if (firstCategory?.$id) {
        setSelectedCategoryId(firstCategory.$id);
      }
    }
  }, [tableData, selectedCategoryId]);

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
    setLoading(true);
    try {
      // Load full price list details with items
      const details = await priceListService.getWithItems(priceList.$id!);
      setSelectedPriceList(details);

      // Parse category VAC surcharges
      const surcharges = parseCategoryVacSurcharges(details.category_vac_surcharges);
      setCategoryVacSurcharges(surcharges);

      // Build table data
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
          is_available: item?.is_available ?? true,
          item_id: item?.$id,
        };
      });

      setTableData(rows);
      setViewMode('details');
    } catch (error) {
      console.error("Error loading price list items:", error);
    } finally {
      setLoading(false);
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
    <div className="flex flex-1 flex-col p-6 overflow-hidden">
      {viewMode === 'list' ? (
        // ==== LIST VIEW ====
        <>
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
                  <div className="overflow-x-auto">
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
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // ==== DETAILS VIEW ====
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 mb-4">
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedPriceList(null);
                setTableData([]);
                setSelectedCategoryId(null);
              }}
              className="flex items-center gap-2 text-sm font-medium text-customer-accent hover:text-opacity-80 mb-4 transition-colors"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Price History</span>
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {selectedPriceList?.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Supplier: {selectedPriceList?.supplier_name}
                </p>
              </div>

              {selectedPriceList && (
                <PDFDownloadLink
                  document={
                    <PriceListPDFDocument
                      priceList={selectedPriceList}
                      tableData={tableData}
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
              )}
            </div>
          </div>

          {/* Master-Detail Layout */}
          <div className="flex-1 overflow-hidden">
            {selectedPriceList && tableData.length > 0 && (
              <PriceListDetailView
                tableData={tableData}
                priceList={selectedPriceList}
                editable={false}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                categoryVacSurcharges={categoryVacSurcharges}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPriceHistory;
