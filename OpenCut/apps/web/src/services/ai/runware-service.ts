import { AIGenerationService } from './types';
import { AIImageElement, AIImageGenerationOptions } from '@/types/ai-timeline';
import { generateUUID } from '@/lib/utils';

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
  private ws: WebSocket | null = null;
  private apiKey: string;
  private pendingTasks = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor() {
    this.apiKey = process.env.RUNWARE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('RUNWARE_API_KEY not found in environment variables');
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('wss://ws-api.runware.ai/v1');
        
        this.ws.onopen = () => {
          console.log('Runware WebSocket connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('Runware WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Runware WebSocket disconnected');
          this.ws = null;
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const responses: RunwareResponse[] = JSON.parse(data);
      
      responses.forEach(response => {
        const pending = this.pendingTasks.get(response.taskUUID);
        if (!pending) return;

        clearTimeout(pending.timeout);
        this.pendingTasks.delete(response.taskUUID);

        if (response.status === 'success') {
          pending.resolve(response);
        } else {
          pending.reject(new Error(response.error || 'Generation failed'));
        }
      });
    } catch (error) {
      console.error('Failed to parse Runware response:', error);
    }
  }

  private async sendTask(task: RunwareTask): Promise<RunwareResponse> {
    await this.ensureConnection();
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(task.taskUUID);
        reject(new Error('Generation timeout'));
      }, 60000); // 60 second timeout

      this.pendingTasks.set(task.taskUUID, {
        resolve,
        reject,
        timeout,
      });

      this.ws!.send(JSON.stringify([{
        ...task,
        apiKey: this.apiKey,
      }]));
    });
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

  private enhancePromptForStyle(prompt: string, style: string): string {
    const styleEnhancements: Record<string, string> = {
      'realistic': 'photorealistic, high quality, detailed, professional lighting',
      'artistic': 'artistic, creative, vibrant colors, expressive, digital art',
      'minimalist': 'minimalist, clean, simple, modern, elegant design',
      'cinematic': 'cinematic lighting, dramatic, movie scene, professional photography',
      'abstract': 'abstract art, geometric, modern, creative composition',
      'vintage': 'vintage style, retro, nostalgic, aged, classic aesthetic',
    };

    const enhancement = styleEnhancements[style] || '';
    return enhancement ? `${prompt}, ${enhancement}` : prompt;
  }

  async generateImage(prompt: string, options: AIImageGenerationOptions): Promise<AIImageElement> {
    const dimensions = options.dimensions || this.getFormatDimensions(options.canvasFormat);
    const enhancedPrompt = this.enhancePromptForStyle(prompt, options.style || 'realistic');
    
    const task: RunwareTask = {
      taskType: 'imageInference',
      taskUUID: generateUUID(),
      prompt: enhancedPrompt,
      width: dimensions.width,
      height: dimensions.height,
      model: options.model || 'civitai:4384@130072',
      steps: 25,
      guidanceScale: 7.5,
      seed: options.seed,
    };

    try {
      const response = await this.sendTask(task);
      
      if (!response.imageURL && !response.imageURLs?.[0]) {
        throw new Error('No image URL in response');
      }

      const imageUrl = response.imageURL || response.imageURLs![0];
      
      return {
        id: generateUUID(),
        type: 'ai-image',
        name: 'AI Generated Background',
        duration: 5000, // 5 seconds default
        startTime: 0,
        trimStart: 0,
        trimEnd: 0,
        imageUrl,
        dimensions,
        style: options.style || 'realistic',
        aspectRatio: dimensions.width / dimensions.height,
        aiMetadata: {
          provider: 'runware',
          model: options.model || 'civitai:4384@130072',
          prompt,
          enhancedPrompt,
          generatedAt: new Date(),
          generationTime: 0, // Will be set by API route
          parameters: {
            steps: 25,
            guidanceScale: 7.5,
            seed: options.seed,
            style: options.style,
          },
          cost: response.cost || 0.05,
        },
        canvasFormat: options.canvasFormat,
        isRegeneratable: true,
        generationHistory: [],
      };

    } catch (error) {
      console.error('Runware image generation failed:', error);
      throw new Error(`Runware generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateText(): Promise<never> {
    throw new Error('Text generation not supported by Runware service');
  }

  async enhancePrompt(prompt: string): Promise<string> {
    const task: RunwareTask = {
      taskType: 'promptEnhancer',
      taskUUID: generateUUID(),
      prompt,
      width: 1024, // Required for API
      height: 1024, // Required for API
    };

    try {
      const response = await this.sendTask(task);
      return response.imageURL || prompt; // Return enhanced prompt or original
    } catch (error) {
      console.warn('Prompt enhancement failed, using original:', error);
      return prompt;
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Clear pending tasks
    this.pendingTasks.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Service disconnected'));
    });
    this.pendingTasks.clear();
  }
}

// Export singleton instance
export const runwareService = new RunwareService();

// Cleanup on process exit
if (typeof window === 'undefined') {
  process.on('beforeExit', () => {
    runwareService.disconnect();
  });
}