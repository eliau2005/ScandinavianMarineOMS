import React, { useState } from "react";
import Modal from "../common/Modal";
import type { PriceList } from "../../types/priceList";

interface CreatePriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<PriceList, "$id">) => Promise<void>;
  supplierInfo: {
    id: string;
    name: string;
  };
}

const CreatePriceListModal: React.FC<CreatePriceListModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplierInfo,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    effective_date: "",
    expiry_date: "",
    notes: "",
    is_default: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Price list name is required");
      return;
    }

    if (!formData.effective_date) {
      setError("Effective date is required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        supplier_id: supplierInfo.id,
        supplier_name: supplierInfo.name,
        effective_date: new Date(formData.effective_date).toISOString(),
        expiry_date: formData.expiry_date
          ? new Date(formData.expiry_date).toISOString()
          : null,
        status: "draft",
        notes: formData.notes.trim() || null,
        is_default: formData.is_default,
        created_by: supplierInfo.id,
      });

      // Reset form
      setFormData({
        name: "",
        effective_date: "",
        expiry_date: "",
        notes: "",
        is_default: false,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create price list");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: "",
        effective_date: "",
        expiry_date: "",
        notes: "",
        is_default: false,
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Price List">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Price List Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            placeholder="e.g., Weekly Price List 12-11-2025"
            disabled={loading}
          />
        </div>

        {/* Effective Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Effective Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.effective_date}
            onChange={(e) =>
              setFormData({ ...formData, effective_date: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            disabled={loading}
          />
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={formData.expiry_date}
            onChange={(e) =>
              setFormData({ ...formData, expiry_date: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent resize-none"
            placeholder="Internal notes about this price list..."
            disabled={loading}
          />
        </div>

        {/* Set as Default */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_default"
            checked={formData.is_default}
            onChange={(e) =>
              setFormData({ ...formData, is_default: e.target.checked })
            }
            className="w-4 h-4 text-supplier-accent bg-gray-100 border-gray-300 rounded focus:ring-supplier-accent focus:ring-2"
            disabled={loading}
          />
          <label
            htmlFor="is_default"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Set as default price list
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            <span>{loading ? "Creating..." : "Create Price List"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePriceListModal;
