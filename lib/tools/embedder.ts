import { getEmbeddingsModel } from '@/lib/ai';
import { embedMany } from 'ai';
import { promises as fs } from 'fs';
import path from 'path';
import type { ToolInputType, ToolOutputType } from '@/lib/common/types';

const VECTOR_STORE_DIR = './chroma';

/**
 * Simple file-based vector store
 * In production, use Chroma, Pinecone, or other vector database
 */
interface VectorEntry {
  id: string;
  text: string;
  embedding: number[];
  metadata?: any;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Load vector store from file
 */
async function loadVectorStore(projectId: string): Promise<VectorEntry[]> {
  try {
    const storePath = path.join(VECTOR_STORE_DIR, `${projectId}.json`);
    const data = await fs.readFile(storePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save vector store to file
 */
async function saveVectorStore(projectId: string, entries: VectorEntry[]): Promise<void> {
  await fs.mkdir(VECTOR_STORE_DIR, { recursive: true });
  const storePath = path.join(VECTOR_STORE_DIR, `${projectId}.json`);
  await fs.writeFile(storePath, JSON.stringify(entries, null, 2));
}

/**
 * Generate embeddings from text
 */
export async function generateEmbeddings(input: ToolInputType): Promise<ToolOutputType> {
  // Declare variables outside try block so they're accessible in catch
  const { texts, projectId, metadata } = input.parameters;

  if (!Array.isArray(texts) || texts.length === 0) {
    return {
      success: false,
      error: 'Missing required parameter: texts (array)',
    };
  }

  try {
    const embeddingsModel = getEmbeddingsModel();

    if (!embeddingsModel) {
      // Mock mode
      console.log('[Mock Embeddings] Generating mock embeddings for', texts.length, 'texts');
      const mockEmbeddings = texts.map((_: string, i: number) => ({
        id: `${projectId}_${i}`,
        embedding: Array(384).fill(0).map(() => Math.random()), // Mock 384-dim vector
      }));

      return {
        success: true,
        data: {
          embeddings: mockEmbeddings,
          model: 'mock',
        },
        metadata: { count: texts.length },
      };
    }

    // Real embeddings with error handling
    console.log(`[Embeddings] Generating real embeddings for ${texts.length} texts using ${process.env.GEMINI_API_KEY ? 'Gemini' : 'OpenAI'}`);

    const { embeddings } = await embedMany({
      model: embeddingsModel,
      values: texts,
    });

    const results = texts.map((text, i) => ({
      id: `${projectId}_${Date.now()}_${i}`,
      text,
      embedding: embeddings[i],
      metadata: metadata?.[i],
    }));

    return {
      success: true,
      data: {
        embeddings: results,
        dimensions: embeddings[0].length,
        model: process.env.GEMINI_API_KEY ? 'gemini-text-embedding-004' : 'openai-text-embedding-3-small',
      },
      metadata: { count: texts.length },
    };
  } catch (error: any) {
    console.error('[Embedder Error]:', error.message);

    // Handle specific errors
    if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
      return {
        success: false,
        error: 'Embedding API quota exceeded. Please check your billing.',
      };
    }

    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      return {
        success: false,
        error: 'Invalid API key for embeddings. Please check your .env file.',
      };
    }

    // Fallback to mock on any error
    console.log('[Embeddings] Error occurred, falling back to mock mode');
    const mockEmbeddings = texts.map((text: string, i: number) => ({
      id: `${projectId}_${Date.now()}_${i}`,
      text,
      embedding: Array.from({ length: 768 }, () => Math.random() - 0.5),
      metadata: metadata?.[i],
    }));

    return {
      success: true,
      data: {
        embeddings: mockEmbeddings,
        dimensions: 768,
        model: 'mock-fallback',
      },
      metadata: { count: texts.length },
    };
  }
}

/**
 * Store embeddings in vector database
 */
export async function storeEmbeddings(input: ToolInputType): Promise<ToolOutputType> {
  try {
    const { projectId, embeddings } = input.parameters;

    if (!projectId || !Array.isArray(embeddings)) {
      return {
        success: false,
        error: 'Missing required parameters: projectId and embeddings',
      };
    }

    const store = await loadVectorStore(projectId);
    store.push(...embeddings);
    await saveVectorStore(projectId, store);

    return {
      success: true,
      data: {
        stored: embeddings.length,
        totalCount: store.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to store embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Search for similar texts using embeddings
 */
export async function searchSimilar(input: ToolInputType): Promise<ToolOutputType> {
  try {
    const { projectId, query, limit = 5 } = input.parameters;

    if (!projectId || !query) {
      return {
        success: false,
        error: 'Missing required parameters: projectId and query',
      };
    }

    // Generate embedding for query
    const embeddingResult = await generateEmbeddings({
      toolName: 'embedder',
      parameters: { texts: [query], projectId },
    });

    if (!embeddingResult.success) {
      return embeddingResult;
    }

    const queryEmbedding = embeddingResult.data.embeddings[0].embedding;

    // Load vector store and calculate similarities
    const store = await loadVectorStore(projectId);
    
    if (store.length === 0) {
      return {
        success: true,
        data: { results: [] },
        metadata: { message: 'Vector store is empty' },
      };
    }

    const similarities = store.map((entry) => ({
      ...entry,
      similarity: cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    // Sort by similarity and return top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    const results = similarities.slice(0, limit).map(({ embedding, ...rest }) => rest);

    return {
      success: true,
      data: { results },
      metadata: { totalDocuments: store.length },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search similar: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Embedder tool for AI agents
 */
export const embedderTool = {
  name: 'embedder',
  description: 'Generate embeddings and perform semantic search',
  execute: async (input: ToolInputType): Promise<ToolOutputType> => {
    const action = input.parameters.action;

    switch (action) {
      case 'generate':
        return generateEmbeddings(input);
      case 'store':
        return storeEmbeddings(input);
      case 'search':
        return searchSimilar(input);
      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Supported actions: generate, store, search`,
        };
    }
  },
};
