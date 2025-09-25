import { NextRequest, NextResponse } from 'next/server';
import { createMessage } from '@/lib/db-service';

export async function POST(request: NextRequest) {
  try {
    const messageData = await request.json();
    
    const newMessage = createMessage(messageData);
    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
