'use client';

import { useState, useEffect } from 'react';
import { Chat, Folder, LLMModel } from '@/lib/types';
import ChatList from '@/components/ChatList';
import ChatInterface from '@/components/ChatInterface';
import OutputColumn from '@/components/OutputColumn';
// Removed direct database imports - using API routes instead

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [llmModels, setLlmModels] = useState<LLMModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading PromptLab...');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // First sync models from OpenRouter
      setLoadingMessage('Syncing models from OpenRouter...');
      try {
        const syncResponse = await fetch('/api/sync-models', {
          method: 'POST',
        });
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          console.log(`Synced ${syncData.count} models from OpenRouter`);
        }
      } catch (syncError) {
        console.warn('Failed to sync models:', syncError);
        // Continue loading even if sync fails
      }

      // Then load the data
      setLoadingMessage('Loading chats and data...');
      const response = await fetch('/api/chats');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load data');
      }
      
      setChats(data.chats);
      setFolders(data.folders);
      setLlmModels(data.models);
      
      if (data.chats.length > 0) {
        setSelectedChat(data.chats[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleChatUpdate = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{loadingMessage}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Column - Chat List - Fixed */}
      <div className="w-64 border-r border-border bg-card flex-shrink-0">
        <ChatList
          chats={chats}
          folders={folders}
          selectedChat={selectedChat}
          onChatSelect={handleChatSelect}
          onChatUpdate={handleChatUpdate}
        />
      </div>

      {/* Middle Column - Chat Interface - Scrollable */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          chat={selectedChat}
          llmModels={llmModels}
          onChatUpdate={handleChatUpdate}
        />
      </div>
    </div>
  );
}
