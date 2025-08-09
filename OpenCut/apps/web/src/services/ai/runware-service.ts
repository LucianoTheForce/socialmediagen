import { AIGenerationService } from './types';
import { AIImageElement, AIImageGenerationOptions } from '@/types/ai-timeline';
import { generateUUID } from '@/lib/utils';
// Lazy import Vercel AI SDK provider at runtime to avoid type resolution issues during linting

interface RunwareTask {
  taskType: string;
  taskUUID: string;
  prompt: string;
  width: number;
  height: number;
  model?: string;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  style?: string;
  negativePrompt?: string;
}

interface RunwareResponse {
  taskUUID: string;
  imageURL?: string;
  imageURLs?: string[];
  status: 'success' | 'failed' | 'processing';
  error?: string;
  cost?: number;
}

export class RunwareService implements AIGenerationService {

  // Canvas dimensions - what the user sees/exports
  private getCanvasDimensions(format: string): { width: number; height: number } {
    const formats: Record<string, { width: number; height: number }> = {
      'instagram-story': { width: 1080, height: 1920 },
      'instagram-post': { width: 1080, height: 1080 },
      'instagram-reel': { width: 1080, height: 1920 },
      'tiktok': { width: 1080, height: 1920 },
      'facebook-post': { width: 1920, height: 1080 },
      'facebook-story': { width: 1080, height: 1920 },
      'linkedin-post': { width: 1920, height: 1080 },
      'twitter-post': { width: 1600, height: 900 },
      'youtube-thumbnail': { width: 1280, height: 720 },
    };

    return formats[format] || { width: 1080, height: 1920 };
  }

  // Generation dimensions - Runware API compatible (multiples of 64, max 2048)
  private getGenerationDimensions(format: string, quality: 'high' | 'medium' | 'fast' = 'high'): { width: number; height: number } {
    const canvas = this.getCanvasDimensions(format);
    const aspectRatio = canvas.width / canvas.height;
    
    // Quality-based max dimensions
    const qualityLimits = {
      'high': 2048,
      'medium': 1536,
      'fast': 1024
    };
    
    const maxDimension = qualityLimits[quality];
    
    // Calculate dimensions maintaining aspect ratio, constrained by Runware limits
    let genWidth: number;
    let genHeight: number;
    
    if (aspectRatio >= 1) { // Landscape or square
      genWidth = Math.min(maxDimension, 2048);
      genHeight = Math.round(genWidth / aspectRatio);
    } else { // Portrait
      genHeight = Math.min(maxDimension, 2048);
      genWidth = Math.round(genHeight * aspectRatio);
    }
    
    // Round to nearest multiple of 64
    genWidth = Math.round(genWidth / 64) * 64;
    genHeight = Math.round(genHeight / 64) * 64;
    
    // Ensure within Runware constraints
    genWidth = Math.max(128, Math.min(genWidth, 2048));
    genHeight = Math.max(128, Math.min(genHeight, 2048));
    
    return { width: genWidth, height: genHeight };
  }

  private enhancePromptForStyle(prompt: string, style: string): string {
    const styleEnhancements: Record<string, string> = {
      'realistic': 'photorealistic, high quality, detailed, professional lighting, 8k resolution',
      'artistic': 'artistic, creative, vibrant colors, expressive, digital art, masterpiece',
      'minimalist': 'minimalist, clean, simple, modern, elegant design, white space',
      'cinematic': 'cinematic lighting, dramatic, movie scene, professional photography, depth of field',
      'abstract': 'abstract art, geometric, modern, creative composition, contemporary',
      'vintage': 'vintage style, retro, nostalgic, aged, classic aesthetic, film grain',
    };

    const enhancement = styleEnhancements[style] || '';
    return enhancement ? `${prompt}, ${enhancement}` : prompt;
  }

