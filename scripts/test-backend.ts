/**
 * Backend Integration Test
 * Tests database, agents, orchestrator, and API functionality
 */

import { getDb, initDb } from '../lib/db';
import { projects, logEvents } from '../lib/db/schema';
import { nanoid } from 'nanoid';
import { knowledgeAgent } from '../lib/agents/knowledge-agent';
import { brandBrainAgent } from '../lib/agents/brand-brain-agent';
import { executeTool } from '../lib/tools';
import { eq } from 'drizzle-orm';

async function testDatabase() {
  console.log('\n🧪 Testing Database...');
  
  try {
    await initDb();
    const db = getDb();
    
    // Test project creation
    const testProjectId = nanoid();
    await db.insert(projects).values({
      id: testProjectId,
      name: 'Test Project',
      description: 'Backend test',
      status: 'draft',
    });
    
    // Test project retrieval
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, testProjectId))
      .limit(1);
    
    console.log('✅ Database: Project CRUD working');
    console.log(`   Created project: ${project.name}`);
    
    // Cleanup
    await db.delete(projects).where(eq(projects.id, testProjectId));
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

async function testTools() {
  console.log('\n🧪 Testing Tools...');
  
  try {
    const testProjectId = nanoid();
    
    // Test file storage
    const saveResult = await executeTool('file_storage', {
      action: 'save',
      projectId: testProjectId,
      type: 'test',
      content: { message: 'Test artifact' },
    });
    
    if (!saveResult.success) {
      throw new Error('File storage save failed');
    }
    console.log('✅ Tools: File storage working');
    
    // Test memory
    const memoryResult = await executeTool('memory', {
      action: 'store',
      projectId: testProjectId,
      key: 'test_key',
      value: { data: 'test data' },
    });
    
    if (!memoryResult.success) {
      throw new Error('Memory storage failed');
    }
    console.log('✅ Tools: Memory working');
    
    // Test web scout (mock mode)
    const webScoutResult = await executeTool('web_scout', {
      action: 'search_competitors',
      industry: 'technology',
      limit: 3,
    });
    
    if (!webScoutResult.success) {
      throw new Error('Web scout failed');
    }
    console.log('✅ Tools: Web scout working (mock mode)');
    console.log(`   Found ${webScoutResult.data.competitors.length} competitors`);
    
    return true;
  } catch (error) {
    console.error('❌ Tools test failed:', error);
    return false;
  }
}

async function testAgents() {
  console.log('\n🧪 Testing Agents...');
  
  try {
    const testProjectId = nanoid();
    
    // Test KnowledgeAgent
    const knowledgeResult = await knowledgeAgent.run({
      input: {
        documents: [
          { text: 'Sample document about AI technology' },
        ],
      },
      projectId: testProjectId,
      sessionId: 'test_session',
    });
    
    if (!knowledgeResult.success) {
      throw new Error('KnowledgeAgent failed');
    }
    console.log('✅ Agents: KnowledgeAgent working');
    console.log(`   Confidence: ${knowledgeResult.confidence}`);
    
    // Test BrandBrainAgent
    const brandResult = await brandBrainAgent.run({
      input: {
        name: 'Test Brand',
        industry: 'Technology',
        targetAudience: 'Developers',
        brandVision: 'Innovate the future',
        brandValues: ['Innovation', 'Quality'],
      },
      projectId: testProjectId,
      sessionId: 'test_session',
    });
    
    if (!brandResult.success) {
      throw new Error('BrandBrainAgent failed');
    }
    console.log('✅ Agents: BrandBrainAgent working');
    console.log(`   Confidence: ${brandResult.confidence}`);
    console.log(`   Content pillars: ${brandResult.data.content_pillars?.length || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Agents test failed:', error);
    return false;
  }
}

async function testEventLogging() {
  console.log('\n🧪 Testing Event Logging...');
  
  try {
    const db = getDb();
    const testProjectId = nanoid();
    
    // Insert test event
    await db.insert(logEvents).values({
      id: nanoid(),
      timestamp: new Date().toISOString(),
      agentId: 'test_agent',
      agentName: 'TestAgent',
      eventType: 'emit',
      payloadSummary: 'Test event',
      projectId: testProjectId,
      ownerVisible: true,
    });
    
    // Query events
    const events = await db
      .select()
      .from(logEvents)
      .where(eq(logEvents.projectId, testProjectId));
    
    if (events.length === 0) {
      throw new Error('Event logging failed');
    }
    
    console.log('✅ Logging: Event storage working');
    console.log(`   Logged ${events.length} event(s)`);
    
    // Cleanup
    await db.delete(logEvents).where(eq(logEvents.projectId, testProjectId));
    
    return true;
  } catch (error) {
    console.error('❌ Event logging test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Backend Integration Tests\n');
  console.log('=' . repeat(50));
  
  const results = {
    database: await testDatabase(),
    tools: await testTools(),
    agents: await testAgents(),
    logging: await testEventLogging(),
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results:');
  console.log(`   Database: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Tools: ${results.tools ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Agents: ${results.agents ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Logging: ${results.logging ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - Backend is ready!\n');
  } else {
    console.log('❌ SOME TESTS FAILED - Check errors above\n');
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
