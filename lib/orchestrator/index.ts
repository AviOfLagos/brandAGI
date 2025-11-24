import { runAgent } from '@/lib/agents';
import { qaAgent, codeReviewAgent } from '@/lib/agents/qa-code-review-agents';
import { loadBrandWorkflow, getNextNodes, validateWorkflow } from './workflow-parser';
import {
  createWorkflowState,
  getWorkflowState,
  setCurrentNode,
  markNodeComplete,
  markNodeFailed,
  addPendingDecision,
  removePendingDecision,
  completeWorkflow,
  deleteWorkflowState,
} from './state-manager';
import { logEvent } from '@/lib/agents/output-passer-agent';
import type { WorkflowType, WorkflowNodeType, AgentOutputType } from '@/lib/common/types';

/**
 * Master Orchestrator - Controls workflow execution with dependency gating
 */
export class MasterOrchestrator {
  private workflow: WorkflowType | null = null;

  /**
   * Initialize orchestrator with workflow
   */
  async initialize() {
    this.workflow = await loadBrandWorkflow();
    
    // Validate workflow
    const validation = validateWorkflow(this.workflow);
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
    }

    console.log('[Orchestrator] Initialized with workflow:', this.workflow.name);
  }

  /**
   * Start workflow for a project
   */
  async startWorkflow(projectId: string, input: any, sessionId?: string): Promise<any> {
    if (!this.workflow) {
      await this.initialize();
    }

    // Check if there's existing workflow state
    const existingState = await getWorkflowState(projectId);
    
    if (existingState) {
      console.log('[Orchestrator] Found existing workflow state:', existingState.status);
      
      // If workflow is already running or paused, continue it
      if (existingState.status === 'running' || existingState.status === 'paused') {
        console.log('[Orchestrator] Resuming existing workflow');
        return this.executeNextNodes(projectId, input, sessionId);
      }
      
      // If workflow is failed or completed, create a new state (fresh start)
      console.log('[Orchestrator] Resetting failed/completed workflow state');
      await deleteWorkflowState(projectId);
    }

    // Create fresh workflow state
    const stateId = await createWorkflowState(projectId);
    console.log('[Orchestrator] Created new workflow state:', stateId);
    
    await logEvent({
      agentId: 'orchestrator',
      agentName: 'MasterOrchestrator',
      eventType: 'emit',
      payloadSummary: `Started workflow: ${this.workflow!.name}`,
      projectId,
      sessionId,
      ownerVisible: true,
    });

    console.log('[Orchestrator] About to call executeNextNodes...');

    // Execute nodes and wait for completion
    try {
      const result = await this.executeNextNodes(projectId, input, sessionId);
      console.log('[Orchestrator] executeNextNodes returned:', result);
      return result;
    } catch (error) {
      console.error('[Orchestrator] executeNextNodes error:', error);
      throw error;
    }
  }

  /**
   * Execute next available nodes
   */
  async executeNextNodes(projectId: string, input: any, sessionId?: string): Promise<any> {
    console.log('[Orchestrator] === executeNextNodes CALLED ===');
    console.log('[Orchestrator] projectId:', projectId);
    console.log('[Orchestrator] input:', input);
    
    if (!this.workflow) {
      console.log('[Orchestrator] No workflow, initializing...');
      await this.initialize();
    }

    console.log('[Orchestrator] Getting workflow state...');
    const state = await getWorkflowState(projectId);
    console.log('[Orchestrator] State:', state);
    
    if (!state) {
      throw new Error('Workflow state not found');
    }

    // Check if workflow is paused (awaiting decision)
    if (state.status === 'paused') {
      return {
        status: 'paused',
        message: 'Workflow paused - awaiting decision approval',
        pendingDecisions: state.pendingDecisions,
      };
    }

    // Check if workflow is complete or failed
    if (state.status === 'completed' || state.status === 'failed') {
      return {
        status: state.status,
        completedNodes: state.completedNodes,
        failedNodes: state.failedNodes,
      };
    }

    // Get next nodes to execute
    const nextNodes = getNextNodes(this.workflow!, state.completedNodes, state.failedNodes);
    
    console.log(`[Orchestrator] Next nodes to execute:`, nextNodes.map(n => n.id));
    console.log(`[Orchestrator] Completed nodes:`, state.completedNodes);
    console.log(`[Orchestrator] Failed nodes:`, state.failedNodes);

    if (nextNodes.length === 0) {
      console.log('[Orchestrator] No more nodes - workflow complete');
      // No more nodes - workflow complete
      await completeWorkflow(projectId);
      
      await logEvent({
        agentId: 'orchestrator',
        agentName: 'MasterOrchestrator',
        eventType: 'emit',
        payloadSummary: 'Workflow completed successfully',
        projectId,
        sessionId,
        ownerVisible: true,
      });

      return {
        status: 'completed',
        completedNodes: state.completedNodes,
      };
    }

    // Execute nodes (sequentially to maintain order)
    const results = [];
    for (const node of nextNodes) {
      const result = await this.executeNode(node, projectId, input, sessionId);
      results.push(result);

      // If node requires approval, pause workflow
      if (result.requiresApproval) {
        break; // Stop executing further nodes
      }
    }

    console.log('[Orchestrator] Batch execution complete, results:', results);

    // Check if any nodes require approval
    const hasApproval = results.some(r => r.requiresApproval);
    
    if (hasApproval) {
      console.log('[Orchestrator] Workflow paused for approval');
      return {
        status: 'paused',
        executedNodes: results,
      };
    }

    // Continue executing next nodes automatically
    console.log('[Orchestrator] Continuing to next batch of nodes...');
    return this.executeNextNodes(projectId, input, sessionId);
  }

  /**
   * Execute a single workflow node
   */
  private async executeNode(
    node: WorkflowNodeType,
    projectId: string,
    input: any,
    sessionId?: string
  ): Promise<any> {
    console.log(`[Orchestrator] Executing node: ${node.id} (${node.agentId})`);

    await setCurrentNode(projectId, node.id);

    await logEvent({
      agentId: 'orchestrator',
      agentName: 'MasterOrchestrator',
      eventType: 'emit',
      payloadSummary: `Starting node: ${node.name} (${node.agentId})`,
      projectId,
      sessionId,
      ownerVisible: true,
      metadata: { nodeId: node.id },
    });

    let retries = 0;
    const maxRetries = node.retryPolicy?.maxRetries || 0;
    let lastError: Error | null = null;

    while (retries <= maxRetries) {
      try {
        // Execute agent
        const agentResult: AgentOutputType = await runAgent(
          node.agentId,
          input,
          projectId,
          sessionId
        );

        if (!agentResult.success) {
          throw new Error(agentResult.error || 'Agent execution failed');
        }

        // Run QA checks if configured
        if (node.runQA) {
          const qaResult = await qaAgent.run({
            input: agentResult.data,
            projectId,
            sessionId,
          });

          if (qaResult.success && qaResult.data && !qaResult.data.pass) {
            console.warn(`[Orchestrator] QA failed for ${node.id}:`, qaResult.data.issues);
            // Log warning but don't fail the node
          }
        }

        // Run code review if configured
        if (node.runCodeReview) {
          const reviewResult = await codeReviewAgent.run({
            input: agentResult.data,
            projectId,
            sessionId,
          });

          if (reviewResult.success && reviewResult.data && !reviewResult.data.approved) {
            console.warn(`[Orchestrator] Code review flagged issues for ${node.id}:`, reviewResult.data.feedback);
            // Log warning but don't fail
          }
        }

        // Check if node requires approval
        if (node.requiresApproval) {
          // Agent should have created a decision
          if (agentResult.data && 'decision_id' in agentResult.data) {
            await addPendingDecision(projectId, agentResult.data.decision_id);

            await logEvent({
              agentId: 'orchestrator',
              agentName: 'MasterOrchestrator',
              eventType: 'decision',
              payloadSummary: `Node ${node.name} requires approval - workflow paused`,
              projectId,
              sessionId,
              ownerVisible: true,
              metadata: { nodeId: node.id, decisionId: agentResult.data.decision_id },
            });

            return {
              nodeId: node.id,
              status: 'awaiting_approval',
              requiresApproval: true,
              decisionId: agentResult.data.decision_id,
              result: agentResult,
            };
          }
        }

        // Node completed successfully
        await markNodeComplete(projectId, node.id);

        await logEvent({
          agentId: 'orchestrator',
          agentName: 'MasterOrchestrator',
          eventType: 'emit',
          payloadSummary: `Completed node: ${node.name}`,
          projectId,
          sessionId,
          ownerVisible: true,
          metadata: { nodeId: node.id },
        });

        return {
          nodeId: node.id,
          status: 'completed',
          requiresApproval: false,
          result: agentResult,
        };
      } catch (error) {
        lastError = error as Error;
        retries++;

        if (retries <= maxRetries) {
          const backoffMs = node.retryPolicy?.backoffMs || 1000;
          const delay = backoffMs * Math.pow(2, retries - 1); // Exponential backoff
          
          console.warn(`[Orchestrator] Node ${node.id} failed, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted - mark as failed
    await markNodeFailed(projectId, node.id);

    await logEvent({
      agentId: 'orchestrator',
      agentName: 'MasterOrchestrator',
      eventType: 'error',
      payloadSummary: `Node ${node.name} failed after ${retries} retries: ${lastError?.message}`,
      projectId,
      sessionId,
      ownerVisible: true,
      metadata: { nodeId: node.id, error: lastError?.message },
    });

    return {
      nodeId: node.id,
      status: 'failed',
      error: lastError?.message,
    };
  }

  /**
   * Approve decision and resume workflow
   */
  async approveDecision(
    projectId: string,
    decisionId: string,
    selectedOption: string,
    sessionId?: string
  ): Promise<any> {
    // Remove from pending decisions
    await removePendingDecision(projectId, decisionId);

    await logEvent({
      agentId: 'orchestrator',
      agentName: 'MasterOrchestrator',
      eventType: 'emit',
      payloadSummary: `Decision approved: ${decisionId} - option: ${selectedOption}`,
      projectId,
      sessionId,
      ownerVisible: true,
      metadata: { decisionId, selectedOption },
    });

    // Process the decision (agent-specific logic)
    // For now, we'll handle strategy agent decisions
    const { processStrategyDecision } = await import('@/agents/strategy-agent');
    const result = await processStrategyDecision(projectId, decisionId, selectedOption, sessionId);

    if (result.success) {
      // Mark strategy node as complete
      const state = await getWorkflowState(projectId);
      if (state && state.currentNode) {
        await markNodeComplete(projectId, state.currentNode);
      }

      // Continue workflow
      return this.executeNextNodes(projectId, {}, sessionId);
    }

    return result;
  }

  /**
   * Get workflow state
   */
  async getState(projectId: string) {
    return getWorkflowState(projectId);
  }
}

// Export singleton instance
export const orchestrator = new MasterOrchestrator();
