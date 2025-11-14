import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import CreateUnitModal from "./CreateUnitModal";
import type { ProductCategory, UnitOfMeasure } from "../../types/priceList";
import { unitOfMeasureService } from "../../lib/unitOfMeasureService";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ProductCategory, "$id">) => Promise<void>;
  editCategory?: ProductCategory;
  supplierInfo: {
    id: string;
    name: string;
  };
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editCategory,
  supplierInfo,
}) => {
  const [formData, setFormData] = useState({
    name: editCategory?.name || "",
    unit_of_measure: editCategory?.unit_of_measure || "",
    description: editCategory?.description || "",
    is_active: editCategory?.is_active ?? true,
    enable_vac_pricing: editCategory?.enable_vac_pricing || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Load units when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUnits();
    }
  }, [isOpen, supplierInfo.id]);

  // Update form when editCategory changes
  useEffect(() => {
    if (editCategory) {
      setFormData({
        name: editCategory.name,
        unit_of_measure: editCategory.unit_of_measure || "",
        description: editCategory.description || "",
        is_active: editCategory.is_active,
        enable_vac_pricing: editCategory.enable_vac_pricing || false,
      });
    }
  }, [editCategory]);

  const loadUnits = async () => {
    setLoadingUnits(true);
    try {
      const fetchedUnits = await unitOfMeasureService.getBySupplier(supplierInfo.id);
      setUnits(fetchedUnits);
      // If no unit is selected and we have units, select the first one
      if (!formData.unit_of_measure && fetchedUnits.length > 0) {
        setFormData(prev => ({ ...prev, unit_of_measure: fetchedUnits[0].unit_name }));
      }
    } catch (err) {
      console.error("Failed to load units:", err);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleCreateUnit = async (data: Omit<UnitOfMeasure, "$id">) => {
    await unitOfMeasureService.create(data);
    await loadUnits(); // Refresh the units list
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    if (!formData.unit_of_measure.trim()) {
      setError("Unit of measure is required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        unit_of_measure: formData.unit_of_measure.trim(),
        description: formData.description.trim() || undefined,
        is_active: formData.is_active,
        enable_vac_pricing: formData.enable_vac_pricing,
        display_order: 0, // Default value
      });

      // Reset form
      setFormData({
        name: "",
        unit_of_measure: units.length > 0 ? units[0].unit_name : "",
        description: "",
        is_active: true,
        enable_vac_pricing: false,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: "",
        unit_of_measure: units.length > 0 ? units[0].unit_name : "",
        description: "",
        is_active: true,
        enable_vac_pricing: false,
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editCategory ? "Edit Category" : "Create Product Category"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="space-y-4 flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            placeholder="e.g., Salmon, Cod, Turbot"
            disabled={loading}
          />
        </div>

        {/* Unit of Measure */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowUnitModal(true)}
              className="text-xs font-medium text-supplier-accent hover:text-opacity-80 transition-colors flex items-center gap-1"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Manage Units
            </button>
          </div>
          <select
            value={formData.unit_of_measure}
            onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            disabled={loading || loadingUnits}
          >
            {loadingUnits ? (
              <option>Loading units...</option>
            ) : units.length === 0 ? (
              <option value="">No units available - Click "Manage Units" to add one</option>
            ) : (
              <>
                <option value="">Select a unit</option>
                {units.map((unit) => (
                  <option key={unit.$id} value={unit.unit_name}>
                    {unit.unit_name}
                  </option>
                ))}
              </>
            )}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            All products in this category will use this unit
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent resize-none"
            placeholder="Category description..."
            disabled={loading}
          />
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-supplier-accent bg-gray-100 border-gray-300 rounded focus:ring-supplier-accent focus:ring-2"
              disabled={loading}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enable_vac_pricing"
              checked={formData.enable_vac_pricing}
              onChange={(e) => setFormData({ ...formData, enable_vac_pricing: e.target.checked })}
              className="w-4 h-4 text-supplier-accent bg-gray-100 border-gray-300 rounded focus:ring-supplier-accent focus:ring-2"
              disabled={loading}
            />
            <label htmlFor="enable_vac_pricing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable VAC Pricing
            </label>
          </div>
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
            <span>{loading ? "Saving..." : editCategory ? "Update Category" : "Create Category"}</span>
          </button>
        </div>
      </form>

      {/* Unit Management Modal */}
      <CreateUnitModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSubmit={handleCreateUnit}
        supplierInfo={supplierInfo}
      />
    </Modal>
  );
};

export default CreateCategoryModal;
