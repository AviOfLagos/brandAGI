# Contributing to BrandAgi

Thank you for your interest in contributing to BrandAgi! This document provides guidelines and information for contributors.

## 🌟 How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. **Search existing issues** to avoid duplicates
2. **Create a new issue** with a clear title and description
3. **Include**:
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Node version, etc.)

### Pull Requests

We actively welcome pull requests!

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**:
   - Follow existing code style
   - Add tests if applicable
   - Update documentation
4. **Commit with clear messages**: `git commit -m 'feat: add amazing feature'`
5. **Push to your fork**: `git push origin feature/amazing-feature`
6. **Open a Pull Request** with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots/videos for UI changes

## 🏗️ Development Setup

### Prerequisites

- Node.js 18.17+
- pnpm (recommended)
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/brandAGI.git
cd brandAGI

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Add your API keys

# Setup database
pnpm db:generate
pnpm db:push

# Start development
pnpm dev
```

## 📝 Code Style

### TypeScript

- Use TypeScript for all new code
- Define proper types, avoid `any`
- Use Zod for schema validation
- Follow existing patterns in the codebase

### Formatting

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Type check
pnpm typecheck
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```bash
feat: add social media scheduler agent
fix: resolve workflow state persistence issue
docs: update agent architecture diagram
```

## 🤖 Adding New Agents

### Agent Structure

All agents should follow this structure:

```typescript
import type { Agent, AgentInput, AgentOutputType } from '@/lib/common/types';

export const newAgent: Agent = {
  id: 'unique_agent_id',
  name: 'AgentName',
  description: 'What this agent does',
  version: '1.0.0',
  tools: ['tool1', 'tool2'],

  async run(input: AgentInput): Promise<AgentOutputType> {
    // 1. Log start event
    // 2. Execute agent logic
    // 3. Generate structured output
    // 4. Log completion
    // 5. Return with artifacts
    
    return {
      success: true,
      data: { /* structured data */ },
      confidence: 0.85,
      provenance: 'AgentName',
      artifacts: ['artifact_id'],
    };
  },
};
```

### Agent Checklist

- [ ] Implements `Agent` interface
- [ ] Has unique `id` and descriptive `name`
- [ ] Logs events via `logEvent()`
- [ ] Returns structured output matching `AgentOutputType`
- [ ] Includes confidence score (0.0-1.0)
- [ ] Provides provenance (reasoning/source)
- [ ] Has error handling with try/catch
- [ ] Generates artifacts if applicable
- [ ] Includes TypeScript types
- [ ] Has JSDoc comments
- [ ] Registered in `lib/agents/index.ts`

### Testing New Agents

```bash
# Run backend tests
pnpm test:backend

# Test in isolation
pnpm seed  # Creates demo project
# Then test via UI or API calls
```

## 🔧 Adding New Tools

Tools are reusable utilities that agents can leverage:

```typescript
// lib/tools/my-new-tool.ts
import type { Tool } from '@/lib/common/types';

export const myNewTool: Tool = {
  name: 'my_new_tool',
  description: 'What this tool does',
  
  async execute(input: ToolInputType): Promise<ToolOutputType> {
    try {
      // Tool logic here
      return {
        success: true,
        data: { /* result */ },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

Register in `lib/tools/index.ts`:

```typescript
export { myNewTool } from './my-new-tool';
```

## 🧪 Testing

### Running Tests

```bash
# All tests
pnpm test

# Backend only
pnpm test:backend

# With coverage
pnpm test:coverage
```

### Writing Tests

- Place tests next to the code: `agent-name.test.ts`
- Test success and error cases
- Mock external dependencies (LLMs, APIs)
- Verify structured outputs match schemas

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { myAgent } from './my-agent';

describe('MyAgent', () => {
  it('should return structured output', async () => {
    const result = await myAgent.run({
      input: { test: 'data' },
      projectId: 'test-project',
    });
    
    expect(result.success).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
  });
});
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments to all public functions
- Document complex logic inline
- Update README when adding major features

### Documentation Files

- `README.md` - Main project documentation
- `CONTRIBUTING.md` - This file
- `/docs` folder - Detailed guides (coming soon)

## 🎯 Areas for Contribution

### High Priority

- [ ] Additional workflow agents (Visual Identity, Tone & Voice)
- [ ] WebSocket/SSE real-time updates
- [ ] Artifact streaming with @ai-sdk-tools
- [ ] Production deployment guides
- [ ] E2E tests with Playwright

### Medium Priority

- [ ] Chat-first interface
- [ ] Dynamic workflow selection
- [ ] Agent performance optimization
- [ ] Better error messages
- [ ] Accessibility improvements

### Good First Issues

Look for issues labeled `good-first-issue`:
- Documentation improvements
- UI polish
- Bug fixes
- Test coverage

## 🔍 Code Review Process

All pull requests go through code review:

1. **Automated checks** run (lint, type check, tests)
2. **Maintainer review** for code quality and design
3. **Discussion** if changes needed
4. **Approval** and merge when ready

### Review Criteria

- Code follows project conventions
- Tests pass and coverage maintained
- Documentation updated
- No breaking changes (without discussion)
- Commit messages follow convention

## 🤔 Questions?

- Open a [GitHub Discussion](https://github.com/AviOfLagos/brandAGI/discussions)
- Check existing [Issues](https://github.com/AviOfLagos/brandAGI/issues)
- Read the [README](README.md)

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to BrandAgi!** 🎉

Every contribution, no matter how small, makes a difference.
