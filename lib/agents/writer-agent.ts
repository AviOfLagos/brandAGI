import { getLLM, mockLLMCall } from '../ai';
import { logEvent } from './output-passer-agent';
import type { AgentInput, AgentOutputType } from '../common/types';

/**
 * WriterAgent
 * 
 * Generates compelling, original long-form content that establishes
 * thought leadership and drives engagement.
 * 
 * Success Metrics:
 * - Quality: Original, engaging, actionable content
 * - Structure: Clear headline, sections, 1500-3000 words
 * - Brand Alignment: Uses brand voice, values, positioning
 * - SEO: Keywords, meta tags, proper structure
 */

interface ContentOutput extends AgentOutputType {
  data: {
    article: {
      headline: string;
      subheading: string;
      body: string; // Markdown
      excerpt: string;
      wordCount: number;
    };
    seo: {
      primaryKeyword: string;
      secondaryKeywords: string[];
      metaTitle: string;
      metaDescription: string;
      slug: string;
    };
    metadata: {
      tone: 'professional' | 'conversational' | 'technical';
      readingLevel: 'beginner' | 'intermediate' | 'advanced';
      estimatedReadTime: number;
      callToAction: string;
    };
    quality: {
      originalityScore: number;
      brandAlignmentScore: number;
      engagementScore: number;
    };
  };
}

/**
 * System prompt for WriterAgent
 */
const SYSTEM_PROMPT = `You are an expert content writer specializing in B2B thought leadership.

Mission: Create compelling, original long-form content that establishes authority and drives engagement.

Writing principles:
1. ORIGINAL - Never generic or templated
2. ENGAGING - Hook readers in first paragraph
3. VALUABLE - Every section provides insights
4. ACTIONABLE - Clear next steps
5. BRANDED - Weaves in brand voice naturally

Structure:
- Attention-grabbing headline
- Compelling introduction (problem + promise)
- Clear sections with subheadings
- Examples and evidence throughout
- Strong conclusion with CTA

Quality bar: Would this be published in industry-leading publications?`;

/**
 * Generate article content using LLM
 */
async function generateArticle(
  topic: string,
  brandProfile: any,
  contentStrategy: any
): Promise<{ headline: string; body: string; excerpt: string }> {
  const model = getLLM();

  const prompt = `${SYSTEM_PROMPT}

Brand Context:
- Name: ${brandProfile.name || 'The Company'}
- Industry: ${brandProfile.industry || 'Technology'}
- Values: ${brandProfile.brandValues?.join(', ') || 'Innovation, Excellence'}
- Target Audience: ${brandProfile.targetAudience || 'B2B professionals'}

Content Brief:
Topic: ${topic}
Tone: Professional yet accessible
Length: 2000-2500 words
Goal: Establish thought leadership and provide actionable insights

Write a complete article in markdown format with:
1. Compelling headline
2. Engaging introduction
3. 4-5 main sections with subheadings
4. Practical examples and insights
5. Strong conclusion with clear CTA

Make it original, valuable, and aligned with the brand voice.`;

  if (!model) {
    // Mock mode
    const mockContent = await mockLLMCall(prompt);
    return {
      headline: `${topic}: A Comprehensive Guide`,
      body: mockContent,
      excerpt: `Discover everything you need to know about ${topic} and how to leverage it for your business success.`,
    };
  }

  // Real LLM call would go here
  // For now, using mock
  const content = await mockLLMCall(prompt);
  
  return {
    headline: `${topic}: Transforming ${brandProfile.industry || 'Business'}`,
    body: content,
    excerpt: `Learn how ${topic} is reshaping the ${brandProfile.industry || 'technology'} landscape and what it means for your organization.`,
  };
}

/**
 * Generate SEO metadata
 */
