import { storageService } from "@/lib/storage/storage-service";
import { TProject } from "@/types/project";
import { MediaItem } from "@/stores/media-store";
import { TimelineTrack } from "@/types/timeline";

export interface MigrationProgress {
  stage: 'init' | 'projects' | 'media' | 'timelines' | 'ai_generations' | 'complete' | 'error';
  currentItem?: string;
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  migratedProjects: number;
  migratedMediaItems: number;
  migratedTimelines: number;
  migratedGenerations: number;
  errors: string[];
  duration: number; // in seconds
}

export class LocalToServerMigrator {
  private onProgress?: (progress: MigrationProgress) => void;
  private progress: MigrationProgress;
  private startTime: number = 0;

  constructor(onProgress?: (progress: MigrationProgress) => void) {
    this.onProgress = onProgress;
    this.progress = {
      stage: 'init',
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      errors: []
    };
  }

  private updateProgress(updates: Partial<MigrationProgress>) {
    this.progress = { ...this.progress, ...updates };
    
    // Calculate overall progress percentage
    if (this.progress.totalItems > 0) {
      this.progress.progress = Math.round((this.progress.processedItems / this.progress.totalItems) * 100);
    }
    
    this.onProgress?.(this.progress);
  }

  async migrate(): Promise<MigrationResult> {
    this.startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      migratedProjects: 0,
      migratedMediaItems: 0,
      migratedTimelines: 0,
      migratedGenerations: 0,
      errors: [],
      duration: 0
    };

