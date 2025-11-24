import { executeTool } from '@/lib/tools';
import { logEvent } from './output-passer-agent';
import { getDb } from '@/lib/db';
import { decisions } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import type { Agent, AgentInput, AgentOutputType } from '@/lib/common/types';

/**
 * Strategy Agent - Produces content strategy and calendar with decision point
 * THIS AGENT INCLUDES A DECISION NODE - workflow must pause for owner approval
 */
export const strategyAgent: Agent = {
  id: 'strategy_agent',
  name: 'StrategyAgent',
  description: 'Produces content strategy document and 30-day content calendar',
  version: '1.0.0',
  tools: ['artifact_generator', 'memory'],

  run: async (input: AgentInput): Promise<AgentOutputType> => {
    const startTime = Date.now();
    const { input: userInput, projectId, sessionId, context } = input;

    try {
      await logEvent({
        agentId: 'strategy_agent',
        agentName: 'StrategyAgent',
        eventType: 'emit',
        payloadType: 'strategy',
        payloadSummary: 'Starting content strategy development',
        projectId,
        sessionId,
        ownerVisible: true,
      });

      // Get brand profile from memory
      const brandResult = await executeTool('memory', {
        action: 'retrieve',
        projectId,
        key: 'brand_profile',
      });

      const brandProfile = brandResult.success ? brandResult.data.value : null;

      if (!brandProfile) {
        throw new Error('Brand profile not found - BrandBrain must run first');
      }

      // Generate two strategy options: safe and bold
      const safeStrategy = await executeTool('artifact_generator', {
        action: 'content_strategy',
        brandProfile,
        approach: 'safe',
      });

      const boldStrategy = await executeTool('artifact_generator', {
        action: 'content_strategy',
        brandProfile,
        approach: 'bold',
      });

      if (!safeStrategy.success || !boldStrategy.success) {
        throw new Error('Strategy generation failed');
      }

      // Create decision point for owner approval
      const db = getDb();
      const decisionId = nanoid();

      const decisionOptions = [
        {
          id: 'safe',
          label: 'Safe Approach',
          description: 'Conservative posting frequency, focus on proven content types',
          confidence: 0.85,
          provenance: 'Based on industry best practices and proven strategies',
          strategy: safeStrategy.data.artifact,
        },
        {
          id: 'balanced',
          label: 'Balanced Approach',
          description: 'Mix of safe and experimental content, moderate posting frequency',
          confidence: 0.82,
          provenance: 'Optimized balance of risk and growth potential',
          strategy: {
            ...safeStrategy.data.artifact,
            approach: 'balanced',
            postingFrequency: {
              linkedin: '4x/week',
              x: 'daily',
              medium: '3x/month',
            },
          },
        },
        {
          id: 'bold',
          label: 'Bold Approach',
          description: 'Aggressive posting frequency, experimental content formats',
          confidence: 0.75,
          provenance: 'High-growth strategy with calculated risks',
          strategy: boldStrategy.data.artifact,
        },
      ];

      // Store decision in database
      await db.insert(decisions).values({
        id: decisionId,
        projectId,
        agentId: 'strategy_agent',
        question: 'Which content strategy approach would you like to pursue?',
        options: JSON.stringify(decisionOptions.map(({ strategy, ...opt }) => opt)),
        status: 'pending',
        metadata: JSON.stringify({
          options: decisionOptions,
          createdBy: 'StrategyAgent',
        }),
      });

      // Log decision event
      await logEvent({
        agentId: 'strategy_agent',
        agentName: 'StrategyAgent',
        eventType: 'decision',
        payloadType: 'decision',
        payloadSummary: `Decision required: Choose content strategy approach (${decisionOptions.length} options)`,
        confidence: 0.82,
        provenance: 'StrategyAgent',
        projectId,
        sessionId,
        ownerVisible: true,
        metadata: {
          decisionId,
          optionCount: decisionOptions.length,
        },
      });

      // Return PENDING result - workflow will pause here
      return {
        success: true,
        data: {
          content_strategy: null, // Will be set after approval
          content_calendar: null,
          strategy_options: decisionOptions.map(({ strategy, ...opt }) => opt),
          decision_id: decisionId,
          status: 'awaiting_approval',
          confidence_score: 0.82,
          provenance: 'StrategyAgent - generated options, awaiting owner decision',
        },
        confidence: 0.82,
        provenance: 'StrategyAgent',
        nextSteps: [`Awaiting decision approval: ${decisionId}`],
      };
    } catch (error) {
      await logEvent({
        agentId: 'strategy_agent',
        agentName: 'StrategyAgent',
        eventType: 'error',
        payloadSummary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        projectId,
        sessionId,
        ownerVisible: true,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        confidence: 0,
        provenance: 'StrategyAgent',
      };
    }
  },
};

/**
 * Process decision approval and continue strategy creation
 */
export async function processStrategyDecision(
  projectId: string,
  decisionId: string,
  selectedOption: string,
  sessionId?: string
): Promise<AgentOutputType> {
  try {
    const db = getDb();
    const { eq } = await import('drizzle-orm');

    // Get decision from database
    const [decision] = await db
      .select()
      .from(decisions)
      .where(eq(decisions.id, decisionId))
      .limit(1);

    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }

    const metadata = JSON.parse(decision.metadata || '{}');
    const selectedStrategy = metadata.options.find((opt: any) => opt.id === selectedOption);

    if (!selectedStrategy) {
      throw new Error(`Invalid option selected: ${selectedOption}`);
    }

    // Update decision as approved
    await db
      .update(decisions)
      .set({
        selectedOption,
        approvedAt: new Date().toISOString(),
        status: 'approved',
      })
      .where(eq(decisions.id, decisionId));

    // Generate content calendar based on selected strategy
    const calendarResult = await executeTool('artifact_generator', {
      action: 'content_calendar',
      strategy: selectedStrategy.strategy,
      days: 30,
    });

    if (!calendarResult.success) {
      throw new Error('Calendar generation failed');
    }

    // Store approved strategy in memory
    await executeTool('memory', {
      action: 'store',
      projectId,
      key: 'content_strategy',
      value: selectedStrategy.strategy,
      metadata: { approach: selectedOption, decisionId },
    });

    // Save artifacts
    await executeTool('file_storage', {
      action: 'save',
      projectId,
      type: 'content_strategy',
      content: selectedStrategy.strategy,
      filename: 'content_strategy.json',
    });

    await executeTool('file_storage', {
      action: 'save',
      projectId,
      type: 'content_calendar',
      content: calendarResult.data.artifact,
      filename: 'content_calendar.json',
    });

    // Log completion
    await logEvent({
      agentId: 'strategy_agent',
      agentName: 'StrategyAgent',
      eventType: 'emit',
      payloadType: 'strategy',
      payloadSummary: `Strategy approved: ${selectedOption} approach with ${calendarResult.data.artifact.entries.length} calendar entries`,
      confidence: selectedStrategy.confidence,
      provenance: `StrategyAgent - ${selectedOption} strategy approved and calendar created`,
      projectId,
      sessionId,
      ownerVisible: true,
      metadata: { decisionId, selectedOption },
    });

    return {
      success: true,
      data: {
        content_strategy: selectedStrategy.strategy,
        content_calendar: calendarResult.data.artifact,
        selectedApproach: selectedOption,
        confidence_score: selectedStrategy.confidence,
        provenance: `StrategyAgent - ${selectedOption} approach approved`,
      },
      confidence: selectedStrategy.confidence,
      provenance: 'StrategyAgent',
      artifacts: [`${projectId}_content_strategy`, `${projectId}_content_calendar`],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
      confidence: 0,
      provenance: 'StrategyAgent',
    };
  }
}
