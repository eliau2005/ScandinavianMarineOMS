import React, { useState, useEffect } from "react";
import { associationService } from "../../../lib/orderService";
import { account } from "../../../lib/appwrite";
import { getAllUsers, type UserWithEmail } from "../../../lib/userManagement";
import type { CustomerSupplierAssociation } from "../../../types/order";
import Modal from "../../common/Modal";
import ConfirmationDialog from "../../common/ConfirmationDialog";

interface Notification {
  type: "success" | "error" | "info";
  message: string;
}

const SupplierCustomerAssociations = () => {
  const [associations, setAssociations] = useState<CustomerSupplierAssociation[]>([]);
  const [suppliers, setSuppliers] = useState<UserWithEmail[]>([]);
  const [customers, setCustomers] = useState<UserWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    supplier_ids: [] as string[],
    notes: "",
  });
  const [editingCustomer, setEditingCustomer] = useState<UserWithEmail | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load associations
      const associationsData = await associationService.getAll();
      setAssociations(associationsData);

      // Load all users using the user management function
      const allUsers = await getAllUsers();

      // Get current admin ID
      const currentUser = await account.get();
      setCurrentAdminId(currentUser.$id);

      // Filter suppliers and customers by role
      const suppliersData = allUsers.filter((user) => user.role === "Supplier");
      const customersData = allUsers.filter((user) => user.role === "Customer");

      setSuppliers(suppliersData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading data:", error);
      showNotification("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: Notification["type"], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id || formData.supplier_ids.length === 0) {
      showNotification("error", "Please select a customer and at least one supplier");
      return;
    }

    try {
      const customer = customers.find((c) => (c as any).id === formData.customer_id);
      let created = 0;
      let reactivated = 0;
      let skipped = 0;

      for (const supplierId of formData.supplier_ids) {
        const supplier = suppliers.find((s) => (s as any).id === supplierId);

        // Check if association already exists
        const existingAssociation = associations.find(
          (a) => a.customer_id === formData.customer_id && a.supplier_id === supplierId
        );

        if (existingAssociation) {
          if (!existingAssociation.is_active) {
            await associationService.activate(existingAssociation.$id!);
            reactivated++;
          } else {
            skipped++;
          }
        } else {
          await associationService.create({
            customer_id: formData.customer_id,
            customer_name: customer?.username || "Unknown Customer",
            supplier_id: supplierId,
            supplier_name: supplier?.username || "Unknown Supplier",
            is_active: true,
            created_by: currentAdminId,
            notes: formData.notes || null,
          });
          created++;
        }
      }

      await loadData();

      const messages = [];
      if (created > 0) messages.push(`${created} created`);
      if (reactivated > 0) messages.push(`${reactivated} reactivated`);
      if (skipped > 0) messages.push(`${skipped} already existed`);

      showNotification("success", `Associations: ${messages.join(", ")}`);
      setShowCreateModal(false);
      setFormData({ customer_id: "", supplier_ids: [], notes: "" });
    } catch (error) {
      console.error("Error creating associations:", error);
      showNotification("error", "Failed to create associations");
    }
  };

  const handleEdit = (customer: UserWithEmail) => {
    const customerAssociations = associations.filter(
      (a) => a.customer_id === (customer as any).id
    );
    const activeSupplierIds = customerAssociations
      .filter((a) => a.is_active)
      .map((a) => a.supplier_id);

    setEditingCustomer(customer);
    setFormData({
      customer_id: (customer as any).id,
      supplier_ids: activeSupplierIds,
      notes: "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCustomer) return;

    try {
      const customerId = (editingCustomer as any).id;
      const currentAssociations = associations.filter((a) => a.customer_id === customerId);
      const currentSupplierIds = currentAssociations.map((a) => a.supplier_id);

      // Determine which to add and which to remove
      const toAdd = formData.supplier_ids.filter((id) => !currentSupplierIds.includes(id));
      const toRemove = currentSupplierIds.filter((id) => !formData.supplier_ids.includes(id));
      const toActivate = currentAssociations
        .filter((a) => formData.supplier_ids.includes(a.supplier_id) && !a.is_active)
        .map((a) => a.$id!);

      // Add new associations
      for (const supplierId of toAdd) {
        const supplier = suppliers.find((s) => (s as any).id === supplierId);
        await associationService.create({
          customer_id: customerId,
          customer_name: editingCustomer.username,
          supplier_id: supplierId,
          supplier_name: supplier?.username || "Unknown Supplier",
          is_active: true,
          created_by: currentAdminId,
          notes: formData.notes || null,
        });
      }

      // Deactivate removed associations
      for (const supplierId of toRemove) {
        const assoc = currentAssociations.find((a) => a.supplier_id === supplierId);
        if (assoc?.is_active) {
          await associationService.deactivate(assoc.$id!);
        }
      }

      // Activate previously inactive associations
      for (const assocId of toActivate) {
        await associationService.activate(assocId);
      }

      await loadData();
      showNotification("success", "Associations updated successfully");
      setShowEditModal(false);
      setEditingCustomer(null);
      setFormData({ customer_id: "", supplier_ids: [], notes: "" });
    } catch (error) {
      console.error("Error updating associations:", error);
      showNotification("error", "Failed to update associations");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await associationService.deactivate(id);
        showNotification("success", "Association deactivated");
      } else {
        await associationService.activate(id);
        showNotification("success", "Association activated");
      }
      await loadData();
    } catch (error) {
      showNotification("error", "Failed to update association");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await associationService.delete(id);
      await loadData();
      showNotification("success", "Association deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      showNotification("error", "Failed to delete association");
    }
  };

  // Group associations by customer
  const groupedAssociations = customers.map((customer) => ({
    customer,
    associations: associations.filter((a) => a.customer_id === (customer as any).id),
  }));

  return (
    <div className="flex flex-1 flex-col p-6">
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

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Customer-Supplier Associations
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage which customers can order from which suppliers (customers can have multiple suppliers)
          </p>
          {associations.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Total active associations: {associations.filter(a => a.is_active).length} / {associations.length}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Temporary: Delete invalid associations */}
          {associations.filter(a => !customers.some(c => (c as any).id === a.customer_id)).length > 0 && (
            <button
              onClick={async () => {
                const invalidAssociations = associations.filter(
                  a => !customers.some(c => (c as any).id === a.customer_id)
                );
                if (window.confirm(`Delete ${invalidAssociations.length} invalid associations?`)) {
                  for (const assoc of invalidAssociations) {
                    try {
                      await associationService.delete(assoc.$id!);
                    } catch (error) {
                      console.error("Error deleting:", error);
                    }
                  }
                  await loadData();
                  showNotification("success", "Invalid associations deleted");
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              <span>Delete Invalid ({associations.filter(a => !customers.some(c => (c as any).id === a.customer_id)).length})</span>
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-admin-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Association</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-admin-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading associations...</p>
          </div>
        </div>
      ) : groupedAssociations.filter((g) => g.associations.length > 0).length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            link
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            No associations yet
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Create associations to allow customers to order from suppliers
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Each customer can be associated with multiple suppliers
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedAssociations
            .filter((g) => g.associations.length > 0)
            .map(({ customer, associations: customerAssociations }) => (
              <div
                key={(customer as any).id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {customer.username}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-admin-accent/10 text-admin-accent rounded-full text-xs font-semibold">
                        {customerAssociations.length} {customerAssociations.length === 1 ? 'supplier' : 'suppliers'}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-semibold">
                        {customerAssociations.filter(a => a.is_active).length} active
                      </span>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {customerAssociations.map((association) => (
                      <div
                        key={association.$id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                            store
                          </span>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {association.supplier_name}
                            </p>
                            {association.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {association.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleActive(association.$id!, association.is_active)
                            }
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              association.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {association.is_active ? "Active" : "Inactive"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(association.$id!)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-base">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ customer_id: "", supplier_ids: [], notes: "" });
        }}
        title="Create Customer-Supplier Associations"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.customer_id}
              onChange={(e) =>
                setFormData({ ...formData, customer_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-admin-accent"
              required
            >
              <option value="">Select a customer...</option>
              {customers.map((customer) => (
                <option key={(customer as any).id} value={(customer as any).id}>
                  {customer.username} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          {/* Suppliers (Checkboxes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suppliers <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-60 overflow-y-auto bg-white dark:bg-gray-700">
              {suppliers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No suppliers available</p>
              ) : (
                <div className="space-y-2">
                  {suppliers.map((supplier) => (
                    <label
                      key={(supplier as any).id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.supplier_ids.includes((supplier as any).id)}
                        onChange={(e) => {
                          const supplierId = (supplier as any).id;
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              supplier_ids: [...formData.supplier_ids, supplierId],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              supplier_ids: formData.supplier_ids.filter((id) => id !== supplierId),
                            });
                          }
                        }}
                        className="w-4 h-4 text-admin-accent border-gray-300 rounded focus:ring-admin-accent"
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        {supplier.username} ({supplier.email})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selected: {formData.supplier_ids.length} supplier{formData.supplier_ids.length !== 1 ? 's' : ''}
            </p>
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-admin-accent resize-none"
              placeholder="Internal notes about this association..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ customer_id: "", supplier_ids: [], notes: "" });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-admin-accent rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Create Associations
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCustomer(null);
          setFormData({ customer_id: "", supplier_ids: [], notes: "" });
        }}
        title={`Edit Suppliers for ${editingCustomer?.username || 'Customer'}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {/* Suppliers (Checkboxes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suppliers <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-60 overflow-y-auto bg-white dark:bg-gray-700">
              {suppliers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No suppliers available</p>
              ) : (
                <div className="space-y-2">
                  {suppliers.map((supplier) => (
                    <label
                      key={(supplier as any).id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.supplier_ids.includes((supplier as any).id)}
                        onChange={(e) => {
                          const supplierId = (supplier as any).id;
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              supplier_ids: [...formData.supplier_ids, supplierId],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              supplier_ids: formData.supplier_ids.filter((id) => id !== supplierId),
                            });
                          }
                        }}
                        className="w-4 h-4 text-admin-accent border-gray-300 rounded focus:ring-admin-accent"
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        {supplier.username} ({supplier.email})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selected: {formData.supplier_ids.length} supplier{formData.supplier_ids.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingCustomer(null);
                setFormData({ customer_id: "", supplier_ids: [], notes: "" });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-admin-accent rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Association"
        message="Are you sure you want to delete this association? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default SupplierCustomerAssociations;
