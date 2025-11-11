import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import type { PriceList, PriceListWithItems, PriceListTableRow } from "../../types/priceList";
import {
  priceListService,
  productService,
  productCategoryService,
} from "../../lib/priceListService";
import PriceListPDFDocument from "../pdf/PriceListPDFDocument";

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  onViewPriceList?: (priceList: PriceList) => void;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  supplierId,
  onViewPriceList,
}) => {
  const [archivedLists, setArchivedLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<string>("");
  const [priceListData, setPriceListData] = useState<
    Map<string, { priceList: PriceListWithItems; tableData: PriceListTableRow[] }>
  >(new Map());

  useEffect(() => {
    if (isOpen && supplierId) {
      loadArchivedLists();
    }
  }, [isOpen, supplierId]);

  const loadArchivedLists = async () => {
    setLoading(true);
    try {
      const allLists = await priceListService.getBySupplier(supplierId);
      const archived = allLists.filter((list) => list.status === "archived");
      setArchivedLists(archived);
    } catch (error) {
      console.error("Error loading archived price lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceListDetailsForPDF = async (priceListId: string) => {
    // Check if already loaded
    if (priceListData.has(priceListId)) {
      return priceListData.get(priceListId)!;
    }

    try {
      const details = await priceListService.getWithItems(priceListId);

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

      const data = { priceList: details, tableData: rows };
      setPriceListData(new Map(priceListData.set(priceListId, data)));
      return data;
    } catch (error) {
      console.error("Error loading price list details:", error);
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const handleDownloadAllAsZip = async () => {
    if (archivedLists.length === 0) return;

    setDownloadingZip(true);
    setZipProgress("Initializing...");

    try {
      const zip = new JSZip();

      // Loop through all archived lists
      for (let i = 0; i < archivedLists.length; i++) {
        const priceList = archivedLists[i];
        setZipProgress(`Processing ${i + 1} of ${archivedLists.length}: ${priceList.name}...`);

        // Load price list details if not already loaded
        let data = priceListData.get(priceList.$id!);
        if (!data) {
          data = await loadPriceListDetailsForPDF(priceList.$id!);
        }

        // Generate PDF blob
        const pdfDoc = (
          <PriceListPDFDocument
            priceList={data.priceList}
            tableData={data.tableData}
          />
        );

        const blob = await pdf(pdfDoc).toBlob();

        // Add PDF to zip with sanitized filename
        const fileName = `${priceList.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        zip.file(fileName, blob);
      }

      setZipProgress("Generating ZIP file...");

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `archived_price_lists_${format(new Date(), "yyyy-MM-dd")}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setZipProgress("Download complete!");
      setTimeout(() => {
        setZipProgress("");
        setDownloadingZip(false);
      }, 2000);
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      setZipProgress("Error creating ZIP file");
      setTimeout(() => {
        setZipProgress("");
        setDownloadingZip(false);
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Archived Price Lists
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View and export archived price lists
            </p>
          </div>
          <div className="flex items-center gap-3">
            {archivedLists.length > 0 && (
              <button
                onClick={handleDownloadAllAsZip}
                disabled={downloadingZip}
                className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingZip ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-base">
                      progress_activity
                    </span>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      folder_zip
                    </span>
                    <span>Download All as ZIP</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {downloadingZip && zipProgress && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {zipProgress}
                </p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-supplier-accent"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading archived price lists...
                </p>
              </div>
            </div>
          ) : archivedLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
                inventory_2
              </span>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
                No archived price lists
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                Archived price lists will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {archivedLists.map((priceList) => {
                const cachedData = priceListData.get(priceList.$id!);

                return (
                  <div
                    key={priceList.$id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {priceList.name}
                        </h3>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="material-symbols-outlined text-base">
                              calendar_today
                            </span>
                            <span>
                              Effective: <strong>{formatDate(priceList.effective_date)}</strong>
                            </span>
                          </div>
                          {priceList.expiry_date && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="material-symbols-outlined text-base">
                                event_busy
                              </span>
                              <span>
                                Expires: <strong>{formatDate(priceList.expiry_date)}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                        {priceList.notes && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {priceList.notes}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        {cachedData ? (
                          <PDFDownloadLink
                            document={
                              <PriceListPDFDocument
                                priceList={cachedData.priceList}
                                tableData={cachedData.tableData}
                              />
                            }
                            fileName={`${priceList.name}.pdf`}
                            className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                          >
                            {({ loading: pdfLoading }) => (
                              <>
                                <span className="material-symbols-outlined text-base">
                                  picture_as_pdf
                                </span>
                                <span>{pdfLoading ? "Generating..." : "Export PDF"}</span>
                              </>
                            )}
                          </PDFDownloadLink>
                        ) : (
                          <button
                            onClick={() => loadPriceListDetailsForPDF(priceList.$id!)}
                            className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">
                              picture_as_pdf
                            </span>
                            <span>Export PDF</span>
                          </button>
                        )}
                        {onViewPriceList && (
                          <button
                            onClick={() => {
                              onViewPriceList(priceList);
                              onClose();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">
                              visibility
                            </span>
                            <span>View List</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveModal;
