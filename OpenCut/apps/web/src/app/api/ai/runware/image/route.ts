import { NextRequest, NextResponse } from 'next/server';
import { runwareService } from '@/services/ai/runware-service';
import { auth } from '~/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      prompt, 
      model = 'runware:default', 
      width = 1080, 
      height = 1920, 
      style = 'realistic',
      quality = 'standard',
      canvasFormat = 'instagram-story'
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate image using Runware service
    const startTime = Date.now();
    const result = await runwareService.generateImage(prompt, {
      canvasFormat,
      style,
      dimensions: {
        width,
        height
      },
      model,
    });

    const generationTime = Date.now() - startTime;

    // Log generation for analytics
    console.log(`Runware image generated for user ${session.user.id}:`, {
      prompt: prompt.substring(0, 100),
      model,
      dimensions: `${width}x${height}`,
      generationTime: `${generationTime}ms`,
      cost: result.aiMetadata.cost || 0.05,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        generationTime,
      }
    });

  } catch (error) {
    console.error('Runware image generation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Generation failed'
      },
      { status: 500 }
    );
  }
}