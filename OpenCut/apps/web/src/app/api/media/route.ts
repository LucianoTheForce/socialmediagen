import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";
import { db } from "@/lib/db";
import { mediaItems, projects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const canvasId = searchParams.get("canvasId");
    const mediaType = searchParams.get("type");

    // Build where conditions
    let whereConditions = [eq(projects.userId, user.id)];

    if (projectId) {
      whereConditions.push(eq(mediaItems.projectId, projectId));
    }

    if (canvasId) {
      whereConditions.push(eq(mediaItems.canvasId, canvasId));
    }

    if (mediaType) {
      whereConditions.push(eq(mediaItems.type, mediaType));
    }

    // Execute query with all conditions
    const userMediaItems = await db
      .select({
        id: mediaItems.id,
        projectId: mediaItems.projectId,
        name: mediaItems.name,
        type: mediaItems.type,
        url: mediaItems.url,
        thumbnailUrl: mediaItems.thumbnailUrl,
        fileSize: mediaItems.fileSize,
        width: mediaItems.width,
        height: mediaItems.height,
        duration: mediaItems.duration,
        fps: mediaItems.fps,
        isAIGenerated: mediaItems.isAIGenerated,
        generationPrompt: mediaItems.generationPrompt,
        aiMetadata: mediaItems.aiMetadata,
        canvasId: mediaItems.canvasId,
        slideNumber: mediaItems.slideNumber,
        backgroundStrategy: mediaItems.backgroundStrategy,
        createdAt: mediaItems.createdAt,
        updatedAt: mediaItems.updatedAt,
      })
      .from(mediaItems)
      .innerJoin(projects, eq(mediaItems.projectId, projects.id))
      .where(and(...whereConditions))
      .orderBy(desc(mediaItems.createdAt));

    return NextResponse.json(userMediaItems);
  } catch (error) {
    console.error("Error fetching media items:", error);
    return NextResponse.json(
      { error: "Failed to fetch media items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      canvasId,
      name,
      type,
      url,
      thumbnailUrl,
      fileSize,
      width,
      height,
      duration,
      fps,
      isAIGenerated,
      generationPrompt,
      aiMetadata,
      slideNumber,
      backgroundStrategy
    } = body;

    if (!projectId || !name || !type || !url) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, name, type, url" },
        { status: 400 }
      );
    }

    // Verify user owns this project
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    const newMediaItem = {
      id: generateId(),
      projectId,
      name,
      type,
      url,
      thumbnailUrl: thumbnailUrl || null,
      fileSize: fileSize || null,
      width: width || null,
      height: height || null,
      duration: duration || null,
      fps: fps || null,
      isAIGenerated: isAIGenerated || false,
      generationPrompt: generationPrompt || null,
      aiMetadata: aiMetadata || null,
      canvasId: canvasId || null,
      slideNumber: slideNumber || null,
      backgroundStrategy: backgroundStrategy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [insertedMediaItem] = await db
      .insert(mediaItems)
      .values(newMediaItem)
      .returning();

    return NextResponse.json(insertedMediaItem, { status: 201 });
  } catch (error) {
    console.error("Error creating media item:", error);
    return NextResponse.json(
      { error: "Failed to create media item" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Media item ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns this media item through project relationship
    const existingMediaItem = await db
      .select()
      .from(mediaItems)
      .innerJoin(projects, eq(mediaItems.projectId, projects.id))
      .where(and(eq(mediaItems.id, id), eq(projects.userId, user.id)))
      .limit(1);

    if (existingMediaItem.length === 0) {
      return NextResponse.json(
        { error: "Media item not found or access denied" },
        { status: 404 }
      );
    }

    const [updatedMediaItem] = await db
      .update(mediaItems)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(mediaItems.id, id))
      .returning();

    return NextResponse.json(updatedMediaItem);
  } catch (error) {
    console.error("Error updating media item:", error);
    return NextResponse.json(
      { error: "Failed to update media item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Media item ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns this media item through project relationship
    const existingMediaItem = await db
      .select()
      .from(mediaItems)
      .innerJoin(projects, eq(mediaItems.projectId, projects.id))
      .where(and(eq(mediaItems.id, id), eq(projects.userId, user.id)))
      .limit(1);

    if (existingMediaItem.length === 0) {
      return NextResponse.json(
        { error: "Media item not found or access denied" },
        { status: 404 }
      );
    }

    await db
      .delete(mediaItems)
      .where(eq(mediaItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting media item:", error);
    return NextResponse.json(
      { error: "Failed to delete media item" },
      { status: 500 }
    );
  }
}