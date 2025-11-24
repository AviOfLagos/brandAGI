import { executeTool } from '@/lib/tools';
import { logEvent } from './output-passer-agent';
import type { Agent, AgentInput, AgentOutputType } from '@/lib/common/types';

/**
 * Knowledge Agent - Ingests documents, chunks content, and generates embeddings
 */
export const knowledgeAgent: Agent = {
  id: 'knowledge_agent',
  name: 'KnowledgeAgent',
  description: 'Ingests uploaded documents, runs chunking, and stores embeddings in vector storage',
  version: '1.0.0',
  tools: ['embedder', 'file_storage'],

  run: async (input: AgentInput): Promise<AgentOutputType> => {
    const startTime = Date.now();
    const { input: userInput, projectId, sessionId } = input;

    try {
      await logEvent({
        agentId: 'knowledge_agent',
        agentName: 'KnowledgeAgent',
        eventType: 'emit',
        payloadType: 'knowledge',
        payloadSummary: 'Starting knowledge ingestion',
        projectId,
        sessionId,
        ownerVisible: true,
      });

      // Extract documents from input
      const documents = typeof userInput === 'object' && 'documents' in userInput
        ? (userInput as any).documents
        : [];

      if (documents.length === 0) {
        // Mock mode: create sample documents
        documents.push(
          { text: 'Sample industry knowledge document 1', source: 'mock' },
          { text: 'Sample industry knowledge document 2', source: 'mock' },
        );
      }

      // Chunk documents (simple implementation)
      const chunks = documents.flatMap((doc: any, idx: number) => {
        const text = doc.text || doc.content || '';
        // Simple chunking: split by paragraphs (in production, use better chunking)
        const paragraphs = text.split('\n\n').filter((p: string) => p.trim().length > 0);
        return paragraphs.map((p: string, i: number) => ({
          text: p,
          source: doc.source || `doc_${idx}`,
          chunkId: `${idx}_${i}`,
        }));
      });

      // Generate embeddings
      const embeddingResult = await executeTool('embedder', {
        action: 'generate',
        texts: chunks.map((c: any) => c.text),
        projectId,
        metadata: chunks.map((c: any) => ({ source: c.source, chunkId: c.chunkId })),
      });

      if (!embeddingResult.success) {
        throw new Error(`Embedding failed: ${embeddingResult.error}`);
      }

      // Store embeddings
      const storeResult = await executeTool('embedder', {
        action: 'store',
        projectId,
        embeddings: embeddingResult.data.embeddings,
      });

      if (!storeResult.success) {
        throw new Error(`Storage failed: ${storeResult.error}`);
      }

      // Create knowledge catalog
      const catalog = {
        totalDocuments: documents.length,
        totalChunks: chunks.length,
        vectorIndexId: `${projectId}_knowledge`,
        sources: [...new Set(chunks.map((c: any) => c.source))],
        indexedAt: new Date().toISOString(),
      };

      // Save catalog to file storage
      await executeTool('file_storage', {
        action: 'save',
        projectId,
        type: 'knowledge_catalog',
        content: catalog,
        filename: 'knowledge_catalog.json',
      });

      const result = {
        vector_index_id: catalog.vectorIndexId,
        knowledge_catalog: catalog,
        confidence_score: 0.95,
        provenance: 'KnowledgeAgent - processed documents and created vector index',
      };

      await logEvent({
        agentId: 'knowledge_agent',
        agentName: 'KnowledgeAgent',
        eventType: 'emit',
        payloadType: 'knowledge',
        payloadSummary: `Indexed ${chunks.length} chunks from ${documents.length} documents`,
        confidence: 0.95,
        provenance: 'KnowledgeAgent',
        projectId,
        sessionId,
        ownerVisible: true,
        metadata: { processingTime: Date.now() - startTime },
      });

      return {
        success: true,
        data: result,
        confidence: 0.95,
        provenance: 'KnowledgeAgent',
        artifacts: [catalog.vectorIndexId],
      };
    } catch (error) {
      await logEvent({
        agentId: 'knowledge_agent',
        agentName: 'KnowledgeAgent',
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
        provenance: 'KnowledgeAgent',
      };
    }
  },
};
