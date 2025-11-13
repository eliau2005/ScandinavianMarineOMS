import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import PlaceOrder from "./customer/PlaceOrder";
import OrderHistory from "./customer/OrderHistory";
import ViewPendingOrders from "./customer/ViewPendingOrders";
import ViewPriceHistory from "./customer/ViewPriceHistory";
import CustomerNotificationPanel from "./customer/CustomerNotificationPanel";
import type { Notification } from "../../lib/notificationService";
import { Drawer, IconButton, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

type CustomerView = "dashboard" | "placeOrder" | "pendingOrders" | "orderHistory" | "priceHistory";

const CustomerDashboard = () => {
  const [activeView, setActiveView] = useState<CustomerView>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

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
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                  Welcome to Your Portal
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Quick actions to manage your orders and suppliers
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Place New Order */}
                <button
                  onClick={() => setActiveView("placeOrder")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-customer-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-customer-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-customer-accent">
                        shopping_cart
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Place New Order
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Browse products and create a new order from your suppliers
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="material-symbols-outlined text-2xl text-customer-accent group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>

                {/* View Pending Orders */}
                <button
                  onClick={() => setActiveView("pendingOrders")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-customer-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-customer-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-customer-accent">
                        pending_actions
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        View Pending Orders
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track orders awaiting confirmation or approval
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="material-symbols-outlined text-2xl text-customer-accent group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>

                {/* View Order History */}
                <button
                  onClick={() => setActiveView("orderHistory")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-customer-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-customer-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-customer-accent">
                        history
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        View Order History
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Review all your completed and past orders
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="material-symbols-outlined text-2xl text-customer-accent group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>

                {/* View Price History */}
                <button
                  onClick={() => setActiveView("priceHistory")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-customer-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-customer-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-customer-accent">
                        price_check
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        View Price History
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Browse archived price lists from your suppliers
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="material-symbols-outlined text-2xl text-customer-accent group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>
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

  const drawer = (
    <div className="w-64 p-4">
      <h2 className="text-lg font-semibold mb-4">Menu</h2>
      <List>
        {navLinks.map((link) => (
          <ListItem key={link.id} disablePadding>
            <ListItemButton
              onClick={() => {
                setActiveView(link.id);
                setMobileMenuOpen(false);
              }}
              selected={activeView === link.id}
            >
              <ListItemText primary={link.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background-light dark:bg-background-dark font-display">
      {/* Header with Navigation */}
      <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <button
            onClick={() => setActiveView("dashboard")}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-3xl text-customer-accent mr-2">
              person
            </span>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Customer Portal
            </h1>
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveView(link.id)}
              className={`text-sm font-medium transition-colors ${
                activeView === link.id
                  ? "text-customer-accent font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-customer-accent dark:hover:text-customer-accent"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-customer-accent text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>Logout</span>
        </button>
      </header>

      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>

      <main className="flex flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default CustomerDashboard;
