import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import type { ToolInputType, ToolOutputType } from '@/lib/common/types';

const ARTIFACTS_DIR = './artifacts';

/**
 * Ensure artifacts directory exists
 */
async function ensureArtifactsDir(projectId: string) {
  const projectDir = path.join(ARTIFACTS_DIR, projectId);
  await fs.mkdir(projectDir, { recursive: true });
  return projectDir;
}

/**
 * Save artifact to file system
 */
export async function saveArtifact(input: ToolInputType): Promise<ToolOutputType> {
  try {
    const { projectId, type, content, filename } = input.parameters;

    if (!projectId || !content) {
      return {
        success: false,
        error: 'Missing required parameters: projectId and content',
      };
    }

    const projectDir = await ensureArtifactsDir(projectId);
    const artifactId = nanoid();
    const fileName = filename || `${type}_${artifactId}.json`;
    const filePath = path.join(projectDir, fileName);

    // Write content to file
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await fs.writeFile(filePath, contentStr, 'utf-8');

    return {
      success: true,
      data: {
        artifactId,
        filePath,
        fileName,
      },
      metadata: {
        size: contentStr.length,
        type,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save artifact: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get artifact from file system
 */
export async function getArtifact(input: ToolInputType): Promise<ToolOutputType> {
  try {
    const { projectId, fileName, artifactId } = input.parameters;

    if (!projectId) {
      return {
        success: false,
        error: 'Missing required parameter: projectId',
      };
    }

    const projectDir = path.join(ARTIFACTS_DIR, projectId);
    let filePath: string;

    if (fileName) {
      filePath = path.join(projectDir, fileName);
    } else if (artifactId) {
      // Find file by artifact ID pattern
      const files = await fs.readdir(projectDir);
      const matchingFile = files.find(f => f.includes(artifactId));
      
      if (!matchingFile) {
        return {
          success: false,
          error: `Artifact not found with ID: ${artifactId}`,
        };
      }
      
      filePath = path.join(projectDir, matchingFile);
    } else {
      return {
        success: false,
        error: 'Must provide either fileName or artifactId',
      };
    }

    const content = await fs.readFile(filePath, 'utf-8');

    return {
      success: true,
      data: {
        content,
        filePath,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get artifact: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * List all artifacts for a project
 */
export async function listArtifacts(input: ToolInputType): Promise<ToolOutputType> {
  try {
    const { projectId } = input.parameters;

    if (!projectId) {
      return {
        success: false,
        error: 'Missing required parameter: projectId',
      };
    }

    const projectDir = path.join(ARTIFACTS_DIR, projectId);

    try {
      const files = await fs.readdir(projectDir);
      const artifacts = await Promise.all(
        files.map(async (fileName) => {
          const filePath = path.join(projectDir, fileName);
          const stats = await fs.stat(filePath);
          return {
            fileName,
            filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
          };
        })
      );

      return {
        success: true,
        data: { artifacts },
      };
    } catch (error) {
      // Directory doesn't exist yet
      return {
        success: true,
        data: { artifacts: [] },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to list artifacts: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * File storage tool for AI agents
 */
export const fileStorageTool = {
  name: 'file_storage',
  description: 'Store, retrieve, and list artifacts in the file system',
  execute: async (input: ToolInputType): Promise<ToolOutputType> => {
    const action = input.parameters.action;

    switch (action) {
      case 'save':
        return saveArtifact(input);
      case 'get':
        return getArtifact(input);
      case 'list':
        return listArtifacts(input);
      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Supported actions: save, get, list`,
        };
    }
  },
};
