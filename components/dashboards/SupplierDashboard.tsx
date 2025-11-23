import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import PriceListManagement from "./supplier/PriceListManagement";
import NewOrdersView from "./supplier/NewOrdersView";
import IncomingOrders from "./supplier/IncomingOrders";
import ProductManagement from "./supplier/ProductManagement";
import SupplierNotificationPanel from "./supplier/SupplierNotificationPanel";
import type { Notification } from "../../lib/notificationService";

type SupplierView = "dashboard" | "orders" | "history" | "pricing" | "products";

const SupplierDashboard = () => {
  const [activeView, setActiveView] = useState<SupplierView>("dashboard");

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Handle notification click based on type
    if (notification.type === "price_list_pending_approval") {
      // Navigate to price lists
      setActiveView("pricing");
    } else if (notification.type === "order_pending_approval") {
      // Navigate to new orders
      setActiveView("orders");
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="flex flex-1 gap-6 p-6">
            {/* Main Quick Actions Area */}
            <div className="flex-1">
              <div className="mb-8 animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">
                  Welcome to Your Portal
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  Quick actions to manage your products, pricing, and orders
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                {/* New Orders */}
                <div onClick={() => setActiveView("orders")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-supplier-accent/10 group-hover:bg-supplier-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-supplier-accent">
                          shopping_cart
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-supplier-accent transition-colors">
                          New Orders
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          View and manage active orders from your customers
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-supplier-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order History */}
                <div onClick={() => setActiveView("history")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-supplier-accent/10 group-hover:bg-supplier-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-supplier-accent">
                          history
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-supplier-accent transition-colors">
                          Order History
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          View complete order history and analytics
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-supplier-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manage Products */}
                <div onClick={() => setActiveView("products")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-supplier-accent/10 group-hover:bg-supplier-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-supplier-accent">
                          inventory_2
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-supplier-accent transition-colors">
                          Manage Products
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Add, edit, and organize your product catalog
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-supplier-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manage Price Lists */}
                <div onClick={() => setActiveView("pricing")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-supplier-accent/10 group-hover:bg-supplier-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-supplier-accent">
                          receipt_long
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-supplier-accent transition-colors">
                          Manage Price Lists
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Create and update pricing for your products
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-supplier-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Panel - Right Side */}
            <div className="hidden lg:block w-96">
              <SupplierNotificationPanel onNotificationClick={handleNotificationClick} />
            </div>
          </div>
        );
      case "products":
        return <ProductManagement />;
      case "orders":
        return <NewOrdersView />;
      case "history":
        return <IncomingOrders />;
      case "pricing":
        return <PriceListManagement />;
      default:
        return null;
    }
  };

  const navLinks: { id: SupplierView; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "orders", label: "New Orders" },
    { id: "history", label: "Order History" },
    { id: "products", label: "Products" },
    { id: "pricing", label: "Price Lists" },
  ];

  return (
    <div className="flex h-screen flex-col bg-background-light dark:bg-background-dark font-display">
      {/* Header with Navigation */}
      <header className="flex h-20 w-full items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 md:px-8 sticky top-0 z-20 transition-all duration-300">
        <button
          onClick={() => setActiveView("dashboard")}
          className="flex items-center hover:opacity-80 transition-opacity gap-3"
        >
          <div className="p-2 bg-supplier-accent/10 rounded-xl">
            <span className="material-symbols-outlined text-3xl text-supplier-accent">
              local_shipping
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Supplier Portal
          </h1>
        </button>

        <nav className="hidden md:flex items-center gap-2 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveView(link.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeView === link.id
                  ? "bg-white dark:bg-gray-700 text-supplier-accent shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 text-sm group"
        >
          <span className="material-symbols-outlined text-xl group-hover:-translate-x-0.5 transition-transform">logout</span>
          <span>Logout</span>
        </button>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default SupplierDashboard;
