import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { openaiService } from '@/services/ai/openai-service';
import { AITextGenerationOptions, SocialPlatform, ContentType, ToneOfVoice } from '@/services/ai/types';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { prompt, options }: { prompt: string; options: AITextGenerationOptions } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    if (!options || typeof options !== 'object') {
      return NextResponse.json(
        { error: 'Valid options object is required' },
        { status: 400 }
      );
    }

    // Validate platform if provided
    if (options.platform && !Object.values(SocialPlatform).includes(options.platform)) {
      return NextResponse.json(
        { error: 'Invalid platform specified' },
        { status: 400 }
      );
    }

    // Validate content type if provided
    if (options.contentType && !Object.values(ContentType).includes(options.contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type specified' },
        { status: 400 }
      );
    }

    // Validate tone if provided
    if (options.tone && !Object.values(ToneOfVoice).includes(options.tone)) {
      return NextResponse.json(
        { error: 'Invalid tone specified' },
        { status: 400 }
      );
    }

    // Set default values
    const textOptions: AITextGenerationOptions = {
      canvasFormat: options.canvasFormat || 'instagram-post',
      platform: options.platform || SocialPlatform.INSTAGRAM,
      contentType: options.contentType || ContentType.PROMOTIONAL,
      tone: options.tone || ToneOfVoice.FRIENDLY,
      style: options.style || 'engaging',
      language: options.language || 'English',
      maxLength: options.maxLength || 500,
      includeHashtags: options.includeHashtags !== false,
      includeEmojis: options.includeEmojis !== false,
      variations: Math.min(options.variations || 1, 3), // Limit to 3 variations max
      targetAudience: options.targetAudience,
      visualDescription: options.visualDescription,
      businessContext: options.businessContext
    };

    // Validate max length based on platform
    const platformLimits = {
      [SocialPlatform.INSTAGRAM]: 2200,
      [SocialPlatform.TIKTOK]: 300,
      [SocialPlatform.LINKEDIN]: 3000,
      [SocialPlatform.FACEBOOK]: 63206,
      [SocialPlatform.TWITTER]: 280,
      [SocialPlatform.YOUTUBE]: 5000
    };

    const maxAllowed = (textOptions.platform && platformLimits[textOptions.platform]) || 500;
    if (textOptions.maxLength && textOptions.maxLength > maxAllowed) {
      return NextResponse.json(
        { error: `Max length for ${textOptions.platform} is ${maxAllowed} characters` },
        { status: 400 }
      );
    }

    console.log('[OpenAI Text API] Generating text with options:', {
      platform: textOptions.platform,
      contentType: textOptions.contentType,
      tone: textOptions.tone,
      maxLength: textOptions.maxLength,
      variations: textOptions.variations,
      includeHashtags: textOptions.includeHashtags,
      userId: session.user.id
    });

    // Generate text using OpenAI service
    const startTime = Date.now();
    const result = await openaiService.generateText(prompt, textOptions);
    const generationTime = Date.now() - startTime;

    console.log('[OpenAI Text API] Text generation completed:', {
      elementId: result.id,
      contentLength: result.content.length,
      generationTime,
      cost: result.aiMetadata.cost,
      userId: session.user.id
    });

    // Return the generated text element
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        generationTime,
        cost: result.aiMetadata.cost,
        platform: textOptions.platform,
        contentType: textOptions.contentType,
        variations: result.aiMetadata.parameters.variations?.length || 1
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[OpenAI Text API] Error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI service configuration error' },
          { status: 503 }
        );
      }

      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI service temporarily unavailable due to rate limits' },
          { status: 429 }
        );
      }

      if (error.message.includes('content policy') || error.message.includes('safety')) {
        return NextResponse.json(
          { error: 'Content violates OpenAI safety guidelines' },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to generate text. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'OpenAI Text Generation API',
    version: '1.0.0',
    status: 'active',
    capabilities: {
      platforms: ['instagram', 'tiktok', 'linkedin', 'facebook', 'twitter', 'youtube'],
      contentTypes: ['promotional', 'educational', 'entertaining', 'informational'],
      tones: ['professional', 'friendly', 'casual', 'formal', 'playful', 'inspirational', 'urgent'],
      features: [
        'Platform-specific optimization',
        'Hashtag generation',
        'Emoji integration',
        'Multiple variations',
        'Brand voice consistency',
        'Character limit compliance'
      ]
    }
  });
}