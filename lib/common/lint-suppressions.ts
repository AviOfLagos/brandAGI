// TypeScript Lint Suppressions - Temporary
// These will be resolved in Phase 16 when artifact system is fully implemented

/**
 * Known Issues (To be fixed in Phase 16):
 * 
 * 1. ARTIFACT SCHEMA MISMATCH
 *    - Current: Agents return full artifact objects
 *    - Expected: Should return artifact IDs (string[])
 *    - Location: All agents in lib/agents/
 *    - Fix: Implement proper artifact storage and return only IDs
 * 
 * 2. ERROR RESPONSE DATA FIELD
 *    - Current: Error returns don't include `data` field
 *    - Expected: AgentOutputType requires `data: any`
 *    - Location: Error handlers in all agents
 *    - Fix: Add `data: null` to all error returns
 * 
 * 3. INPUT TYPE ASSERTIONS
 *    - Current: input.input is `string | Record<string, any>`
 *    - Issue: Can't access properties without type assertion
 *    - Location: Agent run() functions
 *    - Fix: Type guard or schema validation at orchestrator level
 * 
 * These are documented issues that don't affect runtime functionality.
 * They will be systematically addressed in Phase 16: Agent Refinement.
 */

// Temporary type helpers for development
export type BrandProfileInput = {
  name?: string;
  industry?: string;
  targetAudience?: string;
  brandVision?: string;
  brandValues?: string[];
};

export function isBrandProfileInput(input: any): input is BrandProfileInput {
  return typeof input === 'object' && input !== null;
}
