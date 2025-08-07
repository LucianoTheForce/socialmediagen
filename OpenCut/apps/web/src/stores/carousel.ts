import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  InstagramCarouselProject,
  InstagramCarouselCanvas,
  CarouselGenerationOptions,
  CarouselNavigationState,
  CarouselMetadata,
  createInstagramCarouselProject,
  createCarouselCanvas,
  getActiveCanvas,
  setActiveCanvas,
  addCanvasToCarousel,
  removeCanvasFromCarousel,
  isInstagramCarouselProject
} from '../types/ai-timeline';
import { useMediaStore } from './media-store';

// Generation Progress State
export interface GenerationProgress {
  isGenerating: boolean;
  currentStep: 'text' | 'images' | 'canvases' | 'complete';
  stepProgress: number; // 0-100
  totalProgress: number; // 0-100
  currentSlide?: number;
  totalSlides?: number;
  estimatedTimeRemaining?: number;
  error?: string;
  startTime?: Date;
}

// Background Generation Queue
export interface BackgroundGenerationTask {
  id: string;
  slideNumber: number;
  canvasId: string;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
  startTime?: Date;
  completedTime?: Date;
  cost?: number;
}

// Carousel Store State
export interface CarouselStore {
  // Current project state
  currentProject: InstagramCarouselProject | null;
  
  // Navigation state
  navigation: CarouselNavigationState;
  
  // Generation state
  generationProgress: GenerationProgress;
  backgroundQueue: BackgroundGenerationTask[];
  
  // History and cache
  recentProjects: InstagramCarouselProject[];
  mediaAssets: { [canvasId: string]: string[] }; // URLs of generated assets
  
  // Actions
  // Project Management
  setCurrentProject: (project: InstagramCarouselProject | null) => void;
  updateProject: (updates: Partial<InstagramCarouselProject>) => void;
  
  // Canvas Management
  setActiveCanvas: (canvasId: string) => void;
  addCanvas: (position?: number) => void;
  removeCanvas: (canvasId: string) => void;
  updateCanvas: (canvasId: string, updates: Partial<InstagramCarouselCanvas>) => void;
  reorderCanvases: (fromIndex: number, toIndex: number) => void;
  
  // Navigation Management
  updateNavigation: (updates: Partial<CarouselNavigationState>) => void;
  toggleNavigationVisibility: () => void;
  setThumbnailSize: (size: 'small' | 'medium' | 'large') => void;
  
  // Generation Management
  startGeneration: (options: CarouselGenerationOptions) => Promise<void>;
  updateGenerationProgress: (progress: Partial<GenerationProgress>) => void;
  cancelGeneration: () => void;
  resetGeneration: () => void;
  
  // Background Generation Queue
  addToBackgroundQueue: (task: BackgroundGenerationTask) => void;
  updateBackgroundTask: (taskId: string, updates: Partial<BackgroundGenerationTask>) => void;
  removeFromBackgroundQueue: (taskId: string) => void;
  processBackgroundQueue: () => Promise<void>;
  
  // Media Assets Management
  addMediaAsset: (canvasId: string, assetUrl: string) => void;
  removeMediaAsset: (canvasId: string, assetUrl: string) => void;
  getCanvasAssets: (canvasId: string) => string[];
  
  // History Management
  addToHistory: (project: InstagramCarouselProject) => void;
  removeFromHistory: (projectId: string) => void;
  clearHistory: () => void;
  
  // Utility Actions
  exportCarousel: (format: 'individual' | 'sequence' | 'grid') => Promise<void>;
  regenerateSlide: (canvasId: string, newPrompt?: string) => Promise<void>;
  duplicateCanvas: (canvasId: string) => void;
  
  // State Reset
  reset: () => void;
}

// Default states
const defaultNavigation: CarouselNavigationState = {
  activeCanvasId: '',
  canvasOrder: [],
  isNavigationVisible: true,
  thumbnailSize: 'medium',
  showAddButton: true,
  maxCanvasCount: 10
};

const defaultGenerationProgress: GenerationProgress = {
  isGenerating: false,
  currentStep: 'text',
  stepProgress: 0,
  totalProgress: 0
};

