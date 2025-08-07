import OpenAI from 'openai';
import { AIGenerationService, AITextGenerationOptions, SocialPlatform, ToneOfVoice, ContentType, PlatformTextConfig, TextSuggestion } from './types';
import { AITextElement, AIGenerationMetadata } from '@/types/ai-timeline';
import { generateUUID } from '@/lib/utils';

// Platform-specific configurations
const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformTextConfig> = {
  [SocialPlatform.INSTAGRAM]: {
    platform: SocialPlatform.INSTAGRAM,
    maxCaptionLength: 2200,
    maxHashtags: 30,
    hashtagStyle: 'separate',
    commonPatterns: ['✨', '💫', '🌟'],
    engagementTriggers: ['Double tap if', 'Tag someone who', 'Share in your stories'],
    restrictions: ['No excessive caps', 'Avoid spam words']
  },
  [SocialPlatform.TIKTOK]: {
    platform: SocialPlatform.TIKTOK,
    maxCaptionLength: 300,
    maxHashtags: 5,
    hashtagStyle: 'inline',
    commonPatterns: ['POV:', 'When you', 'How to'],
    engagementTriggers: ['Duet this', 'Try this', 'What do you think?'],
    restrictions: ['Keep it short', 'Use trending sounds reference']
  },
  [SocialPlatform.LINKEDIN]: {
    platform: SocialPlatform.LINKEDIN,
    maxCaptionLength: 3000,
    maxHashtags: 5,
    hashtagStyle: 'separate',
    commonPatterns: ['Key insight:', 'Lessons learned:', 'Industry update:'],
    engagementTriggers: ['What are your thoughts?', 'Have you experienced this?', 'Share your experience'],
    restrictions: ['Professional tone', 'No excessive emojis']
  },
  [SocialPlatform.FACEBOOK]: {
    platform: SocialPlatform.FACEBOOK,
    maxCaptionLength: 63206,
    maxHashtags: 10,
    hashtagStyle: 'both',
    commonPatterns: ['Check this out', 'What do you think?', 'Share your thoughts'],
    engagementTriggers: ['React if you agree', 'Comment below', 'Share with friends'],
    restrictions: ['Avoid clickbait', 'Keep engaging']
  },
  [SocialPlatform.TWITTER]: {
    platform: SocialPlatform.TWITTER,
    maxCaptionLength: 280,
    maxHashtags: 3,
    hashtagStyle: 'inline',
    commonPatterns: ['Thread 🧵', 'Hot take:', 'Unpopular opinion:'],
    engagementTriggers: ['Retweet if', 'Reply with', 'What are your thoughts?'],
    restrictions: ['Character limit', 'No excessive hashtags']
  },
  [SocialPlatform.YOUTUBE]: {
    platform: SocialPlatform.YOUTUBE,
    maxCaptionLength: 5000,
    maxHashtags: 15,
    hashtagStyle: 'separate',
    commonPatterns: ['Don\'t forget to', 'Make sure to', 'Let me know'],
    engagementTriggers: ['Like and subscribe', 'Comment below', 'Hit the notification bell'],
    restrictions: ['Include call-to-action', 'Encourage engagement']
  }
};

// Prompt templates for different content types
const PROMPT_TEMPLATES = {
  caption: {
    promotional: `Create an engaging {{platform}} caption for a {{businessType}} business promoting {{productService}}.

Context:
- Brand voice: {{brandVoice}}
- Target audience: {{targetAudience}}
- Visual description: {{visualDescription}}
- Tone: {{tone}}

Requirements:
- Maximum {{maxLength}} characters
- Include relevant emojis
- Add a clear call-to-action
- Make it engaging and authentic
- Platform-optimized for {{platform}}

Generate {{variations}} different variations.`,

    educational: `Create an educational {{platform}} caption that teaches about {{topic}}.

Context:
- Brand voice: {{brandVoice}}
- Target audience: {{targetAudience}}
- Visual description: {{visualDescription}}
- Tone: {{tone}}

Requirements:
- Maximum {{maxLength}} characters
- Make it informative yet engaging
- Include actionable insights
- Use appropriate emojis
- End with a question to encourage engagement

Generate {{variations}} different variations.`,

    entertaining: `Create an entertaining {{platform}} caption that's fun and engaging.

Context:
- Brand voice: {{brandVoice}}
- Target audience: {{targetAudience}}
- Visual description: {{visualDescription}}
- Tone: {{tone}}

Requirements:
- Maximum {{maxLength}} characters
- Make it fun and relatable
- Use humor if appropriate
- Include emojis for personality
- Encourage user interaction

Generate {{variations}} different variations.`
  },

  hashtags: `Generate optimized hashtags for {{platform}} based on this content:

Content: {{contentDescription}}
Industry: {{industry}}
Target audience: {{targetAudience}}

Requirements for {{platform}}:
- Maximum {{maxHashtags}} hashtags
- Mix of popular and niche hashtags
- Include branded hashtag if applicable: {{brandedHashtag}}
- Avoid banned or shadowbanned hashtags
- Focus on discoverability and engagement

Return as a clean list separated by spaces.`
};

