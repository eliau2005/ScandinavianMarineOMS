import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import PriceListManagement from "./supplier/PriceListManagement";
import IncomingOrders from "./supplier/IncomingOrders";

type SupplierView = "orders" | "pricing";

const SupplierDashboard = () => {
  const [activeView, setActiveView] = useState<SupplierView>("orders");

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  const navLinks: { id: SupplierView; label: string; icon: string }[] = [
    { id: "orders", label: "Incoming Orders", icon: "shopping_cart" },
    { id: "pricing", label: "Price List Management", icon: "receipt_long" },
  ];

  const renderContent = () => {
    switch (activeView) {
      case "orders":
        return <IncomingOrders />;
      case "pricing":
        return <PriceListManagement />;
      default:
        return <IncomingOrders />;
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
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveView(link.id)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                activeView === link.id
                  ? "text-supplier-accent font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-supplier-accent dark:hover:text-supplier-accent"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-supplier-accent text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>Logout</span>
        </button>
      </header>
      <main className="flex flex-1 flex-col overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default SupplierDashboard;
