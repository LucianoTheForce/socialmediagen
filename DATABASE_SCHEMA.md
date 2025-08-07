# Comprehensive Database Schema for Multi-Canvas Social Media Generator

## Overview
Extended database schema built on OpenCut's existing Drizzle ORM + PostgreSQL foundation, designed for AI-powered multi-canvas social media content generation with templates, projects, and team collaboration.

## Current OpenCut Foundation

### Existing Tables (from OpenCut)
```sql
-- Authentication tables (Better Auth)
users (id, name, email, email_verified, image, created_at, updated_at)
sessions (id, expires_at, token, user_id, ip_address, user_agent, created_at, updated_at)
accounts (id, account_id, provider_id, user_id, access_token, refresh_token, ...)
verifications (id, identifier, value, expires_at, created_at, updated_at)
```

## Extended Schema Architecture

### 1. Social Media Format System

#### Social Media Formats
```typescript
export const socialFormats = pgTable("social_formats", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // "Instagram Story", "TikTok Video", "Facebook Post"
  slug: text("slug").notNull().unique(), // "instagram-story", "tiktok-video"
  platform: text("platform").$type<SocialPlatform>().notNull(),
  
  // Dimensions and specs
  width: integer("width").notNull(), // 1080
  height: integer("height").notNull(), // 1920
  aspectRatio: text("aspect_ratio").notNull(), // "9:16"
  maxDuration: integer("max_duration"), // seconds, null for static
  
  // Format specifications
  recommendedFormats: json("recommended_formats").$type<string[]>().default([]), // ["mp4", "mov"]
  maxFileSize: bigint("max_file_size", { mode: "bigint" }), // bytes
  supportedFeatures: json("supported_features").$type<FormatFeatures>().notNull(),
  
  // Visual guidelines
  safeZones: json("safe_zones").$type<SafeZone[]>().default([]),
  brandingGuidelines: json("branding_guidelines").$type<BrandingGuidelines>(),
  
  // Status and metadata
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

type SocialPlatform = 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'twitter' | 'youtube' | 'pinterest';

interface FormatFeatures {
  supportsVideo: boolean;
  supportsAudio: boolean;
  supportsText: boolean;
  supportsStickers: boolean;
  supportsFilters: boolean;
  maxLayers: number;
  supportsTransitions: boolean;
}

interface SafeZone {
  name: string; // "title_safe", "action_safe"
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BrandingGuidelines {
  logoPlacement: { x: number; y: number; maxWidth: number; maxHeight: number }[];
  textAreas: { x: number; y: number; width: number; height: number }[];
  colorPalette: string[];
  fontRecommendations: string[];
}
```

### 2. Template System

#### Template Categories
```typescript
export const templateCategories = pgTable("template_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // icon name or URL
  
  // Hierarchy
  parentId: uuid("parent_id").references(() => templateCategories.id),
  
  // Status
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### Templates
```typescript
export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Categorization
  categoryId: uuid("category_id")
    .notNull()
    .references(() => templateCategories.id),
  tags: json("tags").$type<string[]>().default([]),
  
  // Format compatibility
  socialFormatId: uuid("social_format_id")
    .notNull()
    .references(() => socialFormats.id),
  
  // Template data
  thumbnailUrl: text("thumbnail_url").notNull(),
  previewUrl: text("preview_url"), // video preview for animated templates
  templateData: json("template_data").$type<TemplateData>().notNull(),
  
  // AI configuration
  aiPrompts: json("ai_prompts").$type<AIPromptConfig>(),
  placeholders: json("placeholders").$type<TemplatePlaceholder[]>().default([]),
  
  // Usage and ratings
  usageCount: integer("usage_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  
  // Ownership and visibility
  createdBy: text("created_by").references(() => users.id),
  teamId: uuid("team_id").references(() => teams.id),
  visibility: text("visibility").$type<TemplateVisibility>().default("public"),
  
  // Status
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  formatCategoryIdx: index("template_format_category_idx").on(table.socialFormatId, table.categoryId),
  createdByIdx: index("template_created_by_idx").on(table.createdBy),
  teamIdx: index("template_team_idx").on(table.teamId),
})).enableRLS();

