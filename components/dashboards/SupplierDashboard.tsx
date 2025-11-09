import React from "react";
import { account } from "../../lib/appwrite";

const SupplierDashboard = () => {
  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background-light dark:bg-background-dark font-display">
      <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <span className="material-symbols-outlined text-3xl text-supplier-accent mr-2">
            local_shipping
          </span>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Supplier Portal
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-supplier-accent text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>Logout</span>
        </button>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <span className="material-symbols-outlined text-6xl text-supplier-accent">
            construction
          </span>
          <h1 className="mt-4 text-3xl font-bold text-gray-800 dark:text-gray-200">
            Under Development
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            This page is currently under development.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Supplier features coming soon!
          </p>
        </div>
      </main>
    </div>
  );
};

export default SupplierDashboard;
