import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToOpenRouter, calculateCost } from '@/lib/openrouter';
import { createMessage } from '@/lib/db-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      chatId, 
      modelId, 
      messages, 
      temperature, 
      maxTokens 
    } = await request.json();

    if (!chatId || !modelId || !messages) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Send message to OpenRouter
    const response = await sendMessageToOpenRouter(
      modelId,
      messages,
      temperature || 0.7,
      maxTokens || 1000
    );

    // Get model info for cost calculation
    const { getLLMModel } = await import('@/lib/db-service');
    const model = getLLMModel(modelId);
    
    const cost = model ? calculateCost(
      response.usage.prompt_tokens,
      response.usage.completion_tokens,
      model.pricing_input,
      model.pricing_output
    ) : 0;

    // Save message to database
    const message = createMessage({
      chat_id: chatId,
      role: 'assistant',
      content: response.content,
      model_id: modelId,
      model_name: model?.name || 'Unknown Model',
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 1000,
      response_time_ms: response.response_time_ms,
      tokens_used: response.usage.total_tokens,
      estimated_cost: cost,
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
