# Timeline Integration with AI-Generated and Uploaded Layers

## Overview

This document outlines the integration plan for extending OpenCut's timeline system to support AI-generated content layers and multi-canvas social media workflows. The integration will maintain OpenCut's existing architecture while adding AI capabilities for text generation and image creation.

## Current OpenCut Timeline Architecture Analysis

### Core Components
- **Timeline Component** (`timeline/index.tsx`): Main timeline interface with ruler, tracks, playhead
- **Timeline Store** (`timeline-store.ts`): Zustand state management for tracks and elements  
- **Track Component** (`timeline-track.tsx`): Individual track rendering and drag/drop
- **Element Types**: `MediaElement` (references media store), `TextElement` (embedded properties)
- **Track Types**: `media`, `text`, `audio` with specific ordering rules

### Key Features
- **Track Ordering**: Text tracks (top) → Media tracks (middle) → Audio tracks (bottom)
- **Element Management**: Add, remove, move, split, trim, resize operations
- **Snapping System**: Frame-based and element-edge snapping with visual indicators
- **Ripple Editing**: Timeline-wide adjustments when elements are moved/deleted
- **Drag & Drop**: Media items and timeline elements with overlap detection

## AI Integration Strategy

### 1. Extended Element Types

```typescript
// New AI-specific element types
export interface AITextElement extends BaseTimelineElement {
  type: "ai-text";
  content: string;
  prompt: string; // Original AI prompt
  generatedAt: Date;
  aiProvider: "openai" | "anthropic";
  model: string;
  // Existing text properties
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  // ... other text properties
}

export interface AIImageElement extends BaseTimelineElement {
  type: "ai-image";
  imageUrl: string;
  prompt: string; // Original AI prompt
  generatedAt: Date;
  aiProvider: "runware" | "midjourney";
  model: string;
  dimensions: { width: number; height: number };
  style?: string; // AI style parameters
}

export interface AILayerGroup extends BaseTimelineElement {
  type: "ai-layer-group";
  canvasFormat: "instagram-post" | "instagram-story" | "tiktok" | "facebook-post";
  layers: (AITextElement | AIImageElement | MediaElement)[];
  template?: string; // Template ID if created from template
}
```

### 2. Multi-Canvas Track Structure

```typescript
// Extended track types for multi-canvas support
export type ExtendedTrackType = TrackType | "ai-text" | "ai-image" | "canvas-layer";

export interface CanvasTrack extends TimelineTrack {
  type: "canvas-layer";
  canvasFormat: SocialMediaFormat;
  dimensions: { width: number; height: number };
  backgroundColor: string;
  elements: (AITextElement | AIImageElement | MediaElement | TextElement)[];
}

// Track ordering hierarchy:
// 1. AI Text tracks (top)
// 2. Text tracks 
// 3. Canvas layer tracks (grouped by format)
// 4. Media tracks (main + additional)
// 5. AI Image tracks
// 6. Audio tracks (bottom)
```

### 3. AI Generation Integration Points

#### A. AI Text Generation Panel Integration
```typescript
// Timeline store extensions for AI text
interface AITextGeneration {
  generateTextElement: (
    prompt: string,
    canvasFormat: SocialMediaFormat,
    position: { x: number; y: number }
  ) => Promise<AITextElement>;
  
  regenerateTextElement: (
    elementId: string,
    newPrompt?: string
  ) => Promise<void>;
  
  addAITextToTimeline: (
    textElement: AITextElement,
    trackId?: string,
    startTime?: number
  ) => void;
}
```

#### B. AI Image Generation Integration  
```typescript
// Timeline store extensions for AI images
interface AIImageGeneration {
  generateImageElement: (
    prompt: string,
    canvasFormat: SocialMediaFormat,
    style?: string
  ) => Promise<AIImageElement>;
  
  addAIImageToTimeline: (
    imageElement: AIImageElement,
    trackId?: string,
    startTime?: number
  ) => void;
  
  replaceWithAIImage: (
    elementId: string,
    prompt: string
  ) => Promise<void>;
}
```

### 4. Multi-Canvas Timeline Workflow

#### Canvas Format Management
```typescript
interface MultiCanvasTimelineStore extends TimelineStore {
  // Active canvas formats being edited
  activeCanvasFormats: SocialMediaFormat[];
  
  // Add/remove canvas formats
  addCanvasFormat: (format: SocialMediaFormat) => void;
  removeCanvasFormat: (format: SocialMediaFormat) => void;
  
  // Canvas-specific operations
  duplicateContentAcrossFormats: (
    sourceFormat: SocialMediaFormat,
    targetFormats: SocialMediaFormat[]
  ) => void;
  
  syncElementAcrossCanvases: (
    elementId: string,
    property: keyof AITextElement | keyof AIImageElement,
    value: any
  ) => void;
}
```

