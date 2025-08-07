import { AIImageElement, AITextElement } from '@/types/ai-timeline';

export interface AIGenerationService {
  generateImage(prompt: string, options: AIImageGenerationOptions): Promise<AIImageElement>;
  generateText(prompt: string, options: AITextGenerationOptions): Promise<AITextElement>;
  enhancePrompt?(prompt: string): Promise<string>;
  disconnect?(): void;
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
  // Extended options for comprehensive text generation
  platform?: SocialPlatform;
  contentType?: ContentType;
  tone?: ToneOfVoice;
  variations?: number;
  businessContext?: BusinessContext;
  targetAudience?: string;
  visualDescription?: string;
}

// Social media platform enum
export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  YOUTUBE = 'youtube'
}

// Content type enum
export enum ContentType {
  PROMOTIONAL = 'promotional',
  EDUCATIONAL = 'educational',
  ENTERTAINING = 'entertaining',
  INSPIRATIONAL = 'inspirational',
  NEWS = 'news',
  BEHIND_SCENES = 'behind_scenes',
  USER_GENERATED = 'user_generated'
}

// Tone of voice enum
export enum ToneOfVoice {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  FRIENDLY = 'friendly',
  AUTHORITATIVE = 'authoritative',
  PLAYFUL = 'playful',
  INSPIRATIONAL = 'inspirational',
  EDUCATIONAL = 'educational'
}

// Business context interface
export interface BusinessContext {
  name?: string;
  industry?: string;
  brandVoice?: string;
  targetAudience?: string;
  brandedHashtag?: string;
}

// Platform-specific configuration
export interface PlatformTextConfig {
  platform: SocialPlatform;
  maxCaptionLength: number;
  maxHashtags: number;
  hashtagStyle: 'inline' | 'separate' | 'both';
  commonPatterns: string[];
  engagementTriggers: string[];
  restrictions: string[];
}

// Text suggestion interface
export interface TextSuggestion {
  id: string;
  text: string;
  platform: SocialPlatform;
  confidence: number;
  hashtags?: string[];
  characterCount: number;
}

export interface AIGenerationResult {
  id: string;
  status: 'success' | 'failed' | 'processing';
  cost?: number;
  generationTime?: number;
  error?: string;
}

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  maxConcurrentRequests?: number;
  timeout?: number;
}

export interface GenerationQueueItem {
  id: string;
  type: 'image' | 'text';
  prompt: string;
  options: AIImageGenerationOptions | AITextGenerationOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: AIImageElement | AITextElement;
  error?: string;
}

export interface AIGenerationMetrics {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalCost: number;
  averageGenerationTime: number;
  providerUsage: Record<string, number>;
}