import React, { useState } from "react";
import Modal from "../common/Modal";
import type { Product, ProductCategory } from "../../types/priceList";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (products: Omit<Product, "$id">[]) => Promise<void>;
  categories: ProductCategory[];
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
}) => {
  const [importText, setImportText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Omit<Product, "$id">[]>([]);

  const handleParse = () => {
    setError(null);
    setPreview([]);

    if (!selectedCategory) {
      setError("Please select a category first");
      return;
    }

    if (!importText.trim()) {
      setError("Please enter product data");
      return;
    }

    try {
      const lines = importText.trim().split("\n");
      const products: Omit<Product, "$id">[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // The new simplified format only cares about the name
        const name = line.split("|")[0].split(",")[0].trim();

        if (!name) continue;

        products.push({
          category_id: selectedCategory,
          name: name,
          unit_of_measure: "box", // Default unit
          display_order: i,
          is_active: true,
        });
      }

      if (products.length === 0) {
        setError("No valid products found in the input");
        return;
      }

      setPreview(products);
    } catch (err) {
      setError("Failed to parse product data. Please check the format.");
    }
  };

  const handleSubmit = async () => {
    if (preview.length === 0) {
      setError("No products to import. Click 'Parse' first.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(preview);
      setImportText("");
      setPreview([]);
      setSelectedCategory("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import products");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setImportText("");
      setPreview([]);
      setSelectedCategory("");
      setError(null);
      onClose();
    }
  };

  const exampleFormats = `Simple format (one product per line):
Salmonfillet Trim A 1000/1400 SCALED PBI
Salmonfillet Trim A 1400/1800 SCALED PBI
Cod Fillet Skin On 200/400 GR

Detailed format (using | separator):
Salmonfillet Trim A 1000/1400 SCALED PBI | A | 1000/1400 | SCALED | PBI
Salmon HOG 2-3 SUP | | 2-3 | | SUP | SAL-HOG-23

CSV format (using commas):
Salmonfillet Trim A,A,1000/1400,SCALED,PBI,SAL-A-1014
Doversoles 2/300 GR,,,,,DOV-2-300`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Products"
      wide
    >
      <div className="flex flex-col h-full">
        <div className="space-y-4 flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            disabled={loading}
          >
            <option value="">Select category for all products...</option>
            {categories.map((category) => (
              <option key={category.$id} value={category.$id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Import Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Data
            </label>
            <button
              type="button"
              onClick={() => setImportText(exampleFormats)}
              className="text-xs text-supplier-accent hover:underline"
            >
              Load Example
            </button>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent resize-none font-mono text-sm"
            placeholder="Paste your product list here (one per line)..."
            disabled={loading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Formats: "Product Name" or "Name | Trim | Size | Skin | Packaging |
            SKU"
          </p>
        </div>

        {/* Parse Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleParse}
            disabled={!selectedCategory || !importText.trim() || loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Parse & Preview
          </button>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Preview ({preview.length} products)
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {preview.slice(0, 10).map((product, index) => (
                <div
                  key={index}
                  className="p-2 bg-white dark:bg-gray-800 rounded text-xs border border-gray-200 dark:border-gray-700"
                >
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {product.name}
                  </div>
                </div>
              ))}
              {preview.length > 10 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  ... and {preview.length - 10} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Format Help */}
        <details className="text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded p-3">
          <summary className="cursor-pointer font-medium">
            Supported Formats
          </summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
            {exampleFormats}
          </pre>
        </details>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || preview.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-supplier-accent rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <span className="animate-spin material-symbols-outlined text-base">
                progress_activity
              </span>
            )}
            <span>
              {loading
                ? "Importing..."
                : `Import ${preview.length} Product${preview.length !== 1 ? "s" : ""}`}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkImportModal;
