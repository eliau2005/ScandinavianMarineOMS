import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import UserManagement from "./admin/UserManagement";
import SupplierCustomerAssociations from "./admin/SupplierCustomerAssociations";
import OrdersOverview from "./admin/OrdersOverview";
import AllPriceLists from "./admin/AllPriceLists";
import NotificationsModal from "./admin/NotificationsModal";
import { Drawer, IconButton, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

type AdminView = "dashboard" | "users" | "associations" | "orders" | "pricing";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

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
        return <OrdersOverview />;
      case "pricing":
        return <AllPriceLists />;
      case "dashboard":
      default:
        return (
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Quick Actions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your system efficiently
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
              {/* Create New User */}
              <button
                onClick={() => setActiveView("users")}
                className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-8 border-2 border-transparent hover:border-admin-accent"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-admin-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl text-admin-accent">
                      person_add
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Create New User
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add new users to the system and manage their roles
                  </p>
                </div>
              </button>

              {/* Create Association */}
              <button
                onClick={() => setActiveView("associations")}
                className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-8 border-2 border-transparent hover:border-admin-accent"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-admin-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl text-admin-accent">
                      link
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Create Association
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Link customers with suppliers for ordering
                  </p>
                </div>
              </button>

              {/* View New Notifications */}
              <button
                onClick={() => setShowNotificationsModal(true)}
                className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-8 border-2 border-transparent hover:border-admin-accent"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-admin-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl text-admin-accent">
                      notifications_active
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    View New Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review and approve pending orders and price lists
                  </p>
                </div>
              </button>
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
      <main className="flex flex-1 flex-col overflow-y-auto">
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
