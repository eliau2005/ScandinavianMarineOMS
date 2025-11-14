import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import type { PriceListTableRow } from "../../types/priceList";

interface PriceTableProps {
  data: PriceListTableRow[];
  onPriceChange?: (productId: string, field: "price_box" | "vac_surcharge_per_kg", value: number) => void;
  editable?: boolean;
  loading?: boolean;
}

const columnHelper = createColumnHelper<PriceListTableRow>();

const PriceTable: React.FC<PriceTableProps> = ({
  data,
  onPriceChange,
  editable = false,
  loading = false,
}) => {
  // Group data by category
  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, PriceListTableRow[]>();

    data.forEach((row) => {
      const categoryId = row.category?.$id || "uncategorized";
      if (!groups.has(categoryId)) {
        groups.set(categoryId, []);
      }
      groups.get(categoryId)!.push(row);
    });

    return Array.from(groups.entries()).map(([categoryId, rows]) => ({
      categoryId,
      categoryName: rows[0]?.category?.name || "Uncategorized",
      category: rows[0]?.category,
      rows,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-supplier-accent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading price data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
          inventory_2
        </span>
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
          No products available
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
          Add products to start building your price list
        </p>
      </div>
    );
  }

  // Render a separate table for each category
  return (
    <div className="space-y-6">
      {groupedByCategory.map((group) => {
        const CategoryTable = () => {
          const [sorting, setSorting] = React.useState<SortingState>([]);

          const columns = useMemo(() => {
            const showVacPricing = group.category?.enable_vac_pricing ?? false;
            const unitOfMeasure = group.category?.unit_of_measure || "Box";

            const baseColumns = [
              columnHelper.accessor("product.name", {
                id: "product_name",
                header: "Product",
                cell: (info) => (
                  <div className="max-w-md">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {info.getValue()}
                    </p>
                  </div>
                ),
              }),
              columnHelper.accessor("price_box", {
                id: "price_box",
                header: `Price/${unitOfMeasure}`,
                cell: (info) => {
                  const value = info.getValue();
                  const productId = info.row.original.product.$id!;

                  if (editable && onPriceChange) {
                    return (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={value || ""}
                        onChange={(e) =>
                          onPriceChange(productId, "price_box", parseFloat(e.target.value) || 0)
                        }
                        className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-supplier-accent"
                        placeholder="0.00"
                      />
                    );
                  }

                  return value !== null ? (
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      € {value.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600">-</span>
                  );
                },
              }),
            ];

            if (showVacPricing) {
              baseColumns.push(
                columnHelper.accessor("vac_surcharge_per_kg", {
                  id: "vac_surcharge_per_kg",
                  header: `${unitOfMeasure} (VAC +€/kg)`,
                  cell: (info) => {
                    const value = info.getValue();
                    const productId = info.row.original.product.$id!;

                    if (editable && onPriceChange) {
                      return (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={value || ""}
                          onChange={(e) =>
                            onPriceChange(
                              productId,
                              "vac_surcharge_per_kg",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-supplier-accent"
                          placeholder="0.00"
                        />
                      );
                    }

                    return value !== null && value > 0 ? (
                      <span className="text-gray-800 dark:text-gray-200">
                        +€{value.toFixed(2)}/kg
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    );
                  },
                })
              );
            }

            baseColumns.push(
              columnHelper.accessor("is_available", {
                id: "availability",
                header: "Status",
                cell: (info) => {
                  const available = info.getValue();
                  return (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        available
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {available ? "Available" : "Unavailable"}
                    </span>
                  );
                },
              })
            );

            return baseColumns;
          }, [editable, onPriceChange, group.category]);

          const table = useReactTable({
            data: group.rows,
            columns,
            state: {
              sorting,
            },
            onSortingChange: setSorting,
            getCoreRowModel: getCoreRowModel(),
            getSortedRowModel: getSortedRowModel(),
          });

          return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-2">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getIsSorted() && (
                                <span className="material-symbols-outlined text-sm">
                                  {header.column.getIsSorted() === "asc"
                                    ? "arrow_upward"
                                    : "arrow_downward"}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        };

        return <CategoryTable key={group.categoryId} />;
      })}
    </div>
  );
};

export default PriceTable;
