export interface Chat {
  id: number;
  title: string;
  folder_id?: number;
  folder_name?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: number;
  name: string;
  parent_id?: number;
  created_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  llm_provider?: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
  response_time_ms?: number;
  tokens_used?: number;
  estimated_cost?: number;
  created_at: string;
}

export interface LLMConfig {
  model: string;
  temperature: number;
  max_tokens: number;
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length?: number;
  architecture?: {
    modality: string;
    tokenizer: string;
  };
}