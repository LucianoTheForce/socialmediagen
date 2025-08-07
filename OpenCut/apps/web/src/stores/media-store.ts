import { create } from "zustand";
import { storageService } from "@/lib/storage/storage-service";
import { useTimelineStore } from "./timeline-store";
import { generateUUID } from "@/lib/utils";

export type MediaType = "image" | "video" | "audio";

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  file: File;
  url?: string; // Object URL for preview
  thumbnailUrl?: string; // For video thumbnails
  duration?: number; // For video/audio duration
  width?: number; // For video/image width
  height?: number; // For video/image height
  fps?: number; // For video frame rate
  // Text-specific properties
  content?: string; // Text content
  fontSize?: number; // Font size
  fontFamily?: string; // Font family
  color?: string; // Text color
  backgroundColor?: string; // Background color
  textAlign?: "left" | "center" | "right"; // Text alignment
  // AI-generated carousel properties
  isAIGenerated?: boolean; // Whether this was AI-generated
  carouselMetadata?: {
    carouselId: string; // ID of the carousel this belongs to
    canvasId: string; // Canvas this background is for
    slideNumber: number; // Slide number (1-based)
    generationPrompt: string; // Original prompt used to generate
    backgroundStrategy: 'unique' | 'thematic'; // Generation strategy
    generatedAt: Date; // When it was generated
    aiMetadata?: any; // Additional AI generation metadata
  };
}

interface MediaStore {
  mediaItems: MediaItem[];
  isLoading: boolean;

  // Actions - now require projectId
  addMediaItem: (
    projectId: string,
    item: Omit<MediaItem, "id">
  ) => Promise<void>;
  removeMediaItem: (projectId: string, id: string) => Promise<void>;
  loadProjectMedia: (projectId: string) => Promise<void>;
  clearProjectMedia: (projectId: string) => Promise<void>;
  clearAllMedia: () => void; // Clear local state only

  // AI-generated carousel media management
  addAIGeneratedImage: (
    projectId: string,
    imageUrl: string,
    metadata: {
      name: string;
      carouselId: string;
      canvasId: string;
      slideNumber: number;
      generationPrompt: string;
      backgroundStrategy: 'unique' | 'thematic';
      aiMetadata?: any;
    }
  ) => Promise<MediaItem>;
  getCarouselMediaItems: (carouselId: string) => MediaItem[];
  getCanvasBackground: (carouselId: string, canvasId: string) => MediaItem | undefined;
  removeCarouselMediaItems: (projectId: string, carouselId: string) => Promise<void>;
}

// Helper function to determine file type
export const getFileType = (file: File): MediaType | null => {
  const { type } = file;

  if (type.startsWith("image/")) {
    return "image";
  }
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type.startsWith("audio/")) {
    return "audio";
  }

  return null;
};

// Helper function to get image dimensions
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();

    img.addEventListener("load", () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      resolve({ width, height });
      img.remove();
    });

    img.addEventListener("error", () => {
      reject(new Error("Could not load image"));
      img.remove();
    });

    img.src = URL.createObjectURL(file);
  });
};

// Helper function to generate video thumbnail and get dimensions
export const generateVideoThumbnail = (
  file: File
): Promise<{ thumbnailUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video") as HTMLVideoElement;
    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to 1 second or 10% of duration, whichever is smaller
      video.currentTime = Math.min(1, video.duration * 0.1);
    });

    video.addEventListener("seeked", () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
      const width = video.videoWidth;
      const height = video.videoHeight;

      resolve({ thumbnailUrl, width, height });

      // Cleanup
      video.remove();
      canvas.remove();
    });

    video.addEventListener("error", () => {
      reject(new Error("Could not load video"));
      video.remove();
      canvas.remove();
    });

    video.src = URL.createObjectURL(file);
    video.load();
  });
};

// Helper function to get media duration
export const getMediaDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const element = document.createElement(
      file.type.startsWith("video/") ? "video" : "audio"
    ) as HTMLVideoElement;

    element.addEventListener("loadedmetadata", () => {
      resolve(element.duration);
      element.remove();
    });

    element.addEventListener("error", () => {
      reject(new Error("Could not load media"));
      element.remove();
    });

    element.src = URL.createObjectURL(file);
    element.load();
  });
};

// Helper to get aspect ratio from MediaItem
export const getMediaAspectRatio = (item: MediaItem): number => {
  if (item.width && item.height) {
    return item.width / item.height;
  }
  return 16 / 9; // Default aspect ratio
};

