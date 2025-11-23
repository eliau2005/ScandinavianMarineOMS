import React, { useState } from "react";
import { account, databases, appwriteConfig } from "../lib/appwrite";
import { AppwriteException } from "appwrite";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";

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

  const accentColors = {
    Admin: {
      text: "text-admin-accent",
      bg: "bg-admin-accent",
    },
    Supplier: {
      text: "text-supplier-accent",
      bg: "bg-supplier-accent",
    },
    Customer: {
      text: "text-customer-accent",
      bg: "bg-customer-accent",
    },
  };

  const currentAccent = accentColors[userType];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create email session with Appwrite
      await account.createEmailPasswordSession(email, password);

      // Get current user
      const user = await account.get();

      // Fetch user profile to check role
      const profileDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.profilesCollectionId,
        user.$id
      );

      // Check if the role matches the selected user type
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

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1516916759473-600c07bc5d5f?q=80&w=2560&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in">
        <Card glass className="w-full p-8 sm:p-10 border-white/20 shadow-2xl">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Sign in to Scandinavian Marine OMS
              </p>
            </div>

            {/* User Type Selector */}
            <div className="w-full p-1.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm border border-white/20 dark:border-gray-700/30 flex relative">
              {/* Animated Background Pill - Simplified for now with direct classes */}
              {(["Admin", "Supplier", "Customer"] as UserType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  className={`
                    flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative z-10
                    ${userType === type
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              leftIcon={<span className="material-symbols-outlined text-[20px]">mail</span>}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                leftIcon={<span className="material-symbols-outlined text-[20px]">lock</span>}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                }
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`
                    rounded border-gray-300 text-primary focus:ring-primary 
                    transition-colors duration-200 cursor-pointer
                  `}
                />
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                  Remember me
                </span>
              </label>
              <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className={`w-full mt-2 ${userType === "Admin" ? "bg-admin-accent hover:bg-admin-accent/90 shadow-admin-accent/30" :
                  userType === "Supplier" ? "bg-supplier-accent hover:bg-supplier-accent/90 shadow-supplier-accent/30" :
                    "bg-customer-accent hover:bg-customer-accent/90 shadow-customer-accent/30"
                }`}
            >
              Sign In
            </Button>
          </form>
        </Card>

        <p className="text-center mt-8 text-white/60 text-sm">
          &copy; {new Date().getFullYear()} Scandinavian Marine. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;