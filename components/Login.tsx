import React, { useState } from "react";
import { account, databases, appwriteConfig } from "../lib/appwrite";
import { AppwriteException } from "appwrite";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Anchor } from "lucide-react";

type UserType = "Admin" | "Supplier" | "Customer";

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [userType, setUserType] = useState<UserType>("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      const profileDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.profilesCollectionId,
        user.$id
      );

      if (profileDoc.role !== userType) {
        await account.deleteSession("current");
        throw new Error(
          `You are registered as a ${profileDoc.role}. Please select the "${profileDoc.role}" tab and try again.`
        );
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error("Login error:", err);
      if (err instanceof AppwriteException) {
        if (err.code === 401) {
          setError("Invalid email or password.");
        } else if (err.code === 404) {
          setError("Account not found.");
        } else {
          setError(err.message || "Login failed.");
        }
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getThemeColor = (type: UserType) => {
    switch (type) {
      case "Admin": return "text-blue-600";
      case "Supplier": return "text-emerald-600";
      case "Customer": return "text-indigo-600";
      default: return "text-blue-600";
    }
  };

  const getButtonColor = (type: UserType) => {
    switch (type) {
      case "Admin": return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
      case "Supplier": return "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500";
      case "Customer": return "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
      default: return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Blur - Using inline style for reliability */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2560&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Floating Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-6 sm:p-8 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 mx-4"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-600/20"
          >
            <Anchor className="w-7 h-7" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 dark:text-white text-center"
          >
            Welcome Back
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 dark:text-gray-400 text-sm mt-1 text-center"
          >
            Sign in to Scandinavian Marine OMS
          </motion.p>
        </div>

        {/* User Type Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6"
        >
          {(["Admin", "Supplier", "Customer"] as UserType[]).map((type) => (
            <button
              key={type}
              onClick={() => setUserType(type)}
              className={`
                flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 relative
                ${userType === type
                  ? "text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }
              `}
            >
              {userType === type && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{type}</span>
            </button>
          ))}
        </motion.div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Input
              label="Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="relative"
          >
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-between pt-1"
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
            <a href="#" className={`text-sm font-medium hover:underline ${getThemeColor(userType)}`}>
              Forgot password?
            </a>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              className={`w-full justify-center shadow-lg shadow-blue-900/5 ${getButtonColor(userType)}`}
            >
              Sign in
            </Button>
          </motion.div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-8 text-center text-xs text-gray-400"
        >
          &copy; {new Date().getFullYear()} Scandinavian Marine OMS
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;