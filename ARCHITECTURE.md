# AI-Powered Social Media Content Generator Architecture

## Overview
A comprehensive multi-canvas social media content generation platform built on OpenCut foundation, enabling users to create professional content for Instagram, TikTok, Facebook, and other platforms using AI-generated backgrounds, editable text layers, and pre-defined templates.

## Technical Stack

### Foundation (OpenCut Extended)
- **Framework**: Next.js 15 + React 18 + TypeScript
- **Package Manager**: Bun
- **State Management**: Zustand stores
- **Authentication**: Better Auth (pre-configured)
- **Database**: Drizzle ORM + PostgreSQL
- **Cache**: Upstash Redis
- **Deployment**: Vercel

### AI Integration
- **Primary AI**: Runware API (WebSocket-based)
  - Text-to-image generation
  - Background removal
  - Image upscaling
  - Prompt enhancement
- **Text Generation**: OpenAI GPT-4 API
- **Image Processing**: Built-in + FFmpeg

## System Architecture

### 1. Core Components Extension

```
OpenCut Foundation
├── Timeline System (Extended)
│   ├── AI Layer Management
│   ├── Multi-Canvas Support
│   └── Template Integration
├── State Management (Enhanced)
│   ├── ai-store.ts (NEW)
│   ├── template-store.ts (NEW)
│   ├── social-format-store.ts (NEW)
│   └── existing stores (timeline, project, media)
└── UI Components (Extended)
    ├── Multi-Canvas Preview Panel
    ├── AI Generation Panel
    ├── Template Gallery
    └── Social Format Selector
```

### 2. New Store Architecture

#### AI Store (`ai-store.ts`)
```typescript
interface AIStore {
  // Runware API integration
  generateBackground: (prompt: string, format: SocialFormat) => Promise<string>
  enhancePrompt: (prompt: string) => Promise<string>
  removeBackground: (imageUrl: string) => Promise<string>
  upscaleImage: (imageUrl: string) => Promise<string>
  
  // Text generation
  generateCaption: (context: string, platform: Platform) => Promise<string>
  generateHashtags: (content: string, platform: Platform) => Promise<string[]>
  
  // State management
  isGenerating: boolean
  generationQueue: AITask[]
  apiCredits: number
}
```

#### Template Store (`template-store.ts`)
```typescript
interface TemplateStore {
  templates: Template[]
  categories: TemplateCategory[]
  
  // Template operations
  loadTemplates: () => Promise<void>
  applyTemplate: (templateId: string, projectId: string) => void
  createCustomTemplate: (project: Project) => Promise<Template>
  
  // Filtering and search
  filterByCategory: (category: string) => Template[]
  filterByFormat: (format: SocialFormat) => Template[]
  searchTemplates: (query: string) => Template[]
}
```

#### Social Format Store (`social-format-store.ts`)
```typescript
interface SocialFormatStore {
  currentFormat: SocialFormat
  availableFormats: SocialFormat[]
  
  // Multi-canvas management
  canvases: Map<SocialFormat, CanvasConfig>
  activeCanvases: SocialFormat[]
  
  // Format operations
  switchFormat: (format: SocialFormat) => void
  addCanvas: (format: SocialFormat) => void
  removeCanvas: (format: SocialFormat) => void
  syncCanvases: () => void
}
```

### 3. Social Media Formats

```typescript
enum SocialFormat {
  INSTAGRAM_STORY = 'instagram_story',     // 9:16 (1080x1920)
  INSTAGRAM_POST = 'instagram_post',       // 1:1 (1080x1080)
  INSTAGRAM_REEL = 'instagram_reel',       // 9:16 (1080x1920)
  TIKTOK = 'tiktok',                       // 9:16 (1080x1920)
  FACEBOOK_POST = 'facebook_post',         // 16:9 (1920x1080)
  FACEBOOK_STORY = 'facebook_story',       // 9:16 (1080x1920)
  LINKEDIN_POST = 'linkedin_post',         // 16:9 (1920x1080)
  TWITTER_POST = 'twitter_post',           // 16:9 (1600x900)
  YOUTUBE_THUMBNAIL = 'youtube_thumbnail', // 16:9 (1280x720)
}

interface CanvasConfig {
  width: number
  height: number
  aspectRatio: string
  platform: string
  constraints: {
    maxFileSize: number
    supportedFormats: string[]
    maxDuration?: number
  }
}
```

### 4. Template System

```typescript
interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  supportedFormats: SocialFormat[]
  
  // Visual preview
  thumbnailUrl: string
  previewUrls: Record<SocialFormat, string>
  
  // Template structure
  layers: TemplateLayer[]
  defaultStyles: Record<string, any>
  variables: TemplateVariable[]
  
  // Metadata
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  createdAt: Date
  updatedAt: Date
}

interface TemplateLayer {
  id: string
  type: 'background' | 'text' | 'image' | 'shape'
  position: { x: number; y: number }
  size: { width: number; height: number }
  properties: Record<string, any>
  aiGenerated?: boolean
  prompt?: string
}
```

### 5. Multi-Canvas System

