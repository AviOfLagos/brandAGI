# BrandAgi - Agentic Brand Engine

> AI-powered multi-agent system for automated brand strategy, content generation, and social media scheduling

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-3.0-orange)](https://sdk.vercel.ai/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🌟 Overview

BrandAgi is an intelligent brand automation platform that leverages **11 specialized AI agents** working together through a sophisticated workflow orchestration system. It transforms brand requirements into comprehensive strategies and ready-to-publish content across multiple platforms.

## ✨ Key Features

### 🤖 **Multi-Agent System (11 Agents)**

#### **Workflow Agents** (8 agents)
1. **KnowledgeAgent** - Document ingestion & vector embeddings
   - Processes brand documents, URLs, and text inputs
   - Creates vector embeddings for semantic search
   - Builds knowledge base for other agents

2. **IndustryDNAAgent** - Industry research & trend analysis
   - Researches competitors using web scout
   - Analyzes industry design trends
   - Identifies top-performing content patterns
   - Provides tone, color, and cadence recommendations

3. **CompetitorAnalysisAgent** - Deep competitor intelligence
   - Discovers 5-10 direct competitors
   - Analyzes positioning, pricing, and features
   - Identifies market gaps and opportunities
   - Provides strategic differentiation recommendations

4. **BrandBrainAgent** - Brand profile assembly
   - Synthesizes brand identity from intake questions
   - Defines messaging, tone, and content pillars
   - Creates comprehensive brand profile
   - Establishes unique selling proposition

5. **StrategyAgent** - Content strategy with decision points
   - Generates 3 strategic approaches (safe/balanced/bold)
   - Defines content objectives and platforms
   - Creates posting frequency recommendations
   - **Pauses workflow for human approval**

6. **WriterAgent** - Long-form thought leadership content
   - Generates 1500-3000 word articles
   - SEO optimization (keywords, meta tags, slugs)
   - Brand voice integration
   - Confidence scoring for originality and engagement

7. **RepurposeAgent** - Social media content transformation
   - Transforms long-form into platform-optimized posts
   - **Twitter**: Threads + standalone tweets
   - **LinkedIn**: Professional posts + carousel slides
   - **Instagram**: Captions + hashtags + hooks

8. **SchedulerAgent** - Smart publishing calendar
   - Creates 30-day publishing schedules
   - Platform-specific optimal timing
   - Content mix balancing (60% educational, 30% thought leadership, 10% promotional)
   - Realistic production timelines

#### **System Agents** (3 agents)
9. **OutputPasserAgent** - Universal event logger
   - Logs all agent actions with timestamps
   - Tracks confidence scores and provenance
   - Maintains dependency chains
   - Enables full workflow traceability

10. **QA_Agent** - Quality assurance validation
    - Validates agent outputs
    - Checks confidence thresholds
    - Ensures schema compliance
    - Triggers warnings for low-quality outputs

11. **CodeReviewAgent** - Artifact review
    - Reviews generated artifacts
    - Validates structured data
    - Ensures consistency across outputs
    - Provides quality feedback

### 🔄 **Intelligent Workflow Orchestration**

- **Dependency Gating** - Agents execute only when dependencies complete
- **Automatic Retry** - Exponential backoff with configurable policies
- **Decision Points** - Workflow pauses for human approval
- **Quality Checks** - Automatic QA and code review on all outputs
- **State Persistence** - Resume workflows across sessions
- **Error Recovery** - Graceful handling of failures

### 📊 **Real-time Monitoring**

- **Activity Feed** - Live workflow progress updates
- **Confidence Scoring** - 0.0-1.0 scores for all agent outputs
- **Provenance Tracking** - Full reasoning and source attribution
- **Artifact Viewer** - Display generated content (markdown, JSON, code, tables)
- **Event Logging** - Comprehensive audit trail

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17+
- pnpm (recommended) or npm
- Google Gemini API key (or OpenAI)

### Installation

```bash
# Clone repository
git clone https://github.com/AviOfLagos/brandAGI.git
cd brandAGI

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Add your GOOGLE_GENERATIVE_AI_API_KEY

# Setup database
pnpm db:generate
pnpm db:push

# (Optional) Seed demo data
pnpm seed

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to create your first brand project.

## 🏗️ Architecture

### Agent Collaboration Flow

```
┌──────────────────┐
│ User Input       │
│ (5 Questions)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│                    Master Orchestrator                    │
│  • Dependency management  • Retry logic  • QA checks     │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Knowledge       │────▶│ Industry DNA     │────▶│ Competitor       │
│ Agent           │     │ Agent            │     │ Analysis         │
└─────────────────┘     └──────────────────┘     └─────────┬────────┘
                                                            │
                                                            ▼
┌─────────────────┐                              ┌──────────────────┐
│ Brand Brain     │◀─────────────────────────────│ Industry+        │
│ Agent           │                              │ Competitor Data  │
└────────┬────────┘                              └──────────────────┘
         │
         ▼
┌─────────────────┐
│ Strategy Agent  │──────┐
│ (Decision Req'd)│      │ Presents 3 options
└────────┬────────┘      │ Pauses for approval
         │               │
         ▼               ▼
    [Human Approval Required]
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Writer Agent    │────▶│ Repurpose Agent  │────▶│ Scheduler Agent  │
│ (Longform)      │     │ (Social Media)   │     │ (Calendar)       │
└─────────────────┘     └──────────────────┘     └─────────┬────────┘
                                                            │
                                                            ▼
                                                   ┌──────────────────┐
                                                   │ Ready to Publish │
                                                   └──────────────────┘

                       System Agents (Always Running)
                ┌──────────────┬──────────────┬──────────────┐
                │ OutputPasser │ QA_Agent     │CodeReviewAgent│
                └──────────────┴──────────────┴──────────────┘
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router), React 19
- **Language**: TypeScript 5.0
- **AI**: Vercel AI SDK 3.0, Google Gemini 2.0 Flash
- **Database**: Drizzle ORM + SQLite (dev), PostgreSQL-ready
- **Validation**: Zod schemas
- **Styling**: TailwindCSS 3.4
- **Tools**: Web Scout, Vector Embeddings, Memory Store, File Storage

## 📁 Project Structure

```
brandagi/
├── app/
│   ├── api/
│   │   ├── orchestrator/     # Workflow control endpoints
│   │   ├── logs/             # Event logging API
│   │   ├── projects/         # Project CRUD
│   │   └── decisions/        # Decision approval
│   ├── components/           # React components
│   │   ├── ActivityFeed.tsx  # Real-time workflow updates
│   │   ├── DecisionModal.tsx # Strategy approval UI
│   │   └── ArtifactViewer.tsx # Display agent outputs
│   └── project/[id]/         # Project dashboard
├── lib/
│   ├── agents/               # 11 AI agents
│   │   ├── knowledge-agent.ts
│   │   ├── industry-dna-agent.ts
│   │   ├── competitor-analysis-agent.ts
│   │   ├── brand-brain-agent.ts
│   │   ├── strategy-agent.ts
│   │   ├── writer-agent.ts
│   │   ├── repurpose-agent.ts
│   │   ├── scheduler-agent.ts
│   │   ├── output-passer-agent.ts
│   │   └── qa-code-review-agents.ts
│   ├── tools/                # Reusable tools
│   │   ├── web-scout.ts      # Web scraping & search
│   │   ├── embedder.ts       # Vector embeddings
│   │   ├── memory.ts         # Context storage
│   │   └── file-storage.ts   # Artifact persistence
│   ├── orchestrator/         # Workflow engine
│   │   ├── index.ts          # Main orchestrator
│   │   ├── workflow-parser.ts
│   │   └── state-manager.ts
│   ├── db/                   # Database schema & migrations
│   └── common/               # Shared types & Zod schemas
├── workflows/
│   └── brand_workflow.yaml   # Workflow definition
└── scripts/
    ├── seed.ts               # Demo data generator
    └── test-backend.ts       # Orchestrator tests
```

## 🎯 API Endpoints

### Orchestrator

```bash
# Start workflow
POST /api/orchestrator/start
Body: { projectId, input, sessionId }

# Get workflow state  
GET /api/orchestrator/state/:projectId

# Stop workflow
POST /api/orchestrator/stop
Body: { projectId }
```

### Projects

```bash
GET    /api/projects           # List all projects
POST   /api/projects           # Create new project
GET    /api/projects/:id       # Get project details
PUT    /api/projects/:id       # Update project
```

### Logs & Decisions

```bash
GET  /api/logs?projectId=&ownerVisible=true&limit=50
POST /api/decisions/:id/approve
Body: { projectId, selectedOption, sessionId }
```

## 💾 Database Schema

| Table | Purpose |
|-------|---------|
| `log_events` | All agent events with full traceability |
| `projects` | Project details & brand profiles |
| `sessions` | Conversation/workflow sessions |
| `artifacts` | Generated content & assets |
| `schedules` | Content publishing calendars |
| `decisions` | Decision points requiring approval |
| `workflow_states` | Workflow execution state |

## 🔧 Development

### Database Commands

```bash
pnpm db:generate  # Generate migrations
pnpm db:push      # Apply to database
pnpm db:studio    # Open Drizzle Studio
```

### Mock Mode

Run without API keys for development:

```env
# .env
USE_MOCK_LLM=true
```

System auto-detects missing keys and uses mock data.

### Running Tests

```bash
# Test orchestrator
pnpm test:backend

# Seed demo data
pnpm seed
```

## 🚢 Production Readiness

### ✅ Ready to Scale

- [x] All 11 agents implemented with structured outputs
- [x] PostgreSQL migration path
- [x] Workflow state persistence
- [x] Error handling & retry logic
- [x] Confidence scoring & quality checks
- [x] Real-time activity feed
- [x] Decision approval flow

### 🚧 Next Steps (Phase 17-18)

- [ ] Redis for job queue (BullMQ)
- [ ] Vector database (Chroma/Pinecone)
- [ ] S3 for artifact storage
- [ ] Real SERP API integration
- [ ] Authentication (Clerk/NextAuth)
- [ ] WebSocket/SSE for real-time updates
- [ ] Chat-first interface with dynamic workflow selection

## 📚 Current Status

**Phase 5 Complete** - All workflow agents operational

### ✅ Completed
- 11 specialized AI agents
- Master orchestrator with decision points
- Real-time activity feed
- Project creation wizard (5 questions)
- Artifact viewer component
- Comprehensive logging system
- Quality assurance checks

### 🚧 In Progress (Phase 16)
- TypeScript lint refinements
- Agent output quality tuning
- Artifact schema compliance

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Built with:
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI integration framework
- [Next.js](https://nextjs.org/) - React framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Google Gemini](https://ai.google.dev/) - LLM provider

---

**Built with ❤️ by the BrandAgi team**

[Report Bug](https://github.com/AviOfLagos/brandAGI/issues) · [Request Feature](https://github.com/AviOfLagos/brandAGI/issues) · [Documentation](https://github.com/AviOfLagos/brandAGI/wiki)
