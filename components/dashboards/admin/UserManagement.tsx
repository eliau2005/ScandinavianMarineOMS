import React, { useState, useEffect, useCallback } from "react";
import Modal from "../../common/Modal";
import EditUserForm from "./EditUserForm";
import ConfirmationDialog from "../../common/ConfirmationDialog";
import {
  getAllUsers,
  createUser,
  updateUserProfile,
  deleteUser,
  getCurrentUser,
  type UserRole,
  type UserWithEmail,
} from "../../../lib/userManagement";

type UserDetail = {
  id: string;
  email: string;
  role: UserRole;
  username: string;
  emailVerification: boolean;
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Customer");
  const [showPassword, setShowPassword] = useState(false);

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserDetail | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserDetail | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const usersData = await getAllUsers();
      // Map to UserDetail format
      const mappedUsers: UserDetail[] = usersData.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerification: user.emailVerification,
      }));
      setUsers(mappedUsers);
    } catch (err: any) {
      setErrorUsers(err.message || "Failed to fetch users.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUserId(user?.$id || null);
    };
    loadCurrentUser();
    fetchUsers();
  }, [fetchUsers]);

  // Clear form status messages when user starts typing new info
  useEffect(() => {
    if (formError) setFormError(null);
    if (formSuccess) setFormSuccess(null);
  }, [username, email, password, role]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setFormError(null);
    setFormSuccess(null);
    setNotification(null);

    try {
      await createUser(email, password, username, role);

      setFormSuccess("User created successfully!");
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("Customer");
      fetchUsers(); // Refresh the user list
    } catch (err: any) {
      setFormError(
        err.message || "An unexpected error occurred while creating the user."
      );
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleOpenEditModal = (user: UserDetail) => {
    setNotification(null);
    setUserToEdit(user);
  };

  const handleCloseEditModal = () => {
    setUserToEdit(null);
  };

  const handleUpdateUser = async (
    id: string,
    updates: { username: string; role: UserRole }
  ) => {
    setIsUpdatingUser(true);
    setNotification(null);
    try {
      await updateUserProfile(id, updates);
      setNotification({
        type: "success",
        message: "User updated successfully!",
      });
      handleCloseEditModal();
      fetchUsers();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to update user.",
      });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleOpenDeleteModal = (user: UserDetail) => {
    setNotification(null);
    setUserToDelete(user);
  };

  const handleCloseDeleteModal = () => {
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    setNotification(null);
    try {
      await deleteUser(userToDelete.id);
      setNotification({
        type: "success",
        message: "User deleted successfully!",
      });
      handleCloseDeleteModal();
      fetchUsers();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to delete user.",
      });
      // Close the modal even on error so the user isn't stuck
      handleCloseDeleteModal();
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {notification && (
        <div
          className={`p-4 rounded-lg mb-6 flex items-center justify-between shadow ${
            notification.type === "success"
              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
          }`}
          role="alert"
        >
          <p>{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="text-current"
            aria-label="Close notification"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Create New User
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Username (Display Name)
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="form-input w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-admin-accent focus:border-admin-accent"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-admin-accent focus:border-admin-accent"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="form-input w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-admin-accent focus:border-admin-accent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Role
              </label>
              <select
                id="role"
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
            {formError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400">
                {formSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={isCreatingUser}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-admin-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-admin-accent disabled:opacity-50"
            >
              {isCreatingUser ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
              ) : (
                "Create User"
              )}
            </button>
          </form>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Existing Users
          </h2>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loadingUsers ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 animate-pulse bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-48 animate-pulse bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 animate-pulse bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 animate-pulse bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <div className="h-8 w-16 animate-pulse bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-8 w-16 animate-pulse bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </td>
                    </tr>
                  ))
                ) : errorUsers ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-4 text-red-500"
                    >
                      {errorUsers}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-4 text-gray-500 dark:text-gray-400"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isCurrentUser = user.id === currentUserId;
                    return (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "Admin"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : user.role === "Supplier"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {user.emailVerification ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Confirmed
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center transition-colors"
                            title="Edit user"
                          >
                            <span className="material-symbols-outlined text-lg">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(user)}
                            disabled={isCurrentUser}
                            className={`inline-flex items-center transition-colors ${
                              isCurrentUser
                                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                : "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            }`}
                            title={
                              isCurrentUser
                                ? "You cannot delete yourself"
                                : "Delete user"
                            }
                          >
                            <span className="material-symbols-outlined text-lg">
                              delete
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="block md:hidden space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{user.username}</h3>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === "Admin"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : user.role === "Supplier"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                  }`}>
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                <div>
                  {user.emailVerification ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Confirmed
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Pending
                    </span>
                  )}
                </div>
                <div className="flex justify-end gap-2 border-t pt-2">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center transition-colors"
                    title="Edit user"
                  >
                    <span className="material-symbols-outlined text-lg">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(user)}
                    disabled={user.id === currentUserId}
                    className={`inline-flex items-center transition-colors ${
                      user.id === currentUserId
                        ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    }`}
                    title={
                      user.id === currentUserId
                        ? "You cannot delete yourself"
                        : "Delete user"
                    }
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {userToEdit && (
        <Modal
          isOpen={!!userToEdit}
          onClose={handleCloseEditModal}
          title={`Edit User: ${userToEdit.username}`}
        >
          <EditUserForm
            user={userToEdit}
            onSave={handleUpdateUser}
            onCancel={handleCloseEditModal}
            isSaving={isUpdatingUser}
          />
        </Modal>
      )}
      {userToDelete && (
        <ConfirmationDialog
          isOpen={!!userToDelete}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteUser}
          title="Delete User"
          message={`Are you sure you want to permanently delete the user "${userToDelete.username}" (${userToDelete.email})? This action cannot be undone.`}
          confirmText="Delete"
          isConfirming={isDeletingUser}
        />
      )}
    </div>
  );
};

export default UserManagement;