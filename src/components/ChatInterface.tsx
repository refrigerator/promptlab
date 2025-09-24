import React, { useState, useEffect, useRef } from 'react';
import { Chat, Message, LLMConfig, Model } from '../types';
import { Copy, Send, Plus, X } from 'lucide-react';

interface ChatInterfaceProps {
  selectedChat: Chat | null;
  messages: Message[];
  onSendMessage: (message: string, llmConfigs: LLMConfig[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedChat,
  messages,
  onSendMessage
}) => {
  const [message, setMessage] = useState('');
  const [llmConfigs, setLlmConfigs] = useState<LLMConfig[]>([]);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    // Scroll to the right when new messages are added
    if (chatGridRef.current) {
      chatGridRef.current.scrollLeft = chatGridRef.current.scrollWidth;
    }
  }, [messages]);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      setAvailableModels(data.data || []);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const addLLMConfig = () => {
    if (availableModels.length > 0) {
      setLlmConfigs(prev => [...prev, {
        model: availableModels[0].id,
        temperature: 0.7,
        max_tokens: 1000
      }]);
    }
  };

  const removeLLMConfig = (index: number) => {
    setLlmConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const updateLLMConfig = (index: number, field: keyof LLMConfig, value: any) => {
    setLlmConfigs(prev => prev.map((config, i) => 
      i === index ? { ...config, [field]: value } : config
    ));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || llmConfigs.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      await onSendMessage(message.trim(), llmConfigs);
      setMessage('');
    } catch (error) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const groupMessagesByColumn = () => {
    const columns: Message[][] = [];
    let currentColumn: Message[] = [];
    let lastRole: string | null = null;

    messages.forEach(msg => {
      if (lastRole && msg.role !== lastRole) {
        columns.push([...currentColumn]);
        currentColumn = [msg];
      } else {
        currentColumn.push(msg);
      }
      lastRole = msg.role;
    });

    if (currentColumn.length > 0) {
      columns.push(currentColumn);
    }

    return columns;
  };

  const getLLMResponses = (userMessage: Message) => {
    const messageIndex = messages.findIndex(m => m.id === userMessage.id);
    const responses: Message[] = [];
    
    for (let i = messageIndex + 1; i < messages.length; i++) {
      if (messages[i].role === 'assistant') {
        responses.push(messages[i]);
      } else {
        break;
      }
    }
    
    return responses;
  };

  if (!selectedChat) {
    return (
      <div className="chat-interface">
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div>Select a chat to start</div>
        </div>
      </div>
    );
  }

  const messageColumns = groupMessagesByColumn();

  return (
    <div className="chat-interface">
      <div className="chat-grid" ref={chatGridRef}>
        {messageColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="message-column">
            {column.map((msg, msgIndex) => (
              <div key={msg.id}>
                <div className="message-header">
                  <div className={`message-role ${msg.role}`}>
                    {msg.role === 'user' ? 'You' : msg.llm_model || 'Assistant'}
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(msg.content)}
                    title="Copy message"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="message-content">{msg.content}</div>
                {msg.role === 'assistant' && (msg.response_time_ms || msg.tokens_used || msg.estimated_cost) && (
                  <div className="message-meta">
                    {msg.response_time_ms && <span>{msg.response_time_ms}ms</span>}
                    {msg.tokens_used && <span>{msg.tokens_used} tokens</span>}
                    {msg.estimated_cost && <span>${msg.estimated_cost.toFixed(4)}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="input-area">
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <button
            className="add-llm-btn"
            onClick={addLLMConfig}
            disabled={availableModels.length === 0}
          >
            <Plus size={14} style={{ marginRight: '4px' }} />
            Add LLM
          </button>

          {llmConfigs.map((config, index) => (
            <div key={index} className="llm-config">
              <div className="llm-config-header">
                <div className="llm-model">LLM {index + 1}</div>
                <button
                  className="remove-llm"
                  onClick={() => removeLLMConfig(index)}
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="config-row">
                <div className="config-field">
                  <label className="config-label">Model</label>
                  <select
                    className="config-input"
                    value={config.model}
                    onChange={(e) => updateLLMConfig(index, 'model', e.target.value)}
                  >
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="config-row">
                <div className="config-field">
                  <label className="config-label">Temperature</label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    className="config-input"
                    value={config.temperature}
                    onChange={(e) => updateLLMConfig(index, 'temperature', parseFloat(e.target.value))}
                  />
                </div>
                <div className="config-field">
                  <label className="config-label">Max Tokens</label>
                  <input
                    type="number"
                    min="1"
                    max="4000"
                    className="config-input"
                    value={config.max_tokens}
                    onChange={(e) => updateLLMConfig(index, 'max_tokens', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="input-form">
          <textarea
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={loading || llmConfigs.length === 0}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={loading || !message.trim() || llmConfigs.length === 0}
          >
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <Send size={16} style={{ marginRight: '4px' }} />
                Send
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;