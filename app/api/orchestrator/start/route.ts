import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';
import { nanoid } from 'nanoid';

/**
 * POST /api/orchestrator/start
 * Start workflow for a project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, input, sessionId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const session = sessionId || nanoid();
    const result = await orchestrator.startWorkflow(projectId, input || {}, session);

    return NextResponse.json({
      success: true,
      data: result,
      sessionId: session,
    });
  } catch (error) {
    console.error('[API] Start workflow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
