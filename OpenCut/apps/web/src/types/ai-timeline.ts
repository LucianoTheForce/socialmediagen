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