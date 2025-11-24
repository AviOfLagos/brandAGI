import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';

/**
 * POST /api/decisions/[decisionId]/approve
 * Approve a decision and resume workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ decisionId: string }> }
) {
  try {
    const { decisionId } = await params;
    const body = await request.json();
    const { projectId, selectedOption, sessionId } = body;

    if (!projectId || !selectedOption) {
      return NextResponse.json(
        { error: 'projectId and selectedOption are required' },
        { status: 400 }
      );
    }

    const result = await orchestrator.approveDecision(
      projectId,
      decisionId,
      selectedOption,
      sessionId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] Approve decision error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
