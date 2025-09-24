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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
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
        <div className="text-lg">Loading PromptLab...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Column - Chat List */}
      <div className="w-80 border-r border-border bg-card">
        <ChatList
          chats={chats}
          folders={folders}
          selectedChat={selectedChat}
          onChatSelect={handleChatSelect}
          onChatUpdate={handleChatUpdate}
        />
      </div>

      {/* Middle Column - Chat Interface */}
      <div className="flex-1 flex flex-col">
        <ChatInterface
          chat={selectedChat}
          llmModels={llmModels}
          onChatUpdate={handleChatUpdate}
        />
      </div>

      {/* Right Column - Output */}
      <div className="w-80 border-l border-border bg-card">
        <OutputColumn />
      </div>
    </div>
  );
}