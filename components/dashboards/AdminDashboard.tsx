import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import UserManagement from "./admin/UserManagement";
import SupplierCustomerAssociations from "./admin/SupplierCustomerAssociations";
import OrdersOverview from "./admin/OrdersOverview";
import AllPriceLists from "./admin/AllPriceLists";
import { Drawer, IconButton, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

type AdminView = "dashboard" | "users" | "associations" | "orders" | "pricing";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState<AdminView>("users");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div className="flex flex-1 flex-col items-center justify-center text-gray-800 dark:text-gray-200">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <span className="material-symbols-outlined text-6xl text-admin-accent">
                engineering
              </span>
              <h1 className="mt-4 text-3xl font-bold">Dashboard</h1>
              <p className="mt-2 text-lg">This page is under development.</p>
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
    </div>
  );
};

export default AdminDashboard;
