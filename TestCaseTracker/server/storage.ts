
import { DatabaseStorage } from "./db-storage";

// Create and export the storage instance
export const storage = new DatabaseStorage();

// Also export as default for backward compatibility
export default storage;