  async generateImage(prompt: string, options: AIImageGenerationOptions): Promise<AIImageElement> {
    console.log('🎨 RunwareService.generateImage() called');
    console.log('📝 Input prompt:', prompt);
    console.log('⚙️ Input options:', options);
    
    try {
      console.log('📦 Importing AI SDK dependencies...');
      const { experimental_generateImage: generateImage } = await import('ai' as any);
      const { runware: runwareProvider } = await import('@runware/ai-sdk-provider' as any);
      console.log('✅ AI SDK dependencies imported successfully');
      
      // Get quality from options (default to 'high' for best results)
      const quality = (options as any).quality || 'high';
      console.log(`🎯 Generation quality: ${quality}`);
      
      // Get both canvas and generation dimensions
      const canvasDimensions = options.dimensions || this.getCanvasDimensions(options.canvasFormat);
      const generationDimensions = this.getGenerationDimensions(options.canvasFormat, quality);
      console.log('📏 Canvas dimensions:', canvasDimensions);
      console.log('🔧 Generation dimensions (Runware-compatible):', generationDimensions);
      
      const enhancedPrompt = this.enhancePromptForCarousel(prompt, options.style || 'realistic', options.canvasFormat);
      console.log('🔧 Enhanced prompt:', enhancedPrompt);

      const size = `${generationDimensions.width}x${generationDimensions.height}`;
      const modelId = options.model || this.selectOptimalModel(options.style);
      console.log(`🤖 Using model: ${modelId}, size: ${size}`);

      const generationParams = {
        model: runwareProvider.image(modelId),
        prompt: enhancedPrompt,
        size,
        providerOptions: {
          runware: {
            steps: this.getOptimalSteps(options.style),
            seed: options.seed,
          },
        },
      };
      console.log('🚀 Generation parameters:', generationParams);

      console.log('⏳ Calling AI SDK generateImage...');
      const result = await generateImage(generationParams as any);
      console.log('📸 Raw AI SDK result:', result);

      const imageUrl = (result as any)?.image?.url || (result as any)?.image;
      console.log('🖼️ Extracted imageUrl:', imageUrl);

      if (!imageUrl) {
        console.error('❌ No image URL found in result:', result);
        throw new Error('No image URL found in generation result');
      }

      const finalElement = {
        id: generateUUID(),
        type: 'ai-image' as const,
        name: 'AI Generated Background',
        duration: 5000,
        startTime: 0,
        trimStart: 0,
        trimEnd: 0,
        imageUrl,
        dimensions: canvasDimensions, // Use canvas dimensions for display
        style: options.style || 'realistic',
        aspectRatio: canvasDimensions.width / canvasDimensions.height,
        aiMetadata: {
          provider: 'runware' as const,
          model: modelId,
          prompt,
          enhancedPrompt,
          generatedAt: new Date(),
          generationTime: 0,
          cost: 0.05,
          parameters: {
            steps: this.getOptimalSteps(options.style),
            guidanceScale: this.getOptimalGuidanceScale(options.style),
            seed: options.seed,
            style: options.style,
            quality, // Store the quality setting
          },
          generationDimensions, // Store the actual generation dimensions
          canvasDimensions, // Store the target canvas dimensions
        },
        canvasFormat: options.canvasFormat,
        isRegeneratable: true,
        generationHistory: [],
      };
      
      console.log('✅ Final AIImageElement created:', finalElement);
      return finalElement;
    } catch (error) {
      console.error('❌ RunwareService.generateImage() failed:', error);
      console.error('🔍 Error details:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async generateText(): Promise<never> {
    throw new Error('Text generation not supported by Runware service');
  }

  async enhancePrompt(prompt: string): Promise<string> {
    // Simple pass-through – Vercel AI SDK path does not support WS enhancer
    return prompt;
  }
private enhancePromptForCarousel(prompt: string, style: string, canvasFormat: string): string {
    const baseEnhancement = this.enhancePromptForStyle(prompt, style);
    const formatEnhancement = this.getFormatSpecificEnhancement(canvasFormat);
    const carouselOptimization = 'social media optimized, engaging, professional, clean composition, readable text space';
    
    return `${baseEnhancement}, ${formatEnhancement}, ${carouselOptimization}`;
  }

  private getFormatSpecificEnhancement(canvasFormat: string): string {
    const formatEnhancements: Record<string, string> = {
      'instagram-post': 'square format, Instagram optimized, mobile-friendly, vibrant colors, engaging',
      'instagram-story': 'vertical format, story optimized, full screen mobile, immersive experience',
      'instagram-reel': 'vertical video format, Reels optimized, dynamic, trendy, mobile-first',
      'tiktok': 'vertical video format, TikTok style, youth-oriented, creative, attention-grabbing',
      'facebook-post': 'landscape format, Facebook optimized, social engagement, community-focused',
      'facebook-story': 'vertical format, Facebook Stories, casual, authentic, personal',
      'linkedin-post': 'professional, business-oriented, corporate style, polished, industry-focused',
      'twitter-post': 'landscape format, Twitter optimized, concise visual, news-worthy, trending',
      'youtube-thumbnail': 'landscape format, YouTube optimized, eye-catching, clickable, title-friendly',
    };

    return formatEnhancements[canvasFormat] || 'social media optimized';
  }

  private selectOptimalModel(style?: string): string {
    const modelMap: Record<string, string> = {
      'realistic': 'flux-dev', // Flux Dev for realistic images
      'artistic': 'flux-pro', // Flux Pro for artistic/creative content
      'cinematic': 'flux-pro', // Flux Pro for cinematic quality
      'minimalist': 'flux-dev', // Flux Dev works well for clean designs
      'vintage': 'civitai:4201@128713', // DreamShaper for vintage styles
      'abstract': 'flux-schnell', // Flux Schnell for abstract/quick generations
    };

    return modelMap[style || 'realistic'] || 'flux-dev';
  }

  private getOptimalSteps(style?: string): number {
    const stepsMap: Record<string, number> = {
      'realistic': 30,
      'artistic': 25,
      'minimalist': 20,
      'cinematic': 35,
    };

    return stepsMap[style || 'realistic'] || 25;
  }

  private getOptimalGuidanceScale(style?: string): number {
    const guidanceMap: Record<string, number> = {
      'realistic': 7.5,
      'artistic': 8.0,
      'minimalist': 6.5,
      'cinematic': 8.5,
    };

    return guidanceMap[style || 'realistic'] || 7.5;
  }

  private getDefaultNegativePrompt(): string {
    return 'blurry, low quality, distorted, deformed, watermark, text overlay, signature, amateur, ugly, bad anatomy, low resolution, pixelated';
  }

  disconnect(): void {}
}

// Export singleton instance
export const runwareService = new RunwareService();

// Cleanup on process exit
if (typeof window === 'undefined') {
  process.on('beforeExit', () => {
    runwareService.disconnect();
  });
}