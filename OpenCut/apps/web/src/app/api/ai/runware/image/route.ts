import { NextRequest, NextResponse } from 'next/server';
import { runwareService } from '@/services/ai/runware-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Runware Image API: Starting request processing...');
    
    // Authentication optional to allow background generation in dev/demo
    // If you need to enforce auth, re-enable and handle 401 in the client queue

    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const {
      prompt,
      model = 'runware:100@1',
      width,
      height,
      style = 'realistic',
      quality = 'standard',
      canvasFormat = 'instagram-story'
    } = body;

    if (!prompt) {
      console.error('❌ No prompt provided in request');
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Generating image with prompt: "${prompt}"`);
    console.log('⚙️ Options:', { canvasFormat, style, model, width, height });

    // Generate image using Runware service
    const startTime = Date.now();
    const options: any = { canvasFormat, style, model };
    if (typeof width === 'number' && typeof height === 'number') {
      options.dimensions = { width, height };
    }

    console.log('🚀 Calling runwareService.generateImage with options:', options);
    const result = await runwareService.generateImage(prompt, options);

    const generationTime = Date.now() - startTime;
    console.log(`✅ Generation completed in ${generationTime}ms`);
    console.log('📸 Generated result:', result);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        generationTime,
      },
      imageUrl: result.imageUrl // Add this for backwards compatibility
    });

  } catch (error) {
    console.error('❌ Runware image generation failed:', error);
    console.error('🔍 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      },
      { status: 500 }
    );
  }
}