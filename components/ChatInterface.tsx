'use client';

import { useState, useEffect, useRef } from 'react';
import { Chat, LLMModel, Message } from '@/lib/types';
// Removed direct database imports - using API calls instead
import { sendMessageToOpenRouter, calculateCost } from '@/lib/openrouter';
import { Copy, Send, Plus, X } from 'lucide-react';

interface ChatInterfaceProps {
  chat: Chat | null;
  llmModels: LLMModel[];
  onChatUpdate: () => void;
}

interface ChatWithMessages extends Chat {
  messages: Message[];
}

export default function ChatInterface({ chat, llmModels, onChatUpdate }: ChatInterfaceProps) {
  const [chatData, setChatData] = useState<ChatWithMessages | null>(null);
  const [selectedModels, setSelectedModels] = useState<LLMModel[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelParams, setModelParams] = useState<Record<string, { temperature: number; max_tokens: number }>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      loadChatData();
    } else {
      setChatData(null);
    }
  }, [chat]);

  useEffect(() => {
    scrollToEnd();
  }, [chatData]);

  const loadChatData = async () => {
    if (!chat) return;
    
    try {
      const response = await fetch(`/api/chats/${chat.id}`);
      if (!response.ok) {
        throw new Error('Failed to load chat data');
      }
      const data = await response.json();
      setChatData(data);
    } catch (error) {
      console.error('Error loading chat data:', error);
    }
  };

  const scrollToEnd = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatData || selectedModels.length === 0 || isLoading) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    try {
      // Create user message
      const userResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatData.id,
          role: 'user',
          content: userMessage,
          model_id: null,
          model_name: null,
          temperature: null,
          max_tokens: null,
          response_time_ms: null,
          tokens_used: null,
          estimated_cost: null,
        }),
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to create user message');
      }
      
      const userMsg = await userResponse.json();

      // Update chat data
      setChatData(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMsg]
      } : null);

      // Send to each selected model
      const modelPromises = selectedModels.map(async (model) => {
        const params = modelParams[model.id] || { temperature: 0.7, max_tokens: 1000 };
        
        try {
          const response = await sendMessageToOpenRouter(
            model.id,
            [...chatData.messages, userMsg].map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            params.temperature,
            params.max_tokens
          );

          const cost = calculateCost(
            response.usage.prompt_tokens,
            response.usage.completion_tokens,
            model.pricing_input,
            model.pricing_output
          );

          const messageResponse = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatData.id,
              role: 'assistant',
              content: response.content,
              model_id: model.id,
              model_name: model.name,
              temperature: params.temperature,
              max_tokens: params.max_tokens,
              response_time_ms: response.response_time_ms,
              tokens_used: response.usage.total_tokens,
              estimated_cost: cost,
            }),
          });
          
          if (!messageResponse.ok) {
            throw new Error('Failed to create assistant message');
          }
          
          return await messageResponse.json();
        } catch (error) {
          console.error(`Error with model ${model.name}:`, error);
          
          const errorResponse = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatData.id,
              role: 'assistant',
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              model_id: model.id,
              model_name: model.name,
              temperature: params.temperature,
              max_tokens: params.max_tokens,
              response_time_ms: null,
              tokens_used: null,
              estimated_cost: null,
            }),
          });
          
          if (!errorResponse.ok) {
            throw new Error('Failed to create error message');
          }
          
          return await errorResponse.json();
        }
      });

      const assistantMessages = await Promise.all(modelPromises);

      // Update chat data with all responses
      setChatData(prev => prev ? {
        ...prev,
        messages: [...prev.messages, ...assistantMessages]
      } : null);

      onChatUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const addModel = (model: LLMModel) => {
    if (!selectedModels.find(m => m.id === model.id)) {
      setSelectedModels([...selectedModels, model]);
      setModelParams(prev => ({
        ...prev,
        [model.id]: { temperature: 0.7, max_tokens: 1000 }
      }));
    }
  };

  const removeModel = (modelId: string) => {
    setSelectedModels(selectedModels.filter(m => m.id !== modelId));
    setModelParams(prev => {
      const newParams = { ...prev };
      delete newParams[modelId];
      return newParams;
    });
  };

  const updateModelParams = (modelId: string, params: { temperature: number; max_tokens: number }) => {
    setModelParams(prev => ({
      ...prev,
      [modelId]: params
    }));
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a chat to start experimenting
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading chat...</div>
      </div>
    );
  }

  // Group messages by conversation turn
  const messageGroups: Message[][] = [];
  let currentGroup: Message[] = [];
  
  chatData.messages.forEach((message, index) => {
    if (message.role === 'user') {
      if (currentGroup.length > 0) {
        messageGroups.push([...currentGroup]);
        currentGroup = [];
      }
      currentGroup.push(message);
    } else {
      currentGroup.push(message);
    }
  });
  
  if (currentGroup.length > 0) {
    messageGroups.push(currentGroup);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{chatData.title}</h2>
          <div className="flex items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                const model = llmModels.find(m => m.id === e.target.value);
                if (model) addModel(model);
                e.target.value = '';
              }}
              className="px-3 py-1 text-sm border border-input rounded bg-background"
            >
              <option value="">Add Model</option>
              {llmModels
                .filter(model => !selectedModels.find(m => m.id === model.id))
                .map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Selected Models */}
        {selectedModels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedModels.map(model => (
              <div key={model.id} className="flex items-center gap-2 p-2 bg-accent rounded">
                <span className="text-sm font-medium">{model.name}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={modelParams[model.id]?.temperature || 0.7}
                    onChange={(e) => updateModelParams(model.id, {
                      ...modelParams[model.id],
                      temperature: parseFloat(e.target.value) || 0.7
                    })}
                    className="w-16 px-1 py-0.5 text-xs border border-input rounded bg-background"
                    placeholder="Temp"
                  />
                  <input
                    type="number"
                    min="1"
                    max="4000"
                    value={modelParams[model.id]?.max_tokens || 1000}
                    onChange={(e) => updateModelParams(model.id, {
                      ...modelParams[model.id],
                      max_tokens: parseInt(e.target.value) || 1000
                    })}
                    className="w-16 px-1 py-0.5 text-xs border border-input rounded bg-background"
                    placeholder="Tokens"
                  />
                </div>
                <button
                  onClick={() => removeModel(model.id)}
                  className="p-1 hover:bg-destructive/20 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Messages - Horizontal Scrollable Grid */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden p-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex gap-4 min-w-max">
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex-shrink-0 w-80">
              <div className="space-y-2">
                {/* User Message */}
                {group[0] && group[0].role === 'user' && (
                  <div className="p-3 bg-primary text-primary-foreground rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">You</div>
                        <div className="text-sm whitespace-pre-wrap">{group[0].content}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(group[0].content)}
                        className="p-1 hover:bg-primary-foreground/20 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Assistant Messages */}
                {group.slice(1).map((message, msgIndex) => (
                  <div key={msgIndex} className="p-3 bg-card border border-border rounded">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{message.model_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {message.response_time_ms && `${message.response_time_ms}ms`}
                          {message.tokens_used && ` • ${message.tokens_used} tokens`}
                          {message.estimated_cost && ` • $${message.estimated_cost.toFixed(4)}`}
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="p-1 hover:bg-accent rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex-shrink-0 w-80">
              <div className="p-3 bg-card border border-border rounded">
                <div className="text-sm text-muted-foreground">Generating responses...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-input rounded bg-background resize-none"
            rows={3}
            disabled={isLoading || selectedModels.length === 0}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || selectedModels.length === 0 || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {selectedModels.length === 0 && (
          <div className="text-sm text-muted-foreground mt-2">
            Select at least one model to start chatting
          </div>
        )}
      </div>
    </div>
  );
}