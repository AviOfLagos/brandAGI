import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/projects/[id]
 * Get project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        brandProfile: project.brandProfile ? JSON.parse(project.brandProfile) : null,
        metadata: project.metadata ? JSON.parse(project.metadata) : null,
      },
    });
  } catch (error) {
    console.error('[API] Get project error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status) updates.status = body.status;
    if (body.brandProfile) updates.brandProfile = JSON.stringify(body.brandProfile);

    await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id));

    return NextResponse.json({
      success: true,
      data: { projectId: id },
    });
  } catch (error) {
    console.error('[API] Update project error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
