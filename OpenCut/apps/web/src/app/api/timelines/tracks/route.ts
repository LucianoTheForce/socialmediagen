import { NextRequest, NextResponse } from "next/server";
import { db } from "@opencut/db";
import { timelineTracks, projectCanvases, projects } from "@opencut/db";
import { auth } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";
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
    const canvasId = searchParams.get("canvasId");

    if (!canvasId) {
      return NextResponse.json(
        { error: "Canvas ID is required" },
        { status: 400 }
      );
    }

    // Get timeline tracks for user's canvas
    const tracks = await db
      .select({
        id: timelineTracks.id,
        canvasId: timelineTracks.canvasId,
        name: timelineTracks.name,
        type: timelineTracks.type,
        order: timelineTracks.order,
        muted: timelineTracks.muted,
        isMain: timelineTracks.isMain,
        createdAt: timelineTracks.createdAt,
      })
      .from(timelineTracks)
      .innerJoin(projectCanvases, eq(timelineTracks.canvasId, projectCanvases.id))
      .innerJoin(projects, eq(projectCanvases.projectId, projects.id))
      .where(
        and(
          eq(projects.userId, session.user.id),
          eq(timelineTracks.canvasId, canvasId)
        )
      )
      .orderBy(timelineTracks.order);

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Error fetching timeline tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline tracks" },
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
    const { canvasId, name, type, order = 0, muted = false, isMain = false } = body;

    if (!canvasId || !name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: canvasId, name, type" },
        { status: 400 }
      );
    }

    // Verify user owns this canvas
    const canvas = await db
      .select()
      .from(projectCanvases)
      .innerJoin(projects, eq(projectCanvases.projectId, projects.id))
      .where(
        and(
          eq(projectCanvases.id, canvasId),
          eq(projects.userId, session.user.id)
        )
      )
      .limit(1);

    if (canvas.length === 0) {
      return NextResponse.json(
        { error: "Canvas not found or access denied" },
        { status: 404 }
      );
    }

    const newTrack = {
      id: generateId(),
      canvasId,
      name,
      type,
      order,
      muted,
      isMain,
      createdAt: new Date(),
    };

    const [insertedTrack] = await db
      .insert(timelineTracks)
      .values(newTrack)
      .returning();

    return NextResponse.json(insertedTrack, { status: 201 });
  } catch (error) {
    console.error("Error creating timeline track:", error);
    return NextResponse.json(
      { error: "Failed to create timeline track" },
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
        { error: "Track ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns this track through canvas and project relationships
    const existingTrack = await db
      .select()
      .from(timelineTracks)
      .innerJoin(projectCanvases, eq(timelineTracks.canvasId, projectCanvases.id))
      .innerJoin(projects, eq(projectCanvases.projectId, projects.id))
      .where(
        and(
          eq(timelineTracks.id, id),
          eq(projects.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json(
        { error: "Track not found or access denied" },
        { status: 404 }
      );
    }

    const [updatedTrack] = await db
      .update(timelineTracks)
      .set(updates)
      .where(eq(timelineTracks.id, id))
      .returning();

    return NextResponse.json(updatedTrack);
  } catch (error) {
    console.error("Error updating timeline track:", error);
    return NextResponse.json(
      { error: "Failed to update timeline track" },
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
        { error: "Track ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns this track through canvas and project relationships
    const existingTrack = await db
      .select()
      .from(timelineTracks)
      .innerJoin(projectCanvases, eq(timelineTracks.canvasId, projectCanvases.id))
      .innerJoin(projects, eq(projectCanvases.projectId, projects.id))
      .where(
        and(
          eq(timelineTracks.id, id),
          eq(projects.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json(
        { error: "Track not found or access denied" },
        { status: 404 }
      );
    }

    await db.delete(timelineTracks).where(eq(timelineTracks.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting timeline track:", error);
    return NextResponse.json(
      { error: "Failed to delete timeline track" },
      { status: 500 }
    );
  }
}