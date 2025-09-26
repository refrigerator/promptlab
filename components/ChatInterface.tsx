'use client';

import { useState, useEffect, useRef } from 'react';
import { Chat, LLMModel, Message } from '@/lib/types';
// Removed direct database imports - using API calls instead
import { Copy, Send, Plus, X, PanelRight, LayoutGrid } from 'lucide-react';
import { Rows, RowsPlusTop, RowsPlusBottom } from '@phosphor-icons/react';
import ModelSelector from './ModelSelector';
import OutputColumn from './OutputColumn';

interface ChatInterfaceProps {
  chat: Chat | null;
  llmModels: LLMModel[];
  onChatUpdate: () => void;
}

interface ChatWithMessages extends Chat {
  messages: Message[];
}

type DensityMode = 'compact' | 'comfortable' | 'spacious';

const densityConfig = {
  compact: {
    rowHeight: 'h-24',
    padding: 'p-3',
    textSize: 'text-xs',
    iconSize: 'w-3 h-3',
    spacing: 'gap-1',
  },
  comfortable: {
    rowHeight: 'h-32',
    padding: 'p-4',
    textSize: 'text-xs',
    iconSize: 'w-4 h-4',
    spacing: 'gap-2',
  },
  spacious: {
    rowHeight: 'h-40',
    padding: 'p-5',
    textSize: 'text-xs',
    iconSize: 'w-5 h-5',
    spacing: 'gap-3',
  },
};

export default function ChatInterface({ chat, llmModels, onChatUpdate }: ChatInterfaceProps) {
  const [chatData, setChatData] = useState<ChatWithMessages | null>(null);
  const [selectedModels, setSelectedModels] = useState<LLMModel[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelParams, setModelParams] = useState<Record<string, { temperature: number; max_tokens: number }>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [densityMode, setDensityMode] = useState<DensityMode>('comfortable');
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
          const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: chatData.id,
              modelId: model.id,
              messages: [...chatData.messages, userMsg].map(msg => ({
                role: msg.role,
                content: msg.content,
              })),
              temperature: params.temperature,
              maxTokens: params.max_tokens,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send message');
          }
          
          return await response.json();
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
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{chatData.title}</h2>
          <div className="flex items-center gap-2">
            <ModelSelector
              models={llmModels}
              selectedModels={selectedModels}
              onAddModel={addModel}
            />
            
            {/* Density Toggle */}
            <div className="flex items-center border border-input rounded">
              {(['compact', 'comfortable', 'spacious'] as DensityMode[]).map((mode) => {
                const getIcon = () => {
                  switch (mode) {
                    case 'compact':
                      return <Rows className="w-4 h-4" />;
                    case 'comfortable':
                      return <RowsPlusTop className="w-4 h-4" />;
                    case 'spacious':
                      return <RowsPlusBottom className="w-4 h-4" />;
                    default:
                      return <RowsPlusTop className="w-4 h-4" />;
                  }
                };
                
                return (
                  <button
                    key={mode}
                    onClick={() => setDensityMode(mode)}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      densityMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    } ${mode === 'compact' ? 'rounded-l' : mode === 'spacious' ? 'rounded-r' : ''}`}
                    title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} density`}
                  >
                    {getIcon()}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-2 hover:bg-accent rounded transition-colors"
              title={isDrawerOpen ? "Close output panel" : "Open output panel"}
            >
              <PanelRight className={`w-4 h-4 ${isDrawerOpen ? 'text-primary' : ''}`} />
            </button>
            {llmModels.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No models available
              </span>
            )}
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

      {/* Chat Messages - Scrollable Grid */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex gap-4 min-w-max">
          {/* Fixed Model Names Column */}
          <div className="flex-shrink-0 w-32 sticky left-0 bg-background z-10">
            <div className="space-y-2">
              {/* User Message Header */}
              {messageGroups.length > 0 && messageGroups[0][0] && messageGroups[0][0].role === 'user' && (
                <div className={`${densityConfig[densityMode].rowHeight} ${densityConfig[densityMode].padding} flex items-center`}>
                  <div className={`${densityConfig[densityMode].textSize} font-medium text-muted-foreground`}>User</div>
                </div>
              )}
              
              {/* Model Names */}
              {messageGroups.length > 0 && messageGroups[0].slice(1).map((message, msgIndex) => (
                <div key={msgIndex} className={`${densityConfig[densityMode].rowHeight} ${densityConfig[densityMode].padding} flex items-center`}>
                  <div className={`${densityConfig[densityMode].textSize} font-medium text-muted-foreground truncate`}>
                    {message.model_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {messageGroups.map((group, groupIndex) => {
            const config = densityConfig[densityMode];
            return (
              <div key={groupIndex} className="flex-shrink-0 w-80">
                <div className="space-y-2">
                  {/* User Message */}
                  {group[0] && group[0].role === 'user' && (
                    <div className={`${config.rowHeight} ${config.padding} bg-primary text-primary-foreground rounded flex flex-col group`}>
                      <div className="flex items-center justify-end mb-2">
                        <button
                          onClick={() => copyToClipboard(group[0].content)}
                          className="p-1 hover:bg-primary-foreground/20 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className={config.iconSize} />
                        </button>
                      </div>
                      <div className={`${config.textSize} whitespace-pre-wrap overflow-y-auto flex-1`}>
                        {group[0].content}
                      </div>
                    </div>
                  )}

                  {/* Assistant Messages - Fixed Height Rows */}
                  {group.slice(1).map((message, msgIndex) => (
                    <div key={msgIndex} className={`${config.rowHeight} ${config.padding} bg-card border border-border rounded flex flex-col group`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs text-muted-foreground`}>
                            {message.response_time_ms && `${message.response_time_ms}ms`}
                            {message.tokens_used && ` • ${message.tokens_used} tokens`}
                            {message.estimated_cost && ` • $${message.estimated_cost.toFixed(4)}`}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="p-1 hover:bg-accent rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className={config.iconSize} />
                        </button>
                      </div>
                      <div className={`${config.textSize} whitespace-pre-wrap overflow-y-auto flex-1`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex-shrink-0 w-80">
              <div className={`${densityConfig[densityMode].rowHeight} ${densityConfig[densityMode].padding} bg-card border border-border rounded flex items-center justify-center`}>
                <div className={`${densityConfig[densityMode].textSize} text-muted-foreground`}>Generating responses...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border flex-shrink-0">
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

      {/* Output Drawer */}
      {isDrawerOpen && (
        <div className="absolute top-0 right-0 w-80 h-full bg-card border-l border-border shadow-lg z-50">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold">Output</h3>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 hover:bg-accent rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <OutputColumn />
          </div>
        </div>
      )}
    </div>
  );
}
