import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import type { Product, ProductCategory } from "../../types/priceList";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Product, "$id">) => Promise<void>;
  categories: ProductCategory[];
  editProduct?: Product;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editProduct,
}) => {
  const [formData, setFormData] = useState({
    category_id: editProduct?.category_id || "",
    name: editProduct?.name || "",
    display_order: editProduct?.display_order || 0,
    is_active: editProduct?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editProduct) {
      setFormData({
        category_id: editProduct.category_id,
        name: editProduct.name,
        display_order: editProduct.display_order,
        is_active: editProduct.is_active,
      });
    }
  }, [editProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.category_id) {
      setError("Please select a category");
      return;
    }
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        category_id: formData.category_id,
        name: formData.name.trim(),
        display_order: formData.display_order,
        is_active: formData.is_active,
      });

      // Reset form
      setFormData({
        category_id: "",
        name: "",
        display_order: 0,
        is_active: true,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        category_id: "",
        name: "",
        display_order: 0,
        is_active: true,
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editProduct ? "Edit Product" : "Create Product"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="space-y-4 flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            disabled={loading}
          >
            <option value="">Select a category...</option>
            {categories.map((category) => (
              <option key={category.$id} value={category.$id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Name (Fish) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            placeholder="e.g., Salmon, Cod, Tuna"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter the fish name only. Unit of measure is set at the category level.
          </p>
        </div>

        {/* Display Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Display Order
          </label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            disabled={loading}
            min="0"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Lower numbers appear first
          </p>
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="product_is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-supplier-accent bg-gray-100 border-gray-300 rounded focus:ring-supplier-accent focus:ring-2"
            disabled={loading}
          />
          <label htmlFor="product_is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active
          </label>
        </div>
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
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-supplier-accent rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <span className="animate-spin material-symbols-outlined text-base">
                progress_activity
              </span>
            )}
            <span>{loading ? "Saving..." : editProduct ? "Update Product" : "Create Product"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProductModal;
