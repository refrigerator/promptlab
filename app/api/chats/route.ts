import { NextRequest, NextResponse } from 'next/server';
import { getChats, getFolders, getLLMModels, createChat } from '@/lib/db-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    
    const [chats, folders, models] = await Promise.all([
      getChats(folderId ? parseInt(folderId) : undefined),
      getFolders(),
      getLLMModels(),
    ]);

    return NextResponse.json({ chats, folders, models });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, folderId } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const newChat = createChat(title, folderId || null);
    return NextResponse.json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}