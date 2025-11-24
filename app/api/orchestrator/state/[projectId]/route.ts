import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';

/**
 * GET /api/orchestrator/state/[projectId]
 * Get workflow state for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const state = await orchestrator.getState(projectId);

    if (!state) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No workflow state found',
      });
    }

    return NextResponse.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('[API] Get workflow state error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
