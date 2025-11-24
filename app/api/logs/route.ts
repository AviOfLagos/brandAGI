import { NextRequest, NextResponse } from 'next/server';
import { logEvent, getProjectLogs, getOwnerVisibleLogs } from '@/lib/agents/output-passer-agent';

/**
 * POST /api/logs
 * Create a log event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const logId = await logEvent(body);

    return NextResponse.json({
      success: true,
      data: { logId },
    });
  } catch (error) {
    console.error('[API] Create log error:', error);
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
 * GET /api/logs
 * Query logs with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const ownerVisible = searchParams.get('ownerVisible') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    const logs = ownerVisible
      ? await getOwnerVisibleLogs(projectId, limit)
      : await getProjectLogs(projectId, limit);

    return NextResponse.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    console.error('[API] Get logs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