type TemplateVisibility = 'public' | 'private' | 'team' | 'premium';

interface TemplateData {
  // Canvas configuration
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
  };
  
  // Layer definitions (similar to OpenCut timeline elements)
  layers: TemplateLayer[];
  
  // Animation and transition settings
  animations: TemplateAnimation[];
  transitions: TemplateTransition[];
  
  // Audio settings
  audio?: {
    backgroundMusic?: string;
    soundEffects?: TemplateSoundEffect[];
  };
}

interface TemplateLayer {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'ai-generated';
  name: string;
  
  // Position and size
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  
  // Layer-specific properties
  properties: Record<string, any>;
  
  // Timeline properties
  startTime: number;
  duration: number;
  
  // AI integration
  aiGenerated: boolean;
  aiPrompt?: string;
  aiProvider?: 'runware' | 'openai' | 'anthropic';
}

interface AIPromptConfig {
  textGeneration?: {
    defaultPrompts: string[];
    contextVariables: string[];
    toneOptions: string[];
  };
  imageGeneration?: {
    backgroundPrompts: string[];
    stylePresets: string[];
    excludeTerms: string[];
  };
}

interface TemplatePlaceholder {
  id: string;
  type: 'text' | 'image' | 'video';
  label: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  constraints?: {
    maxLength?: number;
    minLength?: number;
    allowedFormats?: string[];
    maxFileSize?: number;
  };
}
```

### 3. Project System (Extending OpenCut)

#### Projects
```typescript
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Template and format
  templateId: uuid("template_id").references(() => templates.id),
  socialFormatId: uuid("social_format_id")
    .notNull()
    .references(() => socialFormats.id),
  
  // Multi-canvas support
  canvases: json("canvases").$type<ProjectCanvas[]>().notNull(),
  activeCanvasId: text("active_canvas_id"),
  
  // Project data (extends OpenCut's project structure)
  projectData: json("project_data").$type<ProjectData>().notNull(),
  
  // Collaboration
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").references(() => teams.id),
  
  // Status and metadata
  status: text("status").$type<ProjectStatus>().default("draft"),
  lastEditedBy: text("last_edited_by").references(() => users.id),
  lastEditedAt: timestamp("last_edited_at").defaultNow(),
  
  // Export and sharing
  exports: json("exports").$type<ProjectExport[]>().default([]),
  shareSettings: json("share_settings").$type<ShareSettings>(),
  
  // AI usage tracking
  aiGenerationsUsed: integer("ai_generations_used").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("project_owner_idx").on(table.ownerId),
  teamIdx: index("project_team_idx").on(table.teamId),
  templateIdx: index("project_template_idx").on(table.templateId),
  formatIdx: index("project_format_idx").on(table.socialFormatId),
})).enableRLS();

type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'approved' | 'published' | 'archived';

interface ProjectCanvas {
  id: string;
  name: string;
  socialFormatId: string;
  socialFormat: {
    width: number;
    height: number;
    platform: string;
    aspectRatio: string;
  };
  isActive: boolean;
  syncEnabled: boolean; // whether changes sync to other canvases
}

interface ProjectData {
  // Canvas configurations
  canvasConfig: Record<string, CanvasConfig>;
  
  // Shared timeline data (extends OpenCut structure)
  timeline: {
    duration: number;
    tracks: TimelineTrack[];
    elements: TimelineElement[];
  };
  
  // AI generations cache
  aiGenerations: {
    texts: AITextGeneration[];
    images: AIImageGeneration[];
  };
  
  // User customizations
  customizations: {
    colors: string[];
    fonts: string[];
    brandAssets: string[];
  };
}