#### Timeline View Modes
```typescript
type TimelineViewMode = "single" | "split" | "grid";

interface TimelineViewState {
  viewMode: TimelineViewMode;
  selectedCanvas: SocialMediaFormat | null;
  
  // Grid view settings
  gridColumns: number;
  showAllFormats: boolean;
  
  // Split view settings
  primaryCanvas: SocialMediaFormat;
  secondaryCanvas: SocialMediaFormat;
}
```

### 5. AI Layer Creation Workflow

#### Template-Based AI Generation
```typescript
interface AITemplateWorkflow {
  // Apply template with AI generation
  applyTemplateWithAI: (
    templateId: string,
    canvasFormat: SocialMediaFormat,
    aiPrompts: {
      textPrompts?: string[];
      imagePrompts?: string[];
      backgroundPrompt?: string;
    }
  ) => Promise<{
    canvasTrackId: string;
    generatedElements: (AITextElement | AIImageElement)[];
  }>;
  
  // Generate content for template placeholders
  fillTemplatePlaceholders: (
    templateId: string,
    placeholderData: Map<string, string>
  ) => Promise<void>;
}
```

#### Real-time AI Generation
```typescript
interface RealtimeAIGeneration {
  // Generate content at current playhead position
  generateAtPlayhead: (
    type: "text" | "image",
    prompt: string,
    canvasFormat: SocialMediaFormat
  ) => Promise<void>;
  
  // Batch generate for multiple formats
  generateForAllFormats: (
    type: "text" | "image", 
    prompt: string
  ) => Promise<Map<SocialMediaFormat, AITextElement | AIImageElement>>;
  
  // Progressive generation with preview
  generateWithPreview: (
    prompt: string,
    onProgress: (stage: string, progress: number) => void
  ) => Promise<AITextElement | AIImageElement>;
}
```

### 6. Timeline UI Extensions

#### AI Generation Controls
```typescript
// Timeline toolbar additions
interface AITimelineControls {
  // AI generation buttons
  generateAIText: () => void;
  generateAIImage: () => void;
  openAIPanel: (type: "text" | "image") => void;
  
  // Multi-canvas controls  
  toggleCanvasFormat: (format: SocialMediaFormat) => void;
  switchViewMode: (mode: TimelineViewMode) => void;
  syncElementsAcrossCanvases: () => void;
}
```

#### Enhanced Element Context Menu
```typescript
// Additional context menu options for AI elements
interface AIElementContextMenu {
  "Regenerate with AI": (elementId: string) => void;
  "Edit AI Prompt": (elementId: string) => void;
  "Duplicate to All Formats": (elementId: string) => void;
  "Convert to Static": (elementId: string) => void; // Convert AI element to regular element
  "View Generation History": (elementId: string) => void;
}
```

### 7. Canvas Synchronization System

#### Element Synchronization
```typescript
interface CanvasSyncManager {
  // Sync element properties across canvases
  syncElementProperty: (
    elementId: string,
    property: string,
    value: any,
    targetFormats?: SocialMediaFormat[]
  ) => void;
  
  // Smart positioning for different canvas sizes
  adaptElementPosition: (
    element: AITextElement | AIImageElement,
    sourceFormat: SocialMediaFormat,
    targetFormat: SocialMediaFormat
  ) => { x: number; y: number; fontSize?: number };
  
  // Batch operations
  syncAllElements: (
    sourceFormat: SocialMediaFormat,
    targetFormats: SocialMediaFormat[]
  ) => void;
}
```

### 8. Performance Optimizations

#### Lazy Loading and Virtualization
```typescript
interface TimelinePerformance {
  // Virtualize timeline elements for large projects
  virtualizeElements: boolean;
  visibleElementRange: { start: number; end: number };
  
  // Lazy load AI-generated content
  lazyLoadAIElements: boolean;
  preloadRange: number; // Seconds to preload around playhead
  
  // Canvas-specific optimizations
  renderOnlyActiveCanvas: boolean;
  cacheRenderedFrames: boolean;
}
```

#### AI Generation Caching
```typescript
interface AIGenerationCache {
  // Cache generated content
  cacheAIResponse: (prompt: string, provider: string, response: any) => void;
  getCachedResponse: (prompt: string, provider: string) => any | null;
  
  // Prefetch common generations
  prefetchCommonPrompts: (canvasFormat: SocialMediaFormat) => void;
  
  // Memory management
  clearOldCache: (olderThanDays: number) => void;
  getCacheSize: () => number;
}
```

### 9. Database Schema Extensions

