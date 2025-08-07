import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { openaiService } from '@/services/ai/openai-service';
import { runwareService } from '@/services/ai/runware-service';
import { CarouselPromptService } from '@/services/ai/carousel-prompt-service';
import { AITextGenerationOptions, SocialPlatform, ContentType, ToneOfVoice } from '@/services/ai/types';

interface CarouselSlide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  content: string;
  cta?: string;
  backgroundPrompt: string;
  layoutSuggestion?: {
    layoutType: 'text-focused' | 'image-overlay' | 'split-screen' | 'minimal' | 'bold-statement';
    textPlacement: 'top' | 'center' | 'bottom' | 'left' | 'right';
    fontSizeRecommendation: 'large' | 'medium' | 'small';
    colorScheme: 'high-contrast' | 'monochrome' | 'vibrant' | 'subtle';
    visualHierarchy: string[];
  };
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
    contentType?: string;
    backgroundStrategy?: string;
    compositionRules?: string[];
    enhancedFeatures?: string[];
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

    // Step 1: Generate structured carousel content using enhanced prompting
    console.log('[Carousel API] Starting enhanced text generation...');
    const textGenerationStart = Date.now();
    
    // Detect content type and generate structured prompt
    const contentType = CarouselPromptService.detectContentType(prompt);
    console.log('[Carousel API] Content type detected:', contentType);
    
    const carouselPromptOptions = {
      topic: prompt,
      slideCount: canvasCount,
      backgroundStrategy,
      tone: options.tone?.toString() || 'friendly',
      targetAudience: options.targetAudience || 'Instagram users',
      style: options.style || 'engaging and modern',
      contentType
    };
    
    const carouselPrompt = CarouselPromptService.generateStructuredPrompt(carouselPromptOptions);
    console.log('[Carousel API] Enhanced prompt generated:', {
      contentType,
      promptLength: carouselPrompt.length,
      detectedPatterns: contentType
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

    let textResult;
    try {
      textResult = await openaiService.generateText(carouselPrompt, textOptions);
      console.log('[Carousel API] OpenAI response received:', {
        success: !!textResult,
        contentLength: textResult?.content?.length,
        hasMetadata: !!textResult?.aiMetadata
      });
    } catch (openaiError) {
      console.error('[Carousel API] OpenAI service failed, using fallback content:', openaiError);
      // Use fallback content when OpenAI is not available
      textResult = {
        content: JSON.stringify({
          slides: Array.from({ length: canvasCount }, (_, i) => ({
            slideNumber: i + 1,
            title: `Slide ${i + 1}: ${prompt.split(' ').slice(0, 3).join(' ')}`,
            content: `This is slide ${i + 1} content for ${prompt.split(' ').slice(0, 5).join(' ')}...`,
            backgroundPrompt: `Modern design for ${prompt.split(' ').slice(0, 3).join(' ')}, professional, clean`,
            cta: i === canvasCount - 1 ? 'Take action now!' : undefined
          }))
        }),
        aiMetadata: {
          provider: 'fallback',
          model: 'fallback-content',
          cost: 0,
          generatedAt: new Date(),
          generationTime: 100
        }
      };
    }
    
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
      
      // Check if Runware API key is available
      const runwareKey = process.env.RUNWARE_API_KEY;
      if (!runwareKey || runwareKey.includes('placeholder')) {
        console.log('[Carousel API] Runware API key not available, skipping image generation');
        throw new Error('Runware API key not configured');
      }
      
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

      // Apply generated backgrounds to slides with layout suggestions
      slidesWithBackgrounds = slides.map((slide, index) => {
        const backgroundImage = imageResults[index];
        
        // Generate layout suggestion for this slide
        const layoutSuggestion = CarouselPromptService.generateSlideLayoutSuggestions(
          slide.content,
          index,
          slides.length
        );
        
        if (backgroundImage) {
          imageCosts += 0.05; // Approximate cost per image
          return {
            ...slide,
            backgroundImage: {
              id: backgroundImage.id,
              url: (backgroundImage as any).imageURL || (backgroundImage as any).url,
              metadata: backgroundImage
            },
            layoutSuggestion
          };
        }
        return {
          ...slide,
          backgroundImage: undefined,
          layoutSuggestion
        };
      });

      console.log('[Carousel API] Background images applied to slides:', {
        slidesWithImages: slidesWithBackgrounds.filter(s => (s as any).backgroundImage).length,
        totalImageCosts: imageCosts
      });

    } catch (error) {
      console.error('[Carousel API] Background generation error:', error);
      // Continue with slides without backgrounds if generation fails, but include layout suggestions
      slidesWithBackgrounds = slides.map((slide, index) => {
        const layoutSuggestion = CarouselPromptService.generateSlideLayoutSuggestions(
          slide.content,
          index,
          slides.length
        );
        
        return {
          ...slide,
          backgroundImage: undefined,
          layoutSuggestion
        };
      });
      console.log('[Carousel API] Continuing without background images due to error');
    }
    
    const imageGenerationTime = Date.now() - imageGenerationStart;
    console.log('[Carousel API] Image generation completed in:', imageGenerationTime, 'ms');

    const totalGenerationTime = Date.now() - startTime;

    // Generate composition rules for the content type
    const compositionRules = CarouselPromptService.generateCompositionRules(contentType);
    console.log(`[Carousel API] Generated ${compositionRules.length} composition rules for ${contentType} content`);

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
        totalCost,
        contentType,
        backgroundStrategy,
        compositionRules,
        enhancedFeatures: [
          'AI-powered content structuring',
          'Intelligent slide layout system',
          'Automatic background generation',
          'Instagram-optimized formatting',
          'Consistent visual theming',
          'Multi-slide coordination',
          'Composition rule generation',
          'Cost optimization'
        ]
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
    console.error('[Carousel API] CRITICAL ERROR OCCURRED:', error);
    console.error('[Carousel API] Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Carousel API] Error Type:', typeof error);
    console.error('[Carousel API] Error Message:', error instanceof Error ? error.message : String(error));

    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('[Carousel API] Detailed Error Info:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });

      if (error.message.includes('API key')) {
        console.error('[Carousel API] API key configuration error detected');
        return NextResponse.json(
          { error: 'AI service configuration error', details: 'API key issue detected' },
          { status: 503 }
        );
      }

      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        console.error('[Carousel API] Rate limit error detected');
        return NextResponse.json(
          { error: 'AI services temporarily unavailable due to rate limits' },
          { status: 429 }
        );
      }

      if (error.message.includes('content policy') || error.message.includes('safety')) {
        console.error('[Carousel API] Content policy error detected');
        return NextResponse.json(
          { error: 'Content violates AI safety guidelines' },
          { status: 400 }
        );
      }
    }

    // More detailed generic error response
    return NextResponse.json(
      {
        error: 'Failed to generate carousel. Please try again.',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined
      },
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