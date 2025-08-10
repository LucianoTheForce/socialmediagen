import { NextRequest, NextResponse } from "next/server";
import { db } from "@opencut/db";
import { aiGenerations, projects } from "@opencut/db";
import { auth } from "@/lib/auth/server";
import { eq, and, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    let whereConditions = [eq(aiGenerations.userId, session.user.id)];

    if (projectId) {
      whereConditions.push(eq(aiGenerations.projectId, projectId));
    }

    if (status) {
      whereConditions.push(eq(aiGenerations.status, status));
    }

    // Build and execute query
    const baseQuery = db
      .select()
      .from(aiGenerations)
      .where(and(...whereConditions))
      .orderBy(desc(aiGenerations.createdAt));

    let generations;
    
    // Apply pagination if specified
    if (limit) {
      const limitNum = parseInt(limit);
      if (offset) {
        const offsetNum = parseInt(offset);
        generations = await baseQuery.limit(limitNum).offset(offsetNum);
      } else {
        generations = await baseQuery.limit(limitNum);
      }
    } else {
      generations = await baseQuery;
    }

    return NextResponse.json(generations);
  } catch (error) {
    console.error("Error fetching AI generations:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI generations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      canvasId,
      type,
      prompt,
      options = {},
    } = body;

    if (!type || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields: type, prompt" },
        { status: 400 }
      );
    }

    // Verify project ownership if projectId is provided
    if (projectId) {
      const project = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.userId, session.user.id)
          )
        )
        .limit(1);

      if (project.length === 0) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }
    }

    const newGeneration = {
      id: generateId(),
      userId: session.user.id,
      projectId: projectId || null,
      canvasId: canvasId || null,
      type,
      status: "pending" as const,
      prompt,
      options,
      resultData: null,
      progress: 0,
      currentStep: null,
      estimatedTimeRemaining: null,
      cost: 0,
      startTime: null,
      completedTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [insertedGeneration] = await db
      .insert(aiGenerations)
      .values(newGeneration)
      .returning();

    return NextResponse.json(insertedGeneration, { status: 201 });
  } catch (error) {
    console.error("Error creating AI generation:", error);
    return NextResponse.json(
      { error: "Failed to create AI generation" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns this generation
    const existingGeneration = await db
      .select()
      .from(aiGenerations)
      .where(
        and(
          eq(aiGenerations.id, id),
          eq(aiGenerations.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingGeneration.length === 0) {
      return NextResponse.json(
        { error: "Generation not found or access denied" },
        { status: 404 }
      );
    }

    // Update timestamps based on status changes
    const updateData = { ...updates, updatedAt: new Date() };
    
    if (updates.status === "generating" && !existingGeneration[0].startTime) {
      updateData.startTime = new Date();
    }
    
    if ((updates.status === "completed" || updates.status === "failed") && !existingGeneration[0].completedTime) {
      updateData.completedTime = new Date();
    }

    const [updatedGeneration] = await db
      .update(aiGenerations)
      .set(updateData)
      .where(eq(aiGenerations.id, id))
      .returning();

    return NextResponse.json(updatedGeneration);
  } catch (error) {
    console.error("Error updating AI generation:", error);
    return NextResponse.json(
      { error: "Failed to update AI generation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns this generation
    const existingGeneration = await db
      .select()
      .from(aiGenerations)
      .where(
        and(
          eq(aiGenerations.id, id),
          eq(aiGenerations.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingGeneration.length === 0) {
      return NextResponse.json(
        { error: "Generation not found or access denied" },
        { status: 404 }
      );
    }

    await db.delete(aiGenerations).where(eq(aiGenerations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting AI generation:", error);
    return NextResponse.json(
      { error: "Failed to delete AI generation" },
      { status: 500 }
    );
  }
}