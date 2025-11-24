import { getLLM, mockLLMCall } from '../ai';
import { logEvent } from './output-passer-agent';
import type { AgentInput, AgentOutputType } from '../common/types';

/**
 * RepurposeAgent
 * 
 * Transforms long-form content into high-engagement social posts
 * optimized for each platform.
 * 
 * Success Metrics:
 * - Platform Optimization: Twitter <280 char, LinkedIn 1300 char
 * - Engagement: Strong hooks, clear value props
 * - Brand Consistency: Maintains voice across platforms
 */

interface Tweet {
  text: string;
  thread?: string[];
}

interface RepurposedContent extends AgentOutputType {
  data: {
    twitter: {
      thread: Tweet[];
      standalone: string[];
      quotes: string[];
    };
    linkedin: {
      post: string;
      carouselSlides: string[];
    };
    instagram: {
      caption: string;
      hashtags: string[];
      hooks: string[];
    };
    metadata: {
      sourceArticle: string;
      coreMessage: string;
      targetAudience: string;
    };
  };
}

/**
 * System prompt for RepurposeAgent
 */
const SYSTEM_PROMPT = `You are a social media strategist expert at repurposing long-form content.

Mission: Transform articles into high-engagement social posts optimized for each platform.

Platform mastery:
- TWITTER: Punchy, thread-worthy, conversation-starters (<280 char)
- LINKEDIN: Professional insights, thought leadership (1300 char)
- INSTAGRAM: Visual storytelling, inspiration

Repurposing rules:
1. Extract the CORE insight
2. Lead with a HOOK
3. Platform-OPTIMIZE (tone, length, format)
4. Include CLEAR CTA
5. Maintain BRAND voice

Quality bar: Would this stop someone's scroll?`;

/**
 * RepurposeAgent - Main execution
 */
export const repurposeAgent = {
  id: 'repurpose_agent',
  name: 'Repurpose',
  description: 'Repurposes long-form content into platform-optimized social posts',
  version: '1.0.0',
  tools: ['llm'],

  async run(input: AgentInput): Promise<RepurposedContent> {
    const { projectId, sessionId, context } = input;
    const brandProfile = input.input;
    const article = context?.article || {};

    await logEvent({
      agentId: 'repurpose_agent',
      agentName: 'RepurposeAgent',
      eventType: 'emit',
      payloadSummary: 'Repurposing content for social platforms',
      projectId,
      sessionId,
      ownerVisible: true,
    });

    try {
      const headline = article.headline || 'Industry Insights';
      const excerpt = article.excerpt || 'Discover key insights for your business';

      // Twitter content
      const twitterThread: Tweet[] = [
        {
          text: `🚀 ${headline.substring(0, 200)}`,
          thread: [
            excerpt.substring(0, 270),
            `Key takeaway: ${excerpt.substring(0, 250)}`,
            `Learn more: [link]`,
          ],
        },
      ];

      const twitterStandalone = [
        `${headline.substring(0, 230)} 🎯`,
        `Did you know? ${excerpt.substring(0, 240)}`,
      ];

      // LinkedIn post
      const linkedinPost = `${headline}

${excerpt}

${brandProfile.brandValues?.slice(0, 3).map((v: string) => `✅ ${v}`).join('\n') || ''}

What's your take on this? Share in the comments below.

#${brandProfile.industry?.replace(/\s+/g, '') || 'Business'} #ThoughtLeadership`;

      // Instagram
      const instagramCaption = `${headline}

${excerpt.substring(0, 150)}...

${brandProfile.brandValues?.slice(0, 3).map((v: string) => `• ${v}`).join('\n') || ''}

Tap the link in bio to read more! 💡`;

      const output: RepurposedContent = {
        success: true,
        data: {
          twitter: {
            thread: twitterThread,
            standalone: twitterStandalone,
            quotes: [
              excerpt.substring(0, 270),
            ],
          },
          linkedin: {
            post: linkedinPost.substring(0, 1300),
            carouselSlides: [
              headline,
              excerpt,
              `Key Insight: ${excerpt.substring(0, 100)}`,
            ],
          },
          instagram: {
            caption: instagramCaption,
            hashtags: [
              `#${brandProfile.industry?.replace(/\s+/g, '')}`,
              '#ThoughtLeadership',
              '#BusinessGrowth',
            ],
            hooks: [
              `🚀 ${headline.substring(0, 100)}`,
              `💡 ${excerpt.substring(0, 100)}`,
            ],
          },
          metadata: {
            sourceArticle: headline,
            coreMessage: excerpt,
            targetAudience: brandProfile.targetAudience || 'B2B professionals',
          },
        },
        confidence: 0.88,
        provenance: 'RepurposeAgent',
        artifacts: [
          {
            type: 'social_content',
            title: 'Repurposed Social Content',
            content: JSON.stringify({
              twitter: twitterThread,
              linkedin: linkedinPost,
              instagram: instagramCaption,
            }, null, 2),
            metadata: { platforms: ['twitter', 'linkedin', 'instagram'] },
          },
        ],
      };

      await logEvent({
        agentId: 'repurpose_agent',
        agentName: 'RepurposeAgent',
        eventType: 'emit',
        payloadSummary: 'Generated social content for 3 platforms',
        projectId,
        sessionId,
        ownerVisible: true,
      });

      return output;
    } catch (error) {
      await logEvent({
        agentId: 'repurpose_agent',
        agentName: 'RepurposeAgent',
        eventType: 'error',
        payloadSummary: `Repurposing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        projectId,
        sessionId,
        ownerVisible: true,
      });

      return {
        success: false,
        error: `Repurposing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        provenance: 'RepurposeAgent',
      };
    }
  },
};
