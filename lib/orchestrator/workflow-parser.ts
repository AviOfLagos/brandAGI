import { load } from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';
import type { WorkflowType, WorkflowNodeType } from '@/lib/common/types';

/**
 * Parse YAML workflow definition into typed workflow object
 */
export async function parseWorkflowYAML(filePath: string): Promise<WorkflowType> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = load(content) as any;

    const workflow: WorkflowType = {
      name: data.name,
      description: data.description,
      nodes: data.nodes.map((node: any) => ({
        id: node.id,
        name: node.name,
        agentId: node.agentId,
        dependencies: node.dependencies || [],
        requiresApproval: node.requiresApproval || false,
        retryPolicy: node.retryPolicy,
        runQA: node.runQA !== undefined ? node.runQA : true,
        runCodeReview: node.runCodeReview !== undefined ? node.runCodeReview : true,
      })),
      metadata: data.metadata,
    };

    return workflow;
  } catch (error) {
    throw new Error(`Failed to parse workflow YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load default brand workflow
 */
export async function loadBrandWorkflow(): Promise<WorkflowType> {
  const workflowPath = path.join(process.cwd(), 'workflows', 'brand_workflow.yaml');
  return parseWorkflowYAML(workflowPath);
}

/**
 *Check if a node's dependencies are satisfied
 */
export function areDependenciesSatisfied(
  node: WorkflowNodeType,
  completedNodes: string[]
): boolean {
  return node.dependencies.every(dep => completedNodes.includes(dep));
}

/**
 * Get next executable nodes
 */
export function getNextNodes(
  workflow: WorkflowType,
  completedNodes: string[],
  failedNodes: string[] = []
): WorkflowNodeType[] {
  return workflow.nodes.filter(node => {
    // Skip if already completed or failed
    if (completedNodes.includes(node.id) || failedNodes.includes(node.id)) {
      return false;
    }

    // Check if dependencies are satisfied
    return areDependenciesSatisfied(node, completedNodes);
  });
}

/**
 * Build execution graph (for visualization)
 */
export function buildExecutionGraph(workflow: WorkflowType) {
  const graph: Record<string, string[]> = {};

  workflow.nodes.forEach(node => {
    graph[node.id] = node.dependencies;
  });

  return graph;
}

/**
 * Validate workflow (check for circular dependencies)
 */
export function validateWorkflow(workflow: WorkflowType): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for circular dependencies (simple topological sort)
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (node) {
      for (const dep of node.dependencies) {
        if (hasCycle(dep)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of workflow.nodes) {
    if (hasCycle(node.id)) {
      errors.push(`Circular dependency detected involving node: ${node.id}`);
    }
  }

  // Check that all dependencies exist
  for (const node of workflow.nodes) {
    for (const dep of node.dependencies) {
      const depExists = workflow.nodes.some(n => n.id === dep);
      if (!depExists) {
        errors.push(`Node ${node.id} depends on non-existent node: ${dep}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
