import { NextRequest, NextResponse } from "next/server";
import { db } from "@opencut/db";
import { timelineElements, timelineTracks, projectCanvases, projects, mediaItems } from "@opencut/db";
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
    const trackId = searchParams.get("trackId");
    const canvasId = searchParams.get("canvasId");

    if (!trackId && !canvasId) {
      return NextResponse.json(
        { error: "Either trackId or canvasId is required" },
        { status: 400 }
      );
    }

    let whereConditions = [eq(projects.userId, session.user.id)];

    if (trackId) {
      whereConditions.push(eq(timelineElements.trackId, trackId));
    }

    if (canvasId) {
      whereConditions.push(eq(timelineTracks.canvasId, canvasId));
    }

    // Get timeline elements for user's tracks
    const elements = await db
      .select({
        id: timelineElements.id,
        trackId: timelineElements.trackId,
        type: timelineElements.type,
        name: timelineElements.name,
        startTime: timelineElements.startTime,
        duration: timelineElements.duration,
        trimStart: timelineElements.trimStart,
        trimEnd: timelineElements.trimEnd,
        hidden: timelineElements.hidden,
        // Media element properties
        mediaId: timelineElements.mediaId,
        x: timelineElements.x,
        y: timelineElements.y,
        scaleX: timelineElements.scaleX,
        scaleY: timelineElements.scaleY,
        rotation: timelineElements.rotation,
        opacity: timelineElements.opacity,
        objectFit: timelineElements.objectFit,
        alignment: timelineElements.alignment,
        flipHorizontal: timelineElements.flipHorizontal,
        flipVertical: timelineElements.flipVertical,
        borderRadius: timelineElements.borderRadius,
        // Text element properties
        content: timelineElements.content,
        fontSize: timelineElements.fontSize,
        fontFamily: timelineElements.fontFamily,
        color: timelineElements.color,
        backgroundColor: timelineElements.backgroundColor,
        textAlign: timelineElements.textAlign,
        fontWeight: timelineElements.fontWeight,
        fontStyle: timelineElements.fontStyle,
        textDecoration: timelineElements.textDecoration,
        boxMode: timelineElements.boxMode,
        boxWidth: timelineElements.boxWidth,
        boxHeight: timelineElements.boxHeight,
        verticalAlign: timelineElements.verticalAlign,
        createdAt: timelineElements.createdAt,
        updatedAt: timelineElements.updatedAt,
      })
      .from(timelineElements)
      .innerJoin(timelineTracks, eq(timelineElements.trackId, timelineTracks.id))
      .innerJoin(projectCanvases, eq(timelineTracks.canvasId, projectCanvases.id))
      .innerJoin(projects, eq(projectCanvases.projectId, projects.id))
      .where(and(...whereConditions))
      .orderBy(timelineElements.startTime);

    return NextResponse.json(elements);
  } catch (error) {
    console.error("Error fetching timeline elements:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline elements" },
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
      trackId,
      type,
      name,
      startTime,
      duration,
      trimStart = 0,
      trimEnd = 0,
      hidden = false,
      // Media properties
      mediaId,
      x = 0,
      y = 0,
      scaleX = 1,
      scaleY = 1,
      rotation = 0,
      opacity = 1,
      objectFit = 'cover',
      alignment,
      flipHorizontal = false,
      flipVertical = false,
      borderRadius = 0,
      // Text properties
      content,
      fontSize,
      fontFamily,
      color,
      backgroundColor,
      textAlign,
      fontWeight,
      fontStyle,
      textDecoration,
      boxMode,
      boxWidth,
      boxHeight,
      verticalAlign,
    } = body;

    if (!trackId || !type || !name || startTime === undefined || duration === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: trackId, type, name, startTime, duration" },
        { status: 400 }
      );
    }

    // Verify user owns this track
    const track = await db
      .select()
      .from(timelineTracks)
      .innerJoin(projectCanvases, eq(timelineTracks.canvasId, projectCanvases.id))
      .innerJoin(projects, eq(projectCanvases.projectId, projects.id))
      .where(
        and(
          eq(timelineTracks.id, trackId),
          eq(projects.userId, session.user.id)
        )
      )
      .limit(1);

    if (track.length === 0) {
      return NextResponse.json(
        { error: "Track not found or access denied" },
        { status: 404 }
      );
    }

    // If mediaId is provided, verify user owns the media item
    if (mediaId) {
      const media = await db
        .select()
        .from(mediaItems)
        .innerJoin(projects, eq(mediaItems.projectId, projects.id))
        .where(
          and(
            eq(mediaItems.id, mediaId),
            eq(projects.userId, session.user.id)
          )
        )
        .limit(1);

      if (media.length === 0) {
        return NextResponse.json(
          { error: "Media item not found or access denied" },
          { status: 404 }
        );
      }
    }

    const newElement = {
      id: generateId(),
      trackId,
      type,
      name,
      startTime,
      duration,
      trimStart,
      trimEnd,
      hidden,
      // Media properties
      mediaId: mediaId || null,
      x: x || null,
      y: y || null,
      scaleX: scaleX || null,
      scaleY: scaleY || null,
      rotation: rotation || null,
      opacity: opacity || null,
      objectFit: objectFit || null,
      alignment: alignment || null,
      flipHorizontal: flipHorizontal || null,
      flipVertical: flipVertical || null,
      borderRadius: borderRadius || null,
      // Text properties
      content: content || null,
      fontSize: fontSize || null,
      fontFamily: fontFamily || null,
      color: color || null,
      backgroundColor: backgroundColor || null,
      textAlign: textAlign || null,
      fontWeight: fontWeight || null,
      fontStyle: fontStyle || null,
      textDecoration: textDecoration || null,
      boxMode: boxMode || null,
      boxWidth: boxWidth || null,
      boxHeight: boxHeight || null,
      verticalAlign: verticalAlign || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [insertedElement] = await db
      .insert(timelineElements)
      .values(newElement)
      .returning();

    return NextResponse.json(insertedElement, { status: 201 });
  } catch (error) {
    console.error("Error creating timeline element:", error);
    return NextResponse.json(
      { error: "Failed to create timeline element" },
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
        { error: "Element ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns this element through track, canvas and project relationships
    const existingElement = await db
      .select()
      .from(timelineElements)
      .innerJoin(timelineTracks, eq(timelineElements.trackId, timelineTracks.id))
      .innerJoin(projectCanvases, eq(timelineTracks.canvasId, projectCanvases.id))
      .innerJoin(projects, eq(projectCanvases.projectId, projects.id))
      .where(
        and(
          eq(timelineElements.id, id),
          eq(projects.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingElement.length === 0) {
      return NextResponse.json(
        { error: "Element not found or access denied" },
        { status: 404 }
      );
    }

    const [updatedElement] = await db
      .update(timelineElements)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(timelineElements.id, id))
      .returning();

    return NextResponse.json(updatedElement);
  } catch (error) {
    console.error("Error updating timeline element:", error);
    return NextResponse.json(
      { error: "Failed to update timeline element" },
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
        { error: "Element ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns this element through track, canvas and project relationships
    const existingElement = await db
      .select()
      .from(timelineElements)
      .innerJoin(timelineTracks, eq(timelineElements.trackId, timelineTracks.id))
      .innerJoin(projectCanvases, eq(timelineTracks.canvasId, projectCanvases.id))
      .innerJoin(projects, eq(projectCanvases.projectId, projects.id))
      .where(
        and(
          eq(timelineElements.id, id),
          eq(projects.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingElement.length === 0) {
      return NextResponse.json(
        { error: "Element not found or access denied" },
        { status: 404 }
      );
    }

    await db.delete(timelineElements).where(eq(timelineElements.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting timeline element:", error);
    return NextResponse.json(
      { error: "Failed to delete timeline element" },
      { status: 500 }
    );
  }
}