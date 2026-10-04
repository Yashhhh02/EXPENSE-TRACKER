export type AIModelTask = 'categorize' | 'advisor' | 'report';

export function getModelForTask(task: AIModelTask): string {
  switch (task) {
    case 'categorize':
      return process.env.OPENROUTER_CATEGORIZE_MODEL || 'nvidia/nemotron-3-nano-30b-a3b';
    case 'advisor':
      return process.env.OPENROUTER_ADVISOR_MODEL || 'nvidia/nemotron-3-super';
    case 'report':
      return process.env.OPENROUTER_REPORT_MODEL || 'google/gemma-4-31b';
    default:
      throw new Error(`Unknown AI task: ${task}`);
  }
}

export interface OpenRouterCallOptions {
  maxTokens?: number;
  timeoutMs?: number;
}

export class OpenRouterError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options?: OpenRouterCallOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new OpenRouterError('OPENROUTER_API_KEY is not configured in environment variables.');
  }

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Expense Tracker AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: options?.maxTokens || 150,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown response error');
      throw new OpenRouterError(
        `OpenRouter API error (${response.status}): ${errorText}`,
        response.status
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      throw new OpenRouterError('OpenRouter response returned empty or invalid choices content.');
    }

    return content.trim();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new OpenRouterError(`OpenRouter call timed out after ${timeoutMs}ms.`);
    }
    if (error instanceof OpenRouterError) {
      throw error;
    }
    throw new OpenRouterError(`OpenRouter request failed: ${error?.message || String(error)}`);
  }
}

export async function dispatchOpenRouterCall(
  task: AIModelTask,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
) {
  const model = getModelForTask(task);
  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const userMessage = messages.find((m) => m.role === 'user')?.content || '';

  const responseText = await callOpenRouter(model, systemMessage, userMessage);
  return {
    model,
    content: responseText,
  };
}

