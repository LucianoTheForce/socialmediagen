// AI Timeline Integration Types for OpenCut Social Media Generator

export interface TimelineElement {
  id: string;
  type: string;
  name: string;
  duration: number;
  startTime: number;
  trimStart: number;
  trimEnd: number;
}

export interface AIImageElement extends TimelineElement {
  type: 'ai-image';
  imageUrl: string;
  dimensions: {
    width: number;
    height: number;
  };
  style: string;
  aspectRatio: number;
  aiMetadata: AIGenerationMetadata;
  canvasFormat: string;
  isRegeneratable: boolean;
  generationHistory: AIGenerationHistoryEntry[];
}

export interface AITextElement extends TimelineElement {
  type: 'ai-text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  backgroundColor?: string;
  position: {
    x: number;
    y: number;
  };
  alignment: 'left' | 'center' | 'right';
  aiMetadata: AIGenerationMetadata;
  canvasFormat: string;
  isRegeneratable: boolean;
  generationHistory: AIGenerationHistoryEntry[];
}

export interface AIGenerationMetadata {
  provider: 'runware' | 'midjourney' | 'openai' | 'claude';
  model: string;
  prompt: string;
  enhancedPrompt?: string;
  generatedAt: Date;
  generationTime: number;
  parameters: Record<string, any>;
  cost: number;
}

export interface AIGenerationHistoryEntry {
  id: string;
  timestamp: Date;
  prompt: string;
  parameters: Record<string, any>;
  result: string; // URL for images, text content for text
  cost: number;
}

export interface AIImageGenerationOptions {
  canvasFormat: string;
  style?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  model?: string;
  seed?: number;
  steps?: number;
  guidanceScale?: number;
}

export interface AITextGenerationOptions {
  canvasFormat: string;
  maxLength?: number;
  style?: 'formal' | 'casual' | 'creative' | 'professional' | 'engaging';
  language?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

// Canvas Format Configuration
export interface CanvasFormat {
  id: string;
  name: string;
  displayName: string;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: number;
  platform: string;
  category: 'story' | 'post' | 'reel' | 'thumbnail' | 'cover';
  description: string;
}

export const CANVAS_FORMATS: CanvasFormat[] = [
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    displayName: 'Instagram Story (9:16)',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: 9/16,
    platform: 'instagram',
    category: 'story',
    description: 'Vertical format for Instagram Stories'
  },
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    displayName: 'Instagram Post (1:1)',
    dimensions: { width: 1080, height: 1080 },
    aspectRatio: 1,
    platform: 'instagram',
    category: 'post',
    description: 'Square format for Instagram feed posts'
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    displayName: 'Instagram Reel (9:16)',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: 9/16,
    platform: 'instagram',
    category: 'reel',
    description: 'Vertical format for Instagram Reels'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    displayName: 'TikTok (9:16)',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: 9/16,
    platform: 'tiktok',
    category: 'post',
    description: 'Vertical format for TikTok videos'
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    displayName: 'Facebook Post (16:9)',
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    platform: 'facebook',
    category: 'post',
    description: 'Horizontal format for Facebook posts'
  },
  {
    id: 'facebook-story',
    name: 'Facebook Story',
    displayName: 'Facebook Story (9:16)',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: 9/16,
    platform: 'facebook',
    category: 'story',
    description: 'Vertical format for Facebook Stories'
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    displayName: 'LinkedIn Post (16:9)',
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16/9,
    platform: 'linkedin',
    category: 'post',
    description: 'Horizontal format for LinkedIn posts'
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    displayName: 'Twitter Post (16:9)',
    dimensions: { width: 1600, height: 900 },
    aspectRatio: 16/9,
    platform: 'twitter',
    category: 'post',
    description: 'Horizontal format for Twitter/X posts'
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    displayName: 'YouTube Thumbnail (16:9)',
    dimensions: { width: 1280, height: 720 },
    aspectRatio: 16/9,
    platform: 'youtube',
    category: 'thumbnail',
    description: 'Thumbnail format for YouTube videos'
  }
];

