import React, { useState } from "react";
import Modal from "../common/Modal";
import type { UnitOfMeasure } from "../../types/priceList";

interface CreateUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<UnitOfMeasure, "$id">) => Promise<void>;
  supplierInfo: {
    id: string;
    name: string;
  };
  editUnit?: UnitOfMeasure;
}

const CreateUnitModal: React.FC<CreateUnitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplierInfo,
  editUnit,
}) => {
  const [formData, setFormData] = useState({
    unit_name: editUnit?.unit_name || "",
    display_order: editUnit?.display_order || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when editUnit changes
  React.useEffect(() => {
    if (editUnit) {
      setFormData({
        unit_name: editUnit.unit_name,
        display_order: editUnit.display_order,
      });
    } else {
      setFormData({
        unit_name: "",
        display_order: 0,
      });
    }
  }, [editUnit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.unit_name.trim()) {
      setError("Unit name is required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        supplier_id: supplierInfo.id,
        supplier_name: supplierInfo.name,
        unit_name: formData.unit_name.trim(),
        is_default: false,
        display_order: formData.display_order,
        is_active: true,
      });

      // Reset form
      setFormData({
        unit_name: "",
        display_order: 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create unit");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        unit_name: "",
        display_order: 0,
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editUnit ? "Edit Unit of Measure" : "Add Unit of Measure"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Unit Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.unit_name}
              onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
              placeholder="e.g., box, piece, liter"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter a short unit name (e.g., "kg", "box", "piece")
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
              Lower numbers appear first in the dropdown
            </p>
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
            <span>
              {loading
                ? editUnit
                  ? "Updating..."
                  : "Adding..."
                : editUnit
                ? "Update Unit"
                : "Add Unit"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUnitModal;
