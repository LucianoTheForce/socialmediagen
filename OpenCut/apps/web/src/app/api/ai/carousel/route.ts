export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { CarouselPromptService } from '@/services/ai/carousel-prompt-service';
import { openaiService } from '@/services/ai/openai-service';
import { runwareService } from '@/services/ai/runware-service';

export async function POST(request: NextRequest) {
  console.log('[Carousel API] Full carousel generation started');
  const startTime = performance.now();

  try {
    const body = await request.json();
    console.log('[Carousel API] Request body:', JSON.stringify(body, null, 2));

    // Validate request
    if (!body.prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    const {
      prompt,
      canvasCount = 5,
      backgroundStrategy = 'unique',
      imageProvider = 'runware', // Default to runware
      skipImages = false,
    } = body;

    console.log('[Carousel API] Generating carousel with:', { prompt, canvasCount, backgroundStrategy, imageProvider });

    // Step 1: Content Analysis with error handling
    let contentType: 'educational' | 'promotional' | 'inspirational' | 'storytelling' | 'tips' = 'promotional';
    let compositionRules: string[] = [];
    
    try {
      contentType = CarouselPromptService.detectContentType(prompt);
      compositionRules = CarouselPromptService.generateCompositionRules(contentType);
      console.log('[Carousel API] Content analysis successful:', { contentType, rulesCount: compositionRules.length });
    } catch (error) {
      console.warn('[Carousel API] Content analysis failed, using defaults:', error);
    }

    // Step 2: Generate slide content with error handling
    let slides: any[] = [];
    let textGenerationTime = 0;
    let textCost = 0;

    try {
      const textStartTime = performance.now();
      
      // Create structured prompt for OpenAI using the correct method
      const structuredPrompt = CarouselPromptService.generateStructuredPrompt({
      topic: prompt,
      slideCount: canvasCount,
      backgroundStrategy,
        tone: 'engaging',
        targetAudience: 'general',
        style: 'modern',
      contentType
      });

      console.log('[Carousel API] Calling OpenAI for slide generation...');
      const aiTextElement = await openaiService.generateText(structuredPrompt, {
        platform: 'INSTAGRAM' as any,
      maxLength: 2000,
        variations: 1,
        style: 'engaging',
        tone: 'FRIENDLY' as any,
      includeEmojis: true,
        includeHashtags: false,
        canvasFormat: 'instagram-post'
      });

      textGenerationTime = performance.now() - textStartTime;
      textCost = aiTextElement.aiMetadata?.cost || 0.002;

      // Parse JSON response from OpenAI
      try {
        const responseContent = aiTextElement.content;
        const parsedResponse = JSON.parse(responseContent);
        
        if (parsedResponse.slides && Array.isArray(parsedResponse.slides)) {
          // Enhance slides with layout suggestions
          slides = parsedResponse.slides.map((slide: any, index: number) => {
            const layoutSuggestion = CarouselPromptService.generateSlideLayoutSuggestions(
              slide.content || '',
              index,
              parsedResponse.slides.length
            );
            
            return {
              ...slide,
              layoutSuggestion,
              // Add specific text formatting
              textStyles: {
                titleSize: layoutSuggestion.fontSizeRecommendation === 'large' ? 72 : 
                         layoutSuggestion.fontSizeRecommendation === 'medium' ? 56 : 42,
                contentSize: layoutSuggestion.fontSizeRecommendation === 'large' ? 36 : 
                           layoutSuggestion.fontSizeRecommendation === 'medium' ? 28 : 20,
                titleWeight: index === 0 ? 'bold' : 'semibold',
                contentWeight: 'normal',
                alignment: layoutSuggestion.textPlacement === 'center' ? 'center' : 
                          layoutSuggestion.textPlacement === 'left' ? 'left' : 'right'
              }
            };
          });
        } else {
          throw new Error('Invalid response structure');
        }
    } catch (parseError) {
        console.warn('[Carousel API] Failed to parse OpenAI JSON response, creating fallback slides');
        throw parseError;
      }

      console.log('[Carousel API] Generated', slides.length, 'slides from OpenAI');

    } catch (error) {
      console.error('[Carousel API] Text generation failed, creating fallback slides:', error);
      
      // Fallback slide generation
      slides = Array.from({ length: canvasCount }, (_, i) => ({
        slideNumber: i + 1,
        title: `${prompt} - Slide ${i + 1}`,
        subtitle: '',
        content: `Engaging content for slide ${i + 1} about ${prompt}`,
        cta: i === canvasCount - 1 ? 'Learn more!' : '',
        backgroundPrompt: `Professional background for ${contentType} content about ${prompt}`,
        designNotes: 'Clean, modern layout with good readability',
        engagementTactics: 'Use compelling visuals and clear messaging'
      }));
    }

    // Step 3: Generate background images with error handling (skippable for fast path)
    let imageGenerationTime = 0;
    let imageCost = 0;
    let backgroundImages: string[] = [];

    try {
      if (skipImages) {
        // Quick placeholders to avoid long-running requests
        backgroundImages = Array.from({ length: canvasCount }, (_, i) => {
          const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
          ];
          return gradients[i % gradients.length];
        });
        throw new Error('Image generation skipped by request');
      }

      const imageStartTime = performance.now();
      console.log('[Carousel API] Generating background images...');

      const imageService = imageProvider === 'runware' ? runwareService : null;
      
      if (!imageService) {
        throw new Error(`Image provider ${imageProvider} not supported`);
      }

      if (backgroundStrategy === 'thematic') {
        // Single thematic background for all slides
        const thematicPrompt = CarouselPromptService.optimizePromptForRunware(
          `Professional, cohesive background for ${contentType} content about ${prompt}`,
          'Instagram carousel thematic background'
        );
        
        const thematicImage = await imageService.generateImage(thematicPrompt, {
          dimensions: { width: 1080, height: 1350 },
          style: 'realistic',
          canvasFormat: 'instagram-post'
        });
        
        backgroundImages = Array(canvasCount).fill(thematicImage.imageUrl);
        imageCost = thematicImage.aiMetadata?.cost || 0.04;
        
      } else {
        // Generate unique backgrounds for each slide sequentially
        const backgroundPrompts = slides.map((slide, index) => {
          const basePrompt = slide.backgroundPrompt || `Background for slide ${slide.slideNumber}`;
          return CarouselPromptService.optimizePromptForRunware(
            basePrompt,
            `Instagram carousel slide ${index + 1} of ${slides.length}`
          );
        });
        
        for (const bgPrompt of backgroundPrompts) {
          try {
            const imageResult = await imageService.generateImage(bgPrompt, {
              dimensions: { width: 1080, height: 1350 },
              style: 'realistic',
              canvasFormat: 'instagram-post'
            });
            backgroundImages.push(imageResult.imageUrl);
            imageCost += imageResult.aiMetadata?.cost || 0.04;
          } catch (imageError) {
            console.warn('[Carousel API] Failed to generate image for prompt:', bgPrompt, imageError);
            // Use a fallback gradient
            const gradients = [
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
            ];
            backgroundImages.push(gradients[backgroundImages.length % gradients.length]);
          }
        }
      }

      imageGenerationTime = performance.now() - imageStartTime;
      console.log('[Carousel API] Generated', backgroundImages.length, 'background images');

    } catch (error) {
      console.error('[Carousel API] Image generation failed, using fallback:', error);
      
      // Fallback: use default background colors
      backgroundImages = Array.from({ length: canvasCount }, (_, i) => {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];
        return colors[i % colors.length];
      });
    }

    // Step 4: Combine slides with background images
    const finalSlides = slides.map((slide, index) => ({
      ...slide,
      backgroundImage: backgroundImages[index] || backgroundImages[0] || '#667eea',
      timestamp: new Date().toISOString(),
      // Ensure text styles are included
      textStyles: slide.textStyles || {
        titleSize: 56,
        contentSize: 28,
        titleWeight: 'semibold',
        contentWeight: 'normal',
        alignment: 'center'
      }
    }));

    // Calculate totals
    const totalGenerationTime = performance.now() - startTime;
    const totalCost = textCost + imageCost;

    const response = {
      success: true,
      slides: finalSlides,
      metadata: {
        contentType,
        backgroundStrategy,
        slidesGenerated: finalSlides.length,
        totalGenerationTime: Math.round(totalGenerationTime),
        textGenerationTime: Math.round(textGenerationTime),
        imageGenerationTime: Math.round(imageGenerationTime),
        totalCost: parseFloat(totalCost.toFixed(4)),
        textCost: parseFloat(textCost.toFixed(4)),
        imageCost: parseFloat(imageCost.toFixed(4)),
        compositionRulesUsed: compositionRules.length,
        generationTimestamp: new Date().toISOString(),
        imageProvider: imageProvider,
        version: '2.1.0'
      }
    };

    console.log('[Carousel API] Generation completed successfully in', Math.round(totalGenerationTime), 'ms');
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const errorTime = performance.now() - startTime;
    console.error('[Carousel API] Fatal error after', Math.round(errorTime), 'ms:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Carousel generation failed',
        details: error instanceof Error ? error.message : String(error),
      errorTime: Math.round(errorTime),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'OpenCut Carousel Generation API',
    version: '2.0.0',
    status: 'operational',
      features: [
      'AI-powered slide content generation',
      'Intelligent background image creation',
      'Multiple background strategies (unique/thematic)',
      'Content type detection and optimization',
      'Robust error handling and fallbacks',
      'Performance monitoring and cost tracking'
    ],
    endpoints: {
      POST: 'Generate carousel slides with AI',
      GET: 'API status and information'
    }
  });
}