import { getDb } from '@/lib/db';
import { logEvents } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Agent, AgentInput, AgentOutputType, LogEventType } from '@/lib/common/types';

/**
 * Output Passer Agent - Universal logger that receives all agent events
 * This agent is responsible for persisting all events to the database
 * and making them available for frontend consumption
 */

/**
 * Log an event to the database
 */
export async function logEvent(event: Partial<LogEventType>): Promise<string> {
  const db = getDb();
  
  const logId = event.id || nanoid();
  const timestamp = event.timestamp || new Date().toISOString();

  const logEntry = {
    id: logId,
    timestamp,
    agentId: event.agentId || 'unknown',
    agentName: event.agentName || 'unknown',
    eventType: event.eventType || 'emit',
    payloadType: event.payloadType,
    payloadSummary: event.payloadSummary,
    payloadLink: event.payloadLink,
    confidence: event.confidence,
    provenance: event.provenance,
    dependencies: event.dependencies ? JSON.stringify(event.dependencies) : null,
    consumedBy: event.consumedBy ? JSON.stringify(event.consumedBy) : null,
    ownerVisible: event.ownerVisible ?? false,
    metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    projectId: event.projectId,
    sessionId: event.sessionId,
  };

  await db.insert(logEvents).values(logEntry);
  
  console.log(`[OutputPasser] Logged event: ${logId} - ${event.agentName} - ${event.eventType}`);
  
  return logId;
}

/**
 * Get logs for a project
 */
export async function getProjectLogs(projectId: string, limit = 100) {
  const db = getDb();
  const logs = await db
    .select()
    .from(logEvents)
    .where(eq(logEvents.projectId, projectId))
    .orderBy(desc(logEvents.timestamp))
    .limit(limit);

  return logs;
}

/**
 * Get logs for a session
 */
export async function getSessionLogs(sessionId: string) {
  const db = getDb();
  const { eq, desc } = await import('drizzle-orm');
  const logs = await db
    .select()
    .from(logEvents)
    .where(eq(logEvents.sessionId, sessionId))
    .orderBy(desc(logEvents.timestamp));

  return logs;
}

/**
 * Get owner-visible logs (for frontend display)
 */
export async function getOwnerVisibleLogs(projectId: string, limit = 50) {
  const db = getDb();
  const { eq, and, desc } = await import('drizzle-orm');
  const logs = await db
    .select()
    .from(logEvents)
    .where(and(
      eq(logEvents.projectId, projectId),
      eq(logEvents.ownerVisible, true)
    ))
    .orderBy(desc(logEvents.timestamp))
    .limit(limit);

  return logs;
}

/**
 * Output Passer Agent implementation
 */
export const outputPasserAgent: Agent = {
  id: 'output_passer_agent',
  name: 'OutputPasser',
  description: 'Universal logger that receives and persists all agent events',
  version: '1.0.0',
  tools: [],
  
  run: async (input: AgentInput): Promise<AgentOutputType> => {
    try {
      const { input: eventData, projectId, sessionId } = input;

      // If input is a log event, persist it
      if (typeof eventData === 'object' && 'agentId' in eventData) {
        const logId = await logEvent({
          ...eventData as Partial<LogEventType>,
          projectId,
          sessionId,
        });

        return {
          success: true,
          data: { logId, status: 'logged' },
          confidence: 1.0,
          provenance: 'OutputPasserAgent',
        };
      }

      // Otherwise, log the input as a generic event
      const logId = await logEvent({
        agentId: 'output_passer_agent',
        agentName: 'OutputPasser',
        eventType: 'emit',
        payloadSummary: typeof eventData === 'string' ? eventData : JSON.stringify(eventData),
        projectId,
        sessionId,
        ownerVisible: true,
      });

      return {
        success: true,
        data: { logId },
        confidence: 1.0,
        provenance: 'OutputPasserAgent',
      };
    } catch (error) {
      console.error('[OutputPasser] Error logging event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        confidence: 0,
        provenance: 'OutputPasserAgent',
      };
    }
  },
};

// Export helper functions for use throughout the system
export { logEvent as default };
