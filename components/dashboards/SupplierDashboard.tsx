import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import PriceListManagement from "./supplier/PriceListManagement";
import IncomingOrders from "./supplier/IncomingOrders";
import ProductManagement from "./supplier/ProductManagement";
import SupplierNotificationPanel from "./supplier/SupplierNotificationPanel";
import OrderHistoryModal from "./supplier/OrderHistoryModal";

type SupplierView = "dashboard" | "orders" | "pricing" | "products";

const SupplierDashboard = () => {
  const [activeView, setActiveView] = useState<SupplierView>("dashboard");
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  React.useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await account.get();
        setCurrentUserId(user.$id);
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    };
    getCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "products":
        return <ProductManagement />;
      case "orders":
        return <IncomingOrders />;
      case "pricing":
        return <PriceListManagement />;
      case "dashboard":
      default:
        return (
          <div className="flex flex-1 gap-6 p-6">
            <div className="flex-1">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                  Welcome to Your Portal
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Quick actions to manage your products, prices, and orders
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setActiveView("orders")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-supplier-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-supplier-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-supplier-accent">
                        shopping_cart
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Incoming Orders
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View and manage new orders from customers
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setShowOrderHistory(true)}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-supplier-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-supplier-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-supplier-accent">
                        history
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Order History
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View completed or cancelled orders
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveView("products")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-supplier-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-supplier-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-supplier-accent">
                        inventory_2
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Manage Products
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add, edit, or remove products and categories
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveView("pricing")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-supplier-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-supplier-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-supplier-accent">
                        receipt_long
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Manage Price Lists
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create, edit, and activate price lists for your products
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <div className="hidden lg:block w-96">
              <SupplierNotificationPanel />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background-light dark:bg-background-dark font-display">
      <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:px-6 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => setActiveView("dashboard")}
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-3xl text-supplier-accent mr-2">
            local_shipping
          </span>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Supplier Portal
          </h1>
        </button>
        <div className="flex items-center gap-4">
          {activeView !== "dashboard" && (
            <button
              onClick={() => setActiveView("dashboard")}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-supplier-accent dark:hover:text-supplier-accent transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Dashboard</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-supplier-accent text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">{renderContent()}</main>
      {currentUserId && (
        <OrderHistoryModal
          isOpen={showOrderHistory}
          onClose={() => setShowOrderHistory(false)}
          supplierId={currentUserId}
        />
      )}
    </div>
  );
};

export default SupplierDashboard;
