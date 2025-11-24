/**
 * Tool registry - exports all available tools
 */

import { fileStorageTool } from './file-storage';
import { memoryTool } from './memory';
import { embedderTool } from './embedder';
import { webScoutTool } from './web-scout';
import { artifactGeneratorTool } from './artifact-generator';
import type { Tool } from '@/lib/common/types';

export const tools: Record<string, Tool> = {
  file_storage: fileStorageTool,
  memory: memoryTool,
  embedder: embedderTool,
  web_scout: webScoutTool,
  artifact_generator: artifactGeneratorTool,
};

/**
 * Get tool by name
 */
export function getTool(name: string): Tool | undefined {
  return tools[name];
}

/**
 * Execute tool by name
 */
export async function executeTool(toolName: string, parameters: any, context?: any) {
  const tool = getTool(toolName);
  
  if (!tool) {
    return {
      success: false,
      error: `Tool not found: ${toolName}`,
    };
  }

  return tool.execute({
    toolName,
    parameters,
    context,
  });
}

export { fileStorageTool, memoryTool, embedderTool, webScoutTool, artifactGeneratorTool };
