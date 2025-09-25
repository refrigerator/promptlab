export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: number;
  title: string;
  folder_id: number | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  model_id: string | null;
  model_name: string | null;
  temperature: number | null;
  max_tokens: number | null;
  response_time_ms: number | null;
  tokens_used: number | null;
  estimated_cost: number | null;
  created_at: string;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  context_length: number | null;
  pricing_input: number | null;
  pricing_output: number | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}

export interface FolderWithChildren extends Folder {
  children: FolderWithChildren[];
  chats: Chat[];
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
  };
}
