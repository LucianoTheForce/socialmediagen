import { pgTable, text, timestamp, boolean, json, integer, real, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}).enableRLS();

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
}).enableRLS();

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}).enableRLS();

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
}).enableRLS();

// Project management tables
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  templateId: text("template_id"),
  tags: json("tags").$type<string[]>().default([]).notNull(),
  carouselMetadata: json("carousel_metadata").$type<{
    slideCount: number;
    backgroundStrategy: 'unique' | 'consistent' | 'gradient';
    targetPlatform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
    aspectRatio: string;
  }>().notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}).enableRLS();

export const projectCanvases = pgTable("project_canvases", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  slideNumber: integer("slide_number").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  backgroundImage: text("background_image"),
  thumbnailUrl: text("thumbnail_url"),
  slideMetadata: json("slide_metadata").$type<{
    slideNumber: number;
    title?: string;
    content?: string;
    backgroundPrompt?: string;
    textStyles?: {
      titleSize?: number;
      contentSize?: number;
      titleWeight?: string;
      contentWeight?: string;
      alignment?: string;
    };
    isLoading?: boolean;
  }>().notNull(),
  format: json("format").$type<{
    dimensions: { width: number; height: number };
    aspectRatio: string;
    platform: string;
  }>().notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}).enableRLS();

// Timeline management tables
export const timelineTracks = pgTable("timeline_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  canvasId: uuid("canvas_id")
    .notNull()
    .references(() => projectCanvases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'media' | 'text' | 'audio'
  order: integer("order").notNull().default(0),
  muted: boolean("muted").default(false).notNull(),
  isMain: boolean("is_main").default(false).notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}).enableRLS();

export const timelineElements = pgTable("timeline_elements", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackId: uuid("track_id")
    .notNull()
    .references(() => timelineTracks.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'media' | 'text'
  name: text("name").notNull(),
  startTime: real("start_time").notNull(),
  duration: real("duration").notNull(),
  trimStart: real("trim_start").default(0).notNull(),
  trimEnd: real("trim_end").default(0).notNull(),
  hidden: boolean("hidden").default(false).notNull(),
  
  // Media element properties
  mediaId: uuid("media_id").references(() => mediaItems.id, { onDelete: "set null" }),
  x: real("x").default(0),
  y: real("y").default(0),
  scaleX: real("scale_x").default(1),
  scaleY: real("scale_y").default(1),
  rotation: real("rotation").default(0),
  opacity: real("opacity").default(1),
  objectFit: text("object_fit").default('cover'),
  alignment: json("alignment").$type<{ horizontal: string; vertical: string }>(),
  flipHorizontal: boolean("flip_horizontal").default(false),
  flipVertical: boolean("flip_vertical").default(false),
  borderRadius: real("border_radius").default(0),
  
  // Text element properties
  content: text("content"),
  fontSize: real("font_size"),
  fontFamily: text("font_family"),
  color: text("color"),
  backgroundColor: text("background_color"),
  textAlign: text("text_align"),
  fontWeight: text("font_weight"),
  fontStyle: text("font_style"),
  textDecoration: text("text_decoration"),
  boxMode: text("box_mode"),
  boxWidth: real("box_width"),
  boxHeight: real("box_height"),
  verticalAlign: text("vertical_align"),
  
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}).enableRLS();

// Media management tables
export const mediaItems = pgTable("media_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'image' | 'video' | 'audio'
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fileSize: integer("file_size"),
  width: integer("width"),
  height: integer("height"),
  duration: real("duration"), // For video/audio files
  fps: real("fps"), // For video files
  
  // AI-generated content metadata
  isAIGenerated: boolean("is_ai_generated").default(false).notNull(),
  generationPrompt: text("generation_prompt"),
  aiMetadata: json("ai_metadata").$type<{
    cost?: number;
    generatedAt?: Date;
    runwareId?: string;
    model?: string;
    parameters?: Record<string, any>;
  }>(),
  
  // Canvas/slide association for AI-generated backgrounds
  canvasId: uuid("canvas_id").references(() => projectCanvases.id, { onDelete: "set null" }),
  slideNumber: integer("slide_number"),
  backgroundStrategy: text("background_strategy"), // 'unique' | 'consistent' | 'gradient'
  
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}).enableRLS();

// AI generation history and queue management
export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" }),
  canvasId: uuid("canvas_id")
    .references(() => projectCanvases.id, { onDelete: "cascade" }),
  
  type: text("type").notNull(), // 'carousel' | 'background' | 'text'
  status: text("status").notNull(), // 'pending' | 'generating' | 'completed' | 'failed'
  prompt: text("prompt").notNull(),
  
  // Generation options and parameters
  options: json("options").$type<{
    canvasCount?: number;
    layoutPreset?: string;
    backgroundStrategy?: string;
    model?: string;
    skipImages?: boolean;
  }>(),
  
  // Results
  resultData: json("result_data").$type<{
    slides?: any[];
    imageUrl?: string;
    textContent?: string;
    error?: string;
  }>(),
  
  // Progress tracking
  progress: integer("progress").default(0).notNull(), // 0-100
  currentStep: text("current_step"), // 'text' | 'images' | 'canvases' | 'complete'
  estimatedTimeRemaining: integer("estimated_time_remaining"),
  
  // Cost tracking
  cost: real("cost").default(0).notNull(),
  
  startTime: timestamp("start_time"),
  completedTime: timestamp("completed_time"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}).enableRLS();

// Project sharing and collaboration (future feature)
export const projectShares = pgTable("project_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedWithUserId: uuid("shared_with_user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  shareToken: text("share_token").unique(), // For public sharing
  permissions: text("permissions").notNull(), // 'view' | 'edit' | 'admin'
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}).enableRLS();

// Export all tables for use in API routes and services
export const allTables = {
  // Better Auth tables
  users,
  sessions,
  accounts,
  verifications,
  
  // Application tables
  projects,
  projectCanvases,
  timelineTracks,
  timelineElements,
  mediaItems,
  aiGenerations,
  projectShares,
};

// Type definitions for better TypeScript support
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectCanvas = typeof projectCanvases.$inferSelect;
export type NewProjectCanvas = typeof projectCanvases.$inferInsert;

export type TimelineTrack = typeof timelineTracks.$inferSelect;
export type NewTimelineTrack = typeof timelineTracks.$inferInsert;

export type TimelineElement = typeof timelineElements.$inferSelect;
export type NewTimelineElement = typeof timelineElements.$inferInsert;

export type MediaItem = typeof mediaItems.$inferSelect;
export type NewMediaItem = typeof mediaItems.$inferInsert;

export type AIGeneration = typeof aiGenerations.$inferSelect;
export type NewAIGeneration = typeof aiGenerations.$inferInsert;

export type ProjectShare = typeof projectShares.$inferSelect;
export type NewProjectShare = typeof projectShares.$inferInsert;

// User type from Better Auth
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
