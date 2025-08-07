import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { openaiService } from '@/services/ai/openai-service';
import { runwareService } from '@/services/ai/runware-service';
import { AITextGenerationOptions, SocialPlatform, ContentType, ToneOfVoice } from '@/services/ai/types';

interface CarouselSlide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  content: string;
  cta?: string;
  backgroundPrompt: string;
}

interface CarouselGenerationRequest {
  prompt: string;
  canvasCount: number;
  backgroundStrategy: 'unique' | 'thematic';
  options?: {
    tone?: ToneOfVoice;
    targetAudience?: string;
    style?: string;
    includeHashtags?: boolean;
  };
}

interface CarouselGenerationResult {
  slides: (CarouselSlide & {
    backgroundImage?: {
      id: string;
      url: string;
      metadata: any;
    };
  })[];
  metadata: {
    totalGenerationTime: number;
    textGenerationTime: number;
    imageGenerationTime: number;
    totalCost: number;
  };
}

export async function POST(request: NextRequest) {
  console.log('[Carousel API] Request received');
  try {
    console.log('[Carousel API] Starting authentication...');
    // Authenticate user - temporarily disabled for debugging
    const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
    console.log('[Carousel API] Session retrieved:', session ? 'found' : 'not found');
    
    // Use a default user for now
    const user = session?.user || { id: 'debug-user', email: 'debug@test.com' };
    console.log('[Carousel API] Using user:', user);

    console.log('[Carousel API] Parsing request body...');
    // Parse request body
    const body: CarouselGenerationRequest = await request.json();
    console.log('[Carousel API] Body parsed successfully:', {
      hasPrompt: !!body.prompt,
      canvasCount: body.canvasCount,
      backgroundStrategy: body.backgroundStrategy
    });
    const { prompt, canvasCount, backgroundStrategy, options = {} } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    if (!canvasCount || canvasCount < 2 || canvasCount > 10) {
      return NextResponse.json(
        { error: 'Canvas count must be between 2 and 10' },
        { status: 400 }
      );
    }

    if (!['unique', 'thematic'].includes(backgroundStrategy)) {
      return NextResponse.json(
        { error: 'Background strategy must be either "unique" or "thematic"' },
        { status: 400 }
      );
    }

    console.log('[Carousel API] Starting carousel generation:', {
      canvasCount,
      backgroundStrategy,
      userId: user.id,
      prompt: prompt.substring(0, 100) + '...'
    });

    const startTime = Date.now();

    // Step 1: Generate carousel content
    console.log('[Carousel API] Starting text generation...');
    const textGenerationStart = Date.now();
    
    // Create a structured prompt for carousel generation
    const carouselPrompt = `
You are an expert Instagram carousel creator. Create a ${canvasCount}-slide Instagram carousel on the topic: "${prompt}"

TARGET: ${options.targetAudience || 'Instagram users'}
TONE: ${options.tone || 'friendly'}
STYLE: ${options.style || 'engaging and modern'}

SLIDE SPECIFICATIONS:
- Each slide must have a clear, specific purpose
- Titles: Attention-grabbing, max 60 characters
- Content: Concise but valuable, max 150 characters per slide
- Include strategic use of emojis (2-3 per slide max)
- Create logical flow between slides

BACKGROUND STRATEGY: ${backgroundStrategy}
${backgroundStrategy === 'thematic' ?
  '• Create cohesive visual theme with consistent color palette and style' :
  '• Create unique, varied backgrounds that match each slide\'s content'
}

INSTAGRAM OPTIMIZATION:
- Hook readers within first 2 slides
- Use carousel-specific engagement tactics
- Include clear value proposition
- End with strong call-to-action
- Optimize for mobile viewing

RESPONSE FORMAT (STRICT JSON):
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Attention-grabbing title",
      "subtitle": "Supporting subtitle (optional)",
      "content": "Main slide content with clear value",
      "cta": "Action-oriented text (if applicable)",
      "backgroundPrompt": "Detailed visual description for ${backgroundStrategy} background generation"
    }
  ]
}

Create exactly ${canvasCount} slides following this structure.`;

    console.log('[Carousel API] Prompt generated:', {
      promptLength: carouselPrompt.length,
      canvasCount
    });

    const textOptions: AITextGenerationOptions = {
      canvasFormat: 'instagram-post',
      platform: SocialPlatform.INSTAGRAM,
      contentType: ContentType.EDUCATIONAL,
      tone: options.tone || ToneOfVoice.FRIENDLY,
      style: (options.style as 'formal' | 'casual' | 'creative' | 'professional' | 'engaging') || 'engaging',
      language: 'English',
      maxLength: 2000,
      includeHashtags: options.includeHashtags !== false,
      includeEmojis: true,
      variations: 1,
      targetAudience: options.targetAudience,
      visualDescription: `${canvasCount}-slide carousel with ${backgroundStrategy} backgrounds`
    };

    console.log('[Carousel API] Calling OpenAI service...', {
      promptLength: carouselPrompt.length,
      options: textOptions
    });

    const textResult = await openaiService.generateText(carouselPrompt, textOptions);
    console.log('[Carousel API] OpenAI response received:', {
      success: !!textResult,
      contentLength: textResult?.content?.length,
      hasMetadata: !!textResult?.aiMetadata
    });
    
    const textGenerationTime = Date.now() - textGenerationStart;

    // Parse the JSON response from OpenAI
    console.log('[Carousel API] Parsing OpenAI response...');
    let slides: CarouselSlide[];
    try {
      console.log('[Carousel API] Raw OpenAI content preview:', textResult.content?.substring(0, 200) + '...');
      const parsedContent = JSON.parse(textResult.content);
      console.log('[Carousel API] JSON parsed successfully, checking structure...');
      slides = parsedContent.slides;
      
      console.log('[Carousel API] Slides extracted:', {
        isArray: Array.isArray(slides),
        length: slides?.length,
        expectedCount: canvasCount
      });

      if (!Array.isArray(slides) || slides.length !== canvasCount) {
        throw new Error('Invalid slide structure returned from AI');
      }

      console.log('[Carousel API] Slide structure validation passed');
    } catch (parseError) {
      console.error('[Carousel API] Failed to parse AI response:', parseError);
      console.error('[Carousel API] Raw content causing error:', textResult.content);
      return NextResponse.json(
        { error: 'Failed to generate structured carousel content' },
        { status: 500 }
      );
    }

    // Step 2: Generate background images using enhanced Runware service
    console.log('[Carousel API] Starting enhanced background generation...');
    const imageGenerationStart = Date.now();
    
    let slidesWithBackgrounds = slides;
    let imageCosts = 0;
    
    try {
      console.log('[Carousel API] Starting batch image generation...');
      const imageResults = await Promise.all(
        slides.map(async (slide, index) => {
          try {
            console.log(`[Carousel API] Generating image ${index + 1} for slide:`, slide.title);
            
            // Use the public generateImage method with correct parameters
            const result = await runwareService.generateImage(
              slide.backgroundPrompt,
              {
                canvasFormat: 'instagram-post',
                dimensions: {
                  width: 1080,
                  height: 1080
                },
                steps: 25,
                guidanceScale: 7,
                model: 'runware:100@1'
              }
            );
            
            console.log(`[Carousel API] Image ${index + 1} generated successfully:`, result?.id);
            return result;
          } catch (error) {
            console.error(`[Carousel API] Failed to generate background ${index + 1}:`, error);
            return null;
          }
        })
      );

      console.log('[Carousel API] Batch generation completed:', {
        total: imageResults.length,
        successful: imageResults.filter(r => r).length,
        failed: imageResults.filter(r => !r).length
      });

      // Apply generated backgrounds to slides
      slidesWithBackgrounds = slides.map((slide, index) => {
        const backgroundImage = imageResults[index];
        if (backgroundImage) {
          imageCosts += 0.05; // Approximate cost per image
          return {
            ...slide,
            backgroundImage: {
              id: backgroundImage.id,
              url: (backgroundImage as any).imageURL || (backgroundImage as any).url,
              metadata: backgroundImage
            }
          };
        }
        return { ...slide, backgroundImage: undefined };
      });

      console.log('[Carousel API] Background images applied to slides:', {
        slidesWithImages: slidesWithBackgrounds.filter(s => (s as any).backgroundImage).length,
        totalImageCosts: imageCosts
      });

    } catch (error) {
      console.error('[Carousel API] Background generation error:', error);
      // Continue with slides without backgrounds if generation fails
      slidesWithBackgrounds = slides.map(slide => ({
        ...slide,
        backgroundImage: undefined
      }));
      console.log('[Carousel API] Continuing without background images due to error');
    }
    
    const imageGenerationTime = Date.now() - imageGenerationStart;
    console.log('[Carousel API] Image generation completed in:', imageGenerationTime, 'ms');

    const totalGenerationTime = Date.now() - startTime;

    // Calculate total cost with enhanced cost tracking
    console.log('[Carousel API] Calculating costs...');
    const textCost = textResult.aiMetadata?.cost || 0.02;
    const totalCost = textCost + imageCosts;
    console.log('[Carousel API] Cost calculation completed:', { textCost, imageCosts, totalCost });

    const result: CarouselGenerationResult = {
      slides: slidesWithBackgrounds,
      metadata: {
        totalGenerationTime,
        textGenerationTime,
        imageGenerationTime,
        totalCost
      }
    };

    console.log('[Carousel API] Carousel generation completed:', {
      slidesGenerated: slidesWithBackgrounds.length,
      backgroundsGenerated: slidesWithBackgrounds.filter(s => (s as any).backgroundImage).length,
      totalGenerationTime,
      totalCost,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 200 });

  } catch (error) {
    console.error('[Carousel API] Error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 503 }
        );
      }

      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'AI services temporarily unavailable due to rate limits' },
          { status: 429 }
        );
      }

      if (error.message.includes('content policy') || error.message.includes('safety')) {
        return NextResponse.json(
          { error: 'Content violates AI safety guidelines' },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to generate carousel. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Instagram Carousel Generation API',
    version: '1.0.0',
    status: 'active',
    capabilities: {
      maxSlides: 10,
      minSlides: 2,
      backgroundStrategies: ['unique', 'thematic'],
      features: [
        'AI-powered content structuring',
        'Automatic background generation',
        'Instagram-optimized formatting',
        'Consistent visual theming',
        'Multi-slide coordination',
        'Cost optimization'
      ]
    }
  });
}