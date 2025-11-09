import React, { useState } from "react";
import { account, databases, appwriteConfig } from "../lib/appwrite";
import { AppwriteException } from "appwrite";

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
      bg: "bg-admin-accent",
      text: "text-admin-accent",
      ring: "focus:ring-admin-accent",
      checkbox: "text-admin-accent",
    },
    Supplier: {
      bg: "bg-supplier-accent",
      text: "text-supplier-accent",
      ring: "focus:ring-supplier-accent",
      checkbox: "text-supplier-accent",
    },
    Customer: {
      bg: "bg-customer-accent",
      text: "text-customer-accent",
      ring: "focus:ring-customer-accent",
      checkbox: "text-customer-accent",
    },
  };

  const currentAccent = accentColors[userType];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Login attempt started for:", email);

      // Create email session with Appwrite
      await account.createEmailPasswordSession(email, password);
      console.log("Session created successfully");

      // Get current user
      const user = await account.get();
      console.log("User retrieved, ID:", user.$id);

      // Fetch user profile to check role
      console.log("Fetching profile from database...");
      console.log("Database ID:", appwriteConfig.databaseId);
      console.log("Collection ID:", appwriteConfig.profilesCollectionId);
      console.log("Document ID (User ID):", user.$id);

      const profileDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.profilesCollectionId,
        user.$id
      );

      console.log("Profile retrieved:", profileDoc);

      // Check if the role matches the selected user type
      if (profileDoc.role !== userType) {
        console.log(`Role mismatch: expected ${userType}, got ${profileDoc.role}`);
        // Delete the session if role doesn't match
        await account.deleteSession("current");
        throw new Error(
          `Access denied. Please use the ${profileDoc.role} login portal.`
        );
      }

      console.log("Login successful!");
      // Login successful, trigger parent component refresh
      onLoginSuccess();
    } catch (err: any) {
      console.error("Login error:", err);

      if (err instanceof AppwriteException) {
        console.error("Appwrite error code:", err.code);
        console.error("Appwrite error type:", err.type);
        console.error("Appwrite error message:", err.message);

        // Handle Appwrite-specific errors
        if (err.code === 401) {
          setError("Invalid email or password.");
        } else if (err.code === 404) {
          setError("Profile not found. Please contact administrator to create your profile in the database.");
        } else if (err.code === 403) {
          setError("Permission denied. Please contact administrator to fix profile permissions.");
        } else {
          setError(err.message || "An unexpected error occurred.");
        }
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
      <div className="flex h-full min-h-screen grow flex-col">
        <div className="flex min-h-screen flex-1">
          <div className="hidden lg:flex lg:w-2/5 flex-col">
            <div
              className="flex h-full w-full grow items-center justify-center bg-center bg-no-repeat bg-cover aspect-auto"
              style={{
                backgroundImage: "linear-gradient(to top, #E0F7FA, #B2EBF2)",
              }}
            ></div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center bg-white dark:bg-gray-900 p-6 md:p-12">
            <div className="flex w-full max-w-md flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <p className="text-[#212529] dark:text-gray-100 tracking-light text-[28px] font-bold leading-tight">
                  Scandinavian Marine (OMS)
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="flex w-full flex-col gap-6"
              >
                <div className="flex w-full px-4 py-3">
                  <div className="flex h-12 flex-1 items-center justify-center rounded-lg bg-background-light dark:bg-background-dark p-1.5 shadow-inner">
                    {(["Admin", "Supplier", "Customer"] as UserType[]).map(
                      (type) => (
                        <label
                          key={type}
                          className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-[#6C757D] dark:text-gray-400 text-sm font-medium leading-normal transition-all duration-200 ${
                            userType === type
                              ? `bg-white dark:bg-gray-700 shadow-md ${currentAccent.text}`
                              : ""
                          }`}
                        >
                          <span className="truncate">{type}</span>
                          <input
                            type="radio"
                            name="user-type"
                            value={type}
                            checked={userType === type}
                            onChange={() => setUserType(type)}
                            className="invisible w-0"
                            disabled={loading}
                          />
                        </label>
                      )
                    )}
                  </div>
                </div>
                <div className="flex flex-col w-full gap-4 px-4">
                  <div className="flex flex-col flex-1">
                    <label
                      htmlFor="email-address"
                      className="text-[#212529] dark:text-gray-200 text-sm font-medium leading-normal pb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <span
                        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        style={{ fontSize: "20px" }}
                      >
                        mail
                      </span>
                      <input
                        id="email-address"
                        className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#212529] dark:text-gray-100 focus:outline-none focus:ring-2 border border-[#CED4DA] dark:border-gray-600 bg-[#F8F9FA] dark:bg-gray-800 h-12 placeholder:text-[#6C757D] dark:placeholder-gray-500 pl-10 pr-4 text-base font-normal leading-normal transition-all duration-200 ${currentAccent.ring}`}
                        placeholder="Enter your email address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label
                      htmlFor="password"
                      className="text-[#212529] dark:text-gray-200 text-sm font-medium leading-normal pb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <span
                        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        style={{ fontSize: "20px" }}
                      >
                        lock
                      </span>
                      <input
                        id="password"
                        className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#212529] dark:text-gray-100 focus:outline-none focus:ring-2 border border-[#CED4DA] dark:border-gray-600 bg-[#F8F9FA] dark:bg-gray-800 h-12 placeholder:text-[#6C757D] dark:placeholder-gray-500 pl-10 pr-10 text-base font-normal leading-normal transition-all duration-200 ${currentAccent.ring}`}
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C757D] dark:text-gray-400"
                        disabled={loading}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "20px" }}
                        >
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="px-4 text-center text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`form-checkbox h-4 w-4 rounded border-gray-300 focus:ring-1 ${currentAccent.checkbox} ${currentAccent.ring}`}
                      disabled={loading}
                    />
                    <label
                      htmlFor="remember-me"
                      className="text-sm text-[#6C757D] dark:text-gray-400"
                    >
                      Remember Me
                    </label>
                  </div>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                      currentAccent.text
                    } ${loading ? "pointer-events-none opacity-50" : ""}`}
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="px-4 py-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex w-full items-center justify-center rounded-lg h-12 px-6 text-base font-medium text-white shadow-sm transition-all duration-200 hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed ${currentAccent.bg}`}
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                    ) : (
                      <span>Login</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;