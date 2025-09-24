import { OpenRouterModel, LLMModel } from './types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

export function convertOpenRouterModelToLLMModel(model: OpenRouterModel): LLMModel {
  return {
    id: model.id,
    name: model.name,
    provider: model.top_provider ? 'OpenRouter' : 'Unknown',
    context_length: model.context_length,
    pricing_input: parseFloat(model.pricing.prompt) || null,
    pricing_output: parseFloat(model.pricing.completion) || null,
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function sendMessageToOpenRouter(
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.7,
  max_tokens: number = 1000
): Promise<{
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  response_time_ms: number;
}> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  const startTime = Date.now();

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'PromptLab',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature,
      max_tokens,
    }),
  });

  const responseTime = Date.now() - startTime;

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    response_time_ms: responseTime,
  };
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricingInput: number | null,
  pricingOutput: number | null
): number {
  if (!pricingInput || !pricingOutput) return 0;
  
  const inputCost = (inputTokens / 1000000) * pricingInput;
  const outputCost = (outputTokens / 1000000) * pricingOutput;
  
  return inputCost + outputCost;
}