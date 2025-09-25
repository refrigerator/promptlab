'use client';

import { useState } from 'react';
import { Chat, Folder } from '@/lib/types';
import { Plus, Star, Folder as FolderIcon, ChevronRight, ChevronDown } from 'lucide-react';
// Removed direct database imports - using API calls instead

interface ChatListProps {
  chats: Chat[];
  folders: Folder[];
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  onChatUpdate: () => void;
}

export default function ChatList({ 
  chats, 
  folders, 
  selectedChat, 
  onChatSelect, 
  onChatUpdate 
}: ChatListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleCreateChat = async () => {
    if (!newChatTitle.trim()) return;
    
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChatTitle.trim() }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chat');
      }
      
      const newChat = await response.json();
      setNewChatTitle('');
      setIsCreatingChat(false);
      onChatUpdate();
      onChatSelect(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleRatingChange = async (chatId: number, rating: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/rating`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update rating');
      }
      
      onChatUpdate();
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const folderChats = chats.filter(chat => chat.folder_id === folder.id);
    
    return (
      <div key={folder.id} className="mb-1">
        <div
          className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
          onClick={() => toggleFolder(folder.id)}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <FolderIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{folder.name}</span>
          <span className="text-xs text-muted-foreground">({folderChats.length})</span>
        </div>
        
        {isExpanded && (
          <div>
            {folderChats.map(chat => (
              <div
                key={chat.id}
                className={`flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer ${
                  selectedChat?.id === chat.id ? 'bg-accent' : ''
                }`}
                onClick={() => onChatSelect(chat)}
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {chat.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{chat.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderChat = (chat: Chat) => (
    <div
      key={chat.id}
      className={`flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer ${
        selectedChat?.id === chat.id ? 'bg-accent' : ''
      }`}
      onClick={() => onChatSelect(chat)}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs truncate">{chat.title}</div>
        <div className="text-xs text-muted-foreground">
          {new Date(chat.created_at).toLocaleDateString()}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {chat.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">{chat.rating}</span>
          </div>
        )}
      </div>
    </div>
  );

  const ungroupedChats = chats.filter(chat => !chat.folder_id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm font-semibold">PromptLab</h1>
          <button
            onClick={() => setIsCreatingChat(true)}
            className="p-2 hover:bg-accent rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* New Chat Input */}
        {isCreatingChat && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="New chat title..."
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateChat();
                if (e.key === 'Escape') {
                  setIsCreatingChat(false);
                  setNewChatTitle('');
                }
              }}
              className="w-full p-2 text-sm border border-input rounded bg-background"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateChat}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingChat(false);
                  setNewChatTitle('');
                }}
                className="px-3 py-1 text-xs border border-input rounded hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Folders */}
        {folders.map(folder => renderFolder(folder))}
        
        {/* Ungrouped Chats */}
        {ungroupedChats.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Other Chats
            </div>
            {ungroupedChats.map(renderChat)}
          </div>
        )}
      </div>
    </div>
  );
}
