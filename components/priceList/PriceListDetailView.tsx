import React from "react";
import type { PriceListTableRow, PriceListWithItems } from "../../types/priceList";
import PriceListProductTable from "./PriceListProductTable";

interface PriceListDetailViewProps {
  tableData: PriceListTableRow[];
  priceList: PriceListWithItems;
  headerActions?: React.ReactNode;
  editable: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onPriceChange?: (productId: string, field: "price_box", value: number) => void;
  categoryVacSurcharges?: Map<string, number>;
  onCategoryVacSurchargeChange?: (categoryId: string, surcharge: number | null) => void;
}

const PriceListDetailView: React.FC<PriceListDetailViewProps> = ({
  tableData,
  priceList,
  headerActions,
  editable,
  selectedCategoryId,
  onSelectCategory,
  onPriceChange,
  categoryVacSurcharges,
  onCategoryVacSurchargeChange,
}) => {
  // Group products by category
  const categoriesWithProducts = tableData.reduce((acc, row) => {
    const categoryId = row.category.$id!;
    if (!acc.some((c) => c.id === categoryId)) {
      acc.push({
        id: categoryId,
        name: row.category.name,
        icon: row.category.icon,
      });
    }
    return acc;
  }, [] as Array<{ id: string; name: string; icon?: string }>);

  // Get products for selected category
  const selectedCategoryProducts = selectedCategoryId
    ? tableData.filter((row) => row.category.$id === selectedCategoryId)
    : [];

  const selectedCategory = categoriesWithProducts.find(
    (c) => c.id === selectedCategoryId
  );

  // Check if current category has VAC pricing enabled
  const categoryData = selectedCategoryId
    ? tableData.find((row) => row.category.$id === selectedCategoryId)?.category
    : null;
  const hasVacPricing = categoryData?.enable_vac_pricing ?? false;
  const currentSurcharge = selectedCategoryId && categoryVacSurcharges
    ? categoryVacSurcharges.get(selectedCategoryId) ?? null
    : null;

  return (
    <div className="flex gap-4 h-full">
      {/* Left Column - Master (Category List) */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
            Categories
          </h4>
        </div>
        <div className="overflow-y-auto h-[calc(100%-3rem)]">
          {categoriesWithProducts.map((category) => {
            const productCount = tableData.filter(
              (row) => row.category.$id === category.id
            ).length;
            const isSelected = selectedCategoryId === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                  isSelected
                    ? "bg-supplier-accent/10 dark:bg-supplier-accent/20 border-l-4 border-l-supplier-accent"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {category.icon && (
                    <span
                      className={`material-symbols-outlined text-lg ${
                        isSelected
                          ? "text-supplier-accent"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {category.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {productCount} {productCount === 1 ? "product" : "products"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content Area - Detail (Product Table) */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
        {selectedCategory ? (
          <>
            {/* VAC Surcharge Section */}
            {hasVacPricing && editable && onCategoryVacSurchargeChange && (
              <div className="flex-shrink-0 px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                      package_2
                    </span>
                    <label className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                      VAC Surcharge (per kg):
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-900 dark:text-blue-200 font-medium">€</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentSurcharge ?? ""}
                      onChange={(e) =>
                        onCategoryVacSurchargeChange(
                          selectedCategoryId!,
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="w-32 px-3 py-1.5 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      (Applied to all VAC products in this category)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {hasVacPricing && !editable && currentSurcharge !== null && (
              <div className="flex-shrink-0 px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                      package_2
                    </span>
                    <label className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                      VAC Surcharge (per kg):
                    </label>
                  </div>
                  <span className="text-base font-bold text-blue-900 dark:text-blue-200">
                    €{currentSurcharge.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Product Table */}
            <div className="flex-1 overflow-hidden">
              <PriceListProductTable
                categoryName={selectedCategory.name}
                categoryIcon={selectedCategory.icon}
                products={selectedCategoryProducts}
                onPriceChange={onPriceChange || (() => {})}
                editable={editable}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-12">
            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
              category
            </span>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Select a category to view products
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceListDetailView;
