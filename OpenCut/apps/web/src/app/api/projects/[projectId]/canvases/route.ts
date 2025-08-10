import { NextRequest, NextResponse } from "next/server";
import { db } from "@opencut/db";
import { projectCanvases, projects } from "@opencut/db";
import { auth } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;

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
        and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
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
      .orderBy(projectCanvases.slideNumber);

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
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
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

    const projectId = params.projectId;

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
        and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
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