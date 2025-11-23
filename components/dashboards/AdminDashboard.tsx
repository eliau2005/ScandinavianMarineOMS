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
              <div className="mb-8 animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">
                  Welcome to Admin Panel
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  Quick actions to manage your system efficiently
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                {/* Manage Users */}
                <div onClick={() => setActiveView("users")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-admin-accent/10 group-hover:bg-admin-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-admin-accent">
                          group
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-admin-accent transition-colors">
                          Manage Users
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Create and manage users in the system
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-admin-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manage Orders */}
                <div onClick={() => setActiveView("orders")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-admin-accent/10 group-hover:bg-admin-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-admin-accent">
                          shopping_cart
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-admin-accent transition-colors">
                          Manage Orders
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          View and manage all system orders
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-admin-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manage Price Lists */}
                <div onClick={() => setActiveView("pricing")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-admin-accent/10 group-hover:bg-admin-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-admin-accent">
                          receipt_long
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-admin-accent transition-colors">
                          Manage Price Lists
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Review and approve supplier price lists
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-admin-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>

                {/* Associate Customers with Suppliers */}
                <div onClick={() => setActiveView("associations")}>
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                    <div className="flex flex-col items-start gap-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-admin-accent/10 group-hover:bg-admin-accent/20 transition-colors duration-300">
                        <span className="material-symbols-outlined text-4xl text-admin-accent">
                          link
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-admin-accent transition-colors">
                          Associate Customers
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Link customers with suppliers for ordering
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <span className="material-symbols-outlined text-2xl text-admin-accent">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>
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
      <header className="flex h-20 w-full items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 md:px-8 sticky top-0 z-20 transition-all duration-300">
        <div className="flex items-center gap-4">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-admin-accent/10 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-admin-accent">
                shield_person
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Admin Panel
            </h1>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-2 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => !link.disabled && setActiveView(link.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${link.disabled
                  ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : activeView === link.id
                    ? "bg-white dark:bg-gray-700 text-admin-accent shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
              aria-disabled={link.disabled}
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