// Create the carousel store
export const useCarouselStore = create<CarouselStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentProject: null,
        navigation: defaultNavigation,
        generationProgress: defaultGenerationProgress,
        backgroundQueue: [],
        recentProjects: [],
        mediaAssets: {},

        // Project Management Actions
        setCurrentProject: (project) => {
          set(
            (state) => {
              const newNavigation = project ? {
                ...state.navigation,
                activeCanvasId: project.canvases[0]?.id || '',
                canvasOrder: project.canvases.map(c => c.id),
              } : defaultNavigation;

              return {
                currentProject: project,
                navigation: newNavigation,
                generationProgress: defaultGenerationProgress,
                backgroundQueue: []
              };
            },
            false,
            'setCurrentProject'
          );
        },

        updateProject: (updates) => {
          set(
            (state) => ({
              currentProject: state.currentProject ? {
                ...state.currentProject,
                ...updates,
                updatedAt: new Date()
              } : null
            }),
            false,
            'updateProject'
          );
        },

        // Canvas Management Actions
        setActiveCanvas: (canvasId) => {
          set(
            (state) => {
              if (!state.currentProject) return state;

              const updatedProject = setActiveCanvas(state.currentProject, canvasId);
              
              return {
                currentProject: updatedProject,
                navigation: {
                  ...state.navigation,
                  activeCanvasId: canvasId
                }
              };
            },
            false,
            'setActiveCanvas'
          );
        },

        addCanvas: (position) => {
          set(
            (state) => {
              if (!state.currentProject) return state;

              try {
                const updatedProject = addCanvasToCarousel(state.currentProject, position);
                const newCanvasId = updatedProject.canvases.find(c => c.isActive)?.id || '';

                return {
                  currentProject: updatedProject,
                  navigation: {
                    ...state.navigation,
                    activeCanvasId: newCanvasId,
                    canvasOrder: updatedProject.canvases.map(c => c.id)
                  }
                };
              } catch (error) {
                console.error('Failed to add canvas:', error);
                return state;
              }
            },
            false,
            'addCanvas'
          );
        },

        removeCanvas: (canvasId) => {
          set(
            (state) => {
              if (!state.currentProject) return state;

              try {
                const updatedProject = removeCanvasFromCarousel(state.currentProject, canvasId);
                const activeCanvas = getActiveCanvas(updatedProject);

                // Clean up AI-generated media items for this canvas from media browser
                const mediaStore = useMediaStore.getState();
                mediaStore.removeCarouselMediaItems(state.currentProject.id, state.currentProject.id)
                  .then(() => {
                    console.log(`✅ Cleaned up media items for canvas: ${canvasId}`);
                  })
                  .catch((error) => {
                    console.error('Failed to clean up media items for canvas:', error);
                  });

                return {
                  currentProject: updatedProject,
                  navigation: {
                    ...state.navigation,
                    activeCanvasId: activeCanvas?.id || '',
                    canvasOrder: updatedProject.canvases.map(c => c.id)
                  },
                  mediaAssets: Object.fromEntries(
                    Object.entries(state.mediaAssets).filter(([id]) => id !== canvasId)
                  )
                };
              } catch (error) {
                console.error('Failed to remove canvas:', error);
                return state;
              }
            },
            false,
            'removeCanvas'
          );
        },

        updateCanvas: (canvasId, updates) => {
          set(
            (state) => {
              if (!state.currentProject) return state;

              const updatedCanvases = state.currentProject.canvases.map(canvas =>
                canvas.id === canvasId ? { ...canvas, ...updates } : canvas
              );

              return {
                currentProject: {
                  ...state.currentProject,
                  canvases: updatedCanvases,
                  updatedAt: new Date()
                }
              };
            },
            false,
            'updateCanvas'
          );
        },

        reorderCanvases: (fromIndex, toIndex) => {
          set(
            (state) => {
              if (!state.currentProject) return state;

              const canvases = [...state.currentProject.canvases];
              const [movedCanvas] = canvases.splice(fromIndex, 1);
              canvases.splice(toIndex, 0, movedCanvas);

              // Update slide numbers
              canvases.forEach((canvas, index) => {
                canvas.slideMetadata.slideNumber = index + 1;
              });

              return {
                currentProject: {
                  ...state.currentProject,
                  canvases,
                  updatedAt: new Date()
                },
                navigation: {
                  ...state.navigation,
                  canvasOrder: canvases.map(c => c.id)
                }
              };
            },
            false,
            'reorderCanvases'
          );
        },

        // Navigation Management Actions
        updateNavigation: (updates) => {
          set(
            (state) => ({
              navigation: { ...state.navigation, ...updates }
            }),
            false,
            'updateNavigation'
          );
        },

        toggleNavigationVisibility: () => {
          set(
            (state) => ({
              navigation: {
                ...state.navigation,
                isNavigationVisible: !state.navigation.isNavigationVisible
              }
            }),
            false,
            'toggleNavigationVisibility'
          );
        },

        setThumbnailSize: (size) => {
          set(
            (state) => ({
              navigation: { ...state.navigation, thumbnailSize: size }
            }),
            false,
            'setThumbnailSize'
          );
        },

        // Generation Management Actions
        startGeneration: async (options) => {
          const { currentProject } = get();
          
          set(
            (state) => ({
              generationProgress: {
                isGenerating: true,
                currentStep: 'text',
                stepProgress: 0,
                totalProgress: 0,
                currentSlide: 1,
                totalSlides: options.canvasCount,
                startTime: new Date()
              }
            }),
            false,
            'startGeneration'
          );

          try {
            // Call the carousel API
            const response = await fetch('/api/ai/carousel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(options)
            });

            if (!response.ok) {
              throw new Error(`Generation failed: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Create project from API result
            const newProject = createInstagramCarouselProject(
              `Carousel: ${options.prompt.substring(0, 50)}...`,
              'current-user', // TODO: Get from auth context
              result
            );

            // Create canvases from generated slides
            const canvases = result.slides.map((slide: any, index: number) =>
              createCarouselCanvas(slide, index + 1, index === 0)
            );

            newProject.canvases = canvases;

            // Update state with new project
            get().setCurrentProject(newProject);
            get().addToHistory(newProject);

            // Mark generation as complete
            set(
              (state) => ({
                generationProgress: {
                  ...state.generationProgress,
                  isGenerating: false,
                  currentStep: 'complete',
                  stepProgress: 100,
                  totalProgress: 100
                }
              }),
              false,
              'generationComplete'
            );

          } catch (error) {
            console.error('Generation failed:', error);
            set(
              (state) => ({
                generationProgress: {
                  ...state.generationProgress,
                  isGenerating: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              }),
              false,
              'generationError'
            );
          }
        },

        updateGenerationProgress: (progress) => {
          set(
            (state) => ({
              generationProgress: { ...state.generationProgress, ...progress }
            }),
            false,
            'updateGenerationProgress'
          );
        },

        cancelGeneration: () => {
          set(
            () => ({
              generationProgress: {
                ...defaultGenerationProgress,
                error: 'Generation cancelled by user'
              }
            }),
            false,
            'cancelGeneration'
          );
        },

        resetGeneration: () => {
          set(
            () => ({ generationProgress: defaultGenerationProgress }),
            false,
            'resetGeneration'
          );
        },

        // Background Generation Queue Actions
        addToBackgroundQueue: (task) => {
          set(
            (state) => ({
              backgroundQueue: [...state.backgroundQueue, task]
            }),
            false,
            'addToBackgroundQueue'
          );
        },

        updateBackgroundTask: (taskId, updates) => {
          set(
            (state) => ({
              backgroundQueue: state.backgroundQueue.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
              )
            }),
            false,
            'updateBackgroundTask'
          );
        },

        removeFromBackgroundQueue: (taskId) => {
          set(
            (state) => ({
              backgroundQueue: state.backgroundQueue.filter(task => task.id !== taskId)
            }),
            false,
            'removeFromBackgroundQueue'
          );
        },

        processBackgroundQueue: async () => {
          const { backgroundQueue, updateBackgroundTask, currentProject } = get();
          const pendingTasks = backgroundQueue.filter(task => task.status === 'pending');

          for (const task of pendingTasks) {
            try {
              updateBackgroundTask(task.id, {
                status: 'generating',
                startTime: new Date()
              });

              // Generate background image
              const response = await fetch('/api/ai/runware/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: task.prompt,
                  canvasFormat: 'instagram-post'
                })
              });

              if (!response.ok) {
                throw new Error(`Background generation failed: ${response.statusText}`);
              }

              const result = await response.json();
              
              updateBackgroundTask(task.id, {
                status: 'completed',
                imageUrl: result.imageUrl,
                completedTime: new Date(),
                cost: result.cost || 0.05
              });

              // Update canvas with generated background
              get().updateCanvas(task.canvasId, {
                backgroundImage: result.imageUrl,
                thumbnailUrl: result.imageUrl
              });

              // Auto-populate generated background into media browser
              if (currentProject && result.imageUrl) {
                try {
                  const mediaStore = useMediaStore.getState();
                  await mediaStore.addAIGeneratedImage(
                    currentProject.id, // Use project ID for storage
                    result.imageUrl,
                    {
                      name: `carousel-bg-slide-${task.slideNumber}.jpg`,
                      carouselId: currentProject.id,
                      canvasId: task.canvasId,
                      slideNumber: task.slideNumber,
                      generationPrompt: task.prompt,
                      backgroundStrategy: currentProject.carouselMetadata.backgroundStrategy,
                      aiMetadata: {
                        cost: result.cost || 0.05,
                        generatedAt: new Date(),
                        runwareId: result.id,
                        model: result.model || 'runware-default'
                      }
                    }
                  );

                  // Track asset URL in carousel store for quick access
                  get().addMediaAsset(task.canvasId, result.imageUrl);

                  console.log(`✅ Background auto-populated to media browser: ${task.canvasId}`);
                } catch (mediaError) {
                  console.error('Failed to add generated background to media browser:', mediaError);
                }
              }

            } catch (error) {
              console.error(`Background generation failed for task ${task.id}:`, error);
              updateBackgroundTask(task.id, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                completedTime: new Date()
              });
            }
          }
        },

        // Media Assets Management Actions
        addMediaAsset: (canvasId, assetUrl) => {
          set(
            (state) => ({
              mediaAssets: {
                ...state.mediaAssets,
                [canvasId]: [...(state.mediaAssets[canvasId] || []), assetUrl]
              }
            }),
            false,
            'addMediaAsset'
          );
        },

        removeMediaAsset: (canvasId, assetUrl) => {
          set(
            (state) => ({
              mediaAssets: {
                ...state.mediaAssets,
                [canvasId]: (state.mediaAssets[canvasId] || []).filter(url => url !== assetUrl)
              }
            }),
            false,
            'removeMediaAsset'
          );
        },

        getCanvasAssets: (canvasId) => {
          const { mediaAssets } = get();
          return mediaAssets[canvasId] || [];
        },

        // History Management Actions
        addToHistory: (project) => {
          set(
            (state) => ({
              recentProjects: [
                project,
                ...state.recentProjects.filter(p => p.id !== project.id).slice(0, 9)
              ]
            }),
            false,
            'addToHistory'
          );
        },

        removeFromHistory: (projectId) => {
          set(
            (state) => ({
              recentProjects: state.recentProjects.filter(p => p.id !== projectId)
            }),
            false,
            'removeFromHistory'
          );
        },

        clearHistory: () => {
          set(
            () => ({ recentProjects: [] }),
            false,
            'clearHistory'
          );
        },

        // Utility Actions
        exportCarousel: async (format) => {
          const { currentProject } = get();
          if (!currentProject) {
            throw new Error('No carousel project to export');
          }

          try {
            set(
              (state) => ({
                generationProgress: {
                  ...state.generationProgress,
                  isGenerating: true,
                  currentStep: 'canvases',
                  stepProgress: 0,
                  totalProgress: 0
                }
              }),
              false,
              'exportStart'
            );

            const response = await fetch('/api/ai/carousel/export', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: currentProject.id,
                format,
                canvases: currentProject.canvases.map(canvas => ({
                  id: canvas.id,
                  title: canvas.slideMetadata.title,
                  content: canvas.slideMetadata.content,
                  backgroundImage: canvas.backgroundImage,
                  slideNumber: canvas.slideMetadata.slideNumber
                })),
                metadata: {
                  title: currentProject.name,
                  createdBy: currentProject.userId,
                  backgroundStrategy: currentProject.carouselMetadata.backgroundStrategy,
                  slideCount: currentProject.canvases.length
                }
              })
            });

            if (!response.ok) {
              throw new Error(`Export failed: ${response.statusText}`);
            }

            const result = await response.json();

            // Handle different export results
            switch (format) {
              case 'individual':
                // Download individual files
                for (let i = 0; i < result.files.length; i++) {
                  const file = result.files[i];
                  const link = document.createElement('a');
                  link.href = file.url;
                  link.download = file.filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  // Update progress
                  set(
                    (state) => ({
                      generationProgress: {
                        ...state.generationProgress,
                        stepProgress: ((i + 1) / result.files.length) * 100,
                        totalProgress: ((i + 1) / result.files.length) * 100
                      }
                    }),
                    false,
                    'exportProgress'
                  );
                  
                  // Small delay to prevent browser blocking
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                break;

              case 'sequence':
                // Download sequence video/gif
                const sequenceLink = document.createElement('a');
                sequenceLink.href = result.sequenceUrl;
                sequenceLink.download = result.filename;
                document.body.appendChild(sequenceLink);
                sequenceLink.click();
                document.body.removeChild(sequenceLink);
                break;

              case 'grid':
                // Download grid image
                const gridLink = document.createElement('a');
                gridLink.href = result.gridUrl;
                gridLink.download = result.filename;
                document.body.appendChild(gridLink);
                gridLink.click();
                document.body.removeChild(gridLink);
                break;
            }

            set(
              (state) => ({
                generationProgress: {
                  ...state.generationProgress,
                  isGenerating: false,
                  currentStep: 'complete',
                  stepProgress: 100,
                  totalProgress: 100
                }
              }),
              false,
              'exportComplete'
            );

            console.log(`✅ Carousel exported successfully in ${format} format`);
            return result;

          } catch (error) {
            console.error('Export failed:', error);
            set(
              (state) => ({
                generationProgress: {
                  ...state.generationProgress,
                  isGenerating: false,
                  error: error instanceof Error ? error.message : 'Export failed'
                }
              }),
              false,
              'exportError'
            );
            throw error;
          }
        },

        regenerateSlide: async (canvasId, newPrompt) => {
          const { currentProject } = get();
          if (!currentProject) return;

          const canvas = currentProject.canvases.find(c => c.id === canvasId);
          if (!canvas) return;

          const prompt = newPrompt || canvas.slideMetadata.backgroundPrompt;

          // Remove previous AI-generated background for this canvas from media browser
          try {
            const mediaStore = useMediaStore.getState();
            const existingBackground = mediaStore.getCanvasBackground(currentProject.id, canvasId);
            if (existingBackground) {
              await mediaStore.removeMediaItem(currentProject.id, existingBackground.id);
              console.log(`✅ Removed old background for canvas: ${canvasId}`);
            }
          } catch (error) {
            console.error('Failed to remove old canvas background:', error);
          }

          // Add to background generation queue
          get().addToBackgroundQueue({
            id: `regen_${canvasId}_${Date.now()}`,
            slideNumber: canvas.slideMetadata.slideNumber,
            canvasId,
            prompt,
            status: 'pending'
          });

          // Process the queue
          await get().processBackgroundQueue();
        },

        duplicateCanvas: (canvasId) => {
          set(
            (state) => {
              if (!state.currentProject) return state;

              const canvasIndex = state.currentProject.canvases.findIndex(c => c.id === canvasId);
              if (canvasIndex === -1) return state;

              const originalCanvas = state.currentProject.canvases[canvasIndex];
              const duplicatedCanvas = createCarouselCanvas(
                {
                  ...originalCanvas.slideMetadata,
                  title: `${originalCanvas.slideMetadata.title} (Copy)`
                },
                state.currentProject.canvases.length + 1,
                false
              );

              const updatedCanvases = [
                ...state.currentProject.canvases.slice(0, canvasIndex + 1),
                duplicatedCanvas,
                ...state.currentProject.canvases.slice(canvasIndex + 1)
              ];

              // Update slide numbers
              updatedCanvases.forEach((canvas, index) => {
                canvas.slideMetadata.slideNumber = index + 1;
              });

              return {
                currentProject: {
                  ...state.currentProject,
                  canvases: updatedCanvases,
                  carouselMetadata: {
                    ...state.currentProject.carouselMetadata,
                    slideCount: updatedCanvases.length
                  },
                  updatedAt: new Date()
                },
                navigation: {
                  ...state.navigation,
                  canvasOrder: updatedCanvases.map(c => c.id)
                }
              };
            },
            false,
            'duplicateCanvas'
          );
        },

        // State Reset
        reset: () => {
          set(
            () => ({
              currentProject: null,
              navigation: defaultNavigation,
              generationProgress: defaultGenerationProgress,
              backgroundQueue: [],
              recentProjects: [],
              mediaAssets: {}
            }),
            false,
            'reset'
          );
        }
      }),
      {
        name: 'carousel-store',
        partialize: (state) => ({
          recentProjects: state.recentProjects,
          navigation: {
            thumbnailSize: state.navigation.thumbnailSize,
            isNavigationVisible: state.navigation.isNavigationVisible
          }
        })
      }
    ),
    { name: 'CarouselStore' }
  )
);

// Selector hooks for performance optimization
export const useCurrentProject = () => useCarouselStore(state => state.currentProject);
export const useActiveCanvas = () => useCarouselStore(state => {
  if (!state.currentProject) return null;
  return getActiveCanvas(state.currentProject);
});
export const useNavigationState = () => useCarouselStore(state => state.navigation);
export const useGenerationProgress = () => useCarouselStore(state => state.generationProgress);
export const useBackgroundQueue = () => useCarouselStore(state => state.backgroundQueue);
export const useRecentProjects = () => useCarouselStore(state => state.recentProjects);