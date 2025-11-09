import React, { useState, useEffect } from 'react';

type UserRole = "Admin" | "Supplier" | "Customer";
type UserDetail = {
  id: string;
  email: string;
  role: UserRole;
  username: string;
};

interface EditUserFormProps {
  user: UserDetail;
  onSave: (id: string, updates: { username: string; role: UserRole }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onSave, onCancel, isSaving }) => {
  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState<UserRole>(user.role);

  useEffect(() => {
    setUsername(user.username);
    setRole(user.role);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, { username, role });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="edit-username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Username (Display Name)
        </label>
        <input
          id="edit-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="form-input w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-admin-accent focus:border-admin-accent"
        />
      </div>
      <div>
        <label
          htmlFor="edit-email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Email Address
        </label>
        <input
          id="edit-email"
          type="email"
          value={user.email}
          disabled
          className="form-input w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed.</p>
      </div>
      <div>
        <label
          htmlFor="edit-role"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Role
        </label>
        <select
          id="edit-role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          required
          className="form-select w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-admin-accent focus:border-admin-accent"
        >
          <option value="Admin">Admin</option>
          <option value="Supplier">Supplier</option>
          <option value="Customer">Customer</option>
        </select>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-admin-accent border border-transparent rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-admin-accent disabled:opacity-50"
        >
          {isSaving ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default EditUserForm;
