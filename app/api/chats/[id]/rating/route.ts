import { NextRequest, NextResponse } from 'next/server';
import { updateChatRating } from '@/lib/db-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { rating } = await request.json();
    const chatId = parseInt(params.id);
    
    if (isNaN(chatId)) {
      return NextResponse.json(
        { error: 'Invalid chat ID' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 10' },
        { status: 400 }
      );
    }

    updateChatRating(chatId, rating);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating rating:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