#### Canvas Manager Component
```typescript
interface CanvasManager {
  // Multi-canvas state
  activeCanvases: Map<SocialFormat, Canvas>
  syncedElements: Set<string>
  
  // Operations
  addCanvas: (format: SocialFormat) => void
  removeCanvas: (format: SocialFormat) => void
  syncElement: (elementId: string, property: string, value: any) => void
  exportCanvas: (format: SocialFormat) => Promise<ExportResult>
  exportAll: () => Promise<Map<SocialFormat, ExportResult>>
}
```

#### Synchronized Editing
- **Text elements**: Content, style changes sync across all canvases
- **AI backgrounds**: Generate once, auto-resize for all formats
- **Positioning**: Smart positioning system adapts to aspect ratios
- **Layers**: Maintain layer hierarchy across all canvases

### 6. AI Integration Pipeline

#### Runware Integration
```typescript
class RunwareService {
  private ws: WebSocket
  private apiKey: string
  
  async generateBackground(prompt: string, format: SocialFormat): Promise<string> {
    const dimensions = this.getFormatDimensions(format)
    const task = {
      taskType: 'imageInference',
      taskUUID: generateUUID(),
      prompt: prompt,
      width: dimensions.width,
      height: dimensions.height,
      model: 'civitai:4384@130072', // High-quality model
      steps: 25,
      guidanceScale: 7.5
    }
    
    return this.sendTask(task)
  }
  
  async enhancePrompt(prompt: string): Promise<string> {
    const task = {
      taskType: 'promptEnhancer',
      taskUUID: generateUUID(),
      prompt: prompt,
      promptMaxLength: 380,
      promptVersions: 1
    }
    
    return this.sendTask(task)
  }
}
```

### 7. Database Schema Extensions

```sql
-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  supported_formats JSONB NOT NULL,
  layers JSONB NOT NULL,
  default_styles JSONB,
  variables JSONB,
  tags TEXT[],
  difficulty VARCHAR(20) DEFAULT 'beginner',
  thumbnail_url TEXT,
  preview_urls JSONB,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI generation history
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  task_type VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  result_url TEXT,
  format VARCHAR(50),
  cost DECIMAL(10,6),
  generation_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social format presets
CREATE TABLE social_format_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format VARCHAR(50) UNIQUE NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  aspect_ratio VARCHAR(10) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  constraints JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User API keys (encrypted)
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  service VARCHAR(50) NOT NULL, -- 'runware', 'openai'
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 8. Export Pipeline

```typescript
interface ExportService {
  exportProject(projectId: string, formats: SocialFormat[]): Promise<ExportResults>
  
  // Multi-format export
  generatePreviews(project: Project): Promise<Map<SocialFormat, string>>
  optimizeForPlatform(canvas: Canvas, format: SocialFormat): Promise<OptimizedAsset>
  
  // Quality settings per platform
  getExportSettings(format: SocialFormat): ExportSettings
}

interface ExportSettings {
  quality: number
  compression: string
  colorProfile: string
  maxFileSize: number
  format: 'mp4' | 'jpg' | 'png' | 'gif'
}
```

### 9. User Interface Components

#### Multi-Canvas Preview Panel
- **Grid view**: Show all active canvases simultaneously
- **Synchronized editing**: Changes reflect across all canvases in real-time
- **Format-specific previews**: Each canvas shows platform-specific layout

#### AI Generation Panel
- **Background generator**: Text-to-image with format-aware sizing
- **Prompt enhancer**: AI-powered prompt optimization
- **Text generator**: Platform-specific captions and hashtags
- **Generation queue**: Show pending AI tasks with progress

#### Template Gallery
- **Category filtering**: Business, Creative, Minimalist, etc.
- **Format filtering**: Show templates compatible with selected formats
- **Live preview**: Hover to see template applied to current project
- **Custom templates**: Save and share user-created templates

### 10. Performance Optimizations

#### Caching Strategy
- **Template cache**: Redis cache for template metadata
- **Generated assets**: CDN storage for AI-generated images
- **Preview cache**: Pre-generated thumbnails for templates

#### WebSocket Management
- **Connection pooling**: Efficient Runware WebSocket connections
- **Queue management**: Handle multiple simultaneous AI requests
- **Error handling**: Retry logic and fallback mechanisms

## Implementation Phases

### Phase 1: Core Architecture
- Extend OpenCut stores for AI and templates
- Implement multi-canvas system
- Set up Runware API integration

### Phase 2: Template System
- Create template database and management
- Build template gallery UI
- Implement template application logic

### Phase 3: AI Integration
- Complete Runware service implementation
- Add text generation capabilities
- Build AI generation UI panel

### Phase 4: Multi-Canvas Export
- Implement export pipeline for all formats
- Add platform-specific optimizations
- Create batch export functionality

### Phase 5: Polish & Deployment
- Performance optimizations
- User onboarding flow
- Vercel deployment configuration

## Success Metrics

- **Generation Speed**: < 3 seconds for background generation
- **Export Quality**: Platform-optimized outputs
- **User Experience**: Seamless multi-canvas editing
- **Template Library**: 50+ high-quality templates at launch
- **AI Integration**: 95%+ successful generation rate