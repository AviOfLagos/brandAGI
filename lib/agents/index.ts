/**
 * Agent Registry - Central registry of all agents
 */

import { outputPasserAgent } from './output-passer-agent';
import { knowledgeAgent } from './knowledge-agent';
import { industryDNAAgent } from './industry-dna-agent';
import { brandBrainAgent } from './brand-brain-agent';
import { strategyAgent } from './strategy-agent';
import { competitorAnalysisAgent } from './competitor-analysis-agent';
import { writerAgent } from './writer-agent';
import { repurposeAgent } from './repurpose-agent';
import { schedulerAgent } from './scheduler-agent';
import { qaAgent, codeReviewAgent } from './qa-code-review-agents';
import type { Agent } from '@/lib/common/types';

/**
 * All available agents
 */
export const agents: Record<string, Agent> = {
  output_passer_agent: outputPasserAgent,
  knowledge_agent: knowledgeAgent,
  industry_dna_agent: industryDNAAgent,
  brand_brain: brandBrainAgent,
  strategy_agent: strategyAgent,
  competitor_analysis: competitorAnalysisAgent,
  writer_agent: writerAgent,
  repurpose_agent: repurposeAgent,
  scheduler_agent: schedulerAgent,
  qa_agent: qaAgent,
  code_review_agent: codeReviewAgent,
};

/**
 * Get agent by ID
 */
export function getAgent(agentId: string): Agent | undefined {
  return agents[agentId];
}

/**
 * Run an agent
 */
export async function runAgent(
  agentId: string,
  input: any,
  projectId: string,
  sessionId?: string,
  context?: any
) {
  const agent = getAgent(agentId);

  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  return agent.run({
    input,
    projectId,
    sessionId,
    context,
  });
}

/**
 * List all available agents
 */
export function listAgents() {
  return Object.values(agents).map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    version: agent.version,
    tools: agent.tools,
  }));
}

export {
  outputPasserAgent,
  knowledgeAgent,
  industryDNAAgent,
  brandBrainAgent,
  strategyAgent,
  competitorAnalysisAgent,
  writerAgent,
  repurposeAgent,
  schedulerAgent,
  qaAgent,
  codeReviewAgent,
};
