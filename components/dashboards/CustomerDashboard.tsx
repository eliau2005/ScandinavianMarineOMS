import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import PlaceOrder from "./customer/PlaceOrder";
import OrderHistory from "./customer/OrderHistory";
import ViewPendingOrders from "./customer/ViewPendingOrders";
import ViewPriceHistory from "./customer/ViewPriceHistory";
import CustomerNotificationPanel from "./customer/CustomerNotificationPanel";
import type { Notification } from "../../lib/notificationService";

type CustomerView = "dashboard" | "placeOrder" | "pendingOrders" | "orderHistory" | "priceHistory";

const CustomerDashboard = () => {
  const [activeView, setActiveView] = useState<CustomerView>("dashboard");

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
      // Navigate to price history to see new price lists
      setActiveView("priceHistory");
    } else if (notification.type === "order_pending_approval") {
      // Navigate to pending orders
      setActiveView("pendingOrders");
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
                  Quick actions to manage your orders and suppliers
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                {/* Place New Order */}
                <div onClick={() => setActiveView("placeOrder")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-customer-accent/10 group-hover:bg-customer-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-customer-accent">
                          shopping_cart
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-customer-accent transition-colors">
                          Place New Order
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Browse products and create a new order from your suppliers
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-customer-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Pending Orders */}
                <div onClick={() => setActiveView("pendingOrders")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-customer-accent/10 group-hover:bg-customer-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-customer-accent">
                          pending_actions
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-customer-accent transition-colors">
                          View Pending Orders
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Track orders awaiting confirmation or approval
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-customer-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Order History */}
                <div onClick={() => setActiveView("orderHistory")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-customer-accent/10 group-hover:bg-customer-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-customer-accent">
                          history
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-customer-accent transition-colors">
                          View Order History
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Review all your completed and past orders
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-customer-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Price History */}
                <div onClick={() => setActiveView("priceHistory")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-customer-accent/10 group-hover:bg-customer-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-customer-accent">
                          price_check
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-customer-accent transition-colors">
                          View Price History
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Browse archived price lists from your suppliers
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-customer-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Panel - Right Side */}
            <div className="hidden lg:block w-96">
              <CustomerNotificationPanel onNotificationClick={handleNotificationClick} />
            </div>
          </div>
        );
      case "placeOrder":
        return <PlaceOrder />;
      case "pendingOrders":
        return <ViewPendingOrders />;
      case "orderHistory":
        return <OrderHistory />;
      case "priceHistory":
        return <ViewPriceHistory />;
      default:
        return null;
    }
  };

  const navLinks: { id: CustomerView; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "placeOrder", label: "Place Order" },
    { id: "pendingOrders", label: "Pending Orders" },
    { id: "orderHistory", label: "Order History" },
    { id: "priceHistory", label: "Price History" },
  ];

  return (
    <div className="flex h-screen flex-col bg-background-light dark:bg-background-dark font-display">
      {/* Header with Navigation */}
      <header className="flex h-20 w-full items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 md:px-8 sticky top-0 z-20 transition-all duration-300">
        <button
          onClick={() => setActiveView("dashboard")}
          className="flex items-center hover:opacity-80 transition-opacity gap-3"
        >
          <div className="p-2 bg-customer-accent/10 rounded-xl">
            <span className="material-symbols-outlined text-3xl text-customer-accent">
              person
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Customer Portal
          </h1>
        </button>

        <nav className="hidden md:flex items-center gap-2 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveView(link.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeView === link.id
                  ? "bg-white dark:bg-gray-700 text-customer-accent shadow-sm"
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

export default CustomerDashboard;