    try {
      // Phase 1: Count total items for progress tracking
      this.updateProgress({ stage: 'init', currentItem: 'Scanning local data...' });
      
      const projects = await storageService.loadAllProjects();
      const totalProjects = projects.length;
      
      let totalMediaItems = 0;
      let totalGenerations = 0;
      
      for (const project of projects) {
        const mediaItems = await storageService.loadAllMediaItems(project.id);
        totalMediaItems += mediaItems.length;
        
        const generationsData = await storageService.loadRunwareGenerations(project.id);
        totalGenerations += generationsData.generations.length;
      }

      const totalItems = totalProjects + totalMediaItems + totalProjects + totalGenerations; // +totalProjects for timelines
      this.updateProgress({ totalItems, stage: 'projects' });

      // Phase 2: Migrate Projects
      this.updateProgress({ stage: 'projects', currentItem: 'Migrating projects...' });
      
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        try {
          this.updateProgress({ currentItem: `Migrating project: ${project.name}` });
          
          await this.migrateProject(project);
          result.migratedProjects++;
          
          this.updateProgress({ processedItems: this.progress.processedItems + 1 });
        } catch (error) {
          const errorMsg = `Failed to migrate project ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          this.progress.errors.push(errorMsg);
        }
      }

      // Phase 3: Migrate Media Items (with files)
      this.updateProgress({ stage: 'media', currentItem: 'Migrating media files...' });
      
      for (const project of projects) {
        try {
          const mediaItems = await storageService.loadAllMediaItems(project.id);
          
          for (let i = 0; i < mediaItems.length; i++) {
            const mediaItem = mediaItems[i];
            try {
              this.updateProgress({ currentItem: `Migrating media: ${mediaItem.name}` });
              
              await this.migrateMediaItem(project.id, mediaItem);
              result.migratedMediaItems++;
              
              this.updateProgress({ processedItems: this.progress.processedItems + 1 });
            } catch (error) {
              const errorMsg = `Failed to migrate media ${mediaItem.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(errorMsg);
              this.progress.errors.push(errorMsg);
            }
          }
        } catch (error) {
          const errorMsg = `Failed to load media for project ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          this.progress.errors.push(errorMsg);
        }
      }

      // Phase 4: Migrate Timelines
      this.updateProgress({ stage: 'timelines', currentItem: 'Migrating timeline data...' });
      
      for (const project of projects) {
        try {
          this.updateProgress({ currentItem: `Migrating timeline for: ${project.name}` });
          
          await this.migrateProjectTimeline(project.id);
          result.migratedTimelines++;
          
          this.updateProgress({ processedItems: this.progress.processedItems + 1 });
        } catch (error) {
          const errorMsg = `Failed to migrate timeline for ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          this.progress.errors.push(errorMsg);
        }
      }

      // Phase 5: Migrate AI Generations
      this.updateProgress({ stage: 'ai_generations', currentItem: 'Migrating AI generations...' });
      
      for (const project of projects) {
        try {
          const generationsData = await storageService.loadRunwareGenerations(project.id);
          
          for (let i = 0; i < generationsData.generations.length; i++) {
            const generation = generationsData.generations[i];
            try {
              this.updateProgress({ currentItem: `Migrating AI generation: ${generation.prompt.substring(0, 50)}...` });
              
              await this.migrateAIGeneration(project.id, generation);
              result.migratedGenerations++;
              
              this.updateProgress({ processedItems: this.progress.processedItems + 1 });
            } catch (error) {
              const errorMsg = `Failed to migrate AI generation: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(errorMsg);
              this.progress.errors.push(errorMsg);
            }
          }
        } catch (error) {
          const errorMsg = `Failed to load AI generations for ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          this.progress.errors.push(errorMsg);
        }
      }

      // Migration completed
      result.success = this.progress.errors.length === 0;
      result.errors = this.progress.errors;
      result.duration = Math.round((Date.now() - this.startTime) / 1000);
      
      this.updateProgress({ 
        stage: result.success ? 'complete' : 'error',
        currentItem: result.success ? 'Migration completed successfully!' : 'Migration completed with errors',
        progress: 100 
      });

      return result;

    } catch (error) {
      const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      
      result.success = false;
      result.errors = [...this.progress.errors, errorMsg];
      result.duration = Math.round((Date.now() - this.startTime) / 1000);
      
      this.updateProgress({ 
        stage: 'error',
        currentItem: errorMsg
      });

      return result;
    }
  }

  private async migrateProject(project: TProject): Promise<void> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: project.id,
        name: project.name,
        thumbnail: project.thumbnail,
        backgroundColor: project.backgroundColor,
        backgroundType: project.backgroundType,
        blurIntensity: project.blurIntensity,
        bookmarks: project.bookmarks,
        fps: project.fps,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
  }

  private async migrateMediaItem(projectId: string, mediaItem: MediaItem): Promise<void> {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', mediaItem.file);
    formData.append('projectId', projectId);
    formData.append('mediaData', JSON.stringify({
      id: mediaItem.id,
      name: mediaItem.name,
      type: mediaItem.type,
      width: mediaItem.width,
      height: mediaItem.height,
      duration: mediaItem.duration,
      fps: mediaItem.fps,
      content: mediaItem.content,
      fontSize: mediaItem.fontSize,
      fontFamily: mediaItem.fontFamily,
      color: mediaItem.color,
      backgroundColor: mediaItem.backgroundColor,
      textAlign: mediaItem.textAlign,
      isAIGenerated: mediaItem.isAIGenerated,
      carouselMetadata: mediaItem.carouselMetadata ? {
        ...mediaItem.carouselMetadata,
        generatedAt: mediaItem.carouselMetadata.generatedAt.toISOString(),
      } : undefined,
    }));

    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
  }

  private async migrateProjectTimeline(projectId: string): Promise<void> {
    const tracks = await storageService.loadTimeline(projectId);
    
    if (!tracks || tracks.length === 0) {
      return; // No timeline data to migrate
    }

    // First, create all the tracks
    for (const track of tracks) {
      const trackResponse = await fetch('/api/timelines/tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: track.id,
          projectId: projectId,
          name: track.name,
          type: track.type,
          muted: track.muted,
          isMain: track.isMain,
        }),
      });

      if (!trackResponse.ok) {
        const error = await trackResponse.text();
        throw new Error(`Failed to create track ${track.name}: HTTP ${trackResponse.status}: ${error}`);
      }

      // Then create all elements for this track
      for (const element of track.elements) {
        const elementResponse = await fetch('/api/timelines/elements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: element.id,
            trackId: track.id,
            projectId: projectId,
            type: element.type,
            name: element.name,
            startTime: element.startTime,
            duration: element.duration,
            trimStart: element.trimStart,
            trimEnd: element.trimEnd,
            hidden: element.hidden,
            
            // Media element specific fields
            ...(element.type === 'media' && {
              mediaId: element.mediaId,
              x: element.x,
              y: element.y,
              scaleX: element.scaleX,
              scaleY: element.scaleY,
              rotation: element.rotation,
              opacity: element.opacity,
              objectFit: element.objectFit,
              alignment: element.alignment,
              flipHorizontal: element.flipHorizontal,
              flipVertical: element.flipVertical,
              borderRadius: element.borderRadius,
            }),
            
            // Text element specific fields
            ...(element.type === 'text' && {
              content: element.content,
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              color: element.color,
              backgroundColor: element.backgroundColor,
              textAlign: element.textAlign,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              textDecoration: element.textDecoration,
              x: element.x,
              y: element.y,
              rotation: element.rotation,
              opacity: element.opacity,
              boxMode: element.boxMode,
              boxWidth: element.boxWidth,
              boxHeight: element.boxHeight,
              verticalAlign: element.verticalAlign,
            }),
          }),
        });

        if (!elementResponse.ok) {
          const error = await elementResponse.text();
          throw new Error(`Failed to create element ${element.name}: HTTP ${elementResponse.status}: ${error}`);
        }
      }
    }
  }

  private async migrateAIGeneration(projectId: string, generation: any): Promise<void> {
    const response = await fetch('/api/ai/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: generation.id,
        projectId: projectId,
        prompt: generation.prompt,
        imageUrl: generation.imageUrl,
        style: generation.style,
        model: generation.model,
        dimensions: generation.dimensions,
        cost: generation.cost,
        status: 'completed', // All local generations are completed
        createdAt: generation.timestamp instanceof Date ? generation.timestamp.toISOString() : new Date(generation.timestamp).toISOString(),
        completedAt: generation.timestamp instanceof Date ? generation.timestamp.toISOString() : new Date(generation.timestamp).toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
  }

  async validateMigration(): Promise<{
    isValid: boolean;
    localProjects: number;
    serverProjects: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Count local projects
      const localProjects = await storageService.loadAllProjects();
      
      // Count server projects
      const serverResponse = await fetch('/api/projects');
      if (!serverResponse.ok) {
        issues.push('Cannot connect to server to validate migration');
        return {
          isValid: false,
          localProjects: localProjects.length,
          serverProjects: 0,
          issues
        };
      }
      
      const serverData = await serverResponse.json();
      const serverProjects = serverData.projects || [];
      
      // Basic validation
      if (localProjects.length !== serverProjects.length) {
        issues.push(`Project count mismatch: ${localProjects.length} local vs ${serverProjects.length} server`);
      }
      
      // Validate each project exists on server
      for (const localProject of localProjects) {
        const serverProject = serverProjects.find((p: any) => p.id === localProject.id);
        if (!serverProject) {
          issues.push(`Project "${localProject.name}" not found on server`);
        }
      }
      
      return {
        isValid: issues.length === 0,
        localProjects: localProjects.length,
        serverProjects: serverProjects.length,
        issues
      };
      
    } catch (error) {
      issues.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        localProjects: 0,
        serverProjects: 0,
        issues
      };
    }
  }
}

// Utility function to start migration with progress callback
export async function migrateLocalDataToServer(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const migrator = new LocalToServerMigrator(onProgress);
  return await migrator.migrate();
}

// Utility function to validate migration
export async function validateMigration() {
  const migrator = new LocalToServerMigrator();
  return await migrator.validateMigration();
}