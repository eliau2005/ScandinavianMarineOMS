import { Client, Account, Databases } from 'appwrite';

// Initialize Appwrite client
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Export services
export const account = new Account(client);
export const databases = new Databases(client);

// Export configuration
export const appwriteConfig = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  profilesCollectionId: import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
};

export { client };
