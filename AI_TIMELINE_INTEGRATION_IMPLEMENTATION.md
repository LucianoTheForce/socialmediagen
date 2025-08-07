# AI Timeline Integration Implementation Guide

## Overview

This document provides a comprehensive implementation guide for integrating AI-generated content layers with OpenCut's existing timeline system. The design extends the robust timeline architecture while maintaining backward compatibility and performance standards.

## Current OpenCut Timeline Architecture Analysis

### Core Components
- **Timeline Store** (`timeline-store.ts`): Zustand-based state management with 1,559 lines of comprehensive functionality
- **Timeline Types** (`types/timeline.ts`): Well-defined type system with `MediaElement`, `TextElement`, and utilities
- **Timeline Components**: Main timeline, track components, playhead, element rendering, snapping system
- **Track Management**: Three track types (`media`, `text`, `audio`) with automatic ordering
- **Element Operations**: Complete CRUD operations with history, ripple editing, drag/drop

### Existing Strengths
- **Robust State Management**: Comprehensive Zustand store with auto-save and history
- **Type Safety**: Well-defined TypeScript interfaces for all timeline entities
- **Advanced Features**: Snapping, ripple editing, multi-selection, drag/drop
- **Performance**: Optimized rendering with proper React patterns
- **Extensibility**: Clean separation of concerns and modular architecture

## AI Integration Architecture

### 1. Extended Type System

#### AI-Specific Element Types
```typescript
// Extended timeline types
export type AIProvider = "openai" | "anthropic" | "runware" | "midjourney";
export type AIContentType = "text" | "image" | "background" | "layer-group";
export type SocialMediaFormat = "instagram-post" | "instagram-story" | "tiktok" | "facebook-post" | "youtube-short";

// Base AI element interface
interface AITimelineElement extends BaseTimelineElement {
  aiMetadata: {
    provider: AIProvider;
    model: string;
    prompt: string;
    generatedAt: Date;
    generationTime?: number;
    parameters?: Record<string, any>;
    cost?: number;
  };
  canvasFormat?: SocialMediaFormat;
  isRegeneratable: boolean;
  generationHistory?: AIGenerationHistoryEntry[];
}

// AI Text Element (extends existing TextElement)
export interface AITextElement extends AITimelineElement {
  type: "ai-text";
  content: string;
  // Inherit all TextElement properties
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  textAlign: "left" | "center" | "right";
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  // AI-specific text properties
  textEffects?: {
    stroke?: { color: string; width: number };
    shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
    gradient?: { type: "linear" | "radial"; colors: string[]; direction?: number };
  };
  animations?: TextAnimation[];
  stylePreset?: string;
}

// AI Image Element
export interface AIImageElement extends AITimelineElement {
  type: "ai-image";
  imageUrl: string;
  dimensions: { width: number; height: number };
  style?: string;
  aspectRatio?: number;
  effects?: {
    filters?: string[];
    transforms?: { scale?: number; skew?: number; perspective?: number };
    blend?: { mode: string; opacity: number };
  };
}

// AI Layer Group (for multi-canvas coordination)
export interface AILayerGroup extends AITimelineElement {
  type: "ai-layer-group";
  layers: (AITextElement | AIImageElement | MediaElement)[];
  canvasFormat: SocialMediaFormat;
  template?: {
    id: string;
    name: string;
    placeholders: Record<string, any>;
  };
  synchronization: {
    enabled: boolean;
    masterFormat?: SocialMediaFormat;
    adaptivePositioning: boolean;
  };
}

// Updated timeline element union
export type EnhancedTimelineElement = MediaElement | TextElement | AITextElement | AIImageElement | AILayerGroup;
```

#### Generation History and Caching
```typescript
interface AIGenerationHistoryEntry {
  id: string;
  timestamp: Date;
  prompt: string;
  provider: AIProvider;
  model: string;
  parameters: Record<string, any>;
  result: {
    content?: string;
    imageUrl?: string;
    metadata?: Record<string, any>;
  };
  generationTime: number;
  cost?: number;
  quality?: "draft" | "standard" | "premium";
}

interface AIGenerationCache {
  key: string; // hash of prompt + parameters
  result: any;
  timestamp: Date;
  expiresAt: Date;
  usageCount: number;
  provider: AIProvider;
  cost: number;
}
```

### 2. Enhanced Timeline Store

#### AI Store Extension
```typescript
interface AITimelineStore extends TimelineStore {
  // AI-specific state
  aiElements: Map<string, AITextElement | AIImageElement>;
  aiGenerationQueue: AIGenerationRequest[];
  aiCache: Map<string, AIGenerationCache>;
  
  // Multi-canvas state
  activeCanvasFormats: SocialMediaFormat[];
  canvasSyncEnabled: boolean;
  masterCanvas: SocialMediaFormat | null;
  
  // AI generation methods
  generateAIText: (prompt: string, options: AITextGenerationOptions) => Promise<AITextElement>;
  generateAIImage: (prompt: string, options: AIImageGenerationOptions) => Promise<AIImageElement>;
  regenerateAIElement: (elementId: string, newPrompt?: string) => Promise<void>;
  
  // Multi-canvas operations
  addCanvasFormat: (format: SocialMediaFormat) => void;
  removeCanvasFormat: (format: SocialMediaFormat) => void;
  syncElementAcrossCanvases: (elementId: string, properties: Partial<EnhancedTimelineElement>) => void;
  duplicateContentToFormat: (sourceFormat: SocialMediaFormat, targetFormat: SocialMediaFormat) => void;
  
  // Canvas-aware element operations
  addAIElementToCanvas: (element: AITextElement | AIImageElement, canvasFormat: SocialMediaFormat) => void;
  adaptElementToCanvas: (elementId: string, targetFormat: SocialMediaFormat) => Promise<void>;
  
  // AI generation queue management
  queueGeneration: (request: AIGenerationRequest) => void;
  processGenerationQueue: () => Promise<void>;
  cancelGeneration: (requestId: string) => void;
  
  // Cache management
  getCachedGeneration: (key: string) => AIGenerationCache | null;
  setCachedGeneration: (key: string, result: any, metadata: CacheMetadata) => void;
  clearExpiredCache: () => void;
}
```

