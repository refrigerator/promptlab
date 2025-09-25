import db from './database';
import { Chat, Message, Folder, LLMModel, ChatWithMessages, FolderWithChildren } from './types';

// Folder operations
export function createFolder(name: string, parentId: number | null = null): Folder {
  const stmt = db.prepare(`
    INSERT INTO folders (name, parent_id) 
    VALUES (?, ?)
  `);
  
  const result = stmt.run(name, parentId);
  
  return {
    id: result.lastInsertRowid as number,
    name,
    parent_id: parentId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getFolders(): FolderWithChildren[] {
  const folders = db.prepare(`
    SELECT * FROM folders 
    ORDER BY name
  `).all() as Folder[];

  const chats = db.prepare(`
    SELECT * FROM chats 
    ORDER BY created_at DESC
  `).all() as Chat[];

  // Build folder hierarchy
  const folderMap = new Map<number, FolderWithChildren>();
  const rootFolders: FolderWithChildren[] = [];

  // Initialize all folders
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
      chats: [],
    });
  });

  // Build hierarchy
  folders.forEach(folder => {
    const folderWithChildren = folderMap.get(folder.id)!;
    if (folder.parent_id === null) {
      rootFolders.push(folderWithChildren);
    } else {
      const parent = folderMap.get(folder.parent_id);
      if (parent) {
        parent.children.push(folderWithChildren);
      }
    }
  });

  // Add chats to folders
  chats.forEach(chat => {
    if (chat.folder_id) {
      const folder = folderMap.get(chat.folder_id);
      if (folder) {
        folder.chats.push(chat);
      }
    }
  });

  return rootFolders;
}

// Chat operations
export function createChat(title: string, folderId: number | null = null): Chat {
  const stmt = db.prepare(`
    INSERT INTO chats (title, folder_id) 
    VALUES (?, ?)
  `);
  
  const result = stmt.run(title, folderId);
  
  return {
    id: result.lastInsertRowid as number,
    title,
    folder_id: folderId,
    rating: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getChats(folderId?: number): Chat[] {
  if (folderId) {
    return db.prepare(`
      SELECT * FROM chats 
      WHERE folder_id = ? 
      ORDER BY created_at DESC
    `).all(folderId) as Chat[];
  }
  
  return db.prepare(`
    SELECT * FROM chats 
    ORDER BY created_at DESC
  `).all() as Chat[];
}

export function getChatWithMessages(chatId: number): ChatWithMessages | null {
  const chat = db.prepare(`
    SELECT * FROM chats WHERE id = ?
  `).get(chatId) as Chat | undefined;

  if (!chat) return null;

  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE chat_id = ? 
    ORDER BY created_at ASC
  `).all(chatId) as Message[];

  return {
    ...chat,
    messages,
  };
}

export function updateChatRating(chatId: number, rating: number): void {
  db.prepare(`
    UPDATE chats 
    SET rating = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(rating, chatId);
}

export function updateChatTitle(chatId: number, title: string): void {
  db.prepare(`
    UPDATE chats 
    SET title = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(title, chatId);
}

// Message operations
export function createMessage(message: Omit<Message, 'id' | 'created_at'>): Message {
  const stmt = db.prepare(`
    INSERT INTO messages (
      chat_id, role, content, model_id, model_name, 
      temperature, max_tokens, response_time_ms, 
      tokens_used, estimated_cost
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    message.chat_id,
    message.role,
    message.content,
    message.model_id,
    message.model_name,
    message.temperature,
    message.max_tokens,
    message.response_time_ms,
    message.tokens_used,
    message.estimated_cost
  );
  
  return {
    id: result.lastInsertRowid as number,
    ...message,
    created_at: new Date().toISOString(),
  };
}

// LLM Model operations
export function saveLLMModel(model: LLMModel): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO llm_models (
      id, name, provider, context_length, 
      pricing_input, pricing_output, is_available, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    model.id,
    model.name,
    model.provider,
    model.context_length,
    model.pricing_input,
    model.pricing_output,
    model.is_available ? 1 : 0,
    new Date().toISOString()
  );
}

export function getLLMModels(): LLMModel[] {
  return db.prepare(`
    SELECT * FROM llm_models 
    WHERE is_available = 1 
    ORDER BY name
  `).all() as LLMModel[];
}

export function getLLMModel(modelId: string): LLMModel | null {
  return db.prepare(`
    SELECT * FROM llm_models WHERE id = ?
  `).get(modelId) as LLMModel | undefined || null;
}
