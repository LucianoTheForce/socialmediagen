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
import { useTimelineStore } from './timeline-store';

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
  progress?: number; // 0-100 for loading progress
}

// Loading State for Individual Canvas
export interface CanvasLoadingState {
  canvasId: string;
  isTextLoaded: boolean;
  isImageLoading: boolean;
  isImageLoaded: boolean;
  imageLoadProgress: number; // 0-100
  hasPlaceholder: boolean;
  error?: string;
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
  
  // Loading states for individual canvases
  canvasLoadingStates: { [canvasId: string]: CanvasLoadingState };
  
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
  addCanvasFromTemplate: (slideData: any, position?: number) => void;
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
  
  // Canvas Loading State Management
  updateCanvasLoadingState: (canvasId: string, updates: Partial<CanvasLoadingState>) => void;
  setImageLoading: (canvasId: string, isLoading: boolean, progress?: number) => void;
  setImageLoaded: (canvasId: string, imageUrl: string) => void;
  setImageError: (canvasId: string, error: string) => void;
  getCanvasLoadingState: (canvasId: string) => CanvasLoadingState | null;
  
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
  createEmptyProject: (name?: string) => InstagramCarouselProject;
  createProjectWithAllTemplates: (name?: string) => Promise<InstagramCarouselProject>;
  
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
        canvasLoadingStates: {},
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

                // Ensure new canvas has an empty timeline
                if (newCanvasId) {
                  const timelineStore = useTimelineStore.getState();
                  
                  // Create completely empty timeline for the new canvas
                  timelineStore.createCanvasTimeline(newCanvasId);
                  
                  // Switch to the new canvas to activate it
                  timelineStore.switchToCanvas(newCanvasId);
                }

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