#### AI Element Storage
```sql
-- AI-generated timeline elements
CREATE TABLE ai_timeline_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    track_id UUID NOT NULL,
    element_type VARCHAR(20) NOT NULL, -- 'ai-text', 'ai-image', 'ai-layer-group'
    
    -- Timeline properties
    start_time DECIMAL NOT NULL,
    duration DECIMAL NOT NULL,
    trim_start DECIMAL DEFAULT 0,
    trim_end DECIMAL DEFAULT 0,
    
    -- AI generation metadata
    prompt TEXT NOT NULL,
    ai_provider VARCHAR(20) NOT NULL,
    model VARCHAR(50) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Content data (JSON for flexibility)
    content_data JSONB NOT NULL,
    
    -- Canvas format association
    canvas_format VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI generation history for regeneration
CREATE TABLE ai_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id UUID REFERENCES ai_timeline_elements(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    model VARCHAR(50) NOT NULL,
    result_data JSONB NOT NULL,
    generation_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 10. Implementation Phases

#### Phase 1: Core AI Element Support
- [ ] Extend timeline element types for AI content
- [ ] Add AI text and image generation to timeline store
- [ ] Create AI element rendering in timeline tracks
- [ ] Implement basic AI generation integration

#### Phase 2: Multi-Canvas Timeline
- [ ] Add canvas format management to timeline
- [ ] Implement multi-canvas track structure
- [ ] Create canvas format selector UI
- [ ] Add element synchronization across canvases

#### Phase 3: AI Generation Workflow
- [ ] Integrate AI text generation panel with timeline
- [ ] Add AI image generation workflow
- [ ] Implement template-based AI content creation
- [ ] Create AI generation progress indicators

#### Phase 4: Advanced Features
- [ ] Add element synchronization controls
- [ ] Implement AI regeneration and editing
- [ ] Create AI generation history tracking
- [ ] Add performance optimizations

#### Phase 5: Polish and Testing
- [ ] Timeline UI/UX refinements
- [ ] Performance testing with large AI projects
- [ ] Integration testing with all AI providers
- [ ] User acceptance testing

## Integration with Existing Components

### Timeline Component Extensions (`timeline/index.tsx`)
```typescript
// Additional imports for AI functionality
import { AIGenerationPanel } from '../ai-panels/ai-generation-panel';
import { CanvasFormatSelector } from '../canvas/canvas-format-selector';
import { useAITimelineStore } from '@/stores/ai-timeline-store';

// Enhanced timeline component with AI support
export function EnhancedTimeline() {
  const { aiGenerationMode, activeCanvasFormats } = useAITimelineStore();
  
  return (
    <div className="timeline-container">
      {/* Canvas format selector */}
      <CanvasFormatSelector formats={activeCanvasFormats} />
      
      {/* Enhanced timeline toolbar with AI controls */}
      <TimelineToolbarWithAI />
      
      {/* Main timeline with multi-canvas support */}
      <MultiCanvasTimeline />
      
      {/* AI generation panel overlay */}
      {aiGenerationMode && <AIGenerationPanel />}
    </div>
  );
}
```

### Timeline Store Extensions
```typescript
// Extend existing timeline store with AI capabilities
export const useEnhancedTimelineStore = create<EnhancedTimelineStore>((set, get) => ({
  ...useTimelineStore(set, get), // Inherit all existing functionality
  
  // AI-specific state
  aiElements: new Map(),
  aiGenerationQueue: [],
  
  // AI element operations
  addAIElementToTrack: async (trackId, aiElement) => {
    // Implementation for adding AI-generated elements
  },
  
  regenerateAIElement: async (elementId, newPrompt) => {
    // Implementation for regenerating AI content
  },
  
  // Multi-canvas operations
  addCanvasFormat: (format) => {
    // Implementation for adding canvas formats
  },
  
  syncElementAcrossCanvases: (elementId, targetFormats) => {
    // Implementation for cross-canvas synchronization
  }
}));
```

## Success Metrics

### Functional Requirements
- ✅ AI-generated text elements integrate seamlessly with timeline
- ✅ AI-generated images display and animate correctly
- ✅ Multi-canvas editing maintains timeline performance
- ✅ Element synchronization works across all canvas formats
- ✅ AI regeneration preserves timeline positioning

### Performance Requirements
- Timeline remains responsive with 100+ AI elements
- Canvas switching completes within 500ms
- AI generation doesn't block timeline interactions
- Memory usage stays reasonable with multiple canvas formats

### User Experience Requirements
- Intuitive AI generation workflow from timeline
- Clear visual distinction for AI vs. manual elements
- Seamless template application with AI content
- Efficient cross-canvas element management

This integration plan extends OpenCut's robust timeline architecture with AI capabilities while maintaining its performance and usability standards. The phased approach ensures systematic implementation and testing of each component.