import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { embed } from 'ai';

/**
 * Get the appropriate LLM model based on available API keys
 * Priority: Gemini > OpenAI > Mock
 */
export function getLLM() {
  // Prefer Gemini if available
  if (process.env.GEMINI_API_KEY) {
    console.log('[AI] Using Gemini 2.0 Flash');
    return google('gemini-2.0-flash-exp'); // or 'gemini-1.5-pro' for more stable
  }
  
  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    console.log('[AI] Using OpenAI GPT-4');
    return openai('gpt-4-turbo-preview');
  }
  
  // No API keys available
  console.log('[AI] No API keys configured, using mock mode');
  return null;
}

/**
 * Get embeddings model with error handling
 */
export function getEmbeddingsModel() {
  // Prefer Gemini embeddings
  if (process.env.GEMINI_API_KEY) {
    console.log('[AI] Using Gemini text-embedding-004');
    return google.textEmbeddingModel('text-embedding-004');
  }
  
  // Fallback to OpenAI embeddings
  if (process.env.OPENAI_API_KEY) {
    console.log('[AI] Using OpenAI text-embedding-3-small');
    return openai.embedding('text-embedding-3-small');
  }
  
  // No API keys
  console.log('[AI] No API keys for embeddings, will use mock');
  return null;
}

/**
 * Check if we have any API keys configured
 */
export function hasAPIKey(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
}

/**
 * Mock LLM call for development without API keys
 */
export async function mockLLMCall(prompt: string): Promise<string> {
  console.log('[Mock LLM] Generating mock response for:', prompt.slice(0, 100));
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return `[Mock Response] This is a simulated AI response. 

Based on your input, I would analyze the brand positioning, target audience, and competitive landscape. 

To use real AI responses, add GEMINI_API_KEY or OPENAI_API_KEY to your .env file.

**Mock Insights:**
- Brand positioning looks strong
- Target audience is well-defined
- Content strategy should focus on thought leadership

*This is mock data for development purposes.*`;
}
