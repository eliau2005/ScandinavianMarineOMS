import React from "react";
import type { PriceListTableRow } from "../../../types/priceList";

interface PriceListProductTableProps {
  categoryName: string;
  categoryIcon?: string;
  products: PriceListTableRow[];
  onPriceChange: (
    productId: string,
    field: "price_box" | "vac_surcharge_per_kg",
    value: number
  ) => void;
  editable: boolean;
}

const PriceListProductTable: React.FC<PriceListProductTableProps> = ({
  categoryName,
  categoryIcon,
  products,
  onPriceChange,
  editable,
}) => {
  // Check if this category has VAC pricing enabled
  const hasVacPricing = products.length > 0 && products[0].category?.enable_vac_pricing;
  const unitOfMeasure = products.length > 0 ? products[0].category?.unit_of_measure || "Box" : "Box";

  return (
    <>
      {/* Category Header */}
      <div className="bg-supplier-accent/10 dark:bg-supplier-accent/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
          {categoryIcon && (
            <span className="material-symbols-outlined text-xl text-supplier-accent">
              {categoryIcon}
            </span>
          )}
          <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {categoryName}
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({products.length} {products.length === 1 ? "product" : "products"})
          </span>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-auto h-[calc(100%-3.5rem)]">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
              inventory_2
            </span>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              No products in this category
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Product Name
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Unit
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Price/{unitOfMeasure}
                </th>
                {hasVacPricing && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    {unitOfMeasure} (VAC +€/kg)
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((row) => (
                <tr
                  key={row.product.$id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {row.product.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {row.category.unit_of_measure}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {editable ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.price_box || ""}
                          onChange={(e) =>
                            onPriceChange(
                              row.product.$id!,
                              "price_box",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-right focus:outline-none focus:ring-2 focus:ring-supplier-accent"
                          placeholder="0.00"
                        />
                      ) : (
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {row.price_box !== null ? `€ ${row.price_box.toFixed(2)}` : "-"}
                        </span>
                      )}
                    </div>
                  </td>
                  {hasVacPricing && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {editable ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.vac_surcharge_per_kg || ""}
                            onChange={(e) =>
                              onPriceChange(
                                row.product.$id!,
                                "vac_surcharge_per_kg",
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-right focus:outline-none focus:ring-2 focus:ring-supplier-accent"
                            placeholder="0.00"
                          />
                        ) : (
                          <span className="text-gray-800 dark:text-gray-200">
                            {row.vac_surcharge_per_kg !== null && row.vac_surcharge_per_kg > 0 ? `+€${row.vac_surcharge_per_kg.toFixed(2)}/kg` : "-"}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default PriceListProductTable;
