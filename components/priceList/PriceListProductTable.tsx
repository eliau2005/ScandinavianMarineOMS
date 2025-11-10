import React from "react";
import type { PriceListTableRow } from "../../../types/priceList";

interface PriceListProductTableProps {
  categoryName: string;
  products: PriceListTableRow[];
  onPriceChange: (
    productId: string,
    field: "price_box" | "price_box_vac",
    value: number
  ) => void;
  editable: boolean;
}

const PriceListProductTable: React.FC<PriceListProductTableProps> = ({
  categoryName,
  products,
  onPriceChange,
  editable,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 p-4 border-b border-gray-200 dark:border-gray-700">
        {categoryName}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                Product Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                Unit/Price
              </th>
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
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {row.product.unit_of_measure}
                    </span>
                    <input
                      type="number"
                      value={row.price_box || ""}
                      onChange={(e) =>
                        onPriceChange(
                          row.product.$id!,
                          "price_box",
                          parseFloat(e.target.value)
                        )
                      }
                      disabled={!editable}
                      className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
                      placeholder="Price"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceListProductTable;
