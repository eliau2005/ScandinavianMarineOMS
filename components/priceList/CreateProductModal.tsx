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
    base_name: editProduct?.base_name || "",
    trim_type: editProduct?.trim_type || "",
    size_range: editProduct?.size_range || "",
    weight_unit: editProduct?.weight_unit || "kg",
    skin_type: editProduct?.skin_type || "",
    packaging_type: editProduct?.packaging_type || "",
    display_order: editProduct?.display_order || 0,
    is_active: editProduct?.is_active ?? true,
    sku: editProduct?.sku || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editProduct) {
      setFormData({
        category_id: editProduct.category_id,
        name: editProduct.name,
        base_name: editProduct.base_name,
        trim_type: editProduct.trim_type || "",
        size_range: editProduct.size_range || "",
        weight_unit: editProduct.weight_unit,
        skin_type: editProduct.skin_type || "",
        packaging_type: editProduct.packaging_type || "",
        display_order: editProduct.display_order,
        is_active: editProduct.is_active,
        sku: editProduct.sku || "",
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
    if (!formData.base_name.trim()) {
      setError("Base name is required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        category_id: formData.category_id,
        name: formData.name.trim(),
        base_name: formData.base_name.trim(),
        trim_type: formData.trim_type.trim() || null,
        size_range: formData.size_range.trim() || null,
        weight_unit: formData.weight_unit as "kg" | "gr",
        skin_type: formData.skin_type.trim() || null,
        packaging_type: formData.packaging_type.trim() || null,
        attributes: null,
        display_order: formData.display_order,
        is_active: formData.is_active,
        sku: formData.sku.trim() || null,
      });

      // Reset form
      setFormData({
        category_id: "",
        name: "",
        base_name: "",
        trim_type: "",
        size_range: "",
        weight_unit: "kg",
        skin_type: "",
        packaging_type: "",
        display_order: 0,
        is_active: true,
        sku: "",
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
        base_name: "",
        trim_type: "",
        size_range: "",
        weight_unit: "kg",
        skin_type: "",
        packaging_type: "",
        display_order: 0,
        is_active: true,
        sku: "",
      });
      setError(null);
      onClose();
    }
  };

  // Auto-generate product name from components
  const generateProductName = () => {
    const parts = [
      formData.base_name,
      formData.trim_type,
      formData.size_range,
      formData.skin_type,
      formData.packaging_type,
    ].filter(Boolean);

    return parts.join(" ").trim();
  };

  const handleAutoGenerate = () => {
    setFormData({ ...formData, name: generateProductName() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editProduct ? "Edit Product" : "Create Product"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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

        {/* Base Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.base_name}
            onChange={(e) => setFormData({ ...formData, base_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            placeholder="e.g., Salmon Fillet, Cod Loin"
            disabled={loading}
          />
        </div>

        {/* Attributes Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trim Type
            </label>
            <input
              type="text"
              value={formData.trim_type}
              onChange={(e) => setFormData({ ...formData, trim_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
              placeholder="e.g., A, B, D, E"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Size Range
            </label>
            <input
              type="text"
              value={formData.size_range}
              onChange={(e) => setFormData({ ...formData, size_range: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
              placeholder="e.g., 1000/1400, 2-3 KG"
              disabled={loading}
            />
          </div>
        </div>

        {/* Attributes Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skin Type
            </label>
            <input
              type="text"
              value={formData.skin_type}
              onChange={(e) => setFormData({ ...formData, skin_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
              placeholder="e.g., SCALED, Skin On, Skinless"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Packaging Type
            </label>
            <input
              type="text"
              value={formData.packaging_type}
              onChange={(e) => setFormData({ ...formData, packaging_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
              placeholder="e.g., PBI, PBO, SUP"
              disabled={loading}
            />
          </div>
        </div>

        {/* Full Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Product Name <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
              placeholder="Full product name as it appears on price lists"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleAutoGenerate}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              title="Auto-generate from fields above"
            >
              Auto-Generate
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Click "Auto-Generate" to create name from fields above
          </p>
        </div>

        {/* Additional Fields Row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Weight Unit
            </label>
            <select
              value={formData.weight_unit}
              onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
              disabled={loading}
            >
              <option value="kg">kg</option>
              <option value="gr">gr</option>
            </select>
          </div>
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SKU
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
              placeholder="Optional"
              disabled={loading}
            />
          </div>
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
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