export const useMediaStore = create<MediaStore>((set, get) => ({
  mediaItems: [],
  isLoading: false,

  addMediaItem: async (projectId, item) => {
    const newItem: MediaItem = {
      ...item,
      id: generateUUID(),
    };

    // Add to local state immediately for UI responsiveness
    set((state) => ({
      mediaItems: [...state.mediaItems, newItem],
    }));

    // Save to persistent storage in background
    try {
      await storageService.saveMediaItem(projectId, newItem);
    } catch (error) {
      console.error("Failed to save media item:", error);
      // Remove from local state if save failed
      set((state) => ({
        mediaItems: state.mediaItems.filter((media) => media.id !== newItem.id),
      }));
    }
  },

  removeMediaItem: async (projectId: string, id: string) => {
    const state = get();
    const item = state.mediaItems.find((media) => media.id === id);

    // Cleanup object URLs to prevent memory leaks
    if (item?.url) {
      URL.revokeObjectURL(item.url);
      if (item.thumbnailUrl) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
    }

    // 1) Remove from local state immediately
    set((state) => ({
      mediaItems: state.mediaItems.filter((media) => media.id !== id),
    }));

    // 2) Cascade into the timeline: remove any elements using this media ID
    const timeline = useTimelineStore.getState();
    const {
      tracks,
      removeElementFromTrack,
      removeElementFromTrackWithRipple,
      rippleEditingEnabled,
      pushHistory,
    } = timeline;

    // Find all elements that reference this media
    const elementsToRemove: Array<{ trackId: string; elementId: string }> = [];
    for (const track of tracks) {
      for (const el of track.elements) {
        if (el.type === "media" && el.mediaId === id) {
          elementsToRemove.push({ trackId: track.id, elementId: el.id });
        }
      }
    }

    // If there are elements to remove, push history once before batch removal
    if (elementsToRemove.length > 0) {
      pushHistory();

      // Remove all elements without pushing additional history entries
      for (const { trackId, elementId } of elementsToRemove) {
        if (rippleEditingEnabled) {
          removeElementFromTrackWithRipple(trackId, elementId, false);
        } else {
          removeElementFromTrack(trackId, elementId, false);
        }
      }
    }

    // 3) Remove from persistent storage
    try {
      await storageService.deleteMediaItem(projectId, id);
    } catch (error) {
      console.error("Failed to delete media item:", error);
    }
  },

  loadProjectMedia: async (projectId) => {
    set({ isLoading: true });

    try {
      const mediaItems = await storageService.loadAllMediaItems(projectId);

      // Regenerate thumbnails for video items
      const updatedMediaItems = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.type === "video" && item.file) {
            try {
              const { thumbnailUrl, width, height } =
                await generateVideoThumbnail(item.file);
              return {
                ...item,
                thumbnailUrl,
                width: width || item.width,
                height: height || item.height,
              };
            } catch (error) {
              console.error(
                `Failed to regenerate thumbnail for video ${item.id}:`,
                error
              );
              return item;
            }
          }
          return item;
        })
      );

      set({ mediaItems: updatedMediaItems });
    } catch (error) {
      console.error("Failed to load media items:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearProjectMedia: async (projectId) => {
    const state = get();

    // Cleanup all object URLs
    state.mediaItems.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url);
      }
      if (item.thumbnailUrl) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
    });

    // Clear local state
    set({ mediaItems: [] });

    // Clear persistent storage
    try {
      const mediaIds = state.mediaItems.map((item) => item.id);
      await Promise.all(
        mediaIds.map((id) => storageService.deleteMediaItem(projectId, id))
      );
    } catch (error) {
      console.error("Failed to clear media items from storage:", error);
    }
  },

  clearAllMedia: () => {
    const state = get();

    // Cleanup all object URLs
    state.mediaItems.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url);
      }
      if (item.thumbnailUrl) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
    });

    // Clear local state
    set({ mediaItems: [] });
  },

  // Add AI-generated image from URL to media browser
  addAIGeneratedImage: async (projectId: string, imageUrl: string, metadata) => {
    try {
      // Fetch the image and convert to File
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const file = new File([blob], metadata.name, { type: blob.type });
      
      // Get image dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        img.onerror = reject;
        img.src = objectUrl;
      });

      const mediaItem: MediaItem = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: metadata.name,
        type: "image",
        file,
        url: URL.createObjectURL(file),
        width: img.width,
        height: img.height,
        isAIGenerated: true,
        carouselMetadata: {
          carouselId: metadata.carouselId,
          canvasId: metadata.canvasId,
          slideNumber: metadata.slideNumber,
          generationPrompt: metadata.generationPrompt,
          backgroundStrategy: metadata.backgroundStrategy,
          generatedAt: new Date(),
          aiMetadata: metadata.aiMetadata,
        },
      };

      // Add to store
      set((state) => ({
        mediaItems: [...state.mediaItems, mediaItem],
      }));

      // Save to persistent storage
      try {
        await storageService.saveMediaItem(projectId, mediaItem);
      } catch (error) {
        console.error("Failed to save AI-generated media item:", error);
      }

      return mediaItem;
    } catch (error) {
      console.error("Failed to add AI-generated image:", error);
      throw error;
    }
  },

  // Get all AI-generated images for a specific carousel
  getCarouselMediaItems: (carouselId: string): MediaItem[] => {
    return get().mediaItems.filter(
      (item) =>
        item.isAIGenerated &&
        item.carouselMetadata?.carouselId === carouselId
    );
  },

  // Get AI-generated background for specific canvas
  getCanvasBackground: (carouselId: string, canvasId: string): MediaItem | undefined => {
    return get().mediaItems.find(
      (item) =>
        item.isAIGenerated &&
        item.carouselMetadata?.carouselId === carouselId &&
        item.carouselMetadata?.canvasId === canvasId
    );
  },

  // Remove AI-generated images for a carousel
  removeCarouselMediaItems: async (projectId: string, carouselId: string) => {
    const carouselItems = get().getCarouselMediaItems(carouselId);
    
    // Clean up object URLs
    carouselItems.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url);
      }
    });

    // Remove from store
    set((state) => ({
      mediaItems: state.mediaItems.filter(
        (item) =>
          !item.isAIGenerated ||
          item.carouselMetadata?.carouselId !== carouselId
      ),
    }));

    // Remove from persistent storage
    try {
      await Promise.all(
        carouselItems.map((item) =>
          storageService.deleteMediaItem(projectId, item.id)
        )
      );
    } catch (error) {
      console.error("Failed to remove carousel media items from storage:", error);
    }
  },
}));
