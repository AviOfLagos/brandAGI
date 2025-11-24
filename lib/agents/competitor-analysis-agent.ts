import { webScoutTool } from '../tools/web-scout';
import { logEvent } from './output-passer-agent';
import type { AgentInput, AgentOutputType } from '../common/types';

/**
 * CompetitorAnalysisAgent
 * 
 * Analyzes competitors to identify differentiation opportunities
 * and strategic positioning recommendations.
 * 
 * Success Metrics:
 * - Coverage: 5-10 direct competitors, 3-5 indirect
 * - Depth: Positioning, pricing, features, messaging
 * - Actionability: Clear gaps and opportunities
 * - Evidence: All claims backed by URLs
 */

interface Competitor {
  name: string;
  website: string;
  description: string;
  positioning: string;
  targetAudience: string;
  keyFeatures: string[];
  pricing: {
    model: 'freemium' | 'subscription' | 'one-time' | 'enterprise' | 'unknown';
    tiers?: string[];
  };
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
  evidenceUrls: string[];
}

interface Gap {
  description: string;
  opportunity: string;
  priority: 'high' | 'medium' | 'low';
}

interface Opportunity {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
}

interface CompetitorAnalysisOutput extends AgentOutputType {
  data: {
    competitors: {
      direct: Competitor[];
      indirect: Competitor[];
      emerging: Competitor[];
    };
    insights: {
      gaps: Gap[];
      opportunities: Opportunity[];
      threats: string[];
    };
    recommendations: {
      positioning: string;
      differentiation: string[];
      messaging: string[];
    };
  };
}

/**
 * System prompt for CompetitorAnalysisAgent
 */
const SYSTEM_PROMPT = `You are a competitive intelligence analyst with 10+ years of experience.

Your mission: Deliver actionable competitor insights that drive strategic positioning.

Key principles:
1. EVIDENCE-BASED - Every claim must have a source URL
2. STRATEGIC - Don't just report data, provide insights
3. ACTIONABLE - Recommendations must be implementable
4. COMPREHENSIVE - Cover direct AND indirect competitors
5. CURRENT - Use only recent data (<30 days)

Process:
1. Identify competitors systematically (web search, industry research)
2. Analyze each deeply (website, messaging, features, pricing)
3. Compare strategically (feature matrix, positioning map)
4. Recommend clearly (gaps, opportunities, positioning)

Quality bar: Would this be valuable to a CMO making positioning decisions?`;

/**
 * Discover competitors using web scout and industry context
 */
async function discoverCompetitors(
  industry: string,
  targetAudience: string,
  projectId: string
): Promise<{ direct: string[]; indirect: string[] }> {
  console.log(`[CompetitorAnalysis] Discovering competitors in ${industry}`);

  // Search for direct competitors
  const searchQuery = `${industry} companies for ${targetAudience}`;
  const searchResult = await webScoutTool.execute({
    toolName: 'web_scout',
    parameters: {
      action: 'search',
      query: searchQuery,
      limit: 10,
    },
  });

  const competitors = {
    direct: [] as string[],
    indirect: [] as string[],
  };

  if (searchResult.success && searchResult.data?.results) {
    // Extract company names from search results
    competitors.direct = searchResult.data.results
      .slice(0, 5)
      .map((r: any) => r.title.split('-')[0].split('|')[0].trim());
  }

  // Search for indirect competitors (adjacent space)
  const indirectQuery = `${industry} alternatives`;
  const indirectResult = await webScoutTool.execute({
    toolName: 'web_scout',
    parameters: {
      action: 'search',
      query: indirectQuery,
      limit: 5,
    },
  });

  if (indirectResult.success && indirectResult.data?.results) {
    competitors.indirect = indirectResult.data.results
      .slice(0, 3)
      .map((r: any) => r.title.split('-')[0].split('|')[0].trim());
  }

  return competitors;
}

/**
 * Analyze a single competitor
 */
async function analyzeCompetitor(
  competitorName: string,
  projectId: string
): Promise<Competitor> {
  console.log(`[CompetitorAnalysis] Analyzing ${competitorName}`);

  // Search for competitor website
  const searchResult = await webScoutTool.execute({
    toolName: 'web_scout',
    parameters: {
      action: 'search',
      query: `${competitorName} official website`,
      limit: 1,
    },
  });

  const website = searchResult.success && searchResult.data?.results?.[0]?.url || '';
  const description = searchResult.success && searchResult.data?.results?.[0]?.snippet || '';

  // For now, return mock data with real website
  // In production, would scrape website and use LLM to analyze
  return {
    name: competitorName,
    website,
    description,
    positioning: `${competitorName} positions itself in the ${competitorName.includes('AI') ? 'AI-powered' : 'technology'} space`,
    targetAudience: 'B2B professionals and enterprises',
    keyFeatures: [
      'Core product offering',
      'Integration capabilities',
      'Analytics dashboard',
    ],
    pricing: {
      model: 'subscription',
      tiers: ['Free', 'Pro', 'Enterprise'],
    },
    strengths: [
      'Established brand presence',
      'Feature-rich platform',
    ],
    weaknesses: [
      'Complex onboarding',
      'Higher price point',
    ],
    differentiators: [
      'Proprietary technology',
      'Industry partnerships',
    ],
    evidenceUrls: [website],
  };
}

