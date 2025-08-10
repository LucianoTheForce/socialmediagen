import { NextRequest, NextResponse } from "next/server";
import { db } from "@opencut/db";
import { aiGenerations } from "@opencut/db";
import { auth } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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
      status,
      progress,
      currentStep,
      estimatedTimeRemaining,
      resultData,
      cost,
    } = body;

    const id = params.id;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Generation ID and status are required" },
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

    const currentGeneration = existingGeneration[0];

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Add optional fields if provided
    if (progress !== undefined) updateData.progress = progress;
    if (currentStep !== undefined) updateData.currentStep = currentStep;
    if (estimatedTimeRemaining !== undefined) updateData.estimatedTimeRemaining = estimatedTimeRemaining;
    if (resultData !== undefined) updateData.resultData = resultData;
    if (cost !== undefined) updateData.cost = cost;

    // Update timestamps based on status changes
    if (status === "generating" && !currentGeneration.startTime) {
      updateData.startTime = new Date();
    }
    
    if ((status === "completed" || status === "failed") && !currentGeneration.completedTime) {
      updateData.completedTime = new Date();
    }

    const [updatedGeneration] = await db
      .update(aiGenerations)
      .set(updateData)
      .where(eq(aiGenerations.id, id))
      .returning();

    return NextResponse.json(updatedGeneration);
  } catch (error) {
    console.error("Error updating generation status:", error);
    return NextResponse.json(
      { error: "Failed to update generation status" },
      { status: 500 }
    );
  }
}