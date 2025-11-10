import React, { useState } from "react";
import { account } from "../../lib/appwrite";
import PriceListManagement from "./supplier/PriceListManagement";
import IncomingOrders from "./supplier/IncomingOrders";
import ProductManagement from "./supplier/ProductManagement";
import { Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

type SupplierView = "orders" | "pricing" | "products";

const SupplierDashboard = () => {
  const [activeView, setActiveView] = useState<SupplierView>("products");
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

    const navLinks: { id: SupplierView; label: string; icon: string }[] = [

      { id: "products", label: "Products", icon: "inventory_2" },

      { id: "pricing", label: "Price Lists", icon: "receipt_long" },

      { id: "orders", label: "Orders", icon: "shopping_cart" },

    ];

  const renderContent = () => {
    switch (activeView) {
      case "products":
        return <ProductManagement />;
      case "orders":
        return <IncomingOrders />;
      case "pricing":
        return <PriceListManagement />;
      default:
        return <ProductManagement />;
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

export default SupplierDashboard;