// Multi-Canvas Project Types
export interface MultiCanvasProject {
  id: string;
  name: string;
  description?: string;
  canvases: Canvas[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
  tags: string[];
  templateId?: string;
}

export interface Canvas {
  id: string;
  name: string;
  format: CanvasFormat;
  elements: TimelineElement[];
  duration: number;
  backgroundColor: string;
  backgroundImage?: string;
  music?: {
    url: string;
    duration: number;
    volume: number;
  };
  exportSettings: ExportSettings;
}

export interface ExportSettings {
  format: 'mp4' | 'gif' | 'png' | 'jpg';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  bitrate?: number;
  includeAudio: boolean;
}

// AI Generation State Management
export interface AIGenerationState {
  isGenerating: boolean;
  currentTask?: {
    id: string;
    type: 'image' | 'text';
    prompt: string;
    progress: number;
  };
  recentGenerations: AIGenerationHistoryEntry[];
  preferences: AIGenerationPreferences;
}

export interface AIGenerationPreferences {
  defaultImageStyle: string;
  defaultTextStyle: 'formal' | 'casual' | 'creative' | 'professional' | 'engaging';
  preferredModels: {
    image: string;
    text: string;
  };
  autoEnhancePrompts: boolean;
  maxGenerationsPerSession: number;
}

// Utility Functions
export const getCanvasFormatById = (id: string): CanvasFormat | undefined => {
  return CANVAS_FORMATS.find(format => format.id === id);
};

export const getCanvasFormatsByPlatform = (platform: string): CanvasFormat[] => {
  return CANVAS_FORMATS.filter(format => format.platform === platform);
};

export const calculateCanvasDuration = (elements: TimelineElement[]): number => {
  if (elements.length === 0) return 0;
  return Math.max(...elements.map(el => el.startTime + el.duration));
};

export const isAIElement = (element: TimelineElement): element is AIImageElement | AITextElement => {
  return element.type === 'ai-image' || element.type === 'ai-text';
};

export const getAIElementMetadata = (element: TimelineElement): AIGenerationMetadata | null => {
  if (isAIElement(element)) {
    return element.aiMetadata;
  }
  return null;
};

// Export Templates for Multi-Canvas Projects
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  canvases: Omit<Canvas, 'id'>[];
  previewImage: string;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  usageCount: number;
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: 'mp4',
  quality: 'high',
  fps: 30,
  includeAudio: true,
};

// Instagram Carousel Specific Types
export interface InstagramCarouselProject extends MultiCanvasProject {
  type: 'instagram-carousel';
  carouselMetadata: CarouselMetadata;
  canvases: InstagramCarouselCanvas[];
}

export interface CarouselMetadata {
  originalPrompt: string;
  backgroundStrategy: 'unique' | 'thematic';
  generatedAt: Date;
  aiGenerationId: string;
  totalGenerationCost: number;
  generationTime: number;
  slideCount: number;
  maxSlideCount: number;
  isRegeneratable: boolean;
  lastRegeneration?: Date;
}

export interface InstagramCarouselCanvas extends Canvas {
  format: CanvasFormat;
  slideMetadata: CarouselSlideMetadata;
  isActive: boolean;
  thumbnailUrl?: string;
}

export interface CarouselSlideMetadata {
  slideNumber: number;
  title: string;
  subtitle?: string;
  content: string;
  cta?: string;
  backgroundPrompt: string;
  aiGeneratedBackground?: {
    imageId: string;
    imageUrl: string;
    prompt: string;
    generatedAt: Date;
    cost: number;
  };
  textElements: CarouselTextElement[];
  lastModified: Date;
  isGenerated: boolean;
  isRegenerating?: boolean;
}

export interface CarouselTextElement {
  id: string;
  type: 'title' | 'subtitle' | 'content' | 'cta';
  text: string;
  position: {
    x: number;
    y: number;
  };
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
  };
  animation?: {
    type: 'fadeIn' | 'slideIn' | 'typewriter' | 'bounce';
    delay: number;
    duration: number;
  };
  isEditable: boolean;
  aiGenerated: boolean;
}

// Carousel Navigation State
export interface CarouselNavigationState {
  activeCanvasId: string;
  canvasOrder: string[];
  isNavigationVisible: boolean;
  thumbnailSize: 'small' | 'medium' | 'large';
  showAddButton: boolean;
  maxCanvasCount: number;
}

// Carousel Generation Options
export interface CarouselGenerationOptions {
  prompt: string;
  canvasCount: number;
  backgroundStrategy: 'unique' | 'thematic';
  styleOptions: {
    tone: 'professional' | 'casual' | 'friendly' | 'playful' | 'inspirational';
    targetAudience?: string;
    brandContext?: string;
    colorScheme?: string;
  };
  textOptions: {
    includeHashtags: boolean;
    includeEmojis: boolean;
    maxCharactersPerSlide: number;
    language: string;
  };
  imageOptions: {
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    consistency: boolean;
  };
}

// Carousel Export Configuration
export interface CarouselExportSettings extends ExportSettings {
  exportType: 'individual' | 'sequence' | 'grid';
  includeTransitions: boolean;
  transitionType?: 'fade' | 'slide' | 'zoom';
  transitionDuration?: number;
  aspectRatioOverride?: {
    width: number;
    height: number;
  };
}

