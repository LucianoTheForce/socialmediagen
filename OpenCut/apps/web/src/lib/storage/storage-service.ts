import { TProject } from "@/types/project";
import { MediaItem } from "@/stores/media-store";
import { TimelineTrack } from "@/types/timeline";
import { SavedSoundsData, SavedSound, SoundEffect } from "@/types/sounds";

// Runware generation types
interface RunwareGeneration {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: Date;
  style: string;
  model: string;
  dimensions: { width: number; height: number };
  cost: number;
  projectId: string;
}

interface RunwareGenerationsData {
  generations: RunwareGeneration[];
  lastModified: string;
}

// API Response types
interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

class StorageService {
  private baseUrl: string;

  constructor() {
    // Use relative URLs for API calls
    this.baseUrl = '';
  }

  // Helper method for making authenticated API calls
  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  // Helper method for file uploads
  private async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File upload failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  // Project operations
  async saveProject(project: TProject): Promise<void> {
    const projectData = {
      id: project.id,
      name: project.name,
      thumbnail: project.thumbnail,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      backgroundColor: project.backgroundColor,
      backgroundType: project.backgroundType,
      blurIntensity: project.blurIntensity,
      bookmarks: project.bookmarks,
      fps: project.fps,
    };

    await this.apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async loadProject(id: string): Promise<TProject | null> {
    try {
      const response: ApiResponse<any> = await this.apiCall(`/projects/${id}`);
      const project = response.data;
      
      if (!project) return null;

      return {
        id: project.id,
        name: project.name,
        thumbnail: project.thumbnail,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        backgroundColor: project.backgroundColor,
        backgroundType: project.backgroundType,
        blurIntensity: project.blurIntensity,
        bookmarks: project.bookmarks,
        fps: project.fps,
      };
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  async loadAllProjects(): Promise<TProject[]> {
    try {
      const response: ApiResponse<any[]> = await this.apiCall('/projects');
      
      return response.data.map(project => ({
        id: project.id,
        name: project.name,
        thumbnail: project.thumbnail,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        backgroundColor: project.backgroundColor,
        backgroundType: project.backgroundType,
        blurIntensity: project.blurIntensity,
        bookmarks: project.bookmarks,
        fps: project.fps,
      })).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  async deleteProject(id: string): Promise<void> {
    await this.apiCall(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Media operations
  async saveMediaItem(projectId: string, mediaItem: MediaItem): Promise<void> {
    const formData = new FormData();
    formData.append('file', mediaItem.file);
    formData.append('id', mediaItem.id);
    formData.append('name', mediaItem.name);
    formData.append('type', mediaItem.type);
    formData.append('projectId', projectId);
    
    if (mediaItem.width) formData.append('width', mediaItem.width.toString());
    if (mediaItem.height) formData.append('height', mediaItem.height.toString());
    if (mediaItem.duration) formData.append('duration', mediaItem.duration.toString());
    if (mediaItem.isAIGenerated) formData.append('isAIGenerated', 'true');
    
    if (mediaItem.carouselMetadata) {
      formData.append('carouselMetadata', JSON.stringify({
        ...mediaItem.carouselMetadata,
        generatedAt: mediaItem.carouselMetadata.generatedAt.toISOString(),
      }));
    }

    await this.uploadFile('/media', formData);
  }

  async loadMediaItem(projectId: string, id: string): Promise<MediaItem | null> {
    try {
      const response: ApiResponse<any> = await this.apiCall(`/media/${id}?projectId=${projectId}`);
      const mediaData = response.data;
      
      if (!mediaData) return null;

      // Create a blob from the file URL
      const fileResponse = await fetch(mediaData.url);
      const file = await fileResponse.blob();
      
      return {
        id: mediaData.id,
        name: mediaData.name,
        type: mediaData.type,
        file: new File([file], mediaData.name, { type: mediaData.type }),
        url: mediaData.url,
        width: mediaData.width,
        height: mediaData.height,
        duration: mediaData.duration,
        isAIGenerated: mediaData.isAIGenerated,
        carouselMetadata: mediaData.carouselMetadata ? {
          ...mediaData.carouselMetadata,
          generatedAt: new Date(mediaData.carouselMetadata.generatedAt),
        } : undefined,
      };
    } catch (error) {
      console.error('Failed to load media item:', error);
      return null;
    }
  }

  async loadAllMediaItems(projectId: string): Promise<MediaItem[]> {
    try {
      const response: ApiResponse<any[]> = await this.apiCall(`/media?projectId=${projectId}`);
      
      const mediaItems: MediaItem[] = [];
      
      for (const mediaData of response.data) {
        try {
          // Create a blob from the file URL
          const fileResponse = await fetch(mediaData.url);
          const file = await fileResponse.blob();
          
          mediaItems.push({
            id: mediaData.id,
            name: mediaData.name,
            type: mediaData.type,
            file: new File([file], mediaData.name, { type: mediaData.type }),
            url: mediaData.url,
            width: mediaData.width,
            height: mediaData.height,
            duration: mediaData.duration,
            isAIGenerated: mediaData.isAIGenerated,
            carouselMetadata: mediaData.carouselMetadata ? {
              ...mediaData.carouselMetadata,
              generatedAt: new Date(mediaData.carouselMetadata.generatedAt),
            } : undefined,
          });
        } catch (error) {
          console.error(`Failed to process media item ${mediaData.id}:`, error);
        }
      }
      
      return mediaItems;
    } catch (error) {
      console.error('Failed to load media items:', error);
      return [];
    }
  }

  async deleteMediaItem(projectId: string, id: string): Promise<void> {
    await this.apiCall(`/media/${id}?projectId=${projectId}`, {
      method: 'DELETE',
    });
  }

  async deleteProjectMedia(projectId: string): Promise<void> {
    const mediaItems = await this.loadAllMediaItems(projectId);
    await Promise.all(
      mediaItems.map(item => this.deleteMediaItem(projectId, item.id))
    );
  }

  // Timeline operations
  async saveTimeline(projectId: string, tracks: TimelineTrack[]): Promise<void> {
    await this.apiCall('/timelines/tracks', {
      method: 'POST',
      body: JSON.stringify({ projectId, tracks }),
    });
  }

  async loadTimeline(projectId: string): Promise<TimelineTrack[] | null> {
    try {
      const response: ApiResponse<{ tracks: TimelineTrack[] }> = await this.apiCall(`/timelines/tracks?projectId=${projectId}`);
      return response.data?.tracks || null;
    } catch (error) {
      console.error('Failed to load timeline:', error);
      return null;
    }
  }

  async deleteProjectTimeline(projectId: string): Promise<void> {
    await this.apiCall(`/timelines/tracks?projectId=${projectId}`, {
      method: 'DELETE',
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    // This would require a special API endpoint to clear user's data
    // For now, we can delete all projects which should cascade
    const projects = await this.loadAllProjects();
    await Promise.all(projects.map(project => this.deleteProject(project.id)));
  }

  async getStorageInfo(): Promise<{
    projects: number;
    isOPFSSupported: boolean;
    isIndexedDBSupported: boolean;
  }> {
    const projects = await this.loadAllProjects();
    
    return {
      projects: projects.length,
      isOPFSSupported: true, // Server handles storage
      isIndexedDBSupported: true, // Not relevant for server storage
    };
  }

  async getProjectStorageInfo(projectId: string): Promise<{
    mediaItems: number;
    hasTimeline: boolean;
  }> {
    const [mediaItems, timeline] = await Promise.all([
      this.loadAllMediaItems(projectId),
      this.loadTimeline(projectId),
    ]);

    return {
      mediaItems: mediaItems.length,
      hasTimeline: !!timeline,
    };
  }

  // Sound management - keeping local for now as these are user preferences
  async loadSavedSounds(): Promise<SavedSoundsData> {
    try {
      const saved = localStorage.getItem('saved-sounds');
      if (saved) {
        return JSON.parse(saved);
      }
      return {
        sounds: [],
        lastModified: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to load saved sounds:', error);
      return { sounds: [], lastModified: new Date().toISOString() };
    }
  }

  async saveSoundEffect(soundEffect: SoundEffect): Promise<void> {
    try {
      const currentData = await this.loadSavedSounds();
      
      if (currentData.sounds.some((sound) => sound.id === soundEffect.id)) {
        return;
      }

      const savedSound: SavedSound = {
        id: soundEffect.id,
        name: soundEffect.name,
        username: soundEffect.username,
        previewUrl: soundEffect.previewUrl,
        downloadUrl: soundEffect.downloadUrl,
        duration: soundEffect.duration,
        tags: soundEffect.tags,
        license: soundEffect.license,
        savedAt: new Date().toISOString(),
      };

      const updatedData: SavedSoundsData = {
        sounds: [...currentData.sounds, savedSound],
        lastModified: new Date().toISOString(),
      };

      localStorage.setItem('saved-sounds', JSON.stringify(updatedData));
    } catch (error) {
      console.error('Failed to save sound effect:', error);
      throw error;
    }
  }

  async removeSavedSound(soundId: number): Promise<void> {
    try {
      const currentData = await this.loadSavedSounds();
      
      const updatedData: SavedSoundsData = {
        sounds: currentData.sounds.filter((sound) => sound.id !== soundId),
        lastModified: new Date().toISOString(),
      };

      localStorage.setItem('saved-sounds', JSON.stringify(updatedData));
    } catch (error) {
      console.error('Failed to remove saved sound:', error);
      throw error;
    }
  }

  async isSoundSaved(soundId: number): Promise<boolean> {
    try {
      const currentData = await this.loadSavedSounds();
      return currentData.sounds.some((sound) => sound.id === soundId);
    } catch (error) {
      console.error('Failed to check if sound is saved:', error);
      return false;
    }
  }

  async clearSavedSounds(): Promise<void> {
    try {
      localStorage.removeItem('saved-sounds');
    } catch (error) {
      console.error('Failed to clear saved sounds:', error);
      throw error;
    }
  }

  // Runware operations
  async saveRunwareGeneration(projectId: string, generation: Omit<RunwareGeneration, 'projectId'>): Promise<void> {
    const generationData = {
      ...generation,
      projectId,
      timestamp: generation.timestamp.toISOString(),
    };

    await this.apiCall('/ai/generations', {
      method: 'POST',
      body: JSON.stringify(generationData),
    });
  }

  async loadRunwareGenerations(projectId: string): Promise<RunwareGenerationsData> {
    try {
      const response: ApiResponse<any[]> = await this.apiCall(`/ai/generations?projectId=${projectId}`);
      
      const generations = response.data.map(gen => ({
        ...gen,
        timestamp: new Date(gen.timestamp),
      }));

      return {
        generations,
        lastModified: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to load Runware generations:', error);
      return {
        generations: [],
        lastModified: new Date().toISOString(),
      };
    }
  }

  async clearOldRunwareGenerations(projectId: string, keepCount: number = 20): Promise<void> {
    const data = await this.loadRunwareGenerations(projectId);
    const sortedGenerations = data.generations
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const toDelete = sortedGenerations.slice(keepCount);
    
    await Promise.all(
      toDelete.map(gen => this.deleteRunwareGeneration(projectId, gen.id))
    );
  }

  async deleteRunwareGeneration(projectId: string, generationId: string): Promise<void> {
    await this.apiCall(`/ai/generations/${generationId}?projectId=${projectId}`, {
      method: 'DELETE',
    });
  }

  async deleteProjectRunwareData(projectId: string): Promise<void> {
    const data = await this.loadRunwareGenerations(projectId);
    await Promise.all(
      data.generations.map(gen => this.deleteRunwareGeneration(projectId, gen.id))
    );
  }

  // Check browser support (always true for server storage)
  isOPFSSupported(): boolean {
    return true; // Server handles file storage
  }

  isIndexedDBSupported(): boolean {
    return true; // Not relevant for server storage
  }

  isFullySupported(): boolean {
    return true; // Server storage is always supported
  }
}

// Export singleton instance
export const storageService = new StorageService();
export { StorageService };
