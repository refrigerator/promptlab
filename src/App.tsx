import React, { useState, useEffect } from 'react';
import ChatList from './components/ChatList';
import ChatInterface from './components/ChatInterface';
import OutputPanel from './components/OutputPanel';
import { Chat, Folder, Message } from './types';

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [chatsRes, foldersRes] = await Promise.all([
        fetch('/api/chats'),
        fetch('/api/folders')
      ]);
      
      const chatsData = await chatsRes.json();
      const foldersData = await foldersRes.json();
      
      setChats(chatsData);
      setFolders(foldersData);
      
      if (chatsData.length > 0) {
        setSelectedChat(chatsData[0]);
        loadMessages(chatsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      const messagesData = await response.json();
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewChat = async (title: string, folderId?: number) => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, folder_id: folderId })
      });
      
      const newChat = await response.json();
      setChats(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
      setMessages([]);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const updateChatRating = async (chatId: number, rating: number) => {
    try {
      await fetch(`/api/chats/${chatId}/rating`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, rating } : chat
      ));
      
      if (selectedChat?.id === chatId) {
        setSelectedChat(prev => prev ? { ...prev, rating } : null);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const sendMessage = async (message: string, llmConfigs: any[]) => {
    if (!selectedChat) return;

    try {
      const response = await fetch(`/api/chats/${selectedChat.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, llm_configs: llmConfigs })
      });

      const result = await response.json();
      
      // Reload messages to get the new ones
      await loadMessages(selectedChat.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <ChatList
        chats={chats}
        folders={folders}
        selectedChat={selectedChat}
        onChatSelect={handleChatSelect}
        onNewChat={createNewChat}
        onUpdateRating={updateChatRating}
      />
      <ChatInterface
        selectedChat={selectedChat}
        messages={messages}
        onSendMessage={sendMessage}
      />
      <OutputPanel />
    </div>
  );
}

export default App;