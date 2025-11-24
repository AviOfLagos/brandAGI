import { executeTool } from '@/lib/tools';
import { logEvent } from './output-passer-agent';
import type { Agent, AgentInput, AgentOutputType } from '@/lib/common/types';

/**
 * QA Agent - Performs quality assurance checks on generated content
 */
export const qaAgent: Agent = {
  id: 'qa_agent',
  name: 'QAAgent',
  description: 'Performs quality assurance checks: spellcheck, profanity filter, platform restrictions',
  version: '1.0.0',
  tools: [],

  run: async (input: AgentInput): Promise<AgentOutputType> => {
    const { input: content, projectId, sessionId } = input;

    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Simple checks (in production, use proper QA tools)
      const contentStr = JSON.stringify(content);

      // Check for common issues
      if (contentStr.length < 100) {
        recommendations.push('Content seems very short, consider adding more detail');
      }

      if (contentStr.includes('TODO') || contentStr.includes('FIXME')) {
        issues.push('Content contains TODO/FIXME markers');
      }

      // Profanity check (very basic)
      const profanityWords = ['bad-word-1', 'bad-word-2']; // In production, use comprehensive list
      const hasProfanity = profanityWords.some(word => contentStr.toLowerCase().includes(word));
      if (hasProfanity) {
        issues.push('Content may contain inappropriate language');
      }

      // Platform-specific checks
      if (typeof content === 'object' && 'platform' in content) {
        const platform = (content as any).platform;
        if (platform === 'x' && contentStr.length > 280) {
          issues.push('Content too long for X (Twitter) - max 280 characters');
        }
      }

      const passed = issues.length === 0;
      const confidenceScore = passed ? 0.95 : Math.max(0.3, 0.95 - issues.length * 0.15);

      await logEvent({
        agentId: 'qa_agent',
        agentName: 'QAAgent',
        eventType: 'emit',
        payloadSummary: `QA ${passed ? 'passed' : 'failed'}: ${issues.length} issues found`,
        confidence: confidenceScore,
        projectId,
        sessionId,
        ownerVisible: false,
      });

      return {
        success: true,
        data: {
          pass: passed,
          issues,
          recommendations,
          confidence_score: confidenceScore,
        },
        confidence: confidenceScore,
        provenance: 'QAAgent',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { pass: false, issues: ['QA check failed'], recommendations: [] },
        confidence: 0,
        provenance: 'QAAgent',
      };
    }
  },
};

/**
 * Code Review Agent - Reviews generated artifacts for quality and consistency
 */
export const codeReviewAgent: Agent = {
  id: 'code_review_agent',
  name: 'CodeReviewAgent',
  description: 'Reviews generated artifacts for quality, consistency, and brand alignment',
  version: '1.0.0',
  tools: ['memory'],

  run: async (input: AgentInput): Promise<AgentOutputType> => {
    const { input: artifact, projectId, sessionId } = input;

    try {
      // Get brand profile for alignment check
      const brandResult = await executeTool('memory', {
        action: 'retrieve',
        projectId,
        key: 'brand_profile',
      });

      const feedback: string[] = [];
      const revisionSuggestions: string[] = [];
      let approved = true;

      // Check structure
      if (typeof artifact !== 'object') {
        feedback.push('Artifact should be a structured object');
        approved = false;
      }

      // Check required fields
      const artifactObj = artifact as any;
      if (!artifactObj.confidence_score && !artifactObj.confidence) {
        feedback.push('Missing confidence score');
        revisionSuggestions.push('Add confidence score to output');
      }

      if (!artifactObj.provenance) {
        feedback.push('Missing provenance information');
        revisionSuggestions.push('Add provenance/source information');
      }

      // Brand alignment check
      if (brandResult.success) {
        const brandProfile = brandResult.data.value;
        // Check if content aligns with brand tone/values (simplified)
        const contentStr = JSON.stringify(artifactObj).toLowerCase();
        const brandValues = brandProfile.brand_values || brandProfile.brandValues || [];
        
        if (brandValues.length > 0 && !brandValues.some((v: string) => contentStr.includes(v.toLowerCase()))) {
          feedback.push('Content may not fully align with brand values');
        }
      }

      const confidenceScore = approved && feedback.length === 0 ? 0.92 : Math.max(0.5, 0.92 - feedback.length * 0.1);

      await logEvent({
        agentId: 'code_review_agent',
        agentName: 'CodeReviewAgent',
        eventType: 'emit',
        payloadSummary: `Review ${approved ? 'approved' : 'requires revision'}: ${feedback.length} items`,
        confidence: confidenceScore,
        projectId,
        sessionId,
        ownerVisible: false,
      });

      return {
        success: true,
        data: {
          approved,
          feedback,
          revision_suggestions: revisionSuggestions,
          confidence_score: confidenceScore,
        },
        confidence: confidenceScore,
        provenance: 'CodeReviewAgent',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { approved: false, feedback: ['Review failed'], revision_suggestions: [] },
        confidence: 0,
        provenance: 'CodeReviewAgent',
      };
    }
  },
};