interface CanvasConfig {
  backgroundColor: string;
  backgroundImage?: string;
  safeZoneVisible: boolean;
  gridVisible: boolean;
  snapToGrid: boolean;
  gridSize: number;
}
```

#### Project Collaborators
```typescript
export const projectCollaborators = pgTable("project_collaborators", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  role: text("role").$type<CollaboratorRole>().notNull(),
  permissions: json("permissions").$type<CollaboratorPermissions>().notNull(),
  
  // Status
  status: text("status").$type<CollaboratorStatus>().default("active"),
  invitedBy: text("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectUserIdx: uniqueIndex("project_user_idx").on(table.projectId, table.userId),
})).enableRLS();

type CollaboratorRole = 'viewer' | 'editor' | 'admin';
type CollaboratorStatus = 'pending' | 'active' | 'removed';

interface CollaboratorPermissions {
  canEdit: boolean;
  canComment: boolean;
  canExport: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
}
```

### 4. AI Generation System

#### AI Text Generations
```typescript
export const aiTextGenerations = pgTable("ai_text_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Generation request
  prompt: text("prompt").notNull(),
  context: json("context").$type<TextGenerationContext>(),
  provider: text("provider").$type<AIProvider>().notNull(),
  model: text("model").notNull(),
  
  // Generation result
  generatedText: text("generated_text").notNull(),
  alternatives: json("alternatives").$type<string[]>().default([]),
  
  // Usage tracking
  tokensUsed: integer("tokens_used"),
  cost: decimal("cost", { precision: 10, scale: 6 }),
  responseTime: integer("response_time"), // milliseconds
  
  // Application
  appliedToElement: text("applied_to_element"), // timeline element ID
  isUsed: boolean("is_used").default(false),
  
  // Quality and feedback
  userRating: integer("user_rating"), // 1-5 stars
  userFeedback: text("user_feedback"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("ai_text_project_idx").on(table.projectId),
  userIdx: index("ai_text_user_idx").on(table.userId),
  providerIdx: index("ai_text_provider_idx").on(table.provider),
})).enableRLS();

type AIProvider = 'openai' | 'anthropic' | 'runware';

interface TextGenerationContext {
  platform: string;
  contentType: 'caption' | 'headline' | 'cta' | 'hashtags' | 'description';
  tone: string;
  targetAudience: string;
  brandVoice?: string;
  keywords?: string[];
  maxLength?: number;
}
```

#### AI Image Generations
```typescript
export const aiImageGenerations = pgTable("ai_image_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Generation request
  prompt: text("prompt").notNull(),
  negativePrompt: text("negative_prompt"),
  style: text("style"), // "photorealistic", "cartoon", "watercolor", etc.
  provider: text("provider").$type<AIImageProvider>().notNull(),
  
  // Generation parameters
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  seed: bigint("seed", { mode: "bigint" }),
  steps: integer("steps"),
  guidance: decimal("guidance", { precision: 4, scale: 2 }),
  
  // Generation result
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  alternatives: json("alternatives").$type<string[]>().default([]),
  
  // Usage tracking
  generationTime: integer("generation_time"), // milliseconds
  cost: decimal("cost", { precision: 10, scale: 6 }),
  
  // Application
  appliedToElement: text("applied_to_element"), // timeline element ID
  isUsed: boolean("is_used").default(false),
  
  // Quality and feedback
  userRating: integer("user_rating"), // 1-5 stars
  userFeedback: text("user_feedback"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("ai_image_project_idx").on(table.projectId),
  userIdx: index("ai_image_user_idx").on(table.userId),
  providerIdx: index("ai_image_provider_idx").on(table.provider),
})).enableRLS();

type AIImageProvider = 'runware' | 'openai' | 'midjourney' | 'stable-diffusion';
```

### 5. Media and Asset Management

#### User Media Library
```typescript
export const userMedia = pgTable("user_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").references(() => teams.id),
  
  // File information
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: bigint("file_size", { mode: "bigint" }).notNull(),
  
  // Storage
  storageProvider: text("storage_provider").$type<StorageProvider>().notNull(),
  storageKey: text("storage_key").notNull(),
  publicUrl: text("public_url").notNull(),
  
  // Media metadata
  mediaType: text("media_type").$type<MediaType>().notNull(),
  dimensions: json("dimensions").$type<{ width: number; height: number }>(),
  duration: decimal("duration", { precision: 10, scale: 3 }), // seconds
  thumbnailUrl: text("thumbnail_url"),
  
  // Organization
  tags: json("tags").$type<string[]>().default([]),
  description: text("description"),
  folderId: uuid("folder_id").references(() => mediaFolders.id),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  // AI analysis (for better search and recommendations)
  aiAnalysis: json("ai_analysis").$type<MediaAIAnalysis>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_media_user_idx").on(table.userId),
  teamIdx: index("user_media_team_idx").on(table.teamId),
  typeIdx: index("user_media_type_idx").on(table.mediaType),
  folderIdx: index("user_media_folder_idx").on(table.folderId),
})).enableRLS();

