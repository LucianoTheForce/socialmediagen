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

  private getFormatDimensions(format: string): { width: number; height: number } {
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
      
      const dimensions = options.dimensions || this.getFormatDimensions(options.canvasFormat);
      console.log('📏 Resolved dimensions:', dimensions);
      
      const enhancedPrompt = this.enhancePromptForCarousel(prompt, options.style || 'realistic', options.canvasFormat);
      console.log('🔧 Enhanced prompt:', enhancedPrompt);

      const size = `${dimensions.width}x${dimensions.height}`;
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
        dimensions,
        style: options.style || 'realistic',
        aspectRatio: dimensions.width / dimensions.height,
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
          },
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
      'instagram-post': 'square format, Instagram optimized, mobile-friendly',
      'instagram-story': 'vertical format, story optimized, full screen mobile',
      'tiktok': 'vertical video format, TikTok style, youth-oriented',
      'facebook-post': 'landscape format, Facebook optimized, social engagement',
      'linkedin-post': 'professional, business-oriented, corporate style',
    };

    return formatEnhancements[canvasFormat] || 'social media optimized';
  }

  private selectOptimalModel(style?: string): string {
    const modelMap: Record<string, string> = {
      'realistic': 'civitai:4384@130072', // Realistic Vision
      'artistic': 'civitai:4201@128713', // DreamShaper
      'cinematic': 'civitai:43331@132760', // Cinematic
      'minimalist': 'civitai:4384@130072', // Realistic Vision works well for clean designs
    };

    return modelMap[style || 'realistic'] || 'civitai:4384@130072';
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