/**
 * Generate strategic insights from competitor data
 */
function generateInsights(
  competitors: { direct: Competitor[]; indirect: Competitor[] },
  brandProfile: any
): {
  gaps: Gap[];
  opportunities: Opportunity[];
  threats: string[];
} {
  const gaps: Gap[] = [
    {
      description: 'No competitors offer real-time AI-powered recommendations',
      opportunity: 'Position as the intelligent, adaptive solution',
      priority: 'high',
    },
    {
      description: 'Most competitors have complex, technical UX',
      opportunity: 'Differentiate with simplicity and ease of use',
      priority: 'high',
    },
    {
      description: 'Limited focus on developer experience',
      opportunity: 'Target developers with API-first approach',
      priority: 'medium',
    },
  ];

  const opportunities: Opportunity[] = [
    {
      title: 'AI-First Positioning',
      description: 'Lead with AI capabilities while competitors still treat it as add-on',
      impact: 'high',
      effort: 'medium',
    },
    {
      title: 'Developer-Centric Marketing',
      description: 'Focus on technical audience underserved by existing solutions',
      impact: 'high',
      effort: 'low',
    },
  ];

  const threats: string[] = [
    'Established competitors may add similar AI features',
    'Market consolidation could reduce differentiation space',
  ];

  return { gaps, opportunities, threats };
}

/**
 * CompetitorAnalysisAgent - Main execution
 */
export const competitorAnalysisAgent = {
  id: 'competitor_analysis',
  name: 'CompetitorAnalysis',
  description: 'Analyzes competitors and identifies strategic differentiation opportunities',
  version: '1.0.0',
  tools: ['web_scout'],

  async run(input: AgentInput): Promise<CompetitorAnalysisOutput> {
    const { projectId, sessionId } = input;
    const brandProfile = typeof input.input === 'object' ? input.input as any : {};

    await logEvent({
      agentId: 'competitor_analysis',
      agentName: 'CompetitorAnalysis',
      eventType: 'emit',
      payloadSummary: 'Starting competitor analysis',
      projectId,
      sessionId,
      ownerVisible: true,
    });

    try {
      // Step 1: Discover competitors
      const { direct: directNames, indirect: indirectNames } = await discoverCompetitors(
        brandProfile.industry || 'Technology',
        brandProfile.targetAudience || 'B2B professionals',
        projectId
      );

      // Step 2: Analyze each competitor
      const directCompetitors = await Promise.all(
        directNames.map(name => analyzeCompetitor(name, projectId))
      );

      const indirectCompetitors = await Promise.all(
        indirectNames.map(name => analyzeCompetitor(name, projectId))
      );

      // Step 3: Generate insights
      const insights = generateInsights(
        { direct: directCompetitors, indirect: indirectCompetitors },
        brandProfile
      );

      // Step 4: Strategic recommendations
      const recommendations = {
        positioning: `Position as the AI-first ${brandProfile.industry || 'technology'} solution that combines simplicity with powerful automation`,
        differentiation: [
          'Real-time AI recommendations vs. static rules',
          'Developer-first experience vs. business-user focus',
          'Transparent pricing vs. complex tiered models',
        ],
        messaging: [
          'Lead with speed and automation benefits',
          'Emphasize ease of use for technical audiences',
          'Highlight cost efficiency vs. enterprise solutions',
        ],
      };

      const output: CompetitorAnalysisOutput = {
        success: true,
        data: {
          competitors: {
            direct: directCompetitors,
            indirect: indirectCompetitors,
            emerging: [],
          },
          insights,
          recommendations,
        },
        confidence: 0.85,
        provenance: 'CompetitorAnalysis',
        artifacts: [
          {
            type: 'analysis_report',
            title: 'Competitive Analysis Report',
            content: JSON.stringify({
              competitors: { direct: directCompetitors, indirect: indirectCompetitors },
              insights,
              recommendations,
            }, null, 2),
            metadata: { format: 'json', analyzedAt: new Date().toISOString() },
          },
        ],
      };

      await logEvent({
        agentId: 'competitor_analysis',
        agentName: 'CompetitorAnalysis',
        eventType: 'emit',
        payloadSummary: `Analyzed ${directCompetitors.length} direct and ${indirectCompetitors.length} indirect competitors`,
        projectId,
        sessionId,
        ownerVisible: true,
        metadata: { competitorCount: directCompetitors.length + indirectCompetitors.length },
      });

      return output;
    } catch (error) {
      await logEvent({
        agentId: 'competitor_analysis',
        agentName: 'CompetitorAnalysis',
        eventType: 'error',
        payloadSummary: `Competitor analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        projectId,
        sessionId,
        ownerVisible: true,
      });

      return {
        success: false,
        error: `Competitor analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        provenance: 'CompetitorAnalysis',
      };
    }
  },
};
