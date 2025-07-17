import { NextRequest, NextResponse } from 'next/server';
import { getUserBookmarks } from '@/utils/userInteractions';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔖 Fetching bookmarks for user:', userId);
    const bookmarks = await getUserBookmarks(userId);
    console.log('🔖 Found bookmarks:', bookmarks.length);
    
    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}