        // Add a new canvas using provided slide data (title/content/backgroundImage...)
        addCanvasFromTemplate: (slideData, position) => {
          set(
            (state) => {
              if (!state.currentProject) return state;

              try {
                // Create a new canvas from slideData
                const newSlideNumber = state.currentProject.canvases.length + 1;
                const newCanvas = createCarouselCanvas(slideData, newSlideNumber, true);

                const insertPosition =
                  position !== undefined ? position : state.currentProject.canvases.length;

                const updatedCanvases = [...state.currentProject.canvases];
                updatedCanvases.splice(insertPosition, 0, newCanvas);

                // Renumber and set active
                updatedCanvases.forEach((canvas, index) => {
                  canvas.slideMetadata.slideNumber = index + 1;
                  canvas.isActive = canvas.id === newCanvas.id;
                });

                const updatedProject: InstagramCarouselProject = {
                  ...state.currentProject,
                  canvases: updatedCanvases,
                  carouselMetadata: {
                    ...state.currentProject.carouselMetadata,
                    slideCount: updatedCanvases.length,
                  },
                  updatedAt: new Date(),
                };

                // Ensure new canvas has an empty timeline
                const timelineStore = useTimelineStore.getState();
                timelineStore.createCanvasTimeline(newCanvas.id);
                timelineStore.switchToCanvas(newCanvas.id);

                // Map JSON components (bbox normalized) to timeline elements when available
                const dim = newCanvas.format.dimensions;
                const vmin = Math.min(dim.width, dim.height); // for size_vmin
                const normToCanvas = (n: number, isX: boolean) => n * (isX ? dim.width : dim.height);
                const centerFromBBox = (bbox: any) => ({
                  x: normToCanvas(bbox.x + bbox.w / 2, true) - dim.width / 2,
                  y: normToCanvas(bbox.y + bbox.h / 2, false) - dim.height / 2,
                  boxWidth: normToCanvas(bbox.w, true),
                  boxHeight: normToCanvas(bbox.h, false),
                });

                const addTextFromComponent = (comp: any, fallbackName: string) => {
                  const textTrackId = timelineStore.findOrCreateTrack('text');
                  const { x, y, boxWidth, boxHeight } = centerFromBBox(comp.bbox);
                  const style = comp.style || {};
                  const fontPx = Math.round(((style.size_vmin ?? 4) / 100) * vmin);
                  const weight = (style.weight ?? 400) >= 700 ? 'bold' : 'normal';
                  const color = style.color || '#FFFFFF';
                  const align = (comp.bbox?.align || 'left') as 'left' | 'center' | 'right';
                  timelineStore.addElementToTrack(textTrackId, {
                    type: 'text',
                    name: `${fallbackName} - Slide ${newSlideNumber}`,
                    content: comp.text || '',
                    duration: 5000,
                    startTime: 0,
                    trimStart: 0,
                    trimEnd: 0,
                    fontSize: fontPx,
                    fontFamily: Array.isArray(style.family) && style.family[0] ? style.family[0] : 'Inter',
                    color,
                    backgroundColor: 'transparent',
                    textAlign: align,
                    fontWeight: weight,
                    fontStyle: 'normal',
                    textDecoration: 'none',
                    x,
                    y,
                    rotation: 0,
                    opacity: 1,
                    boxMode: 'fixed',
                    boxWidth,
                    boxHeight,
                    verticalAlign: 'middle',
                  });
                };

                // Prioritize template components if available, fallback to simple title/content
                const componentsToProcess = slideData.components || [];
                console.log(`🎨 Processing ${componentsToProcess.length} components for slide ${newSlideNumber}`);

                if (Array.isArray(componentsToProcess) && componentsToProcess.length > 0) {
                  componentsToProcess.forEach((comp: any, idx: number) => {
                    console.log(`📝 Processing component ${idx + 1}: ${comp.type}`);
                    if (comp.type === 'headline') addTextFromComponent(comp, 'Headline');
                    if (comp.type === 'body') addTextFromComponent(comp, 'Body');
                    if (comp.type === 'cta' || comp.type === 'badge') addTextFromComponent(comp, 'Text');
                    // Skip image components - no placeholders will be added
                    if (comp.type === 'image') {
                      console.log(`🖼️ Skipping image placeholder for component ${idx + 1}`);
                    }
                  });
                  console.log(`✅ Successfully processed ${componentsToProcess.length} template components (text only)`);
                } else {
                  // Fallback simple title/body
                  const textTrackId = timelineStore.findOrCreateTrack('text');
                  if (slideData.title) {
                    timelineStore.addElementToTrack(textTrackId, {
                      type: 'text',
                      name: `Title - Slide ${newSlideNumber}`,
                      content: slideData.title,
                      duration: 5000,
                      startTime: 0,
                      trimStart: 0,
                      trimEnd: 0,
                      fontSize: 44,
                      fontFamily: 'Inter',
                      color: '#FFFFFF',
                      backgroundColor: 'transparent',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontStyle: 'normal',
                      textDecoration: 'none',
                      x: 0,
                      y: -300,
                      rotation: 0,
                      opacity: 1,
                      boxMode: 'auto',
                    });
                  }
                  if (slideData.content) {
                    timelineStore.addElementToTrack(textTrackId, {
                      type: 'text',
                      name: `Content - Slide ${newSlideNumber}`,
                      content: slideData.content,
                      duration: 5000,
                      startTime: 0,
                      trimStart: 0,
                      trimEnd: 0,
                      fontSize: 24,
                      fontFamily: 'Inter',
                      color: '#E5E5E5',
                      backgroundColor: 'transparent',
                      textAlign: 'center',
                      fontWeight: 'normal',
                      fontStyle: 'normal',
                      textDecoration: 'none',
                      x: 0,
                      y: 20,
                      rotation: 0,
                      opacity: 1,
                      boxMode: 'auto',
                    });
                  }
                }

                // If template provides a background image URL, add it to media store and timeline (async but fire-and-forget)
                if (slideData.backgroundImage) {
                  const projectId = state.currentProject.id;
                  const mediaStore = useMediaStore.getState();
                  const addBackground = async () => {
                    try {
                      const item = await mediaStore.addAIGeneratedImage(projectId, slideData.backgroundImage, {
                        name: `Template BG Slide ${newSlideNumber}`,
                        carouselId: state.currentProject!.id,
                        canvasId: newCanvas.id,
                        slideNumber: newSlideNumber,
                        generationPrompt: slideData.backgroundPrompt || 'Template background',
                        backgroundStrategy: 'unique',
                        aiMetadata: undefined,
                      });
                      const mediaTrackId = timelineStore.findOrCreateTrack('media');
                      timelineStore.addElementToTrack(mediaTrackId, {
                        type: 'media',
                        mediaId: item.id,
                        name: 'Background',
                        duration: 5000,
                        startTime: 0,
                        trimStart: 0,
                        trimEnd: 0,
                        x: 0,
                        y: 0,
                        scaleX: 1,
                        scaleY: 1,
                        rotation: 0,
                        opacity: 1,
                        objectFit: 'cover',
                        alignment: { horizontal: 'center', vertical: 'middle' },
                        flipHorizontal: false,
                        flipVertical: false,
                        borderRadius: 0,
                      });
                    } catch (e) {
                      console.error('Failed to add template background to timeline:', e);
                    }
                  };
                  // Detach
                  addBackground();
                }

                return {
                  currentProject: updatedProject,
                  navigation: {
                    ...state.navigation,
                    activeCanvasId: newCanvas.id,
                    canvasOrder: updatedProject.canvases.map((c) => c.id),
                  },
                };
              } catch (error) {
                console.error('Failed to add canvas from template:', error);
                return state;
              }
            },
            false,
            'addCanvasFromTemplate'
          );
        },

