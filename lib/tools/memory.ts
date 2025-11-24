import { getDb } from '@/lib/db';
import { logEvents } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { ToolInputType, ToolOutputType } from '@/lib/common/types';

/**
 * In-memory cache for agent memory (simple implementation)
 * In production, this should use ai-sdk-tools memory or a vector database
 */
const memoryStore = new Map<string, Map<string, any>>();

/**
 * Get project memory store
 */
function getMemoryStore(projectId: string): Map<string, any> {
  if (!memoryStore.has(projectId)) {
    memoryStore.set(projectId, new Map());
  }
  return memoryStore.get(projectId)!;
}

/**
 * Store data in memory
 */
export async function storeMemory(input: ToolInputType): Promise<ToolOutputType> {
  try {
    const { projectId, key, value, metadata } = input.parameters;

    if (!projectId || !key) {
      return {
        success: false,
        error: 'Missing required parameters: projectId and key',
      };
    }

    const memory = getMemoryStore(projectId);
    memory.set(key, { value, metadata, timestamp: new Date().toISOString() });

    return {
      success: true,
      data: { stored: true, key },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to store memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Retrieve data from memory
 */
export async function retrieveMemory(input: ToolInputType): Promise<ToolOutputType> {
  try {
    const { projectId, key } = input.parameters;

    if (!projectId || !key) {
      return {
        success: false,
        error: 'Missing required parameters: projectId and key',
      };
    }

    const memory = getMemoryStore(projectId);
    const data = memory.get(key);

    if (!data) {
      return {
        success: false,
        error: `No data found for key: ${key}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to retrieve memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Search memory (simple keyword search)
 * In production, this should use semantic search with embeddings
 */
export async function searchMemory(input: ToolInputType): Promise<ToolOutputType> {
  try {
    const { projectId, query, limit = 10 } = input.parameters;

    if (!projectId || !query) {
      return {
        success: false,
        error: 'Missing required parameters: projectId and query',
      };
    }

    const memory = getMemoryStore(projectId);
    const results: any[] = [];

    // Simple keyword matching
    const queryLower = query.toLowerCase();
    for (const [key, data] of memory.entries()) {
      const valueStr = JSON.stringify(data.value).toLowerCase();
      if (valueStr.includes(queryLower)) {
        results.push({ key, ...data });
      }
      if (results.length >= limit) break;
    }

    return {
      success: true,
      data: { results, count: results.length },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get agent history from database logs
 */
export async function getAgentHistory(input: ToolInputType): Promise<ToolOutputType> {
  try {
    const { projectId, agentId, limit = 10 } = input.parameters;

    if (!projectId) {
      return {
        success: false,
        error: 'Missing required parameter: projectId',
      };
    }

    const db = getDb();
    const conditions = agentId
      ? and(eq(logEvents.projectId, projectId), eq(logEvents.agentId, agentId))
      : eq(logEvents.projectId, projectId);

    const history = await db
      .select()
      .from(logEvents)
      .where(conditions)
      .orderBy(desc(logEvents.timestamp))
      .limit(limit);

    return {
      success: true,
      data: { history },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get agent history: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Memory management tool for AI agents
 */
export const memoryTool = {
  name: 'memory',
  description: 'Store and retrieve information from agent memory',
  execute: async (input: ToolInputType): Promise<ToolOutputType> => {
    const action = input.parameters.action;

    switch (action) {
      case 'store':
        return storeMemory(input);
      case 'retrieve':
        return retrieveMemory(input);
      case 'search':
        return searchMemory(input);
      case 'history':
        return getAgentHistory(input);
      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Supported actions: store, retrieve, search, history`,
        };
    }
  },
};
