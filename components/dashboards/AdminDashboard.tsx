import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import UserManagement from "./admin/UserManagement";
import SupplierCustomerAssociations from "./admin/SupplierCustomerAssociations";
import OrdersOverview from "./admin/OrdersOverview";
import AllPriceLists from "./admin/AllPriceLists";
import NotificationsModal from "./admin/NotificationsModal";
import AdminNotificationPanel from "./admin/AdminNotificationPanel";
import { Drawer, IconButton, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import type { Notification } from "../../lib/notificationService";

type AdminView = "dashboard" | "users" | "associations" | "orders" | "pricing";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [openPriceListId, setOpenPriceListId] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      // Reload the page to clear the state and show login
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      // Force reload anyway
      window.location.reload();
    }
  };

  const handleDrawerToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Handle notification click based on type
    if (notification.type === "price_list_pending_approval") {
      // Navigate to price lists
      setActiveView("pricing");
    } else if (notification.type === "order_pending_approval") {
      // Navigate to orders
      setActiveView("orders");
    }
  };

  const handleViewItemFromNotification = (notification: Notification) => {
    if (notification.type === "price_list_pending_approval") {
      setActiveView("pricing");
      setOpenPriceListId(notification.related_item_id);
    } else if (notification.type === "order_pending_approval") {
      setActiveView("orders");
      setOpenOrderId(notification.related_item_id);
    }
  };

  const navLinks: { id: AdminView; label: string; disabled: boolean }[] = [
    { id: "dashboard", label: "Dashboard", disabled: false },
    { id: "users", label: "Users", disabled: false },
    {
      id: "associations",
      label: "Associations",
      disabled: false,
    },
    { id: "orders", label: "Orders", disabled: false },
    { id: "pricing", label: "Pricing", disabled: false },
  ];

  const renderContent = () => {
    switch (activeView) {
      case "users":
        return <UserManagement />;
      case "associations":
        return <SupplierCustomerAssociations />;
      case "orders":
        return (
          <OrdersOverview
            openOrderId={openOrderId}
            onOrderModalClosed={() => setOpenOrderId(null)}
          />
        );
      case "pricing":
        return (
          <AllPriceLists
            openPriceListId={openPriceListId}
            onPriceListModalClosed={() => setOpenPriceListId(null)}
          />
        );
      case "dashboard":
      default:
        return (
          <div className="flex flex-1 gap-6 p-6">
            {/* Main Quick Actions Area */}
            <div className="flex-1">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                  Welcome to Admin Panel
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Quick actions to manage your system efficiently
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manage Users */}
                <button
                  onClick={() => setActiveView("users")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-admin-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-admin-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-admin-accent">
                        group
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Manage Users
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create and manage users in the system
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="material-symbols-outlined text-2xl text-admin-accent group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>

                {/* Manage Orders */}
                <button
                  onClick={() => setActiveView("orders")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-admin-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-admin-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-admin-accent">
                        shopping_cart
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Manage Orders
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View and manage all system orders
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="material-symbols-outlined text-2xl text-admin-accent group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>

                {/* Manage Price Lists */}
                <button
                  onClick={() => setActiveView("pricing")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-admin-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-admin-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-admin-accent">
                        receipt_long
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Manage Price Lists
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Review and approve supplier price lists
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="material-symbols-outlined text-2xl text-admin-accent group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>

                {/* Associate Customers with Suppliers */}
                <button
                  onClick={() => setActiveView("associations")}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-admin-accent"
                >
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-admin-accent bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-admin-accent">
                        link
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Associate Customers
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Link customers with suppliers for ordering
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="material-symbols-outlined text-2xl text-admin-accent group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Notification Panel - Right Side */}
            <div className="hidden lg:block w-96">
              <AdminNotificationPanel
                onNotificationClick={handleNotificationClick}
                onViewItem={handleViewItemFromNotification}
              />
            </div>
          </div>
        );
    }
  };

  const drawer = (
    <div className="w-64 p-4">
      <h2 className="text-lg font-semibold mb-4">Menu</h2>
      <List>
        {navLinks.map((link) => (
          <ListItem key={link.id} disablePadding>
            <ListItemButton
              onClick={() => {
                !link.disabled && setActiveView(link.id);
                setMobileMenuOpen(false);
              }}
              disabled={link.disabled}
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
          <span className="material-symbols-outlined text-3xl text-admin-accent mr-2">
            shield_person
          </span>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Admin Panel
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => !link.disabled && setActiveView(link.id)}
              className={`text-sm font-medium transition-colors ${
                link.disabled
                  ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : `text-gray-600 dark:text-gray-300 hover:text-admin-accent dark:hover:text-admin-accent ${
                      activeView === link.id
                        ? "!text-admin-accent font-semibold"
                        : ""
                    }`
              }`}
              aria-disabled={link.disabled}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-admin-accent text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors text-sm"
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

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;
