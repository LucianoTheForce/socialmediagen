"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ImageIcon,
  Wand2,
  Loader2,
  Download,
  Copy,
  Heart,
  Clock,
  Sparkles,
  Settings2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentProject } from '@/stores/carousel';
import { storageService } from '@/lib/storage/storage-service';
import { useTimelineStore } from '@/stores/timeline-store';
import { useMediaStore, type MediaItem } from '@/stores/media-store';
import { usePlaybackStore } from '@/stores/playback-store';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import dayjs from 'dayjs';

interface RunwareGeneration {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: Date;
  style: string;
  model: string;
  dimensions: { width: number; height: number };
  cost: number;
  projectId: string;
}

const RUNWARE_MODELS = [
  { value: 'runware:100@1', label: 'Flux Dev', description: 'Latest Flux model (recommended)' },
  { value: 'runware:101@1', label: 'Flux Pro', description: 'High-quality Flux model' },
  { value: 'runware:102@1', label: 'Flux Schnell', description: 'Fast Flux model' },
  { value: 'civitai:4384@130072', label: 'Realistic Vision', description: 'Photorealistic images' },
  { value: 'civitai:4201@128713', label: 'DreamShaper', description: 'Artistic and creative' },
  { value: 'civitai:43331@132760', label: 'Cinematic', description: 'Movie-like imagery' }
];

