import { AIGenerationService, AIImageGenerationOptions, AITextGenerationOptions } from './types';
import { AIImageElement, AITextElement, CanvasFormat } from '@/types/ai-timeline';
import { generateUUID } from '@/lib/utils';

export interface MidjourneyConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface MidjourneyImageRequest {
  prompt: string;
  aspect_ratio?: string;
  model?: string;
  quality?: 'standard' | 'high';
  stylize?: number;
  chaos?: number;
  seed?: number;
  style?: string;
}

export interface MidjourneyImageResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  image_url?: string;
  thumbnail_url?: string;
  prompt: string;
  created_at: string;
  completed_at?: string;
  error?: string;
  metadata?: {
    model: string;
    aspect_ratio: string;
    stylize: number;
    chaos: number;
    quality: string;
  };
}

export class MidjourneyService implements AIGenerationService {
  private config: MidjourneyConfig;
  private readonly baseUrl: string;

  constructor(config: MidjourneyConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.midjourney.com/v1';
  }

  async generateImage(prompt: string, options: AIImageGenerationOptions): Promise<AIImageElement> {
    const elementId = generateUUID();
    const startTime = Date.now();

    try {
      // Convert canvas format to Midjourney aspect ratio
      const aspectRatio = this.getAspectRatio(options.canvasFormat, options.dimensions);
      const dimensions = options.dimensions || this.getFormatDimensions(options.canvasFormat);
      
      const requestPayload: MidjourneyImageRequest = {
        prompt: options.style ? `${prompt} --style ${options.style}` : prompt,
        aspect_ratio: aspectRatio,
        model: options.model || 'midjourney-v6',
        quality: 'high',
        stylize: options.guidanceScale ? Math.round(options.guidanceScale * 20) : 100,
        chaos: 0,
        seed: options.seed,
      };

      console.log('Sending Midjourney API request:', requestPayload);

      const response = await fetch(`${this.baseUrl}/imagine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Midjourney API error: ${response.status} - ${errorText}`);
      }

      const result: MidjourneyImageResponse = await response.json();

      // Poll for completion if the image is still processing
      const finalResult = await this.pollForCompletion(result.id);

      const generationTime = Date.now() - startTime;
      const generatedAt = new Date();

      const aiElement: AIImageElement = {
        id: elementId,
        type: 'ai-image',
        name: `AI Generated Image - ${elementId.slice(0, 8)}`,
        duration: 5000, // 5 seconds default
        startTime: 0,
        trimStart: 0,
        trimEnd: 0,
        imageUrl: finalResult.image_url || '',
        dimensions,
        style: options.style || 'realistic',
        aspectRatio: dimensions.width / dimensions.height,
        aiMetadata: {
          provider: 'midjourney',
          model: finalResult.metadata?.model || 'midjourney-v6',
          prompt,
          enhancedPrompt: requestPayload.prompt,
          generatedAt,
          generationTime,
          parameters: {
            aspect_ratio: aspectRatio,
            stylize: finalResult.metadata?.stylize || 100,
            chaos: finalResult.metadata?.chaos || 0,
            quality: finalResult.metadata?.quality || 'high',
            seed: options.seed,
          },
          cost: this.calculateCost(finalResult.metadata?.quality || 'high'),
        },
        canvasFormat: options.canvasFormat,
        isRegeneratable: true,
        generationHistory: [],
      };

      console.log('Midjourney generation completed:', {
        id: elementId,
        generationTime,
        cost: aiElement.aiMetadata.cost,
      });

      return aiElement;

    } catch (error) {
      console.error('Midjourney generation failed:', error);
      throw new Error(`Midjourney generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateText(prompt: string, options: AITextGenerationOptions): Promise<AITextElement> {
    throw new Error('Midjourney service does not support text generation. Use OpenAI or Claude for text generation.');
  }

  async enhancePrompt(prompt: string): Promise<string> {
    // Midjourney-specific prompt enhancement
    const enhancedPrompt = `${prompt}, highly detailed, professional photography, cinematic lighting, 8k resolution, masterpiece`;
    
    console.log('Enhanced Midjourney prompt:', enhancedPrompt);
    return enhancedPrompt;
  }

  private async pollForCompletion(taskId: string, maxAttempts: number = 60, interval: number = 5000): Promise<MidjourneyImageResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/status/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const result: MidjourneyImageResponse = await response.json();

        if (result.status === 'completed') {
          return result;
        }

        if (result.status === 'failed') {
          throw new Error(result.error || 'Midjourney generation failed');
        }

        console.log(`Midjourney generation progress: ${result.progress}% (${result.status})`);

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;

      } catch (error) {
        console.error('Error polling Midjourney status:', error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Midjourney generation timeout - exceeded maximum polling attempts');
  }

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

  private getAspectRatio(canvasFormat: string, dimensions?: { width: number; height: number }): string {
    if (dimensions) {
      const ratio = dimensions.width / dimensions.height;
      
      if (ratio === 1) return '1:1';
      if (ratio === 16/9) return '16:9';
      if (ratio === 9/16) return '9:16';
      if (ratio === 4/3) return '4:3';
      if (ratio === 3/4) return '3:4';
      if (ratio === 3/2) return '3:2';
      if (ratio === 2/3) return '2:3';
      
      // Custom ratio
      return `${dimensions.width}:${dimensions.height}`;
    }

    // Default aspect ratios for social media formats
    switch (canvasFormat.toLowerCase()) {
      case 'instagram-post':
      case 'instagram-carousel':
        return '1:1';
      case 'instagram-story':
      case 'instagram-reel':
      case 'tiktok':
        return '9:16';
      case 'facebook-post':
      case 'linkedin-post':
        return '16:9';
      case 'twitter-post':
        return '16:9';
      case 'youtube-thumbnail':
        return '16:9';
      case 'youtube-short':
        return '9:16';
      default:
        return '1:1';
    }
  }

  private calculateCost(quality: string): number {
    // Estimated Midjourney API costs (adjust based on actual pricing)
    const costs = {
      'standard': 0.02,
      'high': 0.04,
    };
    
    return costs[quality as keyof typeof costs] || costs.high;
  }

  disconnect(): void {
    // Clean up any connections if needed
    console.log('Midjourney service disconnected');
  }
}