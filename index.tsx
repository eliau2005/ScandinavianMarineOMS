import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { account, databases, appwriteConfig } from "./lib/appwrite";
import { Models } from "appwrite";
import Login from "./components/Login";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import CustomerDashboard from "./components/dashboards/CustomerDashboard";
import SupplierDashboard from "./components/dashboards/SupplierDashboard";

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type UserRole = "Admin" | "Supplier" | "Customer";

type UserProfile = {
  role: UserRole;
  username: string;
} | null;

const App = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if user is logged in
      const currentUser = await account.get();
      setUser(currentUser);

      // Fetch user profile from database
      const profileDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.profilesCollectionId,
        currentUser.$id
      );

      setProfile({
        role: profileDoc.role as UserRole,
        username: profileDoc.username,
      });
    } catch (error) {
      // User is not logged in or session expired
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (user && profile) {
    switch (profile.role) {
      case "Admin":
        return <AdminDashboard />;
      case "Customer":
        return <CustomerDashboard />;
      case "Supplier":
        return <SupplierDashboard />;
      default:
        return <Login onLoginSuccess={checkAuth} />;
    }
  }

  return <Login onLoginSuccess={checkAuth} />;
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  </QueryClientProvider>
);
