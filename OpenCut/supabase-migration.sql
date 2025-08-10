-- Complete migration for Supabase PostgreSQL with UUID types
-- Adds all server-first architecture tables

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS project_shares CASCADE;
DROP TABLE IF EXISTS ai_generations CASCADE;
DROP TABLE IF EXISTS timeline_elements CASCADE;
DROP TABLE IF EXISTS media_items CASCADE;
DROP TABLE IF EXISTS timeline_tracks CASCADE;
DROP TABLE IF EXISTS project_canvases CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 1. Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT,
  tags JSONB DEFAULT '[]'::jsonb NOT NULL,
  carousel_metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Project canvases table
CREATE TABLE project_canvases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,
  background_image TEXT,
  thumbnail_url TEXT,
  slide_metadata JSONB NOT NULL,
  canvas_format JSONB NOT NULL, -- "format" is reserved, using "canvas_format"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Timeline tracks table
CREATE TABLE timeline_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES project_canvases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  track_order INTEGER DEFAULT 0 NOT NULL, -- "order" is reserved, using "track_order"
  muted BOOLEAN DEFAULT false NOT NULL,
  is_main BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Media items table (create before timeline_elements due to FK)
CREATE TABLE media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  duration REAL,
  fps REAL,
  
  -- AI metadata
  is_ai_generated BOOLEAN DEFAULT false NOT NULL,
  generation_prompt TEXT,
  ai_metadata JSONB,
  canvas_id UUID REFERENCES project_canvases(id) ON DELETE SET NULL,
  slide_number INTEGER,
  background_strategy TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Timeline elements table
CREATE TABLE timeline_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES timeline_tracks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  start_time REAL NOT NULL,
  duration REAL NOT NULL,
  trim_start REAL DEFAULT 0 NOT NULL,
  trim_end REAL DEFAULT 0 NOT NULL,
  hidden BOOLEAN DEFAULT false NOT NULL,
  
  -- Media properties
  media_id UUID REFERENCES media_items(id) ON DELETE SET NULL,
  x REAL DEFAULT 0,
  y REAL DEFAULT 0,
  scale_x REAL DEFAULT 1,
  scale_y REAL DEFAULT 1,
  rotation REAL DEFAULT 0,
  opacity REAL DEFAULT 1,
  object_fit TEXT DEFAULT 'cover',
  alignment JSONB,
  flip_horizontal BOOLEAN DEFAULT false,
  flip_vertical BOOLEAN DEFAULT false,
  border_radius REAL DEFAULT 0,
  
  -- Text properties
  content TEXT,
  font_size REAL,
  font_family TEXT,
  color TEXT,
  background_color TEXT,
  text_align TEXT,
  font_weight TEXT,
  font_style TEXT,
  text_decoration TEXT,
  box_mode TEXT,
  box_width REAL,
  box_height REAL,
  vertical_align TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. AI generations table
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  canvas_id UUID REFERENCES project_canvases(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB,
  result_data JSONB,
  
  progress INTEGER DEFAULT 0 NOT NULL,
  current_step TEXT,
  estimated_time_remaining INTEGER,
  cost REAL DEFAULT 0 NOT NULL,
  
  start_time TIMESTAMP WITH TIME ZONE,
  completed_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Project shares table
CREATE TABLE project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE,
  permissions TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Projects policies
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (user_id = auth.uid());

-- Project canvases policies
DROP POLICY IF EXISTS "Users can manage their project canvases" ON project_canvases;
CREATE POLICY "Users can manage their project canvases" ON project_canvases
  FOR ALL USING (project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  ));

-- Timeline tracks policies
DROP POLICY IF EXISTS "Users can manage their timeline tracks" ON timeline_tracks;
CREATE POLICY "Users can manage their timeline tracks" ON timeline_tracks
  FOR ALL USING (canvas_id IN (
    SELECT pc.id FROM project_canvases pc 
    JOIN projects p ON pc.project_id = p.id 
    WHERE p.user_id = auth.uid()
  ));

-- Timeline elements policies
DROP POLICY IF EXISTS "Users can manage their timeline elements" ON timeline_elements;
CREATE POLICY "Users can manage their timeline elements" ON timeline_elements
  FOR ALL USING (track_id IN (
    SELECT tt.id FROM timeline_tracks tt
    JOIN project_canvases pc ON tt.canvas_id = pc.id
    JOIN projects p ON pc.project_id = p.id 
    WHERE p.user_id = auth.uid()
  ));

-- Media items policies
DROP POLICY IF EXISTS "Users can manage their media items" ON media_items;
CREATE POLICY "Users can manage their media items" ON media_items
  FOR ALL USING (project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  ));

-- AI generations policies
DROP POLICY IF EXISTS "Users can manage their AI generations" ON ai_generations;
CREATE POLICY "Users can manage their AI generations" ON ai_generations
  FOR ALL USING (user_id = auth.uid());

-- Project shares policies
DROP POLICY IF EXISTS "Users can manage their project shares" ON project_shares;
CREATE POLICY "Users can manage their project shares" ON project_shares
  FOR ALL USING (owner_id = auth.uid() OR shared_with_user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_canvases_project_id ON project_canvases(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_tracks_canvas_id ON timeline_tracks(canvas_id);
CREATE INDEX IF NOT EXISTS idx_timeline_elements_track_id ON timeline_elements(track_id);
CREATE INDEX IF NOT EXISTS idx_media_items_project_id ON media_items(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_status ON ai_generations(status);

-- Create storage bucket and policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-files',
  'media-files',
  false,
  104857600, -- 100MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for media files
DROP POLICY IF EXISTS "Users can upload their own media files" ON storage.objects;
CREATE POLICY "Users can upload their own media files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view their own media files" ON storage.objects;
CREATE POLICY "Users can view their own media files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'media-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;
CREATE POLICY "Users can delete their own media files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
CREATE POLICY "Users can update their own media files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'media-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );