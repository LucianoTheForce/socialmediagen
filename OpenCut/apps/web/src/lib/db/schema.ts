import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  decimal,
  json,
  bigint,
  index
} from "drizzle-orm/pg-core";

// Users table - synced with Supabase Auth
export const users = pgTable("users", {
  id: text("id").primaryKey(), // UUID from Supabase Auth
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

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  templateId: text("template_id"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tags: json("tags").$type<string[]>().default([]),
  carouselMetadata: json("carousel_metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("project_user_idx").on(table.userId),
})).enableRLS();

// Project canvases table
export const projectCanvases = pgTable("project_canvases", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").default("Untitled Canvas"),
  slideNumber: integer("slide_number").notNull(),
  isActive: boolean("is_active").default(false),
  backgroundImage: text("background_image"),
  thumbnailUrl: text("thumbnail_url"),
  slideMetadata: json("slide_metadata"),
  format: json("format"),
  settings: json("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("canvas_project_idx").on(table.projectId),
})).enableRLS();

// AI generations table
export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'text' | 'image'
  prompt: text("prompt").notNull(),
  result: text("result"),
  status: text("status").default("pending"), // 'pending' | 'processing' | 'completed' | 'failed'
  provider: text("provider"), // 'openai' | 'runware'
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("ai_generation_user_idx").on(table.userId),
  projectIdx: index("ai_generation_project_idx").on(table.projectId),
})).enableRLS();

// Timeline tracks table
export const timelineTracks = pgTable("timeline_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  canvasId: uuid("canvas_id")
    .notNull()
    .references(() => projectCanvases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'main' | 'overlay' | 'audio'
  order: integer("order").default(0),
  muted: boolean("muted").default(false),
  isMain: boolean("is_main").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  canvasIdx: index("track_canvas_idx").on(table.canvasId),
})).enableRLS();

// Timeline elements table
export const timelineElements = pgTable("timeline_elements", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackId: uuid("track_id")
    .notNull()
    .references(() => timelineTracks.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'media' | 'text' | 'shape'
  name: text("name").notNull(),
  startTime: decimal("start_time", { precision: 10, scale: 3 }).notNull(),
  duration: decimal("duration", { precision: 10, scale: 3 }).notNull(),
  trimStart: decimal("trim_start", { precision: 10, scale: 3 }).default("0"),
  trimEnd: decimal("trim_end", { precision: 10, scale: 3 }),
  hidden: boolean("hidden").default(false),
  
  // Media element properties
  mediaId: uuid("media_id"),
  x: decimal("x", { precision: 10, scale: 2 }).default("0"),
  y: decimal("y", { precision: 10, scale: 2 }).default("0"),
  scaleX: decimal("scale_x", { precision: 6, scale: 3 }).default("1"),
  scaleY: decimal("scale_y", { precision: 6, scale: 3 }).default("1"),
  rotation: decimal("rotation", { precision: 6, scale: 2 }).default("0"),
  opacity: decimal("opacity", { precision: 4, scale: 3 }).default("1"),
  objectFit: text("object_fit").default("cover"), // 'cover' | 'contain' | 'fill'
  alignment: text("alignment").default("center"), // 'left' | 'center' | 'right'
  flipHorizontal: boolean("flip_horizontal").default(false),
  flipVertical: boolean("flip_vertical").default(false),
  borderRadius: decimal("border_radius", { precision: 6, scale: 2 }).default("0"),
  
  // Text element properties
  content: text("content"),
  fontSize: integer("font_size"),
  fontFamily: text("font_family"),
  color: text("color"),
  backgroundColor: text("background_color"),
  textAlign: text("text_align"), // 'left' | 'center' | 'right'
  fontWeight: text("font_weight"),
  fontStyle: text("font_style"),
  textDecoration: text("text_decoration"),
  boxMode: text("box_mode"), // 'auto' | 'fixed'
  boxWidth: integer("box_width"),
  boxHeight: integer("box_height"),
  verticalAlign: text("vertical_align"), // 'top' | 'middle' | 'bottom'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  trackIdx: index("element_track_idx").on(table.trackId),
  startTimeIdx: index("element_start_time_idx").on(table.startTime),
})).enableRLS();

// Media items table
export const mediaItems = pgTable("media_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'image' | 'video' | 'audio'
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fileSize: bigint("file_size", { mode: "bigint" }),
  width: integer("width"),
  height: integer("height"),
  duration: decimal("duration", { precision: 10, scale: 3 }),
  fps: integer("fps"),
  isAIGenerated: boolean("is_ai_generated").default(false),
  generationPrompt: text("generation_prompt"),
  aiMetadata: json("ai_metadata"),
  canvasId: uuid("canvas_id").references(() => projectCanvases.id),
  slideNumber: integer("slide_number"),
  backgroundStrategy: text("background_strategy"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("media_project_idx").on(table.projectId),
  canvasIdx: index("media_canvas_idx").on(table.canvasId),
})).enableRLS();
