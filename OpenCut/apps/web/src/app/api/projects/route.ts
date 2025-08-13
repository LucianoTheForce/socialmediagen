import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";
import { db } from "@/lib/db";
import { projects, projectCanvases } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user?.id) {
      console.error("Auth error in GET /api/projects:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching projects for user:", user.id);

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not configured");
      return NextResponse.json(
        { error: "Database configuration error. Please check environment variables." },
        { status: 500 }
      );
    }

    // Get user's projects with their canvas count
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        templateId: projects.templateId,
        tags: projects.tags,
        carouselMetadata: projects.carouselMetadata,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(desc(projects.updatedAt));

    // Get canvas counts for each project
    const projectsWithCanvasCount = await Promise.all(
      userProjects.map(async (project) => {
        const canvasCount = await db
          .select()
          .from(projectCanvases)
          .where(eq(projectCanvases.projectId, project.id));
        
        return {
          ...project,
          canvasCount: canvasCount.length,
        };
      })
    );

    return NextResponse.json({
      projects: projectsWithCanvasCount,
      total: userProjects.length
    });
  } catch (error) {
    console.error("Error fetching projects - Full error:", error);
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL") || error.message.includes("postgres") || error.message.includes("connection")) {
        return NextResponse.json(
          {
            error: "Database connection error. Please ensure DATABASE_URL is configured in environment variables.",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      {
        error: "Failed to fetch projects",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user?.id) {
      console.error("Auth error in POST /api/projects:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Creating project with data:", { name: body.name, hasCarouselMetadata: !!body.carouselMetadata });
    
    const { name, templateId, tags = [], carouselMetadata, canvases = [] } = body;

    if (!name || !carouselMetadata) {
      console.error("Missing required fields:", { name: !!name, carouselMetadata: !!carouselMetadata });
      return NextResponse.json(
        { error: "Name and carousel metadata are required" },
        { status: 400 }
      );
    }

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not configured");
      return NextResponse.json(
        { error: "Database configuration error. Please check environment variables." },
        { status: 500 }
      );
    }

    const projectId = generateId();

    // Create the project
    const [newProject] = await db
      .insert(projects)
      .values({
        id: projectId,
        name,
        userId: user.id,
        templateId: templateId || null,
        tags,
        carouselMetadata,
      })
      .returning();

    // Create canvases if provided
    if (canvases.length > 0) {
      const canvasData = canvases.map((canvas: any, index: number) => ({
        id: generateId(),
        projectId,
        slideNumber: index + 1,
        isActive: index === 0, // First canvas is active
        backgroundImage: canvas.backgroundImage || null,
        thumbnailUrl: canvas.thumbnailUrl || null,
        slideMetadata: canvas.slideMetadata || {
          slideNumber: index + 1,
          title: canvas.title || "",
          content: canvas.content || "",
        },
        format: canvas.format || carouselMetadata.format || {
          dimensions: { width: 1080, height: 1080 },
          aspectRatio: "1:1",
          platform: "instagram",
        },
      }));

      await db.insert(projectCanvases).values(canvasData);
    } else {
      // Create a default canvas
      await db.insert(projectCanvases).values({
        id: generateId(),
        projectId,
        slideNumber: 1,
        isActive: true,
        slideMetadata: {
          slideNumber: 1,
          title: "",
          content: "",
        },
        format: {
          dimensions: { width: 1080, height: 1080 },
          aspectRatio: "1:1",
          platform: "instagram",
        },
      });
    }

    return NextResponse.json({
      project: newProject,
      message: "Project created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating project - Full error:", error);
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL") || error.message.includes("postgres") || error.message.includes("connection")) {
        return NextResponse.json(
          {
            error: "Database connection error. Please ensure DATABASE_URL is configured in environment variables.",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}