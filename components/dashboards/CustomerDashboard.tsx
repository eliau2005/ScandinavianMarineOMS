import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import PlaceOrder from "./customer/PlaceOrder";
import OrderHistory from "./customer/OrderHistory";
import { Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

type CustomerView = "order" | "history";

const CustomerDashboard = () => {
  const [activeView, setActiveView] = useState<CustomerView>("order");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  const handleDrawerToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navLinks: { id: CustomerView; label: string; icon: string }[] = [
    { id: "order", label: "Order", icon: "shopping_cart" },
    { id: "history", label: "History", icon: "history" },
  ];

  const renderContent = () => {
    switch (activeView) {
      case "order":
        return <PlaceOrder />;
      case "history":
        return <OrderHistory />;
      default:
        return <PlaceOrder />;
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
                setActiveView(link.id);
                setMobileMenuOpen(false);
              }}
              selected={activeView === link.id}
            >
              <ListItemIcon>
                <span className="material-symbols-outlined">{link.icon}</span>
              </ListItemIcon>
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
          <span className="material-symbols-outlined text-3xl text-customer-accent mr-2">
            person
          </span>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Customer Portal
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveView(link.id)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                activeView === link.id
                  ? "text-customer-accent font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-customer-accent dark:hover:text-customer-accent"
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
      <main className="flex flex-1 flex-col overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default CustomerDashboard;
