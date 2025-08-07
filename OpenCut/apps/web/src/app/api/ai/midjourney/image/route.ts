import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { MidjourneyService } from '@/services/ai/midjourney-service';
import { AIImageGenerationOptions } from '@/types/ai-timeline';

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
    const { prompt, dimensions, canvasFormat, style, model, seed, guidanceScale } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    if (!canvasFormat || typeof canvasFormat !== 'string') {
      return NextResponse.json(
        { error: 'Canvas format is required' },
        { status: 400 }
      );
    }

    // Validate dimensions if provided
    if (dimensions && (!dimensions.width || !dimensions.height || 
        typeof dimensions.width !== 'number' || typeof dimensions.height !== 'number')) {
      return NextResponse.json(
        { error: 'Invalid dimensions format. Expected { width: number, height: number }' },
        { status: 400 }
      );
    }

    // Build generation options
    const options: AIImageGenerationOptions = {
      canvasFormat,
      dimensions,
      style,
      model,
      seed,
      guidanceScale,
    };

    console.log('Starting Midjourney image generation:', {
      userId: session.user.id,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      options,
    });

    // Initialize Midjourney service
    const midjourneyService = new MidjourneyService({
      apiKey: process.env.MIDJOURNEY_API_KEY || '',
      timeout: 300000, // 5 minutes timeout
    });

    const startTime = Date.now();

    // Generate image
    const result = await midjourneyService.generateImage(prompt, options);

    const generationTime = Date.now() - startTime;

    // Log successful generation
    console.log('Midjourney image generation completed:', {
      userId: session.user.id,
      elementId: result.id,
      generationTime,
      cost: result.aiMetadata.cost,
      model: result.aiMetadata.model,
    });

    // Update generation time in metadata
    result.aiMetadata.generationTime = generationTime;

    return NextResponse.json({
      success: true,
      result,
      generationTime,
      cost: result.aiMetadata.cost,
    });

  } catch (error) {
    console.error('Midjourney API error:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Generation timeout - please try again with a simpler prompt' },
          { status: 408 }
        );
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Service configuration error' },
          { status: 503 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded - please try again later' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Generation failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during generation' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking generation status (if needed for polling)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Note: This would require storing task status in a database or cache
    // For now, return a simple response
    return NextResponse.json({
      taskId,
      status: 'This endpoint would check generation status',
      message: 'Status checking not implemented yet',
    });

  } catch (error) {
    console.error('Midjourney status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check generation status' },
      { status: 500 }
    );
  }
}