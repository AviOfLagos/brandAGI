import { logEvent } from './output-passer-agent';
import type { AgentInput, AgentOutputType } from '../common/types';

/**
 * SchedulerAgent
 * 
 * Creates realistic, strategic publishing calendars that maximize
 * reach and engagement across platforms.
 * 
 * Success Metrics:
 * - Strategic Timing: Posts at optimal times
 * - Balanced Frequency: Consistent but sustainable
 * - Content Mix: Variety of types and themes
 * - Feasibility: Realistic production timeline
 */

interface ScheduledPost {
  date: string;
  time: string;
  platform: 'twitter' | 'linkedin' | 'instagram';
  contentType: 'educational' | 'promotional' | 'thought-leadership';
  topic: string;
  contentId: string;
  status: 'draft' | 'ready' | 'published';
}

interface PublishingCalendar extends AgentOutputType {
  data: {
    schedule: ScheduledPost[];
    summary: {
      totalPosts: number;
      frequency: {
        twitter: number;
        linkedin: number;
        instagram: number;
      };
      themes: string[];
    };
    recommendations: {
      optimalTimes: { platform: string; times: string[] }[];
      contentMix: { type: string; percentage: number }[];
      productionTimeline: string;
    };
  };
}

/**
 * Get optimal posting times for each platform
 * Should later check the user's accounts to determine what time they get the most engagements and what times their users are most active.
 * Needs an algorithm that can calculate the best times for each platform, based on the user's accounts and their users' engagement patterns, Hence we need to build a way that this agent can gather this data.
 * 
 */
function getOptimalTimes(platform: string): string[] {
  switch (platform) {
    case 'twitter':
      return ['09:00', '12:00', '15:00', '18:00'];
    case 'linkedin':
      return ['08:00', '12:00', '17:00'];
    case 'instagram':
      return ['10:00', '14:00', '19:00'];
    default:
      return ['12:00'];
  }
}

/**
 * Generate 30-day publishing schedule
 * Future state: Agent should ask a contentCalender agent to create this
 * Frequency of how many posts should be dynamic, not fixed as these are declared here for now
 */
function generateSchedule(
  startDate: Date,
  contentStrategy: any
): ScheduledPost[] {
  const schedule: ScheduledPost[] = [];
  const platforms: Array<'twitter' | 'linkedin' | 'instagram'> = ['twitter', 'linkedin', 'instagram'];
  
  for (let day = 0; day < 30; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    
    // Skip weekends for LinkedIn
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    // Twitter: 3x/day
    if (day % 1 === 0) {
      const times = getOptimalTimes('twitter');
      times.slice(0, 3).forEach((time, idx) => {
        schedule.push({
          date: date.toISOString().split('T')[0],
          time,
          platform: 'twitter',
          contentType: idx % 3 === 0 ? 'educational' : idx % 3 === 1 ? 'thought-leadership' : 'promotional',
          topic: `Industry Insight ${day + 1}`,
          contentId: `twitter_${day}_${idx}`,
          status: 'draft',
        });
      });
    }
    
    // LinkedIn: 1x/day (weekdays only)
    if (!isWeekend) {
      schedule.push({
        date: date.toISOString().split('T')[0],
        time: '08:00',
        platform: 'linkedin',
        contentType: day % 5 === 0 ? 'promotional' : 'thought-leadership',
        topic: `Professional Insight ${day + 1}`,
        contentId: `linkedin_${day}`,
        status: 'draft',
      });
    }
    
    // Instagram: 1x/day
    schedule.push({
      date: date.toISOString().split('T')[0],
      time: '10:00',
      platform: 'instagram',
      contentType: 'educational',
      topic: `Visual Story ${day + 1}`,
      contentId: `instagram_${day}`,
      status: 'draft',
    });
  }
  
  return schedule;
}

/**
 * SchedulerAgent - Main execution
 */
export const schedulerAgent = {
  id: 'scheduler_agent',
  name: 'Scheduler',
  description: 'Creates strategic publishing calendars with optimal timing',
  version: '1.0.0',
  tools: [],

  async run(input: AgentInput): Promise<PublishingCalendar> {
    const { projectId, sessionId, context } = input;
    const contentStrategy = context?.contentStrategy || {};

    await logEvent({
      agentId: 'scheduler_agent',
      agentName: 'SchedulerAgent',
      eventType: 'emit',
      payloadSummary: 'Creating 30-day publishing calendar',
      projectId,
      sessionId,
      ownerVisible: true,
    });

    try {
      const startDate = new Date();
      const schedule = generateSchedule(startDate, contentStrategy);

      // Calculate summary
      const summary = {
        totalPosts: schedule.length,
        frequency: {
          twitter: schedule.filter(p => p.platform === 'twitter').length,
          linkedin: schedule.filter(p => p.platform === 'linkedin').length,
          instagram: schedule.filter(p => p.platform === 'instagram').length,
        },
        themes: ['Industry Insights', 'Thought Leadership', 'Product Updates'],
      };

      const output: PublishingCalendar = {
        success: true,
        data: {
          schedule,
          summary,
          recommendations: {
            optimalTimes: [
              { platform: 'Twitter', times: getOptimalTimes('twitter') },
              { platform: 'LinkedIn', times: getOptimalTimes('linkedin') },
              { platform: 'Instagram', times: getOptimalTimes('instagram') },
            ],
            contentMix: [
              { type: 'Educational', percentage: 60 },
              { type: 'Thought Leadership', percentage: 30 },
              { type: 'Promotional', percentage: 10 },
            ],
            productionTimeline: 'Start content production 2 weeks before publish date',
          },
        },
        confidence: 0.92,
        provenance: 'SchedulerAgent',
        artifacts: [
          {
            type: 'calendar',
            title: '30-Day Publishing Calendar',
            content: JSON.stringify(schedule, null, 2),
            metadata: { totalPosts: schedule.length, startDate: startDate.toISOString() },
          },
        ],
      };

      await logEvent({
        agentId: 'scheduler_agent',
        agentName: 'SchedulerAgent',
        eventType: 'emit',
        payloadSummary: `Created ${schedule.length}-post calendar across 3 platforms`,
        projectId,
        sessionId,
        ownerVisible: true,
        metadata: summary,
      });

      return output;
    } catch (error) {
      await logEvent({
        agentId: 'scheduler_agent',
        agentName: 'SchedulerAgent',
        eventType: 'error',
        payloadSummary: `Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        projectId,
        sessionId,
        ownerVisible: true,
      });

      return {
        success: false,
        error: `Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        provenance: 'SchedulerAgent',
      };
    }
  },
};
