import { getDb } from '@/lib/db';
import { workflowStates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { WorkflowStatus } from '@/lib/common/types';

export interface WorkflowState {
  id: string;
  projectId: string;
  currentNode: string | null;
  completedNodes: string[];
  failedNodes: string[];
  pendingDecisions: string[];
  status: WorkflowStatus;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create new workflow state
 */
export async function createWorkflowState(projectId: string): Promise<string> {
  const db = getDb();
  const stateId = nanoid();

  await db.insert(workflowStates).values({
    id: stateId,
    projectId,
    currentNode: null,
    completedNodes: JSON.stringify([]),
    failedNodes: JSON.stringify([]),
    pendingDecisions: JSON.stringify([]),
    status: 'running',
    metadata: JSON.stringify({}),
  });

  return stateId;
}

/**
 * Get workflow state
 */
export async function getWorkflowState(projectId: string): Promise<WorkflowState | null> {
  const db = getDb();

  const [state] = await db
    .select()
    .from(workflowStates)
    .where(eq(workflowStates.projectId, projectId))
    .orderBy(workflowStates.createdAt)
    .limit(1);

  if (!state) {
    return null;
  }

  return {
    id: state.id,
    projectId: state.projectId,
    currentNode: state.currentNode,
    completedNodes: JSON.parse(state.completedNodes || '[]'),
    failedNodes: JSON.parse(state.failedNodes || '[]'),
    pendingDecisions: JSON.parse(state.pendingDecisions || '[]'),
    status: state.status as WorkflowStatus,
    metadata: JSON.parse(state.metadata || '{}'),
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
}

/**
 * Update workflow state
 */
export async function updateWorkflowState(
  projectId: string,
  updates: Partial<WorkflowState>
): Promise<void> {
  const db = getDb();

  const dbUpdates: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.currentNode !== undefined) {
    dbUpdates.currentNode = updates.currentNode;
  }

  if (updates.completedNodes) {
    dbUpdates.completedNodes = JSON.stringify(updates.completedNodes);
  }

  if (updates.failedNodes) {
    dbUpdates.failedNodes = JSON.stringify(updates.failedNodes);
  }

  if (updates.pendingDecisions) {
    dbUpdates.pendingDecisions = JSON.stringify(updates.pendingDecisions);
  }

  if (updates.status) {
    dbUpdates.status = updates.status;
  }

  if (updates.metadata) {
    dbUpdates.metadata = JSON.stringify(updates.metadata);
  }

  await db
    .update(workflowStates)
    .set(dbUpdates)
    .where(eq(workflowStates.projectId, projectId));
}

/**
 * Mark node as completed
 */
export async function markNodeComplete(projectId: string, nodeId: string): Promise<void> {
  const state = await getWorkflowState(projectId);
  
  if (!state) {
    throw new Error(`Workflow state not found for project: ${projectId}`);
  }

  const completedNodes = [...state.completedNodes, nodeId];
  
  await updateWorkflowState(projectId, {
    completedNodes,
    currentNode: null,
  });
}

/**
 * Mark node as failed
 */
export async function markNodeFailed(projectId: string, nodeId: string): Promise<void> {
  const state = await getWorkflowState(projectId);
  
  if (!state) {
    throw new Error(`Workflow state not found for project: ${projectId}`);
  }

  const failedNodes = [...state.failedNodes, nodeId];
  
  await updateWorkflowState(projectId, {
    failedNodes,
    currentNode: null,
    status: 'failed',
  });
}

/**
 * Add pending decision
 */
export async function addPendingDecision(projectId: string, decisionId: string): Promise<void> {
  const state = await getWorkflowState(projectId);
  
  if (!state) {
    throw new Error(`Workflow state not found for project: ${projectId}`);
  }

  const pendingDecisions = [...state.pendingDecisions, decisionId];
  
  await updateWorkflowState(projectId, {
    pendingDecisions,
    status: 'paused',
  });
}

/**
 * Remove pending decision (when approved/rejected)
 */
export async function removePendingDecision(projectId: string, decisionId: string): Promise<void> {
  const state = await getWorkflowState(projectId);
  
  if (!state) {
    throw new Error(`Workflow state not found for project: ${projectId}`);
  }

  const pendingDecisions = state.pendingDecisions.filter(id => id !== decisionId);
  
  await updateWorkflowState(projectId, {
    pendingDecisions,
    status: pendingDecisions.length > 0 ? 'paused' : 'running',
  });
}

/**
 * Set current node
 */
export async function setCurrentNode(projectId: string, nodeId: string): Promise<void> {
  await updateWorkflowState(projectId, {
    currentNode: nodeId,
  });
}

/**
 * Complete workflow
 */
export async function completeWorkflow(projectId: string): Promise<void> {
  await updateWorkflowState(projectId, {
    status: 'completed',
    currentNode: null,
  });
}

/**
 * Delete workflow state (for resetting)
 */
export async function deleteWorkflowState(projectId: string): Promise<void> {
  const db = getDb();
  
  await db
    .delete(workflowStates)
    .where(eq(workflowStates.projectId, projectId));
}

/**
 * Cancel/stop running workflow
 */
export async function cancelWorkflow(projectId: string): Promise<void> {
  await updateWorkflowState(projectId, {
    status: 'failed', // Mark as failed to stop execution
    currentNode: null,
  });
}