        removeCanvas: (canvasId) => {
          set(
            (state) => {
              if (!state.currentProject) return state;

              try {
                const updatedProject = removeCanvasFromCarousel(state.currentProject, canvasId);
                const activeCanvas = getActiveCanvas(updatedProject);

                // Clean up canvas timeline to prevent cross-contamination
                const timelineStore = useTimelineStore.getState();
                timelineStore.removeCanvasTimeline(canvasId);
                console.log(`🧹 Cleaned up timeline for canvas: ${canvasId}`);

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

        // Generation Management Actions - Instagram-like Instant UX
        startGeneration: async (options) => {
          const { currentProject, generationProgress } = get();
          // Prevent duplicate concurrent generations
          if (generationProgress.isGenerating) {
            return;
          }
          
          // 🚀 INSTANT: Create placeholder project and canvases immediately
          const placeholderSlides = Array.from({ length: options.canvasCount }, (_, index) => ({
            slideNumber: index + 1,
            title: `Slide ${index + 1}`,
            content: 'AI is generating your content...',
            backgroundPrompt: options.prompt,
            textStyles: {
              titleSize: 56,
              contentSize: 28,
              titleWeight: 'bold',
              contentWeight: 'normal',
              alignment: 'center'
            }
          }));

          const placeholderProject = createInstagramCarouselProject(
            `Carousel: ${options.prompt.substring(0, 50)}...`,
            'current-user',
            { slides: placeholderSlides }
          );

          // Build canvases from slides now (so navigation and preview have data immediately)
          const placeholderCanvases = placeholderSlides.map((slide, index) => {
            const canvas = createCarouselCanvas(slide, index + 1, index === 0);
            return {
              ...canvas,
              backgroundImage: '/api/placeholder/instagram-post',
              thumbnailUrl: '/api/placeholder/instagram-post',
              slideMetadata: {
                ...canvas.slideMetadata,
                title: slide.title,
                content: slide.content,
                backgroundPrompt: slide.backgroundPrompt,
                isLoading: true
              }
            };
          });

          placeholderProject.canvases = placeholderCanvases;
          if (options.layoutPreset) {
            placeholderProject.templateId = options.layoutPreset;
            if (!placeholderProject.tags.includes(options.layoutPreset)) {
              placeholderProject.tags.push(options.layoutPreset);
            }
          }

          // 🎯 INSTANT: Display project immediately
          get().setCurrentProject(placeholderProject);
          get().addToHistory(placeholderProject);

          // Create timeline contexts for all placeholder canvases (clear any previous canvas timelines)
          useTimelineStore.getState().clearTimeline();
          const timelineStore = useTimelineStore.getState();
          placeholderProject.canvases.forEach((canvas) => {
            timelineStore.createCanvasTimeline(canvas.id);
             // Populate timeline with placeholder background and text so UI shows immediately
             timelineStore.switchToCanvas(canvas.id);
             // Background placeholder as test media element (rendered by preview as placeholder)
             const mediaTrackId = timelineStore.findOrCreateTrack('media');
             timelineStore.addElementToTrack(mediaTrackId, {
               type: 'media',
               mediaId: 'test',
               name: 'Background Placeholder',
               duration: 5000,
               startTime: 0,
               trimStart: 0,
               trimEnd: 0,
               // Default visual properties
               x: 0,
               y: 0,
               scaleX: 1.0,
               scaleY: 1.0,
               rotation: 0,
               opacity: 1.0,
               objectFit: 'cover',
               alignment: {
                 horizontal: 'center',
                 vertical: 'middle'
               },
               flipHorizontal: false,
               flipVertical: false,
               borderRadius: 0,
             });
             // Text placeholders
             const textTrackId = timelineStore.findOrCreateTrack('text');
             // Title
             timelineStore.addElementToTrack(textTrackId, {
               type: 'text',
               name: 'Title - Placeholder',
               content: canvas.slideMetadata.title || `Slide ${canvas.slideMetadata.slideNumber}`,
               duration: 5000,
               startTime: 0,
               trimStart: 0,
               trimEnd: 0,
               fontSize: 36,
               fontFamily: 'Arial',
               color: '#000000',
               backgroundColor: 'rgba(255,255,255,0.9)',
               textAlign: 'center',
               fontWeight: 'bold',
               fontStyle: 'normal',
               textDecoration: 'none',
               x: 0,
               y: -340,
               rotation: 0,
               opacity: 1,
             });
             // Content
             timelineStore.addElementToTrack(textTrackId, {
               type: 'text',
               name: 'Content - Placeholder',
               content: canvas.slideMetadata.content || 'AI is generating your content...',
               duration: 5000,
               startTime: 0,
               trimStart: 0,
               trimEnd: 0,
               fontSize: 20,
               fontFamily: 'Arial',
               color: '#333333',
               backgroundColor: 'rgba(255,255,255,0.8)',
               textAlign: 'center',
               fontWeight: 'normal',
               fontStyle: 'normal',
               textDecoration: 'none',
               x: 0,
               y: 0,
               rotation: 0,
               opacity: 1,
             });
             // Mark canvas loading state initial
             get().setImageLoading(canvas.id, true, 10);
          });

          // Switch to the first canvas
          const activeCanvas = placeholderProject.canvases[0];
          if (activeCanvas) {
            timelineStore.switchToCanvas(activeCanvas.id);
          }

          // Set generation in progress state
          set(
            (state) => ({
              generationProgress: {
                isGenerating: true,
                currentStep: 'text',
                stepProgress: 10,
                totalProgress: 10,
                currentSlide: 1,
                totalSlides: options.canvasCount,
                startTime: new Date()
              }
            }),
            false,
            'instantPlaceholderCreated'
          );

          // 🔥 BACKGROUND: Start real AI generation
          try {
            console.log('🚀 Starting background AI generation...');
            
            // Update progress to show text generation
            set(
              (state) => ({
                generationProgress: {
                  ...state.generationProgress,
                  currentStep: 'text',
                  stepProgress: 30,
                  totalProgress: 30
                }
              }),
              false,
              'textGenerationStarted'
            );

             const response = await fetch('/api/ai/carousel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
               // Skip images in first pass to avoid timeouts; backgrounds are queued separately
               body: JSON.stringify({ ...options, skipImages: true })
            });

            if (!response.ok) {
              throw new Error(`Generation failed: ${response.statusText}`);
            }

            const payload = await response.json();
            const result = (payload && typeof payload === 'object' && 'data' in payload) ? (payload as any).data : payload;

            if (!result || !Array.isArray(result.slides)) {
              throw new Error('Invalid API response: slides missing');
            }

            console.log('✅ AI content generated, updating project...');

            // 📝 UPDATE: Replace placeholder content with real AI-generated content
            const { currentProject: updatedProject } = get();
            if (updatedProject && updatedProject.id === placeholderProject.id) {
              const enhancedCanvases = updatedProject.canvases.map((canvas, index) => {
                const slide = result.slides[index];
                if (!slide) return canvas;

                // Update canvas with real content
                const updatedCanvas = {
                  ...canvas,
                  slideMetadata: {
                    ...canvas.slideMetadata,
                    title: slide.title || `Slide ${index + 1}`,
                    content: slide.content || 'Generated content',
                    backgroundPrompt: slide.backgroundPrompt || options.prompt,
                    isLoading: false
                  },
                  // Keep placeholder background until images load
                  backgroundImage: canvas.backgroundImage,
                  thumbnailUrl: canvas.thumbnailUrl
                };

                // Update text elements with AI content and enhanced styles
                if (updatedCanvas.elements) {
                  updatedCanvas.elements = updatedCanvas.elements.map((element: any) => {
                    if (element.type === 'ai-text') {
                      if (element.name.includes('Title')) {
                        return {
                          ...element,
                          content: slide.title || `Slide ${index + 1}`,
                          fontSize: slide.textStyles?.titleSize || 56,
                          fontWeight: slide.textStyles?.titleWeight || 'bold',
                          alignment: slide.textStyles?.alignment || 'center'
                        };
                      } else if (element.name.includes('Content')) {
                        return {
                          ...element,
                          content: slide.content || 'Generated content',
                          fontSize: slide.textStyles?.contentSize || 28,
                          fontWeight: slide.textStyles?.contentWeight || 'normal',
                          alignment: slide.textStyles?.alignment || 'center'
                        };
                      }
                    }
                    return element;
                  });
                }

                return updatedCanvas;
              });

              const updatedProjectWithContent = {
                ...updatedProject,
                canvases: enhancedCanvases,
                updatedAt: new Date()
              };

              get().setCurrentProject(updatedProjectWithContent);

              // Update progress
              set(
                (state) => ({
                  generationProgress: {
                    ...state.generationProgress,
                    currentStep: 'images',
                    stepProgress: 70,
                    totalProgress: 70
                  }
                }),
                false,
                'contentUpdated'
              );

              // 🖼️ PROGRESSIVE: Update timeline with real content
              enhancedCanvases.forEach((canvas) => {
                if (canvas.elements && canvas.elements.length > 0) {
                  timelineStore.switchToCanvas(canvas.id);
                  
                  canvas.elements.forEach((element) => {
                    if (element.type === 'ai-text') {
                      const aiTextElement = element as any;
                      const trackId = timelineStore.findOrCreateTrack('text');
                      
                      timelineStore.addElementToTrack(trackId, {
                        type: 'text',
                        name: aiTextElement.name || 'AI Generated Text',
                        content: aiTextElement.content || 'Generated text',
                        duration: 3000,
                        startTime: 0,
                        trimStart: 0,
                        trimEnd: 0,
                        fontSize: aiTextElement.fontSize || 48,
                        fontFamily: aiTextElement.fontFamily || 'Arial',
                        color: aiTextElement.color || '#ffffff',
                        backgroundColor: aiTextElement.backgroundColor || 'transparent',
                        textAlign: aiTextElement.alignment || 'center',
                        fontWeight: aiTextElement.fontWeight || 'normal',
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        x: aiTextElement.position?.x || 0,
                        y: aiTextElement.position?.y || 0,
                        rotation: 0,
                        opacity: 1,
                      });
                    }
                  });
                }
              });

              // Switch back to active canvas
              const activeCanvas = enhancedCanvases.find(c => c.isActive) || enhancedCanvases[0];
              if (activeCanvas) {
                timelineStore.switchToCanvas(activeCanvas.id);
              }

              console.log('✅ Content updated, starting background image generation...');

              // 🎨 BACKGROUND: Generate images progressively
              enhancedCanvases.forEach((canvas, index) => {
                const slide = result.slides[index];
                if (slide && slide.backgroundPrompt) {
                  get().addToBackgroundQueue({
                    id: `bg_${canvas.id}_${Date.now()}`,
                    slideNumber: canvas.slideMetadata.slideNumber,
                    canvasId: canvas.id,
                    prompt: slide.backgroundPrompt,
                    status: 'pending'
                  });
                }
              });

              // Process background images
              await get().processBackgroundQueue();
            }

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
            console.error('Background generation failed:', error);
            // Keep the placeholder project but show error
            set(
              (state) => ({
                generationProgress: {
                  ...state.generationProgress,
                  isGenerating: false,
                  error: error instanceof Error ? error.message : 'Generation failed, but basic slides are available'
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

          console.log(`🎨 Processing ${pendingTasks.length} background generation tasks...`);

          for (const task of pendingTasks) {
            try {
              console.log(`🚀 Starting background generation for canvas ${task.canvasId} with prompt: "${task.prompt}"`);
              
              // Set loading state for this canvas
              get().setImageLoading(task.canvasId, true, 0);
              
              updateBackgroundTask(task.id, {
                status: 'generating',
                startTime: new Date()
              });

              // Generate background image with progress tracking
            const response = await fetch('/api/ai/runware/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: task.prompt,
                  canvasFormat: 'instagram-post'
                })
              });

              console.log(`📡 API response status: ${response.status} ${response.statusText}`);

              if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Background generation API failed:`, errorText);
                throw new Error(`Background generation failed: ${response.statusText}`);
              }

              // Update progress to 50% while processing response
              get().setImageLoading(task.canvasId, true, 50);

              const result = await response.json();
              console.log(`✅ Background generation result:`, result);
              
              // Update progress to 90% before completing
              get().setImageLoading(task.canvasId, true, 90);
              
              const imageUrl = (result?.data?.imageUrl) || result.imageUrl;
              console.log(`🖼️ Generated image URL: ${imageUrl}`);
              
              updateBackgroundTask(task.id, {
                status: 'completed',
                imageUrl: imageUrl,
                completedTime: new Date(),
                cost: (result?.data?.aiMetadata?.cost) || result.cost || 0.05
              });

              // Mark image as loaded - this will update the canvas automatically
              get().setImageLoaded(task.canvasId, imageUrl);

              // Auto-populate generated background into media browser
              if (currentProject && ((result?.data?.imageUrl) || result.imageUrl)) {
                try {
                  const mediaStore = useMediaStore.getState();
                  await mediaStore.addAIGeneratedImage(
                    currentProject.id, // Use project ID for storage
                    (result?.data?.imageUrl) || result.imageUrl,
                    {
                      name: `carousel-bg-slide-${task.slideNumber}.jpg`,
                      carouselId: currentProject.id,
                      canvasId: task.canvasId,
                      slideNumber: task.slideNumber,
                      generationPrompt: task.prompt,
                      backgroundStrategy: currentProject.carouselMetadata.backgroundStrategy,
                      aiMetadata: {
                        cost: (result?.data?.aiMetadata?.cost) || result.cost || 0.05,
                        generatedAt: new Date(),
                        runwareId: (result?.data?.id) || result.id,
                        model: (result?.data?.model) || result.model || 'runware-default'
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

        // Canvas Loading State Management Actions
        updateCanvasLoadingState: (canvasId, updates) => {
          const defaultState: CanvasLoadingState = {
            canvasId,
            isTextLoaded: false,
            isImageLoading: false,
            isImageLoaded: false,
            imageLoadProgress: 0,
            hasPlaceholder: true
          };

          set(
            (state) => ({
              canvasLoadingStates: {
                ...state.canvasLoadingStates,
                [canvasId]: {
                  ...defaultState,
                  ...state.canvasLoadingStates[canvasId],
                  ...updates
                }
              }
            }),
            false,
            'updateCanvasLoadingState'
          );
        },

        setImageLoading: (canvasId, isLoading, progress = 0) => {
          get().updateCanvasLoadingState(canvasId, {
            isImageLoading: isLoading,
            imageLoadProgress: progress,
            isImageLoaded: false
          });
        },

        setImageLoaded: (canvasId, imageUrl) => {
          get().updateCanvasLoadingState(canvasId, {
            isImageLoading: false,
            isImageLoaded: true,
            imageLoadProgress: 100,
            hasPlaceholder: false
          });
          
          // Update canvas with the loaded image
          get().updateCanvas(canvasId, {
            backgroundImage: imageUrl,
            thumbnailUrl: imageUrl
          });
        },

        setImageError: (canvasId, error) => {
          get().updateCanvasLoadingState(canvasId, {
            isImageLoading: false,
            isImageLoaded: false,
            imageLoadProgress: 0,
            error
          });
        },

        getCanvasLoadingState: (canvasId) => {
          const { canvasLoadingStates } = get();
          return canvasLoadingStates[canvasId] || null;
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

        // Create Empty Instagram Carousel Project
        createEmptyProject: (name?: string) => {
          console.log('🧹 Starting comprehensive cleanup for new empty project...');
          
          // Clear all canvas timelines to prevent cross-contamination
          useTimelineStore.getState().clearAllCanvasTimelines();
          
          // Clear media store to prevent cross-contamination
          useMediaStore.getState().clearAllMedia();
          
          // Clear carousel store state
          set(
            () => ({
              currentProject: null,
              navigation: defaultNavigation,
              generationProgress: defaultGenerationProgress,
              backgroundQueue: [],
              canvasLoadingStates: {}
            }),
            false,
            'clearForNewProject'
          );

           // Generate a guaranteed-unique project id suffix to avoid reusing storage buckets
           const projectName = name || `Instagram Carousel ${new Date().toLocaleDateString()}`;
           const emptyProject = createInstagramCarouselProject(
             projectName,
             `user-${Date.now()}`,
             {}
           );

          console.log('✅ Created new empty Instagram carousel project:', emptyProject);

          // Set the project and ensure carousel mode is active by default
          get().setCurrentProject(emptyProject);
          get().addToHistory(emptyProject);

          // Initialize timeline for the default canvas to ensure it starts empty
          const timelineStore = useTimelineStore.getState();
          
          // Create empty timeline for each canvas in the project
          emptyProject.canvases.forEach((canvas) => {
            timelineStore.createCanvasTimeline(canvas.id);
          });
          
          // Switch to the first canvas to ensure proper initialization
          const activeCanvas = emptyProject.canvases.find(c => c.isActive) || emptyProject.canvases[0];
          if (activeCanvas) {
            timelineStore.switchToCanvas(activeCanvas.id);
          }

          console.log('🧹 Comprehensive cleanup completed for empty project');
          return emptyProject;
        },

        // Create Instagram Carousel Project with All Templates Pre-loaded
        createProjectWithAllTemplates: async (name?: string) => {
          console.log('🚀 Creating carousel project with all templates...');
          console.log('🧹 Starting comprehensive cleanup for new template project...');
          
          // Clear all canvas timelines to prevent cross-contamination
          useTimelineStore.getState().clearAllCanvasTimelines();
          
          // Clear media store to prevent cross-contamination
          useMediaStore.getState().clearAllMedia();
          
          // First create an empty project (without additional cleanup since we just did it)
          const projectName = name || `Carousel com Todos os Templates ${new Date().toLocaleDateString()}`;
          
          // Clear carousel store state
          set(
            () => ({
              currentProject: null,
              navigation: defaultNavigation,
              generationProgress: defaultGenerationProgress,
              backgroundQueue: [],
              canvasLoadingStates: {}
            }),
            false,
            'clearForTemplateProject'
          );

          // Generate a guaranteed-unique project id suffix to avoid reusing storage buckets
          const project = createInstagramCarouselProject(
            projectName,
            `user-${Date.now()}`,
            {}
          );
          
          console.log('✅ Created new template carousel project with complete isolation:', project);
          
          try {
            // Load templates from the JSON file
            const response = await fetch('/templates/brandsdecoded_ui_per_slide.json');
            const templatesData = await response.json();
            const slides = templatesData.slides || [];
            
            console.log(`📝 Loading ${slides.length} templates into project...`);
            
            // Set the project first
            get().setCurrentProject(project);
            get().addToHistory(project);
            
            // Remove the default empty canvas first
            if (project.canvases.length > 0) {
              get().removeCanvas(project.canvases[0].id);
            }
            
            // Add all template slides to the project
            slides.forEach((slide: any, index: number) => {
              const title = slide.components?.find((c: any) => c.type === "headline")?.text ?? `Slide ${index + 1}`;
              const content = slide.components?.find((c: any) => c.type === "body")?.text ?? "";
              
              console.log(`🎨 Adding template ${index + 1}/${slides.length}: "${title}"`);
              
              get().addCanvasFromTemplate({
                title,
                content,
                backgroundImage: slide.image_ref,
                backgroundPrompt: "Template background",
                components: slide.components,
              });
            });
            
            console.log(`✅ Successfully created carousel project with ${slides.length} templates`);
            console.log('🧹 Comprehensive cleanup completed for template project');
            return project;
            
          } catch (error) {
            console.error('Failed to load templates:', error);
            // Return the empty project as fallback
            return project;
          }
        },

        // State Reset
        reset: () => {
          set(
            () => ({
              currentProject: null,
              navigation: defaultNavigation,
              generationProgress: defaultGenerationProgress,
              backgroundQueue: [],
              canvasLoadingStates: {},
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
          // Do NOT persist currentProject to avoid loading content from a previous session
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