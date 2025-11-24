import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Choose your model based on env
const getModel = () => {
  if (process.env.GEMINI_API_KEY) {
    console.log('[Chat API] Using Gemini 2.0 Flash');
    return google('gemini-2.0-flash-exp'); // Fast and efficient
    // Alternative: google('gemini-1.5-pro') for more stable production use
  } else if (process.env.OPENAI_API_KEY) {
    console.log('[Chat API] Using OpenAI GPT-4');
    return openai('gpt-4-turbo-preview');
  }
  return null;
};

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const model = getModel();

    // Mock mode if no API keys
    if (!model) {
      console.log('[Chat API] No API key, using mock mode');
      return new Response(
        JSON.stringify({
          role: 'assistant',
          content: `[Mock Mode] I'm one of your brand agents! I can help you with:
- Brand strategy insights
- Content recommendations
- Industry analysis
- Workflow status

To use real AI, add GEMINI_API_KEY or OPENAI_API_KEY to your .env file.

What would you like to know about your brand?`,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Real AI streaming with error handling
    const result = await streamText({
      model,
      messages,
      system: `You are a helpful brand strategy AI assistant working as part of an agentic brand engine. 
      
You help users understand:
- Their brand profile and positioning
- Content strategy recommendations
- Industry insights and competitor analysis
- Workflow execution status
- Next steps in their branding journey

Be concise, actionable, and friendly. Format responses clearly with bullet points when appropriate.`,
    });

    return result.toDataStreamResponse();
    
  } catch (error: any) {
    console.error('[Chat API Error]:', error);
    
    // Handle specific API errors
    if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
      return new Response(
        JSON.stringify({
          error: 'API quota exceeded',
          message: 'Your API quota has been exceeded. Please check your billing or try again later.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      return new Response(
        JSON.stringify({
          error: 'Authentication failed',
          message: 'Invalid API key. Please check your .env configuration.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generic error
    return new Response(
      JSON.stringify({
        error: 'Chat failed',
        message: error.message || 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
