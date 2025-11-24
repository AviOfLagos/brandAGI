import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

/**
 * GET /api/projects
 * List all projects
 */
export async function GET() {
  try {
    const db = getDb();
    const allProjects = await db.select().from(projects);

    return NextResponse.json({
      success: true,
      data: { projects: allProjects },
    });
  } catch (error) {
    console.error('[API] List projects error:', error);
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
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, intakeAnswers } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const projectId = nanoid();

    // Create brand profile from intake answers
    const brandProfile = {
      name,
      industry: intakeAnswers?.industry || '',
      targetAudience: intakeAnswers?.targetAudience || '',
      brandVision: intakeAnswers?.brandVision || '',
      brandValues: intakeAnswers?.brandValues || [],
    };

    await db.insert(projects).values({
      id: projectId,
      name,
      description: description || '',
      status: 'draft',
      brandProfile: JSON.stringify(brandProfile),
      metadata: JSON.stringify({ intakeAnswers }),
    });

    return NextResponse.json({
      success: true,
      data: { projectId, brandProfile },
    });
  } catch (error) {
    console.error('[API] Create project error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