// Utility functions for Instagram Carousel
export const createInstagramCarouselProject = (
  name: string,
  userId: string,
  carouselData: any
): InstagramCarouselProject => {
  const slides = Array.isArray(carouselData?.slides) ? carouselData.slides : [];
  const metadata = carouselData?.metadata ?? {};
  const originalPrompt: string = typeof carouselData?.originalPrompt === 'string' ? carouselData.originalPrompt : '';
  const backgroundStrategy: 'unique' | 'thematic' = carouselData?.backgroundStrategy === 'thematic' ? 'thematic' : 'unique';
  const totalCost: number = typeof metadata.totalCost === 'number' ? metadata.totalCost : 0;
  const generationTime: number = typeof metadata.totalGenerationTime === 'number' ? metadata.totalGenerationTime : 0;
  const aiGenerationId: string = typeof carouselData?.generationId === 'string' ? carouselData.generationId : `gen_${Date.now()}`;

  return {
    id: `carousel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: originalPrompt ? `Instagram carousel generated from: "${originalPrompt.substring(0, 100)}..."` : 'Instagram carousel generated by AI',
    type: 'instagram-carousel',
    canvases: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
    isPublic: false,
    tags: ['instagram', 'carousel', 'ai-generated'],
    carouselMetadata: {
      originalPrompt,
      backgroundStrategy,
      generatedAt: new Date(),
      aiGenerationId,
      totalGenerationCost: totalCost,
      generationTime,
      slideCount: slides.length,
      maxSlideCount: 10,
      isRegeneratable: true
    }
  };
};

export const createCarouselCanvas = (
  slideData: any,
  slideNumber: number,
  isActive: boolean = false
): InstagramCarouselCanvas => {
  const canvasId = `canvas_${slideNumber}_${Date.now()}`;
  
  return {
    id: canvasId,
    name: `Slide ${slideNumber}: ${slideData.title}`,
    format: getCanvasFormatById('instagram-post')!,
    elements: [],
    duration: 5000, // 5 seconds default
    backgroundColor: '#ffffff',
    backgroundImage: slideData.backgroundImage?.url,
    isActive,
    thumbnailUrl: slideData.backgroundImage?.url,
    slideMetadata: {
      slideNumber,
      title: slideData.title,
      subtitle: slideData.subtitle,
      content: slideData.content,
      cta: slideData.cta,
      backgroundPrompt: slideData.backgroundPrompt,
      aiGeneratedBackground: slideData.backgroundImage ? {
        imageId: slideData.backgroundImage.id,
        imageUrl: slideData.backgroundImage.url,
        prompt: slideData.backgroundPrompt,
        generatedAt: new Date(),
        cost: slideData.backgroundImage.metadata?.cost || 0.05
      } : undefined,
      textElements: [],
      lastModified: new Date(),
      isGenerated: true
    },
    exportSettings: {
      ...DEFAULT_EXPORT_SETTINGS,
      format: 'jpg' // Instagram posts are typically images
    }
  };
};

export const getActiveCanvas = (project: InstagramCarouselProject): InstagramCarouselCanvas | null => {
  return project.canvases.find(canvas => canvas.isActive) || project.canvases[0] || null;
};

export const setActiveCanvas = (
  project: InstagramCarouselProject,
  canvasId: string
): InstagramCarouselProject => {
  return {
    ...project,
    canvases: project.canvases.map(canvas => ({
      ...canvas,
      isActive: canvas.id === canvasId
    })),
    updatedAt: new Date()
  };
};

export const addCanvasToCarousel = (
  project: InstagramCarouselProject,
  position?: number
): InstagramCarouselProject => {
  const newSlideNumber = project.canvases.length + 1;
  const insertPosition = position !== undefined ? position : project.canvases.length;
  
  if (newSlideNumber > project.carouselMetadata.maxSlideCount) {
    throw new Error(`Maximum ${project.carouselMetadata.maxSlideCount} slides allowed`);
  }
  
  const newCanvas = createCarouselCanvas({
    title: `New Slide ${newSlideNumber}`,
    content: 'Click to edit this slide content...',
    backgroundPrompt: 'Instagram post background, modern design'
  }, newSlideNumber, true);
  
  const updatedCanvases = [...project.canvases];
  updatedCanvases.splice(insertPosition, 0, newCanvas);
  
  // Update slide numbers for canvases after insertion point
  updatedCanvases.forEach((canvas, index) => {
    canvas.slideMetadata.slideNumber = index + 1;
    canvas.isActive = canvas.id === newCanvas.id;
  });
  
  return {
    ...project,
    canvases: updatedCanvases,
    carouselMetadata: {
      ...project.carouselMetadata,
      slideCount: updatedCanvases.length
    },
    updatedAt: new Date()
  };
};

export const removeCanvasFromCarousel = (
  project: InstagramCarouselProject,
  canvasId: string
): InstagramCarouselProject => {
  const filteredCanvases = project.canvases.filter(canvas => canvas.id !== canvasId);
  
  if (filteredCanvases.length < 2) {
    throw new Error('Carousel must have at least 2 slides');
  }
  
  // Update slide numbers and ensure one canvas is active
  filteredCanvases.forEach((canvas, index) => {
    canvas.slideMetadata.slideNumber = index + 1;
    if (index === 0 && !filteredCanvases.some(c => c.isActive)) {
      canvas.isActive = true;
    }
  });
  
  return {
    ...project,
    canvases: filteredCanvases,
    carouselMetadata: {
      ...project.carouselMetadata,
      slideCount: filteredCanvases.length
    },
    updatedAt: new Date()
  };
};

export const isInstagramCarouselProject = (project: MultiCanvasProject): project is InstagramCarouselProject => {
  return 'type' in project && project.type === 'instagram-carousel';
};