type StorageProvider = 's3' | 'cloudinary' | 'uploadthing' | 'local';
type MediaType = 'image' | 'video' | 'audio' | 'document';

interface MediaAIAnalysis {
  colors: string[]; // dominant colors
  objects: string[]; // detected objects
  text?: string; // OCR text
  mood?: string; // happy, professional, energetic
  style?: string; // modern, vintage, minimalist
  suitableFor?: string[]; // platforms this media works well for
}
```

#### Media Folders
```typescript
export const mediaFolders = pgTable("media_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").references(() => teams.id),
  
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  
  // Hierarchy
  parentId: uuid("parent_id").references(() => mediaFolders.id),
  
  // Status
  isShared: boolean("is_shared").default(false),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("media_folder_user_idx").on(table.userId),
  teamIdx: index("media_folder_team_idx").on(table.teamId),
  parentIdx: index("media_folder_parent_idx").on(table.parentId),
})).enableRLS();
```

### 6. Timeline and Element System (Extending OpenCut)

#### Timeline Elements (Enhanced)
```typescript
export const timelineElements = pgTable("timeline_elements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  canvasId: text("canvas_id").notNull(), // which canvas this element belongs to
  
  // Element properties (extending OpenCut structure)
  type: text("type").$type<ElementType>().notNull(),
  name: text("name").notNull(),
  
  // Timeline position
  trackIndex: integer("track_index").notNull(),
  startTime: decimal("start_time", { precision: 10, scale: 3 }).notNull(),
  duration: decimal("duration", { precision: 10, scale: 3 }).notNull(),
  
  // Visual properties
  x: decimal("x", { precision: 10, scale: 2 }).default("0"),
  y: decimal("y", { precision: 10, scale: 2 }).default("0"),
  width: decimal("width", { precision: 10, scale: 2 }),
  height: decimal("height", { precision: 10, scale: 2 }),
  rotation: decimal("rotation", { precision: 6, scale: 2 }).default("0"),
  opacity: decimal("opacity", { precision: 4, scale: 3 }).default("1"),
  
  // Element-specific data
  properties: json("properties").$type<ElementProperties>().notNull(),
  
  // AI integration
  aiGenerated: boolean("ai_generated").default(false),
  aiGenerationId: uuid("ai_generation_id"), // references ai_text_generations or ai_image_generations
  aiProvider: text("ai_provider").$type<AIProvider>(),
  
  // Synchronization (for multi-canvas)
  isSynced: boolean("is_synced").default(false),
  syncGroup: text("sync_group"), // elements with same sync_group stay in sync
  
  // Layer management
  zIndex: integer("z_index").default(1),
  isLocked: boolean("is_locked").default(false),
  isHidden: boolean("is_hidden").default(false),
  
  // Collaboration
  createdBy: text("created_by").references(() => users.id),
  lastEditedBy: text("last_edited_by").references(() => users.id),
  lastEditedAt: timestamp("last_edited_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("timeline_element_project_idx").on(table.projectId),
  canvasIdx: index("timeline_element_canvas_idx").on(table.canvasId),
  trackTimeIdx: index("timeline_element_track_time_idx").on(table.trackIndex, table.startTime),
  syncGroupIdx: index("timeline_element_sync_idx").on(table.syncGroup),
})).enableRLS();

type ElementType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'shape' 
  | 'ai-text' 
  | 'ai-image' 
  | 'background'
  | 'sticker'
  | 'transition';

