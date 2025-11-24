import { executeTool } from '@/lib/tools';
import { logEvent } from './output-passer-agent';
import { getLLM, mockLLMCall } from '@/lib/ai';
import type { Agent, AgentInput, AgentOutputType } from '@/lib/common/types';

/**
 * Brand Brain Agent - Assembles brand profile from intake questions and industry snapshot
 */
export const brandBrainAgent: Agent = {
  id: 'brand_brain',
  name: 'BrandBrain',
  description: 'Assembles brand profile from intake questions and industry snapshot',
  version: '1.0.0',
  tools: ['memory', 'artifact_generator'],

  run: async (input: AgentInput): Promise<AgentOutputType> => {
    const startTime = Date.now();
    const { input: userInput, projectId, sessionId, context } = input;

    try {
      await logEvent({
        agentId: 'brand_brain',
        agentName: 'BrandBrain',
        eventType: 'emit',
        payloadType: 'brand_profile',
        payloadSummary: 'Starting brand profile assembly',
        projectId,
        sessionId,
        ownerVisible: true,
      });

      // Get industry snapshot from memory
      const industryResult = await executeTool('memory', {
        action: 'retrieve',
        projectId,
        key: 'industry_snapshot',
      });

      const industrySnapshot = industryResult.success ? industryResult.data.value : null;

      // Extract project data from input
      const projectData = typeof userInput === 'object' ? userInput : {
        name: 'Sample Brand',
        industry: 'technology',
        targetAudience: 'Tech professionals',
        brandVision: 'Empower innovation',
        brandValues: ['Innovation', 'Quality', 'Trust'],
      };

      // Generate brand profile using artifact generator
      const profileResult = await executeTool('artifact_generator', {
        action: 'brand_profile',
        projectData,
        industrySnapshot,
      });

      if (!profileResult.success) {
        throw new Error(`Brand profile generation failed: ${profileResult.error}`);
      }

      const brandProfile = profileResult.data.artifact;

      // Use LLM to enhance profile (or use mock)
      const llm = getLLM();
      let enhancedProfile;

      if (llm) {
        // In production, use LLM to analyze and enhance
        enhancedProfile = {
          ...brandProfile,
          unique_selling_proposition: `${projectData.name}: Where ${projectData.brandVision} meets innovation`,
        };
      } else {
        // Mock enhancement
        enhancedProfile = {
          ...brandProfile,
          unique_selling_proposition: `Leading ${projectData.industry} brand focused on ${projectData.brandVision}`,
          brand_tone: industrySnapshot?.tone_recommendations?.[0] || 'Professional and approachable',
          brand_messaging: `We believe in ${projectData.brandValues?.[0] || 'excellence'} and ${projectData.brandValues?.[1] || 'innovation'}`,
        };
      }

      // Store in memory
      await executeTool('memory', {
        action: 'store',
        projectId,
        key: 'brand_profile',
        value: enhancedProfile,
        metadata: { agentId: 'brand_brain' },
      });

      // Save as artifact
      await executeTool('file_storage', {
        action: 'save',
        projectId,
        type: 'brand_profile',
        content: enhancedProfile,
        filename: 'brand_profile.json',
      });

      const result = {
        brand_tone: enhancedProfile.brand_tone || enhancedProfile.tone,
        brand_messaging: enhancedProfile.brand_messaging || enhancedProfile.messaging,
        content_pillars: enhancedProfile.content_pillars || enhancedProfile.contentPillars,
        brand_values: enhancedProfile.brand_values || projectData.brandValues,
        unique_selling_proposition: enhancedProfile.unique_selling_proposition,
        confidence_score: 0.88,
        provenance: 'BrandBrain - assembled from intake questions and industry research',
      };

      await logEvent({
        agentId: 'brand_brain',
        agentName: 'BrandBrain',
        eventType: 'emit',
        payloadType: 'brand_profile',
        payloadSummary: `Created brand profile for ${projectData.name} with ${result.content_pillars?.length || 3} content pillars`,
        confidence: 0.88,
        provenance: 'BrandBrain',
        projectId,
        sessionId,
        ownerVisible: true,
        metadata: { processingTime: Date.now() - startTime },
      });

      return {
        success: true,
        data: result,
        confidence: 0.88,
        provenance: 'BrandBrain',
        artifacts: [`${projectId}_brand_profile`],
      };
    } catch (error) {
      await logEvent({
        agentId: 'brand_brain',
        agentName: 'BrandBrain',
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
        provenance: 'BrandBrain',
      };
    }
  },
};
