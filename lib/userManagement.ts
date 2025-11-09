import { ID, Query, Functions } from "appwrite";
import { account, databases, appwriteConfig, client } from "./appwrite";

const functions = new Functions(client);
const USER_MANAGEMENT_FUNCTION_ID = "user-management"; // You'll need to create this function in Appwrite

export type UserRole = "Admin" | "Supplier" | "Customer";

export interface UserProfile {
  $id: string;
  userId: string;
  username: string;
  role: UserRole;
  $createdAt: string;
  $updatedAt: string;
}

export interface UserWithEmail extends UserProfile {
  email: string;
  emailVerification: boolean;
}

/**
 * Fetch all user profiles with their email information
 * This calls the Appwrite Function to get merged user data
 */
export async function getAllUsers(): Promise<UserWithEmail[]> {
  try {
    // Call the Appwrite Function to list users
    const response = await functions.createExecution(
      USER_MANAGEMENT_FUNCTION_ID,
      JSON.stringify({ action: "list" }),
      false
    );

    if (response.responseStatusCode !== 200) {
      throw new Error("Failed to fetch users");
    }

    const result = JSON.parse(response.responseBody);

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch users");
    }

    return result.users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Create a new user with profile
 * Calls the Appwrite Function for server-side user creation
 */
export async function createUser(
  email: string,
  password: string,
  username: string,
  role: UserRole
): Promise<void> {
  try {
    const response = await functions.createExecution(
      USER_MANAGEMENT_FUNCTION_ID,
      JSON.stringify({
        action: "create",
        userData: { email, password, username, role },
      }),
      false
    );

    if (response.responseStatusCode !== 200) {
      throw new Error("Failed to create user");
    }

    const result = JSON.parse(response.responseBody);

    if (!result.success) {
      throw new Error(result.error || "Failed to create user");
    }
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: { username?: string; role?: UserRole }
): Promise<void> {
  try {
    console.log("Updating user profile:", userId, updates);
    console.log("Database ID:", appwriteConfig.databaseId);
    console.log("Collection ID:", appwriteConfig.profilesCollectionId);

    const result = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.profilesCollectionId,
      userId,
      updates
    );

    console.log("Update successful:", result);
  } catch (error: any) {
    console.error("Error updating user:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

/**
 * Delete user
 * Calls the Appwrite Function for server-side user deletion
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const response = await functions.createExecution(
      USER_MANAGEMENT_FUNCTION_ID,
      JSON.stringify({
        action: "delete",
        userData: { userId },
      }),
      false
    );

    if (response.responseStatusCode !== 200) {
      throw new Error("Failed to delete user");
    }

    const result = JSON.parse(response.responseBody);

    if (!result.success) {
      throw new Error(result.error || "Failed to delete user");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

/**
 * Get current logged-in user
 */
export async function getCurrentUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    return null;
  }
}