interface ElementProperties {
  // Text properties
  text?: {
    content: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    letterSpacing: number;
    textShadow?: string;
    strokeColor?: string;
    strokeWidth?: number;
  };
  
  // Media properties
  media?: {
    src: string;
    volume?: number;
    playbackRate?: number;
    startOffset?: number;
    cropData?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    filters?: MediaFilter[];
  };
  
  // Shape properties
  shape?: {
    shapeType: 'rectangle' | 'circle' | 'triangle' | 'line';
    fill: string;
    stroke?: string;
    strokeWidth?: number;
    borderRadius?: number;
  };
  
  // Animation properties
  animations?: ElementAnimation[];
  
  // Interactive properties (for future features)
  interactive?: {
    clickable: boolean;
    hoverEffects: boolean;
    link?: string;
  };
}

interface MediaFilter {
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sepia' | 'grayscale';
  value: number;
}

interface ElementAnimation {
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'scale' | 'rotate' | 'bounce';
  startTime: number;
  duration: number;
  easing: string;
  properties: Record<string, any>;
}
```

### 7. Export and Publishing System

#### Project Exports
```typescript
export const projectExports = pgTable("project_exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Export configuration
  canvasId: text("canvas_id").notNull(),
  socialFormatId: uuid("social_format_id")
    .notNull()
    .references(() => socialFormats.id),
  
  // Export settings
  exportSettings: json("export_settings").$type<ExportSettings>().notNull(),
  
  // Export result
  status: text("status").$type<ExportStatus>().default("pending"),
  outputUrl: text("output_url"),
  thumbnailUrl: text("thumbnail_url"),
  fileSize: bigint("file_size", { mode: "bigint" }),
  duration: decimal("duration", { precision: 10, scale: 3 }),
  
  // Processing details
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  processingTime: integer("processing_time"), // milliseconds
  errorMessage: text("error_message"),
  
  // Usage tracking
  downloadCount: integer("download_count").default(0),
  lastDownloadedAt: timestamp("last_downloaded_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("export_project_idx").on(table.projectId),
  userIdx: index("export_user_idx").on(table.userId),
  statusIdx: index("export_status_idx").on(table.status),
})).enableRLS();

type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface ExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'gif' | 'png' | 'jpg';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps?: number;
  bitrate?: number;
  resolution: {
    width: number;
    height: number;
  };
  watermark?: {
    enabled: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity: number;
  };
  metadata?: {
    title: string;
    description: string;
    tags: string[];
  };
}
```

### 8. Analytics and Usage Tracking

#### Project Analytics
```typescript
export const projectAnalytics = pgTable("project_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Event details
  eventType: text("event_type").$type<AnalyticsEventType>().notNull(),
  eventData: json("event_data"),
  
  // Context
  canvasId: text("canvas_id"),
  elementId: text("element_id"),
  sessionId: text("session_id"),
  
  // Metadata
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("analytics_project_idx").on(table.projectId),
  userIdx: index("analytics_user_idx").on(table.userId),
  eventIdx: index("analytics_event_idx").on(table.eventType),
  dateIdx: index("analytics_date_idx").on(table.createdAt),
}));

type AnalyticsEventType = 
  | 'project_created' | 'project_opened' | 'project_saved'
  | 'template_applied' | 'element_added' | 'element_edited'
  | 'ai_text_generated' | 'ai_image_generated'
  | 'export_started' | 'export_completed'
  | 'collaboration_invited' | 'collaboration_joined';
