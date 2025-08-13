import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { projectCanvases, projects } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const project = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.userId, user.id))
      )
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Get all canvases for the project
    const canvases = await db
      .select()
      .from(projectCanvases)
      .where(eq(projectCanvases.projectId, projectId))
      .orderBy(asc(projectCanvases.slideNumber));

    return NextResponse.json(canvases);
  } catch (error) {
    console.error("Error fetching project canvases:", error);
    return NextResponse.json(
      { error: "Failed to fetch project canvases" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      slideNumber,
      isActive,
      backgroundImage,
      thumbnailUrl,
      slideMetadata,
      format,
    } = body;

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const project = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.userId, user.id))
      )
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Create new canvas
    const [canvas] = await db
      .insert(projectCanvases)
      .values({
        id: randomUUID(),
        projectId,
        slideNumber: slideNumber ?? 1,
        isActive: isActive ?? false,
        backgroundImage: backgroundImage || null,
        thumbnailUrl: thumbnailUrl || null,
        slideMetadata: slideMetadata || {
          slideNumber: slideNumber ?? 1,
          title: "",
          content: "",
          isLoading: false,
        },
        format: format || {
          dimensions: { width: 1080, height: 1080 },
          aspectRatio: "1:1",
          platform: "instagram",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(canvas);
  } catch (error) {
    console.error("Error creating project canvas:", error);
    return NextResponse.json(
      { error: "Failed to create project canvas" },
      { status: 500 }
    );
  }
}