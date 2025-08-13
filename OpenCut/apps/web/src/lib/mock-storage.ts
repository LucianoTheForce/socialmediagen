// TEMPORARY: In-memory storage for demo purposes
// This will reset on server restart but allows testing without database
// Shared across all API routes that need storage

export const mockProjects = new Map<string, any>();
export const mockCanvases = new Map<string, any>();
export const mockMedia = new Map<string, any>();
export const mockGenerations = new Map<string, any>();

// Initialize with some demo data if needed
if (mockProjects.size === 0) {
  console.log("Mock storage initialized for demo mode");
}