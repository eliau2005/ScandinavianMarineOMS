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
import ArchiveModal from "../../priceList/ArchiveModal";
import ConfirmationDialog from "../../common/ConfirmationDialog";
import { createNotification } from "../../../lib/notificationService";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PriceListPDFDocument from "../../pdf/PriceListPDFDocument";

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
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [createDraftConfirm, setCreateDraftConfirm] = useState<PriceList | null>(null);
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

  // Compute draft count and pending approval status
  const draftCount = priceLists.filter((pl) => pl.status === "draft").length;
  const hasReachedDraftLimit = draftCount >= 10;
  const hasPendingApproval = priceLists.some((pl) => pl.status === "pending_approval");

  const loadPriceLists = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const lists = await priceListService.getBySupplier(currentUser.id);
      // Filter out archived price lists - they should only appear in the archive modal
      const activeLists = lists.filter((list) => list.status !== "archived");
      setPriceLists(activeLists);
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
    try {
      // Find the most recent price list (regardless of status)
      const mostRecentList = priceLists.length > 0
        ? priceLists.reduce((latest, current) => {
            const latestDate = new Date(latest.$createdAt || latest.effective_date);
            const currentDate = new Date(current.$createdAt || current.effective_date);
            return currentDate > latestDate ? current : latest;
          })
        : null;

      let newList: PriceList;

      if (mostRecentList) {
        // Duplicate the most recent price list with new dates and status
        newList = await priceListService.duplicate(
          mostRecentList.$id!,
          data.effective_date,
          data.expiry_date!
        );

        // Update the name to match the user's input
        if (data.name !== newList.name) {
          newList = await priceListService.update(newList.$id!, {
            name: data.name,
          });
        }
      } else {
        // No existing price lists, create a new empty one
        newList = await priceListService.create(data);
      }

      await loadPriceLists();
      showNotification("success", "Price list created successfully");
      // Open the new price list for editing
      setView("edit");
      await loadPriceListDetails(newList.$id!);
    } catch (error) {
      console.error("Error creating price list:", error);
      showNotification("error", "Failed to create price list");
    }
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
      // Get the price list to check its status
      const priceList = priceLists.find((pl) => pl.$id === priceListId);

      if (!priceList) {
        showNotification("error", "Price list not found");
        setDeleteConfirm(null);
        return;
      }

      // Only allow deletion of draft price lists
      if (priceList.status !== "draft") {
        showNotification(
          "error",
          `Cannot delete ${priceList.status === "pending_approval" ? "pending approval" : priceList.status} price lists. Only draft price lists can be deleted.`
        );
        setDeleteConfirm(null);
        return;
      }

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

  const handleCreateNewDraft = async () => {
    if (!createDraftConfirm) return;

    try {
      // Check draft limit before creating
      if (hasReachedDraftLimit) {
        showNotification("error", "You have reached the maximum limit of 10 drafts.");
        setCreateDraftConfirm(null);
        return;
      }

      // Duplicate the active price list to create a new draft
      await handleDuplicatePriceList(createDraftConfirm);
      setCreateDraftConfirm(null);
    } catch (error) {
      console.error("Error creating new draft:", error);
      showNotification("error", "Failed to create new draft");
    }
  };

  const handleSetActive = async (priceList: PriceList) => {
    try {
      // Update status to pending_approval instead of activating directly
      await priceListService.update(priceList.$id!, {
        status: "pending_approval",
      });

      // Create notification for admins
      await createNotification(
        "price_list_pending_approval",
        `Price list "${priceList.name}" from ${currentUser?.name} is pending approval`,
        priceList.$id!,
        currentUser?.name || "Unknown Supplier",
        currentUser?.id || "",
        currentUser?.id,
        undefined
      );

      await loadPriceLists();
      showNotification(
        "success",
        "Price list submitted for admin approval successfully"
      );
    } catch (error) {
      console.error("Error submitting price list for approval:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit price list for approval";
      showNotification("error", errorMessage);
    }
  };

  const handleCancelRequest = async (priceList: PriceList) => {
    try {
      // Update status from pending_approval back to draft
      await priceListService.update(priceList.$id!, {
        status: "draft",
      });

      await loadPriceLists();
      showNotification(
        "success",
        "Approval request cancelled. Price list is now back in draft status."
      );
    } catch (error) {
      console.error("Error cancelling approval request:", error);
      showNotification("error", "Failed to cancel approval request");
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

  const handleClearAllPrices = () => {
    setTableData((prev) =>
      prev.map((row) => ({
        ...row,
        price_box: null,
        price_box_vac: null,
      }))
    );
    showNotification("info", "All prices have been cleared");
  };

  const handleSavePrices = async () => {
    if (!selectedPriceList) return;

    // Check if price list is draft
    if (selectedPriceList.status !== "draft") {
      showNotification("error", "Only draft price lists can be edited");
      return;
    }

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Price List Management
          </h2>
          <div className="h-1 w-16 bg-supplier-accent rounded mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your product pricing and update price lists
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchiveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md transition-all"
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            <span>Show Archive</span>
          </button>
          <button
            onClick={() => {
              if (hasReachedDraftLimit) {
                showNotification("error", "You have reached the maximum limit of 10 drafts.");
                return;
              }
              setShowCreateModal(true);
            }}
            disabled={hasReachedDraftLimit}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              hasReachedDraftLimit
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                : "bg-supplier-accent text-white hover:bg-opacity-90 hover:shadow-lg"
            }`}
            title={hasReachedDraftLimit ? "You have reached the maximum limit of 10 drafts" : ""}
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Price List</span>
          </button>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {priceLists.map((priceList) => (
            <PriceListCard
              key={priceList.$id}
              priceList={priceList}
              onView={() => handleViewPriceList(priceList)}
              onEdit={() => handleEditPriceList(priceList)}
              onDelete={() => setDeleteConfirm(priceList.$id!)}
              onDuplicate={() => handleDuplicatePriceList(priceList)}
              onSetActive={() => handleSetActive(priceList)}
              onCancelRequest={() => handleCancelRequest(priceList)}
              onCreateNewDraft={() => setCreateDraftConfirm(priceList)}
              disableSetActive={hasPendingApproval && priceList.status === "draft"}
              disableSetActiveReason="You can only have one price list pending approval at a time"
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

          <div className="flex flex-1 flex-col overflow-hidden">

            {/* Fixed Header */}
            <div className="flex-shrink-0 px-6 pt-6 pb-5 bg-background-light dark:bg-background-dark border-b-2 border-gray-100 dark:border-gray-700">

              <button

                onClick={() => setView("list")}

                className="flex items-center gap-2 text-sm font-medium text-supplier-accent hover:text-opacity-80 mb-5 transition-colors"

              >

                <span className="material-symbols-outlined text-base">

                  arrow_back

                </span>

                <span>Back to Price Lists</span>

              </button>

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">

                    {selectedPriceList?.name}

                  </h2>

                  <div className="h-1 w-16 bg-supplier-accent rounded mb-3"></div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">

                    {selectedPriceList?.status === "draft"
                      ? "Edit prices for this list"
                      : selectedPriceList?.status === "pending_approval"
                      ? "Pending approval - View-only mode"
                      : selectedPriceList?.status === "active"
                      ? "Active price list - View-only mode"
                      : "Archived - View-only mode"}

                  </p>

                </div>

                <div className="flex items-center gap-3">

                  {selectedPriceList && (

                    <PDFDownloadLink

                      document={

                        <PriceListPDFDocument

                          priceList={selectedPriceList}

                          tableData={tableData}

                        />

                      }

                      fileName={`${selectedPriceList.name}.pdf`}

                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md transition-all"

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

                  {selectedPriceList?.status === "pending_approval" && (

                    <button

                      onClick={() => selectedPriceList && handleCancelRequest(selectedPriceList)}

                      className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 hover:shadow-lg transition-all"

                    >

                      <span className="material-symbols-outlined text-base">

                        cancel

                      </span>

                      <span>Cancel Request</span>

                    </button>

                  )}

                  {selectedPriceList?.status === "draft" && (

                    <>

                      <button

                        onClick={handleClearAllPrices}

                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md transition-all"

                      >

                        <span className="material-symbols-outlined text-base">

                          clear_all

                        </span>

                        <span>Clear All Prices</span>

                      </button>

                      <button

                        onClick={handleSavePrices}

                        disabled={saving}

                        className="flex items-center gap-2 px-5 py-2.5 bg-supplier-accent text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"

                      >

                        {saving && (

                          <span className="animate-spin material-symbols-outlined text-base">

                            progress_activity

                          </span>

                        )}

                        <span>{saving ? "Saving..." : "Save Prices"}</span>

                      </button>

                    </>

                  )}

                </div>

              </div>

            </div>


            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="flex gap-6">

                {columns.map((col, colIndex) => (

                  <div key={colIndex} className="w-1/2 space-y-6">

                    {Object.entries(col).map(([categoryId, group]) => (

                      <PriceListProductTable

                        key={categoryId}

                        categoryName={group.name}

                        products={group.products}

                        onPriceChange={handlePriceChange}

                        editable={selectedPriceList?.status === "draft"}

                      />

                    ))}

                  </div>

                ))}

              </div>
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



          <div className="flex flex-1 flex-col overflow-hidden">



            {/* Fixed Header */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-background-light dark:bg-background-dark">



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



                  {selectedPriceList && (



                    <PDFDownloadLink



                      document={



                        <PriceListPDFDocument



                          priceList={selectedPriceList}



                          tableData={tableData}



                        />



                      }



                      fileName={`${selectedPriceList.name}.pdf`}



                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"



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




            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
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

      {/* Archive Modal */}
      {currentUser && (
        <ArchiveModal
          isOpen={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          supplierId={currentUser.id}
          onViewPriceList={handleViewPriceList}
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

      {/* Create New Draft Confirmation */}
      <ConfirmationDialog
        isOpen={createDraftConfirm !== null}
        onClose={() => setCreateDraftConfirm(null)}
        onConfirm={handleCreateNewDraft}
        title="Create New Draft?"
        message={`This will create a new draft based on "${createDraftConfirm?.name}". You can then edit the new draft as needed.`}
        confirmText="Create Draft"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />
    </>
  );
};

export default PriceListManagement;
