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
import Button from "../../ui/Button";
import Card from "../../ui/Card";
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
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status as keyof typeof statusColors] || statusColors.draft
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
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">
              Price History
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
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
            <Card className="flex flex-col items-center justify-center py-16 animate-fade-in" glass>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full mb-4">
                <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500">
                  history
                </span>
              </div>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                No price history available
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Archived price lists from your suppliers will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-8 animate-slide-up">
              {supplierPriceLists.map((supplierData) => (
                <Card
                  key={supplierData.supplierId}
                  className="overflow-hidden !p-0"
                  glass
                >
                  {/* Supplier Header */}
                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {supplierData.supplierName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        {supplierData.priceLists.length} archived price{" "}
                        {supplierData.priceLists.length === 1 ? "list" : "lists"}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-customer-accent/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-customer-accent text-sm">
                        inventory_2
                      </span>
                    </div>
                  </div>

                  {/* Price Lists Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Price List Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Delivery Window
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {supplierData.priceLists.map((priceList) => (
                          <tr
                            key={priceList.$id}
                            className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                              {priceList.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400 text-sm">event</span>
                                <span>
                                  {format(new Date(priceList.effective_date), "MMM dd")} -{" "}
                                  {format(new Date(priceList.expiry_date), "MMM dd, yyyy")}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(priceList.status)}</td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPriceList(priceList)}
                                className="text-customer-accent hover:text-customer-accent hover:bg-customer-accent/10"
                                rightIcon={<span className="material-symbols-outlined text-sm">arrow_forward</span>}
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
              ))}
            </div>
          )}
        </>
      ) : (
        // ==== DETAILS VIEW ====
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 mb-6 animate-fade-in">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewMode('list');
                setSelectedPriceList(null);
                setTableData([]);
                setSelectedCategoryId(null);
              }}
              leftIcon={<span className="material-symbols-outlined">arrow_back</span>}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
            >
              Back to Price History
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {selectedPriceList?.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-gray-400 text-sm">store</span>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {selectedPriceList?.supplier_name}
                  </p>
                </div>
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
                  className="inline-block"
                >
                  {({ loading }) => (
                    <Button
                      variant="primary"
                      isLoading={loading}
                      className="bg-customer-accent hover:bg-customer-accent/90"
                      leftIcon={<span className="material-symbols-outlined">picture_as_pdf</span>}
                    >
                      {loading ? "Generating..." : "Export PDF"}
                    </Button>
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
