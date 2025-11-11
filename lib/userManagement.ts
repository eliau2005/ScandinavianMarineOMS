import { databases, appwriteConfig, account } from "./appwrite";
import { Query, ID } from "appwrite";

export type UserRole = "Admin" | "Supplier" | "Customer";

export interface UserWithEmail {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  emailVerification: boolean;
}

export const userManagementService = {
  async getAdminUserIds(): Promise<string[]> {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.profilesCollectionId,
        [Query.equal("role", "Admin")]
      );
      return response.documents.map((doc) => doc.$id);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      throw error;
    }
  },
};

export const getAllUsers = async (): Promise<UserWithEmail[]> => {
  try {
    const [users, profiles] = await Promise.all([
      account.list(),
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.profilesCollectionId,
        [Query.limit(5000)]
      ),
    ]);

    const profileMap = new Map(
      profiles.documents.map((p) => [p.$id, p])
    );

    return users.users.map((user) => {
      const profile = profileMap.get(user.$id);
      return {
        id: user.$id,
        email: user.email,
        username: profile?.username || "N/A",
        role: profile?.role || "Customer",
        emailVerification: user.emailVerification,
      };
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

export const createUser = async (
  email: string,
  password: string,
  username: string,
  role: UserRole
): Promise<void> => {
  // Implementation to be added
};

export const updateUserProfile = async (
  id: string,
  updates: { username: string; role: UserRole }
): Promise<void> => {
  // Implementation to be added
};

export const deleteUser = async (id: string): Promise<void> => {
  // Implementation to be added
};

export const getCurrentUser = async (): Promise<any> => {
  return account.get();
};