function generateSEO(
  headline: string,
  excerpt: string,
  industry: string
): {
  primaryKeyword: string;
  secondaryKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  slug: string;
} {
  const words = headline.toLowerCase().split(' ');
  const slug = words.join('-').replace(/[^a-z0-9-]/g, '');

  return {
    primaryKeyword: words.slice(0, 3).join(' '),
    secondaryKeywords: [
      `${industry} trends`,
      `${industry} insights`,
      'thought leadership',
    ],
    metaTitle: headline.length > 60 ? headline.substring(0, 57) + '...' : headline,
    metaDescription: excerpt.substring(0, 155),
    slug,
  };
}

/**
 * Calculate quality scores
 */
function calculateQualityScores(
  body: string,
  brandProfile: any
): {
  originalityScore: number;
  brandAlignmentScore: number;
  engagementScore: number;
} {
  // Simplified scoring - in production would use more sophisticated analysis
  const wordCount = body.split(/\s+/).length;
  const hasExamples = body.includes('example') || body.includes('case study');
  const hasData = /\d+%|\d+ percent/.test(body);
  const hasBrandValues = brandProfile.brandValues?.some((v: string) => 
    body.toLowerCase().includes(v.toLowerCase())
  );

  return {
    originalityScore: wordCount > 1500 ? 0.85 : 0.7,
    brandAlignmentScore: hasBrandValues ? 0.9 : 0.75,
    engagementScore: (hasExamples && hasData) ? 0.88 : 0.75,
  };
}

/**
 * WriterAgent - Main execution
 */
export const writerAgent = {
  id: 'writer_agent',
  name: 'Writer',
  description: 'Generates compelling long-form thought leadership content',
  version: '1.0.0',
  tools: ['llm'],

  async run(input: AgentInput): Promise<ContentOutput> {
    const { projectId, sessionId, context } = input;
    const brandProfile = input.input;
    const contentStrategy = context?.contentStrategy || {};

    await logEvent({
      agentId: 'writer_agent',
      agentName: 'WriterAgent',
      eventType: 'emit',
      payloadSummary: 'Starting content generation',
      projectId,
      sessionId,
      ownerVisible: true,
    });

    try {
      // Get topic from content strategy or generate default
      const topic = contentStrategy.primaryTopic || 
        `The Future of ${brandProfile.industry || 'Technology'}`;

      // Generate article
      const { headline, body, excerpt } = await generateArticle(
        topic,
        brandProfile,
        contentStrategy
      );

      // Generate SEO
      const seo = generateSEO(
        headline,
        excerpt,
        brandProfile.industry || 'technology'
      );

      // Calculate quality scores
      const quality = calculateQualityScores(body, brandProfile);

      const wordCount = body.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200); // Average reading speed

      const output: ContentOutput = {
        success: true,
        data: {
          article: {
            headline,
            subheading: excerpt,
            body,
            excerpt,
            wordCount,
          },
          seo,
          metadata: {
            tone: 'professional',
            readingLevel: 'intermediate',
            estimatedReadTime: readTime,
            callToAction: `Learn more about ${brandProfile.name || 'our solutions'}`,
          },
          quality,
        },
        confidence: quality.originalityScore,
        provenance: 'WriterAgent',
        artifacts: [
          {
            type: 'article',
            title: headline,
            content: body,
            metadata: {
              format: 'markdown',
              wordCount,
              seo,
            },
          },
        ],
      };

      await logEvent({
        agentId: 'writer_agent',
        agentName: 'WriterAgent',
        eventType: 'emit',
        payloadSummary: `Generated ${wordCount}-word article: "${headline}"`,
        projectId,
        sessionId,
        ownerVisible: true,
        metadata: { wordCount, readTime },
      });

      return output;
    } catch (error) {
      await logEvent({
        agentId: 'writer_agent',
        agentName: 'WriterAgent',
        eventType: 'error',
        payloadSummary: `Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        projectId,
        sessionId,
        ownerVisible: true,
      });

      return {
        success: false,
        error: `Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        provenance: 'WriterAgent',
      };
    }
  },
};
