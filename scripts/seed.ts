import { getDb, initDb } from './lib/db';
import { projects } from './lib/db/schema';
import { nanoid } from 'nanoid';
import { orchestrator } from './lib/orchestrator';

/**
 * Seed script - creates demo project and runs workflow
 */
async function seed() {
  console.log('🌱 Starting seed script...\n');

  // Initialize database
  await initDb();
  console.log('✓ Database initialized\n');

  // Create demo project
  const db = getDb();
  const projectId = nanoid();

  const brandProfile = {
    name: 'TechFlow Solutions',
    industry: 'Technology & SaaS',
    targetAudience: 'B2B tech professionals and decision makers',
    brandVision: 'Streamline workflows with intelligent automation',
    brandValues: ['Innovation', 'Reliability', 'Customer Success', 'Transparency'],
  };

  await db.insert(projects).values({
    id: projectId,
    name: brandProfile.name,
    description: 'Demo project for Agentic Brand Engine',
    status: 'active',
    brandProfile: JSON.stringify(brandProfile),
    metadata: JSON.stringify({
      demo: true,
      createdBy: 'seed_script',
    }),
  });

  console.log(`✓ Created demo project: ${projectId}`);
  console.log(`  Name: ${brandProfile.name}`);
  console.log(`  Industry: ${brandProfile.industry}\n`);

  // Start workflow
  console.log('🚀 Starting workflow...\n');

  try {
    const result = await orchestrator.startWorkflow(
      projectId,
      brandProfile,
      'seed_session'
    );

    console.log('✓ Workflow started successfully');
    console.log('  Status:', result.status);
    
    if (result.executedNodes) {
      console.log('  Executed nodes:', result.executedNodes.length);
      result.executedNodes.forEach((node: any) => {
        console.log(`    - ${node.nodeId}: ${node.status}`);
      });
    }

    if (result.pendingDecisions && result.pendingDecisions.length > 0) {
      console.log('\n⏸️  Workflow paused - decision required');
      console.log('  Pending decisions:', result.pendingDecisions);
      console.log('\n  To approve decision and continue:');
      console.log('  1. Visit http://localhost:3000');
      console.log('  2. Open the demo project');
      console.log('  3. Review and approve the strategy decision');
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Next steps:');
    console.log('  1. Run: pnpm dev');
    console.log('  2. Open: http://localhost:3000');
    console.log(`  3. View project: ${projectId}\n`);
  } catch (error) {
    console.error('\n❌ Workflow error:', error);
    console.log('  This is expected in mock mode');
    console.log('  The demo project was created successfully\n');
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