const RUNWARE_STYLES = [
  { value: 'realistic', label: 'Realistic', description: 'Photorealistic, high quality imagery' },
  { value: 'artistic', label: 'Artistic', description: 'Creative, vibrant, expressive style' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple, modern design' },
  { value: 'cinematic', label: 'Cinematic', description: 'Movie-like, dramatic lighting' },
  { value: 'abstract', label: 'Abstract', description: 'Geometric, modern composition' },
  { value: 'vintage', label: 'Vintage', description: 'Retro, nostalgic aesthetic' }
];

const RESOLUTION_QUALITIES = [
  { value: 'high', label: 'High Quality', description: 'Up to 2048px - Best quality, slower', maxDimension: '2048px' },
  { value: 'medium', label: 'Medium Quality', description: 'Up to 1536px - Balanced quality & speed', maxDimension: '1536px' },
  { value: 'fast', label: 'Fast', description: 'Up to 1024px - Quick generation', maxDimension: '1024px' }
] as const;

const CANVAS_FORMATS = [
  { value: 'instagram-post', label: 'Instagram Post', dimensions: '1080x1350' },
  { value: 'instagram-story', label: 'Instagram Story', dimensions: '1080x1920' },
  { value: 'facebook-post', label: 'Facebook Post', dimensions: '1200x630' },
  { value: 'twitter-post', label: 'Twitter Post', dimensions: '1600x900' },
  { value: 'linkedin-post', label: 'LinkedIn Post', dimensions: '1200x627' },
  { value: 'youtube-thumbnail', label: 'YouTube Thumbnail', dimensions: '1280x720' }
];

export function RunwareView() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('runware:100@1');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedFormat, setSelectedFormat] = useState('instagram-story');
  const [selectedQuality, setSelectedQuality] = useState<'high' | 'medium' | 'fast'>('high');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<RunwareGeneration[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentProject = useCurrentProject();
  const timelineStore = useTimelineStore();
  const mediaStore = useMediaStore();
  const playbackStore = usePlaybackStore();

  // Load project-specific generations on mount
  useEffect(() => {
    if (currentProject?.id) {
      loadGenerationsForProject(currentProject.id);
    }
  }, [currentProject?.id]);

  const loadGenerationsForProject = async (projectId: string) => {
    try {
      const data = await storageService.loadRunwareGenerations(projectId);
      const generations = data.generations.map(g => ({
        ...g,
        timestamp: new Date(g.timestamp)
      }));
      setGenerations(generations);
    } catch (error) {
      console.error('Failed to load generations:', error);
    }
  };

  const saveGenerationToProject = async (generation: RunwareGeneration) => {
    if (!currentProject?.id) return;
    
    try {
      // Save to IndexedDB using storage service
      await storageService.saveRunwareGeneration(currentProject.id, {
        id: generation.id,
        prompt: generation.prompt,
        imageUrl: generation.imageUrl,
        timestamp: generation.timestamp,
        style: generation.style,
        model: generation.model,
        dimensions: generation.dimensions,
        cost: generation.cost
      });
      
      // Update local state
      const updated = [generation, ...generations].slice(0, 50); // Keep more generations since IndexedDB can handle it
      setGenerations(updated);
      
      // Clean up old generations periodically (keep last 50)
      if (generations.length > 45) {
        await storageService.clearOldRunwareGenerations(currentProject.id, 50);
      }
      
      console.log('✅ Generation saved to IndexedDB successfully');
    } catch (error) {
      console.error('❌ Failed to save generation:', error);
      // Still update local state even if save fails
      const updated = [generation, ...generations].slice(0, 20);
      setGenerations(updated);
    }
  };

  const handleGenerate = async () => {
    console.log('🔍 Generate button clicked');
    console.log('🔍 Prompt:', prompt.trim());
    console.log('🔍 Current project:', currentProject);
    console.log('🔍 Selected model:', selectedModel);
    console.log('🔍 Selected style:', selectedStyle);
    console.log('🔍 Selected format:', selectedFormat);
    
    if (!prompt.trim()) {
      console.log('❌ No prompt provided');
      return;
    }
    
    if (!currentProject?.id) {
      console.log('❌ No current project ID');
      return;
    }

    console.log('✅ Starting generation...');
    setIsGenerating(true);
    try {
      console.log('🔍 Making API request to /api/ai/runware/image');
      const response = await fetch('/api/ai/runware/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          style: selectedStyle,
          canvasFormat: selectedFormat,
          quality: selectedQuality,
        })
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Response error:', errorText);
        throw new Error(`Generation failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('🔍 API result:', result);
      
      if (result.success && result.imageUrl) {
        const timestamp = new Date();
        const generation: RunwareGeneration = {
          id: result.data?.id || `gen-${timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
          prompt: prompt.trim(),
          imageUrl: result.imageUrl,
          timestamp,
          style: selectedStyle,
          model: result.data?.model || 'runware-default',
          dimensions: result.data?.dimensions || { width: 1080, height: 1920 },
          cost: result.data?.cost || 0.05,
          projectId: currentProject.id
        };

        await saveGenerationToProject(generation);
        
        // Clear prompt for next generation
        setPrompt('');
        console.log('✅ Generation completed successfully');
      } else {
        console.log('❌ Generation result invalid:', result);
      }
    } catch (error) {
      console.error('❌ Generation failed:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
      console.log('🔍 Generation process finished');
    }
  };

  const handleCopyImageUrl = (imageUrl: string) => {
    navigator.clipboard.writeText(imageUrl);
    // TODO: Show success toast
  };

  const handleUseInProject = async (generation: RunwareGeneration) => {
    if (!currentProject?.id) {
      console.error('No current project available');
      toast.error('No project selected');
      return;
    }

    try {
      console.log('🔍 Adding generation to project:', generation);
      
      // Fetch the image and convert to File object
      const response = await fetch(generation.imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const file = new File([blob], `runware-${generation.id}.jpg`, { type: 'image/jpeg' });
      
      // Add to media store first and get the created item directly
      const mediaItem = await mediaStore.addMediaItem(currentProject.id, {
        name: `Runware: ${generation.prompt.slice(0, 50)}...`,
        type: 'image',
        file,
        url: URL.createObjectURL(file),
        width: generation.dimensions.width,
        height: generation.dimensions.height,
        isAIGenerated: true,
      });

      console.log('✅ Media item created:', mediaItem);

      // Get current timeline and playhead position
      const currentTime = playbackStore.currentTime;
      
      // Add to timeline at current playhead position
      timelineStore.addMediaAtTime(mediaItem, currentTime);
      
      console.log('✅ Image added to timeline at', currentTime);
      toast.success('Image added to timeline');
      
    } catch (error) {
      console.error('❌ Failed to add image to project:', error);
      toast.error('Failed to add image to timeline');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Runware AI Generator</h2>
          <Badge variant="secondary" className="text-xs">
            {generations.length} generated
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate professional images with AI for your social media projects
        </p>
      </div>

      {/* Prompt Section */}
      <div className="p-4 border-b">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Prompt</label>
            <Textarea
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">AI Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                {RUNWARE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex flex-col">
                      <span>{model.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Style</label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {RUNWARE_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex flex-col">
                        <span>{style.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {style.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Quality</label>
              <Select value={selectedQuality} onValueChange={(value) => setSelectedQuality(value as 'high' | 'medium' | 'fast')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_QUALITIES.map((quality) => (
                    <SelectItem key={quality.value} value={quality.value}>
                      <div className="flex flex-col">
                        <span>{quality.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {quality.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Format</label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {CANVAS_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    <div className="flex flex-col">
                      <span>{format.label}</span>
                      <span className="text-xs text-muted-foreground">
                        Canvas: {format.dimensions} • Generated at {RESOLUTION_QUALITIES.find(q => q.value === selectedQuality)?.maxDimension}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Advanced Options
            </Button>

            <Button 
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Fast Gallery */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Generation History</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Project: {generations.length} generations
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-400px)]">
            {generations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  No generations yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Start by writing a prompt above
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {generations.map((generation, index) => (
                  <GenerationCard
                    key={`${generation.id}-${generation.timestamp.getTime()}-${index}`}
                    generation={generation}
                    onCopy={() => handleCopyImageUrl(generation.imageUrl)}
                    onUse={() => handleUseInProject(generation)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

interface GenerationCardProps {
  generation: RunwareGeneration;
  onCopy: () => void;
  onUse: () => void;
}

function GenerationCard({ generation, onCopy, onUse }: GenerationCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={generation.imageUrl}
          alt={generation.prompt}
          className="w-full h-32 object-cover"
        />
        
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={onCopy}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy URL</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={onUse}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Use in Project</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="p-2">
        <p className="text-xs text-foreground/80 line-clamp-2 mb-1">
          {generation.prompt}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {generation.style}
          </Badge>
          
          <span>{dayjs(generation.timestamp).format('HH:mm')}</span>
        </div>
      </div>
    </Card>
  );
}