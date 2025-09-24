import { NextRequest, NextResponse } from 'next/server';
import { fetchOpenRouterModels, convertOpenRouterModelToLLMModel } from '@/lib/openrouter';
import { saveLLMModel } from '@/lib/db-service';

export async function POST(request: NextRequest) {
  try {
    const models = await fetchOpenRouterModels();
    
    // Convert and save each model
    for (const model of models) {
      const llmModel = convertOpenRouterModelToLLMModel(model);
      saveLLMModel(llmModel);
    }

    return NextResponse.json({ 
      success: true, 
      count: models.length,
      message: `Synced ${models.length} models from OpenRouter`
    });
  } catch (error) {
    console.error('Error syncing models:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}