#### Generation Request System
```typescript
interface AIGenerationRequest {
  id: string;
  type: AIContentType;
  prompt: string;
  provider: AIProvider;
  model: string;
  parameters: Record<string, any>;
  canvasFormat?: SocialMediaFormat;
  priority: "low" | "normal" | "high";
  callback: (result: AITextElement | AIImageElement | Error) => void;
  onProgress?: (stage: string, progress: number) => void;
  timeout?: number;
  retries?: number;
}

interface AITextGenerationOptions {
  provider?: AIProvider;
  model?: string;
  canvasFormat: SocialMediaFormat;
  style?: "casual" | "professional" | "creative" | "marketing";
  maxLength?: number;
  tone?: "friendly" | "formal" | "playful" | "urgent";
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  targetAudience?: string;
  brand?: {
    name: string;
    voice: string;
    keywords: string[];
  };
}

interface AIImageGenerationOptions {
  provider?: AIProvider;
  model?: string;
  style?: string;
  aspectRatio?: string;
  quality?: "draft" | "standard" | "premium";
  canvasFormat: SocialMediaFormat;
  dimensions?: { width: number; height: number };
  effects?: string[];
  backgroundRemoval?: boolean;
}
```

### 3. AI Timeline Components

#### AI Generation Panel
```typescript
// AI Generation Panel Component
interface AIGenerationPanelProps {
  onElementGenerated: (element: AITextElement | AIImageElement) => void;
  activeCanvas: SocialMediaFormat;
  currentTime: number;
}

export function AIGenerationPanel({ onElementGenerated, activeCanvas, currentTime }: AIGenerationPanelProps) {
  const [generationType, setGenerationType] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const { generateAIText, generateAIImage } = useAITimelineStore();
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      if (generationType === "text") {
        const aiTextElement = await generateAIText(prompt, {
          canvasFormat: activeCanvas,
          style: "marketing",
          includeHashtags: true,
        });
        
        // Add to timeline at current playhead position
        onElementGenerated({
          ...aiTextElement,
          startTime: currentTime,
        });
      } else {
        const aiImageElement = await generateAIImage(prompt, {
          canvasFormat: activeCanvas,
          quality: "standard",
          aspectRatio: getCanvasAspectRatio(activeCanvas),
        });
        
        onElementGenerated({
          ...aiImageElement,
          startTime: currentTime,
        });
      }
    } catch (error) {
      toast.error(`AI generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="ai-generation-panel">
      {/* Panel UI implementation */}
    </div>
  );
}
```

#### Enhanced Timeline Track for AI Elements
```typescript
// Extended timeline track component
export function AIEnhancedTimelineTrack({ track, zoomLevel }: {
  track: TimelineTrack;
  zoomLevel: number;
}) {
  const { aiElements, regenerateAIElement } = useAITimelineStore();
  
  const handleAIElementContextMenu = (element: AITextElement | AIImageElement) => {
    return [
      {
        label: "Regenerate with AI",
        onClick: () => regenerateAIElement(element.id),
        icon: "✨",
      },
      {
        label: "Edit Prompt",
        onClick: () => openPromptEditor(element),
        icon: "✏️",
      },
      {
        label: "Duplicate to All Formats",
        onClick: () => duplicateToAllFormats(element),
        icon: "📋",
      },
      {
        label: "View Generation History",
        onClick: () => openGenerationHistory(element),
        icon: "📜",
      },
      {
        label: "Convert to Static",
        onClick: () => convertToStatic(element),
        icon: "🔒",
      },
    ];
  };
  
  return (
    <div className="ai-enhanced-timeline-track">
      {track.elements.map((element) => {
        const isAIElement = element.type.startsWith("ai-");
        
        return (
          <div key={element.id} className="timeline-element-container">
            <TimelineElement 
              element={element}
              track={track}
              zoomLevel={zoomLevel}
              isAIElement={isAIElement}
              contextMenu={isAIElement ? handleAIElementContextMenu(element as AITextElement | AIImageElement) : undefined}
            />
            
            {isAIElement && (
              <div className="ai-element-indicator">
                <AIProviderIcon provider={(element as AITextElement | AIImageElement).aiMetadata.provider} />
                <span className="generation-status">
                  {(element as AITextElement | AIImageElement).isRegeneratable ? "✨" : "🔒"}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

#### Multi-Canvas Timeline View
```typescript
// Multi-canvas timeline view component
export function MultiCanvasTimelineView() {
  const { activeCanvasFormats, tracks, switchCanvasFormat } = useAITimelineStore();
  const [viewMode, setViewMode] = useState<"single" | "split" | "grid">("single");
  const [selectedCanvas, setSelectedCanvas] = useState<SocialMediaFormat>(activeCanvasFormats[0]);
  
  const canvasFilteredTracks = useMemo(() => {
    return tracks.map(track => ({
      ...track,
      elements: track.elements.filter(element => {
        if (element.type.startsWith("ai-")) {
          const aiElement = element as AITextElement | AIImageElement;
          return !aiElement.canvasFormat || aiElement.canvasFormat === selectedCanvas;
        }
        return true; // Regular elements show in all canvases
      }),
    }));
  }, [tracks, selectedCanvas]);
  
  return (
    <div className="multi-canvas-timeline">
      {/* Canvas format selector */}
      <div className="canvas-format-tabs">
        {activeCanvasFormats.map(format => (
          <button
            key={format}
            className={`canvas-tab ${selectedCanvas === format ? 'active' : ''}`}
            onClick={() => setSelectedCanvas(format)}
          >
            <CanvasFormatIcon format={format} />
            {formatDisplayName(format)}
            <span className="element-count">
              {getCanvasElementCount(tracks, format)}
            </span>
          </button>
        ))}
      </div>
      
      {/* Timeline view modes */}
      <div className="view-mode-controls">
        <ToggleGroup value={viewMode} onValueChange={setViewMode}>
          <ToggleGroupItem value="single">Single</ToggleGroupItem>
          <ToggleGroupItem value="split">Split</ToggleGroupItem>
          <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {/* Timeline content */}
      {viewMode === "single" && (
        <Timeline tracks={canvasFilteredTracks} selectedCanvas={selectedCanvas} />
      )}
      
      {viewMode === "split" && (
        <SplitCanvasTimeline formats={activeCanvasFormats.slice(0, 2)} />
      )}
      
      {viewMode === "grid" && (
        <GridCanvasTimeline formats={activeCanvasFormats} />
      )}
    </div>
  );
}
```

### 4. AI Generation Services

#### AI Provider Integration
```typescript
// AI service abstraction layer
interface AIGenerationService {
  generateText(prompt: string, options: AITextGenerationOptions): Promise<AITextElement>;
  generateImage(prompt: string, options: AIImageGenerationOptions): Promise<AIImageElement>;
  estimateCost(request: AIGenerationRequest): Promise<number>;
  checkStatus(requestId: string): Promise<"pending" | "completed" | "failed">;
}

// OpenAI service implementation
export class OpenAIService implements AIGenerationService {
  async generateText(prompt: string, options: AITextGenerationOptions): Promise<AITextElement> {
    const optimizedPrompt = this.optimizePromptForCanvas(prompt, options.canvasFormat);
    
    const response = await fetch("/api/ai/openai/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: optimizedPrompt,
        model: options.model || "gpt-4",
        maxTokens: options.maxLength || 100,
        style: options.style,
        tone: options.tone,
      }),
    });
    
    const result = await response.json();
    
    return {
      id: generateUUID(),
      type: "ai-text",
      name: "AI Generated Text",
      content: result.text,
      duration: TIMELINE_CONSTANTS.DEFAULT_TEXT_DURATION,
      startTime: 0,
      trimStart: 0,
      trimEnd: 0,
      fontSize: getCanvasOptimizedFontSize(options.canvasFormat),
      fontFamily: "Inter",
      color: "#ffffff",
      backgroundColor: "transparent",
      textAlign: "center",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      aiMetadata: {
        provider: "openai",
        model: options.model || "gpt-4",
        prompt: optimizedPrompt,
        generatedAt: new Date(),
        generationTime: result.generationTime,
        parameters: options,
        cost: result.cost,
      },
      canvasFormat: options.canvasFormat,
      isRegeneratable: true,
      generationHistory: [],
    };
  }
  
  async generateImage(prompt: string, options: AIImageGenerationOptions): Promise<AIImageElement> {
    // Implementation for DALL-E image generation
    // Similar structure to text generation
  }
  
  private optimizePromptForCanvas(prompt: string, format: SocialMediaFormat): string {
    const formatContext = {
      "instagram-post": "Create engaging Instagram post content that's visual and hashtag-friendly:",
      "instagram-story": "Create brief, casual Instagram story text that's mobile-optimized:",
      "tiktok": "Create catchy, trendy TikTok content with youth appeal:",
      "facebook-post": "Create Facebook post content that encourages engagement:",
      "youtube-short": "Create YouTube Shorts title/description text:",
    };
    
    return `${formatContext[format]} ${prompt}`;
  }
}

// Runware service implementation
export class RunwareService implements AIGenerationService {
  async generateImage(prompt: string, options: AIImageGenerationOptions): Promise<AIImageElement> {
    const response = await fetch("/api/ai/runware/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: options.model || "runware:default",
        width: options.dimensions?.width || getCanvasWidth(options.canvasFormat),
        height: options.dimensions?.height || getCanvasHeight(options.canvasFormat),
        style: options.style,
        quality: options.quality,
      }),
    });
    
    const result = await response.json();
    
    return {
      id: generateUUID(),
      type: "ai-image",
      name: "AI Generated Image",
      duration: TIMELINE_CONSTANTS.DEFAULT_IMAGE_DURATION,
      startTime: 0,
      trimStart: 0,
      trimEnd: 0,
      imageUrl: result.imageUrl,
      dimensions: result.dimensions,
      style: options.style,
      aspectRatio: result.dimensions.width / result.dimensions.height,
      aiMetadata: {
        provider: "runware",
        model: options.model || "runware:default",
        prompt,
        generatedAt: new Date(),
        generationTime: result.generationTime,
        parameters: options,
        cost: result.cost,
      },
      canvasFormat: options.canvasFormat,
      isRegeneratable: true,
      generationHistory: [],
    };
  }
  
  // Text generation not supported by Runware
  async generateText(): Promise<AITextElement> {
    throw new Error("Text generation not supported by Runware");
  }
}
```

#### Generation Queue Manager
```typescript
export class AIGenerationQueueManager {
  private queue: AIGenerationRequest[] = [];
  private processing = false;
  private concurrentLimit = 3;
  private activeRequests = new Map<string, Promise<any>>();
  
  async queueGeneration(request: AIGenerationRequest): Promise<void> {
    this.queue.push(request);
    this.queue.sort((a, b) => this.getPriorityOrder(a.priority) - this.getPriorityOrder(b.priority));
    
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0 && this.activeRequests.size < this.concurrentLimit) {
      const request = this.queue.shift()!;
      this.processRequest(request);
    }
    
    // Wait for all active requests to complete
    await Promise.allSettled(Array.from(this.activeRequests.values()));
    
    this.processing = false;
    
    // Continue processing if more items were added
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }
  
  private async processRequest(request: AIGenerationRequest): Promise<void> {
    const service = this.getServiceForProvider(request.provider);
    const requestPromise = this.executeWithRetry(request, service);
    
    this.activeRequests.set(request.id, requestPromise);
    
    try {
      const result = await requestPromise;
      request.callback(result);
    } catch (error) {
      request.callback(error);
    } finally {
      this.activeRequests.delete(request.id);
    }
  }
  
  private async executeWithRetry(
    request: AIGenerationRequest,
    service: AIGenerationService,
    retries = 3
  ): Promise<AITextElement | AIImageElement> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (request.type === "text") {
          return await service.generateText(request.prompt, request.parameters);
        } else {
          return await service.generateImage(request.prompt, request.parameters);
        }
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error("Max retries exceeded");
  }
  
  private getPriorityOrder(priority: "low" | "normal" | "high"): number {
    return { high: 1, normal: 2, low: 3 }[priority];
  }
  
  private getServiceForProvider(provider: AIProvider): AIGenerationService {
    const services = {
      openai: new OpenAIService(),
      anthropic: new AnthropicService(),
      runware: new RunwareService(),
      midjourney: new MidjourneyService(),
    };
    
    return services[provider];
  }
  
  cancelRequest(requestId: string): void {
    this.queue = this.queue.filter(req => req.id !== requestId);
    // Note: We can't cancel active requests once started
  }
  
  getQueueStatus(): { pending: number; active: number } {
    return {
      pending: this.queue.length,
      active: this.activeRequests.size,
    };
  }
}
```

### 5. Canvas Format Management

#### Canvas Adaptation System
```typescript
interface CanvasFormat {
  id: SocialMediaFormat;
  name: string;
  dimensions: { width: number; height: number };
  aspectRatio: number;
  safeArea: { top: number; right: number; bottom: number; left: number };
  typography: {
    titleSize: { min: number; max: number; default: number };
    bodySize: { min: number; max: number; default: number };
    lineHeight: number;
  };
  colors: {
    primary: string[];
    accent: string[];
    background: string[];
  };
  constraints: {
    maxTextLength: number;
    maxElements: number;
    animationDuration: { min: number; max: number };
  };
}

export const CANVAS_FORMATS: Record<SocialMediaFormat, CanvasFormat> = {
  "instagram-post": {
    id: "instagram-post",
    name: "Instagram Post",
    dimensions: { width: 1080, height: 1080 },
    aspectRatio: 1,
    safeArea: { top: 60, right: 60, bottom: 60, left: 60 },
    typography: {
      titleSize: { min: 24, max: 72, default: 48 },
      bodySize: { min: 16, max: 32, default: 24 },
      lineHeight: 1.2,
    },
    colors: {
      primary: ["#405DE6", "#5851DB", "#833AB4", "#C13584", "#E1306C", "#FD1D1D"],
      accent: ["#FFFFFF", "#F7F7F7"],
      background: ["#FAFAFA", "#FFFFFF"],
    },
    constraints: {
      maxTextLength: 200,
      maxElements: 8,
      animationDuration: { min: 0.5, max: 3 },
    },
  },
  "instagram-story": {
    id: "instagram-story",
    name: "Instagram Story",
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: 9/16,
    safeArea: { top: 120, right: 60, bottom: 120, left: 60 },
    typography: {
      titleSize: { min: 32, max: 84, default: 56 },
      bodySize: { min: 20, max: 40, default: 28 },
      lineHeight: 1.3,
    },
    colors: {
      primary: ["#405DE6", "#5851DB", "#833AB4", "#C13584", "#E1306C", "#FD1D1D"],
      accent: ["#FFFFFF", "#F7F7F7"],
      background: ["#000000", "#1A1A1A", "#FAFAFA"],
    },
    constraints: {
      maxTextLength: 150,
      maxElements: 6,
      animationDuration: { min: 0.3, max: 2 },
    },
  },
  "tiktok": {
    id: "tiktok",
    name: "TikTok",
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: 9/16,
    safeArea: { top: 100, right: 60, bottom: 200, left: 60 },
    typography: {
      titleSize: { min: 36, max: 96, default: 64 },
      bodySize: { min: 24, max: 48, default: 32 },
      lineHeight: 1.1,
    },
    colors: {
      primary: ["#FF0050", "#25F4EE", "#FE2C55"],
      accent: ["#FFFFFF", "#161823"],
      background: ["#000000", "#161823"],
    },
    constraints: {
      maxTextLength: 100,
      maxElements: 5,
      animationDuration: { min: 0.2, max: 1.5 },
    },
  },
  // ... other formats
};

export class CanvasAdaptationService {
  adaptElementToCanvas(
    element: AITextElement | AIImageElement,
    sourceFormat: SocialMediaFormat,
    targetFormat: SocialMediaFormat
  ): Partial<AITextElement | AIImageElement> {
    const sourceCanvas = CANVAS_FORMATS[sourceFormat];
    const targetCanvas = CANVAS_FORMATS[targetFormat];
    
    if (element.type === "ai-text") {
      return this.adaptTextElement(element as AITextElement, sourceCanvas, targetCanvas);
    } else {
      return this.adaptImageElement(element as AIImageElement, sourceCanvas, targetCanvas);
    }
  }
  
  private adaptTextElement(
    element: AITextElement,
    sourceCanvas: CanvasFormat,
    targetCanvas: CanvasFormat
  ): Partial<AITextElement> {
    // Scale font size proportionally
    const fontSizeRatio = targetCanvas.typography.titleSize.default / sourceCanvas.typography.titleSize.default;
    const newFontSize = Math.max(
      targetCanvas.typography.titleSize.min,
      Math.min(targetCanvas.typography.titleSize.max, element.fontSize * fontSizeRatio)
    );
    
    // Adapt position with safe area consideration
    const sourceUsableWidth = sourceCanvas.dimensions.width - sourceCanvas.safeArea.left - sourceCanvas.safeArea.right;
    const sourceUsableHeight = sourceCanvas.dimensions.height - sourceCanvas.safeArea.top - sourceCanvas.safeArea.bottom;
    const targetUsableWidth = targetCanvas.dimensions.width - targetCanvas.safeArea.left - targetCanvas.safeArea.right;
    const targetUsableHeight = targetCanvas.dimensions.height - targetCanvas.safeArea.top - targetCanvas.safeArea.bottom;
    
    const xRatio = targetUsableWidth / sourceUsableWidth;
    const yRatio = targetUsableHeight / sourceUsableHeight;
    
    const newX = element.x * xRatio;
    const newY = element.y * yRatio;
    
    // Truncate text if needed
    let newContent = element.content;
    if (newContent.length > targetCanvas.constraints.maxTextLength) {
      newContent = newContent.substring(0, targetCanvas.constraints.maxTextLength - 3) + "...";
    }
    
    return {
      fontSize: newFontSize,
      x: newX,
      y: newY,
      content: newContent,
      canvasFormat: targetCanvas.id,
    };
  }
  
  private adaptImageElement(
    element: AIImageElement,
    sourceCanvas: CanvasFormat,
    targetCanvas: CanvasFormat
  ): Partial<AIImageElement> {
    // Calculate new dimensions maintaining aspect ratio
    const sourceAspectRatio = element.dimensions.width / element.dimensions.height;
    const targetAspectRatio = targetCanvas.aspectRatio;
    
    let newWidth = targetCanvas.dimensions.width;
    let newHeight = targetCanvas.dimensions.height;
    
    if (sourceAspectRatio !== targetAspectRatio) {
      // Fit image within canvas bounds
      if (sourceAspectRatio > targetAspectRatio) {
        // Image is wider, fit to width
        newHeight = newWidth / sourceAspectRatio;
      } else {
        // Image is taller, fit to height
        newWidth = newHeight * sourceAspectRatio;
      }
    }
    
    return {
      dimensions: { width: newWidth, height: newHeight },
      canvasFormat: targetCanvas.id,
    };
  }
  
  generateCanvasSpecificPrompt(
    originalPrompt: string,
    targetFormat: SocialMediaFormat
  ): string {
    const canvas = CANVAS_FORMATS[targetFormat];
    const formatContext = {
      "instagram-post": "square format, Instagram aesthetic, bright and engaging",
      "instagram-story": "vertical mobile format, story-style, casual and authentic",
      "tiktok": "vertical video format, trendy and dynamic, Gen Z appeal",
      "facebook-post": "social media friendly, community-focused",
      "youtube-short": "vertical video thumbnail, eye-catching title style",
    };
    
    return `${originalPrompt} - optimized for ${formatContext[targetFormat]}, ${canvas.dimensions.width}x${canvas.dimensions.height}px`;
  }
}
```

### 6. Performance Optimizations

#### Lazy Loading and Virtualization
```typescript
export class TimelineVirtualization {
  private visibleElementRange: { start: number; end: number } = { start: 0, end: 100 };
  private elementCache = new Map<string, React.ComponentType>();
  
  getVisibleElements(
    tracks: TimelineTrack[],
    scrollPosition: number,
    viewportWidth: number,
    zoomLevel: number
  ): TimelineElement[] {
    const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
    const startTime = scrollPosition / pixelsPerSecond;
    const endTime = (scrollPosition + viewportWidth) / pixelsPerSecond;
    
    return tracks
      .flatMap(track => track.elements)
      .filter(element => {
        const elementStart = element.startTime;
        const elementEnd = element.startTime + element.duration - element.trimStart - element.trimEnd;
        return elementEnd > startTime && elementStart < endTime;
      });
  }
  
  preloadAIElements(elements: (AITextElement | AIImageElement)[]): void {
    elements.forEach(element => {
      if (element.type === "ai-image" && element.imageUrl) {
        // Preload images
        const img = new Image();
        img.src = element.imageUrl;
      }
    });
  }
}

// AI generation caching with intelligent eviction
export class AIGenerationCacheManager {
  private cache = new Map<string, AIGenerationCache>();
  private maxCacheSize = 100; // MB
  private currentCacheSize = 0;
  
  async getCached(key: string): Promise<AIGenerationCache | null> {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (cached.expiresAt < new Date()) {
      this.cache.delete(key);
      this.currentCacheSize -= this.estimateSize(cached);
      return null;
    }
    
    // Update usage for LRU
    cached.usageCount++;
    return cached;
  }
  
  async setCached(key: string, result: any, metadata: { 
    expirationHours: number;
    provider: AIProvider;
    cost: number;
  }): Promise<void> {
    const cacheEntry: AIGenerationCache = {
      key,
      result,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + metadata.expirationHours * 60 * 60 * 1000),
      usageCount: 1,
      provider: metadata.provider,
      cost: metadata.cost,
    };
    
    const entrySize = this.estimateSize(cacheEntry);
    
    // Evict old entries if needed
    while (this.currentCacheSize + entrySize > this.maxCacheSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, cacheEntry);
    this.currentCacheSize += entrySize;
  }
  
  private evictLeastUsed(): void {
    let leastUsedKey = "";
    let minUsage = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.usageCount < minUsage) {
        minUsage = entry.usageCount;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      const entry = this.cache.get(leastUsedKey)!;
      this.cache.delete(leastUsedKey);
      this.currentCacheSize -= this.estimateSize(entry);
    }
  }
  
  private estimateSize(entry: AIGenerationCache): number {
    // Rough estimation in MB
    const jsonSize = JSON.stringify(entry).length / (1024 * 1024);
    return jsonSize;
  }
  
  clearExpired(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        this.currentCacheSize -= this.estimateSize(entry);
      }
    }
  }
  
  getStats(): { 
    entries: number; 
    sizeInMB: number; 
    hitRate: number; 
    totalCost: number;
  } {
    const totalCost = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.cost, 0);
    
    return {
      entries: this.cache.size,
      sizeInMB: this.currentCacheSize,
      hitRate: 0.85, // This would be tracked separately
      totalCost,
    };
  }
}
```

### 7. Database Schema Extensions

```sql
-- AI timeline elements storage
CREATE TABLE ai_timeline_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    track_id UUID NOT NULL,
    element_type VARCHAR(20) NOT NULL CHECK (element_type IN ('ai-text', 'ai-image', 'ai-layer-group')),
    
    -- Timeline properties
    start_time DECIMAL NOT NULL,
    duration DECIMAL NOT NULL,
    trim_start DECIMAL DEFAULT 0,
    trim_end DECIMAL DEFAULT 0,
    name VARCHAR(255) NOT NULL,
    hidden BOOLEAN DEFAULT FALSE,
    
    -- AI metadata
    provider VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generation_time_ms INTEGER,
    cost DECIMAL(10, 6),
    is_regeneratable BOOLEAN DEFAULT TRUE,
    
    -- Content data (JSON for flexibility)
    content_data JSONB NOT NULL,
    
    -- Canvas format association
    canvas_format VARCHAR(30),
    
    -- Indexes for performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI generation history for regeneration and analytics
CREATE TABLE ai_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id UUID REFERENCES ai_timeline_elements(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    result_data JSONB NOT NULL,
    generation_time_ms INTEGER NOT NULL,
    cost DECIMAL(10, 6),
    quality VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI generation cache for cost optimization
CREATE TABLE ai_generation_cache (
    cache_key VARCHAR(64) PRIMARY KEY, -- Hash of prompt + parameters
    provider VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_hash VARCHAR(64) NOT NULL,
    result_data JSONB NOT NULL,
    generation_time_ms INTEGER NOT NULL,
    cost DECIMAL(10, 6) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Multi-canvas project settings
CREATE TABLE multi_canvas_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    active_canvas_formats TEXT[] NOT NULL DEFAULT '{}',
    master_canvas VARCHAR(30),
    sync_enabled BOOLEAN DEFAULT TRUE,
    adaptive_positioning BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Canvas-specific element configurations
CREATE TABLE canvas_element_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id UUID NOT NULL REFERENCES ai_timeline_elements(id) ON DELETE CASCADE,
    canvas_format VARCHAR(30) NOT NULL,
    position_data JSONB NOT NULL, -- x, y, fontSize, etc.
    style_overrides JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_ai_elements_project_track ON ai_timeline_elements(project_id, track_id);
CREATE INDEX idx_ai_elements_canvas_format ON ai_timeline_elements(canvas_format) WHERE canvas_format IS NOT NULL;
CREATE INDEX idx_ai_generation_history_element ON ai_generation_history(element_id);
CREATE INDEX idx_ai_cache_expires ON ai_generation_cache(expires_at);
CREATE INDEX idx_ai_cache_provider_model ON ai_generation_cache(provider, model);
CREATE INDEX idx_canvas_configs_element_format ON canvas_element_configs(element_id, canvas_format);
```

### 8. API Integration Layer

#### AI API Routes
```typescript
// API route: /api/ai/generate-text
export async function POST(request: Request) {
  try {
    const { prompt, provider, model, options } = await request.json();
    
    const service = getAIService(provider);
    const result = await service.generateText(prompt, options);
    
    // Cache the result
    const cacheKey = generateCacheKey(prompt, provider, model, options);
    await aiCache.setCached(cacheKey, result, {
      expirationHours: 24,
      provider,
      cost: result.aiMetadata.cost || 0,
    });
    
    // Log generation for analytics
    await logAIGeneration({
      type: "text",
      provider,
      model,
      prompt,
      generationTime: result.aiMetadata.generationTime,
      cost: result.aiMetadata.cost,
    });
    
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error("AI text generation failed:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// API route: /api/ai/generate-image
export async function POST(request: Request) {
  try {
    const { prompt, provider, model, options } = await request.json();
    
    const service = getAIService(provider);
    const result = await service.generateImage(prompt, options);
    
    // Upload image to storage and get permanent URL
    const permanentUrl = await uploadAIGeneratedImage(result.imageUrl);
    result.imageUrl = permanentUrl;
    
    // Cache and log
    const cacheKey = generateCacheKey(prompt, provider, model, options);
    await aiCache.setCached(cacheKey, result, {
      expirationHours: 168, // 1 week for images
      provider,
      cost: result.aiMetadata.cost || 0,
    });
    
    await logAIGeneration({
      type: "image",
      provider,
      model,
      prompt,
      generationTime: result.aiMetadata.generationTime,
      cost: result.aiMetadata.cost,
    });
    
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error("AI image generation failed:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 9. Integration Testing Strategy

#### E2E Test Scenarios
```typescript
// Test suite for AI timeline integration
describe("AI Timeline Integration", () => {
  beforeEach(async () => {
    await setupTestProject();
    await seedAIProviders();
  });
  
  test("should generate AI text element and add to timeline", async () => {
    const timeline = await createTestTimeline();
    const prompt = "Create engaging Instagram post about coffee";
    
    const aiTextElement = await timeline.generateAIText(prompt, {
      canvasFormat: "instagram-post",
      style: "casual",
    });
    
    expect(aiTextElement.type).toBe("ai-text");
    expect(aiTextElement.content).toBeTruthy();
    expect(aiTextElement.canvasFormat).toBe("instagram-post");
    expect(aiTextElement.aiMetadata.provider).toBe("openai");
    
    timeline.addElementToTrack("text-track-1", {
      ...aiTextElement,
      startTime: 0,
    });
    
    const tracks = timeline.getTracks();
    expect(tracks[0].elements).toHaveLength(1);
    expect(tracks[0].elements[0].type).toBe("ai-text");
  });
  
  test("should regenerate AI element with new prompt", async () => {
    const timeline = await createTestTimeline();
    const originalElement = await createAITextElement();
    timeline.addElementToTrack("text-track-1", originalElement);
    
    const regeneratedElement = await timeline.regenerateAIElement(
      originalElement.id,
      "New prompt for regeneration"
    );
    
    expect(regeneratedElement.content).not.toBe(originalElement.content);
    expect(regeneratedElement.aiMetadata.prompt).toBe("New prompt for regeneration");
    expect(regeneratedElement.generationHistory).toHaveLength(1);
  });
  
  test("should adapt element across canvas formats", async () => {
    const timeline = await createTestTimeline();
    const instagramElement = await createAITextElement("instagram-post");
    
    const adaptedElement = await timeline.adaptElementToCanvas(
      instagramElement.id,
      "tiktok"
    );
    
    expect(adaptedElement.canvasFormat).toBe("tiktok");
    expect(adaptedElement.fontSize).toBeGreaterThan(instagramElement.fontSize);
    expect(adaptedElement.content.length).toBeLessThanOrEqual(100); // TikTok limit
  });
  
  test("should sync element changes across multiple canvases", async () => {
    const timeline = await createMultiCanvasTimeline(["instagram-post", "tiktok"]);
    const sharedElement = await createAITextElement("instagram-post");
    
    timeline.addElementToAllCanvases(sharedElement);
    timeline.syncElementAcrossCanvases(sharedElement.id, {
      color: "#ff0000",
      fontWeight: "bold",
    });
    
    const instagramTrack = timeline.getCanvasTrack("instagram-post");
    const tiktokTrack = timeline.getCanvasTrack("tiktok");
    
    expect(instagramTrack.elements[0].color).toBe("#ff0000");
    expect(tiktokTrack.elements[0].color).toBe("#ff0000");
    expect(instagramTrack.elements[0].fontWeight).toBe("bold");
    expect(tiktokTrack.elements[0].fontWeight).toBe("bold");
  });
  
  test("should handle AI generation failures gracefully", async () => {
    const timeline = await createTestTimeline();
    
    // Mock AI service failure
    jest.spyOn(aiService, "generateText").mockRejectedValue(
      new Error("API rate limit exceeded")
    );
    
    await expect(
      timeline.generateAIText("Test prompt", {
        canvasFormat: "instagram-post",
      })
    ).rejects.toThrow("API rate limit exceeded");
    
    // Verify timeline state remains consistent
    expect(timeline.getTracks()).toHaveLength(1);
    expect(timeline.getTracks()[0].elements).toHaveLength(0);
  });
  
  test("should cache AI generations for cost optimization", async () => {
    const timeline = await createTestTimeline();
    const prompt = "Test prompt for caching";
    
    // First generation
    const element1 = await timeline.generateAIText(prompt, {
      canvasFormat: "instagram-post",
    });
    
    // Second generation with same parameters should use cache
    const element2 = await timeline.generateAIText(prompt, {
      canvasFormat: "instagram-post",
    });
    
    expect(element1.content).toBe(element2.content);
    expect(aiCache.getStats().hitRate).toBeGreaterThan(0);
  });
});
```

### 10. Migration Strategy

#### Gradual Implementation Plan
```typescript
// Phase 1: Core AI integration
export const Phase1Migration = {
  // 1. Extend timeline types
  updateTimelineTypes: async () => {
    // Add new AI element types to existing codebase
    // Maintain backward compatibility
  },
  
  // 2. Add AI generation services
  implementAIServices: async () => {
    // Implement OpenAI and Runware integrations
    // Add generation queue management
  },
  
  // 3. Extend timeline store
  enhanceTimelineStore: async () => {
    // Add AI-specific methods to existing store
    // Maintain all existing functionality
  },
};

// Phase 2: Multi-canvas support
export const Phase2Migration = {
  // 1. Add canvas format management
  implementCanvasFormats: async () => {
    // Add canvas format definitions
    // Implement adaptation algorithms
  },
  
  // 2. Multi-canvas UI
  addMultiCanvasUI: async () => {
    // Add canvas format selector
    // Implement multi-canvas timeline view
  },
};

// Phase 3: Advanced features
export const Phase3Migration = {
  // 1. Performance optimizations
  addPerformanceOptimizations: async () => {
    // Implement virtualization
    // Add intelligent caching
  },
  
  // 2. Analytics and monitoring
  addAnalytics: async () => {
    // Generation cost tracking
    // Performance monitoring
    // User engagement metrics
  },
};

// Database migration script
export async function migrateDatabase() {
  const migrations = [
    {
      version: "1.0.0",
      script: `
        -- Add AI element support
        ALTER TABLE timeline_elements ADD COLUMN ai_metadata JSONB;
        ALTER TABLE timeline_elements ADD COLUMN canvas_format VARCHAR(30);
        CREATE INDEX idx_timeline_elements_canvas ON timeline_elements(canvas_format);
      `,
    },
    {
      version: "1.1.0", 
      script: `
        -- Create AI-specific tables
        CREATE TABLE ai_timeline_elements (...);
        CREATE TABLE ai_generation_history (...);
        CREATE TABLE ai_generation_cache (...);
      `,
    },
    {
      version: "1.2.0",
      script: `
        -- Add multi-canvas support
        CREATE TABLE multi_canvas_projects (...);
        CREATE TABLE canvas_element_configs (...);
      `,
    },
  ];
  
  for (const migration of migrations) {
    await runMigration(migration);
  }
}
```

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Implement extended type system
- [ ] Create AI service abstraction layer
- [ ] Set up OpenAI and Runware integrations
- [ ] Add basic AI generation to timeline store

### Week 3-4: Core Integration
- [ ] Implement AI timeline components
- [ ] Add AI generation panel UI
- [ ] Create generation queue management
- [ ] Implement caching system

### Week 5-6: Multi-Canvas Support
- [ ] Add canvas format management
- [ ] Implement element adaptation algorithms
- [ ] Create multi-canvas timeline UI
- [ ] Add synchronization features

### Week 7-8: Performance & Polish
- [ ] Implement virtualization
- [ ] Add performance optimizations
- [ ] Create comprehensive testing suite
- [ ] Add error handling and monitoring

### Week 9-10: Advanced Features
- [ ] Add generation history tracking
- [ ] Implement cost optimization
- [ ] Create analytics dashboard
- [ ] Add user onboarding

## Success Metrics

### Functional Requirements
- ✅ AI text generation integrates seamlessly with timeline
- ✅ AI image generation works with Runware API
- ✅ Multi-canvas editing maintains performance
- ✅ Element synchronization works across formats
- ✅ AI regeneration preserves timeline state

### Performance Requirements
- Timeline stays responsive with 100+ AI elements
- AI generation completes within 10 seconds
- Canvas switching happens within 500ms
- Memory usage stays reasonable with caching

### User Experience Requirements
- Intuitive AI generation workflow
- Clear visual distinction for AI elements
- Seamless template application
- Efficient cost management

This implementation guide provides a comprehensive roadmap for integrating AI capabilities into OpenCut's timeline system while maintaining its robust architecture and performance standards.