```

### 9. System Configuration

#### Feature Flags
```typescript
export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  
  // Flag configuration
  isEnabled: boolean("is_enabled").default(false),
  rolloutPercentage: integer("rollout_percentage").default(0), // 0-100
  
  // Targeting
  targetUsers: json("target_users").$type<string[]>().default([]),
  targetTeams: json("target_teams").$type<string[]>().default([]),
  conditions: json("conditions").$type<FeatureFlagConditions>(),
  
  // Metadata
  createdBy: text("created_by").references(() => users.id),
  environment: text("environment").default("production"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

interface FeatureFlagConditions {
  subscriptionTiers?: string[];
  userProperties?: Record<string, any>;
  dateRange?: {
    start: string;
    end: string;
  };
}
```

## Database Migration Strategy

### Phase 1: Core Extensions
```sql
-- Add core social media and project tables
-- socialFormats, templates, templateCategories, projects, projectCollaborators
```

### Phase 2: AI Integration
```sql
-- Add AI generation tables
-- aiTextGenerations, aiImageGenerations
-- Extend timeline_elements with AI support
```

### Phase 3: Media and Assets
```sql
-- Add media management
-- userMedia, mediaFolders
-- Enhanced timeline elements
```

### Phase 4: Analytics and Features
```sql
-- Add analytics and configuration
-- projectAnalytics, featureFlags, projectExports
```

## Relationships and Constraints

### Key Foreign Key Relationships
```typescript
// User relationships
users -> userProfiles (1:1)
users -> userApiKeys (1:many)
users -> userSubscriptions (1:1)
users -> projects (1:many as owner)
users -> userMedia (1:many)

// Team relationships
teams -> teamMembers (1:many)
teams -> projects (1:many)
teams -> templates (1:many)

// Project relationships
projects -> projectCollaborators (1:many)
projects -> timelineElements (1:many)
projects -> aiTextGenerations (1:many)
projects -> aiImageGenerations (1:many)
projects -> projectExports (1:many)

// Template relationships
templates -> templateCategories (many:1)
templates -> socialFormats (many:1)
projects -> templates (many:1)

// Timeline relationships
timelineElements -> projects (many:1)
timelineElements -> aiTextGenerations (1:1, optional)
timelineElements -> aiImageGenerations (1:1, optional)
```

### Indexes for Performance
```sql
-- User and project access patterns
CREATE INDEX idx_projects_owner_created ON projects(owner_id, created_at DESC);
CREATE INDEX idx_timeline_elements_project_track ON timeline_elements(project_id, track_index, start_time);
CREATE INDEX idx_ai_generations_user_date ON ai_text_generations(user_id, created_at DESC);

-- Template discovery
CREATE INDEX idx_templates_category_active ON templates(category_id, is_active, is_featured);
CREATE INDEX idx_templates_format_rating ON templates(social_format_id, rating DESC);

-- Analytics queries
CREATE INDEX idx_project_analytics_user_event_date ON project_analytics(user_id, event_type, created_at);
CREATE INDEX idx_usage_logs_user_date ON usage_logs(user_id, created_at DESC);
```

## Security Considerations

### Row Level Security (RLS) Policies
```sql
-- Users can only access their own projects
CREATE POLICY "users_own_projects" ON projects
  FOR ALL USING (owner_id = auth.uid());

-- Team members can access team projects
CREATE POLICY "team_project_access" ON projects
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Collaborators can access shared projects
CREATE POLICY "collaborator_project_access" ON projects
  FOR ALL USING (
    id IN (
      SELECT project_id FROM project_collaborators 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

### Data Encryption
- API keys encrypted with AES-256-GCM
- Sensitive project data encrypted at rest
- All media URLs signed with time-limited tokens

### Audit Trail
- All project modifications logged in `project_analytics`
- User actions tracked in `usage_logs`
- Security events in `security_logs`

## Performance Optimization

### Caching Strategy
- Redis caching for frequently accessed templates
- Session data cached with user preferences
- AI generation results cached for reuse
- Media thumbnails cached with CDN

### Database Optimization
- Partitioning for analytics tables by date
- Read replicas for analytics queries
- Connection pooling with PgBouncer
- Optimized queries with proper indexing

## Success Metrics

### Database Performance
- Query response time < 50ms for 95% of requests
- No blocking locks on high-traffic tables
- Connection pool utilization < 80%

### Data Integrity
- Zero data loss incidents
- 99.9% uptime for database operations
- Successful backup restoration tested monthly

### Scalability
- Support for 100K+ concurrent users
- 1M+ projects stored efficiently
- Petabyte-scale media storage capability