export class OpenAIService implements AIGenerationService {
  private client: OpenAI;
  private baseModel = 'gpt-4o-mini'; // Cost-effective for text generation

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateImage(): Promise<any> {
    throw new Error('OpenAI service does not support image generation. Use Runware or Midjourney services.');
  }

  async generateText(prompt: string, options: AITextGenerationOptions): Promise<AITextElement> {
    const startTime = Date.now();
    
    try {
      // Build system prompt based on platform and context
      const systemPrompt = this.buildSystemPrompt(options);
      
      // Generate enhanced prompt if visual description is provided
      const enhancedPrompt = options.visualDescription 
        ? await this.enhancePromptWithVisualContext(prompt, options)
        : prompt;

      // Generate text using OpenAI
      const response = await this.client.chat.completions.create({
        model: this.baseModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: this.getTemperatureForStyle(options.style),
        max_tokens: this.calculateMaxTokens(options),
        n: options.variations || 1
      });

      const generationTime = Date.now() - startTime;
      const suggestions = this.parseTextSuggestions(response, options);
      
      // Calculate cost (GPT-4o-mini pricing: ~$0.00015 per 1K input tokens, ~$0.0006 per 1K output tokens)
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const cost = (inputTokens * 0.00015 / 1000) + (outputTokens * 0.0006 / 1000);

      // Generate hashtags if requested
      let hashtags: string[] = [];
      if (options.includeHashtags && suggestions.length > 0) {
        hashtags = await this.generateHashtags(suggestions[0].text, options);
      }

      // Create AI text element following the correct interface
      const aiTextElement: AITextElement = {
        id: generateUUID(),
        type: 'ai-text',
        name: `AI Generated Text - ${options.platform || 'General'}`,
        content: suggestions[0]?.text || '',
        fontSize: 24,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        color: '#ffffff',
        backgroundColor: undefined,
        position: { x: 50, y: 50 },
        alignment: 'center',
        duration: 5,
        startTime: 0,
        trimStart: 0,
        trimEnd: 5,
        canvasFormat: options.canvasFormat || 'instagram-post',
        isRegeneratable: true,
        generationHistory: [],
        aiMetadata: {
          provider: 'openai',
          model: this.baseModel,
          prompt: enhancedPrompt,
          enhancedPrompt: enhancedPrompt,
          generatedAt: new Date(),
          generationTime: generationTime,
          parameters: {
            platform: options.platform,
            style: options.style,
            tone: options.tone,
            maxLength: options.maxLength,
            includeHashtags: options.includeHashtags,
            includeEmojis: options.includeEmojis,
            variations: options.variations,
            suggestions: suggestions,
            hashtags: hashtags
          },
          cost: cost
        }
      };

      return aiTextElement;

    } catch (error) {
      console.error('OpenAI text generation error:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async enhancePrompt(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.baseModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at optimizing prompts for social media content creation. Enhance the given prompt to make it more specific, engaging, and effective for AI text generation.'
          },
          {
            role: 'user',
            content: `Enhance this prompt for better social media content generation: "${prompt}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      return response.choices[0]?.message?.content?.trim() || prompt;
    } catch (error) {
      console.error('Prompt enhancement error:', error);
      return prompt; // Fallback to original prompt
    }
  }

  private async enhancePromptWithVisualContext(prompt: string, options: AITextGenerationOptions): Promise<string> {
    const visualContext = options.visualDescription ? `Visual context: ${options.visualDescription}` : '';
    const businessContext = options.businessContext ? `Business: ${options.businessContext.name} (${options.businessContext.industry})` : '';
    const audienceContext = options.targetAudience ? `Target audience: ${options.targetAudience}` : '';
    
    return `${prompt}

${visualContext}
${businessContext}
${audienceContext}

Create content that connects the visual elements with the brand message for maximum engagement.`;
  }

  private buildSystemPrompt(options: AITextGenerationOptions): string {
    const platform = options.platform || SocialPlatform.INSTAGRAM;
    const platformConfig = PLATFORM_CONFIGS[platform];
    const tone = options.tone || ToneOfVoice.FRIENDLY;

    return `You are an expert social media content creator specializing in ${platform}. 

Your expertise includes:
- Platform-specific best practices and character limits
- Engagement optimization techniques
- Hashtag research and strategy
- Brand voice consistency
- Current trends and viral content patterns

Always follow these platform guidelines:
- Maximum caption length: ${platformConfig.maxCaptionLength} characters
- Maximum hashtags: ${platformConfig.maxHashtags}
- Hashtag style: ${platformConfig.hashtagStyle}
- Common engagement patterns: ${platformConfig.commonPatterns.join(', ')}
- Engagement triggers: ${platformConfig.engagementTriggers.join(', ')}

Tone of voice: ${tone}
Style: ${options.style || 'engaging'}
Language: ${options.language || 'English'}
Include emojis: ${options.includeEmojis !== false ? 'Yes' : 'No'}

Generate content that is authentic, engaging, and optimized for ${platform} algorithm.
Always stay within character limits and follow platform best practices.`;
  }

  private getTemperatureForStyle(style?: string): number {
    switch (style) {
      case 'formal':
      case 'professional':
        return 0.3;
      case 'creative':
      case 'engaging':
        return 0.8;
      case 'casual':
        return 0.6;
      default:
        return 0.7;
    }
  }

  private calculateMaxTokens(options: AITextGenerationOptions): number {
    const baseTokens = 300;
    const maxLength = options.maxLength || 500;
    // Roughly 4 characters per token
    const estimatedTokens = Math.min(maxLength / 3, baseTokens);
    return Math.max(100, Math.floor(estimatedTokens));
  }

  private parseTextSuggestions(response: OpenAI.Chat.Completions.ChatCompletion, options: AITextGenerationOptions): TextSuggestion[] {
    const platform = options.platform || SocialPlatform.INSTAGRAM;
    const suggestions: TextSuggestion[] = [];

    response.choices.forEach((choice: any, index: number) => {
      const text = choice.message?.content?.trim() || '';
      if (text) {
        suggestions.push({
          id: generateUUID(),
          text: text,
          platform: platform,
          confidence: 0.8 - (index * 0.1), // Decrease confidence for later suggestions
          characterCount: text.length
        });
      }
    });

    return suggestions;
  }

  private async generateHashtags(content: string, options: AITextGenerationOptions): Promise<string[]> {
    const platform = options.platform || SocialPlatform.INSTAGRAM;
    const platformConfig = PLATFORM_CONFIGS[platform];
    
    try {
      const hashtagPrompt = this.fillTemplate(PROMPT_TEMPLATES.hashtags, {
        platform: platform,
        contentDescription: content.substring(0, 200), // Limit content length
        industry: options.businessContext?.industry || 'general',
        targetAudience: options.targetAudience || 'general audience',
        maxHashtags: platformConfig.maxHashtags.toString(),
        brandedHashtag: options.businessContext?.brandedHashtag || ''
      });

      const response = await this.client.chat.completions.create({
        model: this.baseModel,
        messages: [
          {
            role: 'system',
            content: `You are a hashtag expert for ${platform}. Generate relevant, trending hashtags that will maximize reach and engagement.`
          },
          {
            role: 'user',
            content: hashtagPrompt
          }
        ],
        temperature: 0.6,
        max_tokens: 200
      });

      const hashtagText = response.choices[0]?.message?.content?.trim() || '';
      return this.parseHashtags(hashtagText, platform);
    } catch (error) {
      console.error('Hashtag generation error:', error);
      return [];
    }
  }

  private parseHashtags(text: string, platform: SocialPlatform): string[] {
    const maxHashtags = PLATFORM_CONFIGS[platform].maxHashtags;
    const hashtags = text.match(/#[\w]+/g) || [];
    return hashtags.slice(0, maxHashtags);
  }

  private fillTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  }

  disconnect(): void {
    // OpenAI client doesn't require explicit disconnection
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();