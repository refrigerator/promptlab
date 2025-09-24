import React, { useState } from 'react';
import { Chat, Folder } from '../types';
import { Star, Plus, Folder as FolderIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ChatListProps {
  chats: Chat[];
  folders: Folder[];
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  onNewChat: (title: string, folderId?: number) => void;
  onUpdateRating: (chatId: number, rating: number) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  folders,
  selectedChat,
  onChatSelect,
  onNewChat,
  onUpdateRating
}) => {
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<number | undefined>();

  const handleNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChatTitle.trim()) {
      onNewChat(newChatTitle.trim(), selectedFolder);
      setNewChatTitle('');
      setSelectedFolder(undefined);
      setShowNewChatForm(false);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="chat-rating">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderFolderTree = (parentId?: number, level = 0) => {
    const childFolders = folders.filter(f => f.parent_id === parentId);
    
    return childFolders.map(folder => (
      <div key={folder.id}>
        <div 
          className={`folder-item ${selectedFolder === folder.id ? 'active' : ''}`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => setSelectedFolder(selectedFolder === folder.id ? undefined : folder.id)}
        >
          <FolderIcon size={14} style={{ marginRight: '8px', display: 'inline' }} />
          {folder.name}
        </div>
        {renderFolderTree(folder.id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="sidebar">
      <div className="folder-tree">
        <div className="folder-item" onClick={() => setSelectedFolder(undefined)}>
          <FolderIcon size={14} style={{ marginRight: '8px', display: 'inline' }} />
          All Chats
        </div>
        {renderFolderTree()}
      </div>

      <div className="chat-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Chats</h3>
          <button
            className="add-llm-btn"
            onClick={() => setShowNewChatForm(!showNewChatForm)}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <Plus size={14} style={{ marginRight: '4px' }} />
            New
          </button>
        </div>

        {showNewChatForm && (
          <form onSubmit={handleNewChat} style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Chat title..."
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              className="config-input"
              style={{ marginBottom: '8px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="send-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
                Create
              </button>
              <button 
                type="button" 
                onClick={() => setShowNewChatForm(false)}
                style={{ padding: '6px 12px', fontSize: '12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {chats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div>No chats yet</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Create your first chat to get started</div>
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => onChatSelect(chat)}
            >
              <div className="chat-item-header">
                <div className="chat-title">{chat.title}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {renderStars(chat.rating)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newRating = chat.rating === 10 ? undefined : (chat.rating || 0) + 1;
                      onUpdateRating(chat.id, newRating || 0);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                  >
                    <Star size={14} style={{ color: chat.rating ? '#fbbf24' : '#d1d5db' }} />
                  </button>
                </div>
              </div>
              <div className="chat-meta">
                {format(new Date(chat.updated_at), 'MMM d, h:mm a')}
                {chat.folder_name && ` • ${chat.folder_name}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;