import { NextRequest, NextResponse } from 'next/server';
import { cancelWorkflow } from '@/lib/orchestrator/state-manager';

/**
 * POST /api/orchestrator/stop
 * Stop/cancel running workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    await cancelWorkflow(projectId);

    return NextResponse.json({
      success: true,
      message: 'Workflow stopped',
    });
  } catch (error) {
    console.error('[API] Stop workflow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
