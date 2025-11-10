import React, { useState, useEffect } from "react";
import { account } from "../../../lib/appwrite";
import {
  priceListService,
  productService,
  productCategoryService,
  priceListItemService,
} from "../../../lib/priceListService";
import type {
  PriceList,
  PriceListTableRow,
  ProductWithCategory,
  PriceListWithItems,
} from "../../../types/priceList";
import PriceListProductTable from "../../priceList/PriceListProductTable";
import PriceListCard from "../../priceList/PriceListCard";
import CreatePriceListModal from "../../priceList/CreatePriceListModal";
import ConfirmationDialog from "../../common/ConfirmationDialog";
import { exportPriceListToPDF, exportSimplePriceListToPDF } from "../../../lib/pdfExport";

type View = "list" | "edit" | "view";

interface Notification {
  type: "success" | "error" | "info";
  message: string;
}

const PriceListManagement = () => {
  const [view, setView] = useState<View>("list");
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [selectedPriceList, setSelectedPriceList] =
    useState<PriceListWithItems | null>(null);
  const [tableData, setTableData] = useState<PriceListTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await account.get();
        setCurrentUser({
          id: user.$id,
          name: user.name || "Supplier",
        });
      } catch (error) {
        console.error("Error loading user:", error);
        showNotification("error", "Failed to load user information");
      }
    };
    loadUser();
  }, []);

  // Load price lists
  useEffect(() => {
    if (currentUser) {
      loadPriceLists();
    }
  }, [currentUser]);

  const loadPriceLists = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const lists = await priceListService.getBySupplier(currentUser.id);
      setPriceLists(lists);
    } catch (error) {
      console.error("Error loading price lists:", error);
      showNotification("error", "Failed to load price lists");
    } finally {
      setLoading(false);
    }
  };

  const loadPriceListDetails = async (priceListId: string) => {
    setLoading(true);
    try {
      const details = await priceListService.getWithItems(priceListId);
      setSelectedPriceList(details);

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
          price_box_vac: item?.price_box_vac || null,
          vac_surcharge: item?.vac_surcharge || null,
          is_available: item?.is_available ?? true,
          item_id: item?.$id,
        };
      });

      setTableData(rows);
    } catch (error) {
      console.error("Error loading price list details:", error);
      showNotification("error", "Failed to load price list details");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: Notification["type"], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreatePriceList = async (data: Omit<PriceList, "$id">) => {
    const newList = await priceListService.create(data);
    await loadPriceLists();
    showNotification("success", "Price list created successfully");
    // Open the new price list for editing
    setView("edit");
    await loadPriceListDetails(newList.$id!);
  };

  const handleViewPriceList = async (priceList: PriceList) => {
    setView("view");
    await loadPriceListDetails(priceList.$id!);
  };

  const handleEditPriceList = async (priceList: PriceList) => {
    setView("edit");
    await loadPriceListDetails(priceList.$id!);
  };

  const handleDeletePriceList = async (priceListId: string) => {
    try {
      await priceListService.delete(priceListId);
      await loadPriceLists();
      showNotification("success", "Price list deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting price list:", error);
      showNotification("error", "Failed to delete price list");
    }
  };

  const handleDuplicatePriceList = async (priceList: PriceList) => {
    try {
      // Add 7 days to both start and end dates to preserve delivery window duration
      const originalStart = new Date(priceList.effective_date);
      const originalEnd = new Date(priceList.expiry_date!);

      const newStart = new Date(originalStart);
      newStart.setDate(newStart.getDate() + 7);

      const newEnd = new Date(originalEnd);
      newEnd.setDate(newEnd.getDate() + 7);

      const newStartStr = newStart.toISOString().split("T")[0];
      const newEndStr = newEnd.toISOString().split("T")[0];

      await priceListService.duplicate(priceList.$id!, newStartStr, newEndStr);
      await loadPriceLists();
      showNotification("success", "Price list duplicated successfully");
    } catch (error) {
      console.error("Error duplicating price list:", error);
      showNotification("error", "Failed to duplicate price list");
    }
  };

  const handleSetActive = async (priceList: PriceList) => {
    try {
      await priceListService.activate(priceList.$id!);
      await loadPriceLists();
      showNotification(
        "success",
        "Price list activated successfully. Any previously active price list has been archived."
      );
    } catch (error) {
      console.error("Error activating price list:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to activate price list";
      showNotification("error", errorMessage);
    }
  };

  const handlePriceChange = (
    productId: string,
    field: "price_box" | "price_box_vac",
    value: number
  ) => {
    setTableData((prev) =>
      prev.map((row) => {
        if (row.product.$id === productId) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleSavePrices = async () => {
    if (!selectedPriceList) return;

    setSaving(true);
    try {
      const updates: Array<{ id?: string; data: any }> = [];
      const creates: any[] = [];

      tableData.forEach((row) => {
        if (row.price_box !== null || row.price_box_vac !== null) {
          const itemData = {
            price_list_id: selectedPriceList.$id!,
            product_id: row.product.$id!,
            price_box: row.price_box || 0,
            price_box_vac: row.price_box_vac || null,
            vac_surcharge:
              row.price_box && row.price_box_vac
                ? row.price_box_vac - row.price_box
                : null,
            currency: "EUR",
            is_available: row.is_available,
          };

          if (row.item_id) {
            updates.push({ id: row.item_id, data: itemData });
          } else {
            creates.push(itemData);
          }
        }
      });

      await Promise.all([
        ...updates.map(({ id, data }) =>
          priceListItemService.update(id!, data)
        ),
        ...creates.map((data) => priceListItemService.create(data)),
      ]);

      showNotification("success", "Prices saved successfully");
      await loadPriceListDetails(selectedPriceList.$id!);
    } catch (error) {
      console.error("Error saving prices:", error);
      showNotification("error", "Failed to save prices");
    } finally {
      setSaving(false);
    }
  };

  const renderListView = () => (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Price List Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your product pricing and update price lists
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>New Price List</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-supplier-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading price lists...
            </p>
          </div>
        </div>
      ) : priceLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            receipt_long
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            No price lists yet
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Create your first price list to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {priceLists.map((priceList) => (
            <PriceListCard
              key={priceList.$id}
              priceList={priceList}
              onView={() => handleViewPriceList(priceList)}
              onEdit={() => handleEditPriceList(priceList)}
              onDelete={() => setDeleteConfirm(priceList.$id!)}
              onDuplicate={() => handleDuplicatePriceList(priceList)}
              onSetActive={() => handleSetActive(priceList)}
            />
          ))}
        </div>
      )}
    </div>
  );

      const renderEditView = () => {

        const groupedProducts = tableData.reduce((acc, row) => {

          const categoryId = row.category.$id!;

          if (!acc[categoryId]) {

            acc[categoryId] = {

              name: row.category.name,

              products: [],

            };

          }

          acc[categoryId].products.push(row);

          return acc;

        }, {} as Record<string, { name: string; products: PriceListTableRow[] }>);

    

        const columns: Record<string, { name: string; products: PriceListTableRow[] }>[] = [{}, {}];

        Object.entries(groupedProducts).forEach(([categoryId, group], index) => {

          columns[index % 2][categoryId] = group;

        });

    

        return (

          <div className="flex flex-1 flex-col p-6">

            <div className="mb-6">

              <button

                onClick={() => setView("list")}

                className="flex items-center gap-1 text-sm text-supplier-accent hover:underline mb-4"

              >

                <span className="material-symbols-outlined text-base">

                  arrow_back

                </span>

                <span>Back to Price Lists</span>

              </button>

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">

                    {selectedPriceList?.name}

                  </h2>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">

                    Edit prices for this list

                  </p>

                </div>

                <div className="flex items-center gap-2">

                  <button

                    onClick={() =>

                      selectedPriceList &&

                      exportPriceListToPDF(selectedPriceList, tableData)

                    }

                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"

                  >

                    <span className="material-symbols-outlined text-base">

                      picture_as_pdf

                    </span>

                    <span>Export PDF</span>

                  </button>

                  <button

                    onClick={handleSavePrices}

                    disabled={saving}

                    className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

                  >

                    {saving && (

                      <span className="animate-spin material-symbols-outlined text-base">

                        progress_activity

                      </span>

                    )}

                    <span>{saving ? "Saving..." : "Save Prices"}</span>

                  </button>

                </div>

              </div>

            </div>

    

            <div className="flex gap-6">

              {columns.map((col, colIndex) => (

                <div key={colIndex} className="w-1/2 space-y-6">

                  {Object.entries(col).map(([categoryId, group]) => (

                    <PriceListProductTable

                      key={categoryId}

                      categoryName={group.name}

                      products={group.products}

                      onPriceChange={handlePriceChange}

                      editable={true}

                    />

                  ))}

                </div>

              ))}

            </div>

          </div>

        );

      };

  

      const renderViewView = () => {

  

        const groupedProducts = tableData.reduce((acc, row) => {

  

          const categoryId = row.category.$id!;

  

          if (!acc[categoryId]) {

  

            acc[categoryId] = {

  

              name: row.category.name,

  

              products: [],

  

            };

  

          }

  

          acc[categoryId].products.push(row);

  

          return acc;

  

        }, {} as Record<string, { name: string; products: PriceListTableRow[] }>);

  

    

  

        const columns: Record<string, { name: string; products: PriceListTableRow[] }>[] = [{}, {}];

  

        Object.entries(groupedProducts).forEach(([categoryId, group], index) => {

  

          columns[index % 2][categoryId] = group;

  

        });

  

    

  

        return (

  

          <div className="flex flex-1 flex-col p-6">

  

            <div className="mb-6">

  

              <button

  

                onClick={() => setView("list")}

  

                className="flex items-center gap-1 text-sm text-supplier-accent hover:underline mb-4"

  

              >

  

                <span className="material-symbols-outlined text-base">

  

                  arrow_back

  

                </span>

  

                <span>Back to Price Lists</span>

  

              </button>

  

              <div className="flex items-center justify-between">

  

                <div>

  

                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">

  

                    {selectedPriceList?.name}

  

                  </h2>

  

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">

  

                    View-only mode

  

                  </p>

  

                </div>

  

                <div className="flex items-center gap-2">

  

                  <button

  

                    onClick={() =>

  

                      selectedPriceList &&

  

                      exportPriceListToPDF(selectedPriceList, tableData)

  

                    }

  

                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"

  

                  >

  

                    <span className="material-symbols-outlined text-base">

  

                      picture_as_pdf

  

                    </span>

  

                    <span>Export PDF</span>

  

                  </button>

  

                  {selectedPriceList && selectedPriceList.status !== "archived" && (

  

                    <button

  

                      onClick={() => setView("edit")}

  

                      className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"

  

                    >

  

                      <span className="material-symbols-outlined text-base">

  

                        edit

  

                      </span>

  

                      <span>Edit Prices</span>

  

                    </button>

  

                  )}

  

                </div>

  

              </div>

  

            </div>

  

    

  

            <div className="flex gap-6">

  

              {columns.map((col, colIndex) => (

  

                <div key={colIndex} className="w-1/2 space-y-6">

  

                  {Object.entries(col).map(([categoryId, group]) => (

  

                    <PriceListProductTable

  

                      key={categoryId}

  

                      categoryName={group.name}

  

                      products={group.products}

  

                      onPriceChange={handlePriceChange}

  

                      editable={false}

  

                    />

  

                  ))}

  

                </div>

  

              ))}

  

            </div>

  

          </div>

  

        );

  

      };

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : notification.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {view === "list" && renderListView()}
      {view === "edit" && renderEditView()}
      {view === "view" && renderViewView()}

      {/* Create Modal */}
      {currentUser && (
        <CreatePriceListModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePriceList}
          supplierInfo={currentUser}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeletePriceList(deleteConfirm)}
        title="Delete Price List"
        message="Are you sure you want to delete this price list? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </>
  );
};

export default PriceListManagement;
