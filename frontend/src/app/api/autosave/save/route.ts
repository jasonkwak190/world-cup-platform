import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const saveDataSchema = z.object({
  worldcupId: z.string(),
  data: z.object({}).passthrough(),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement autosave when supabase auth is properly configured
    return NextResponse.json({ message: 'Autosave not implemented yet' }, { status: 501 });
  } catch (error) {
    console.error('Auto-save error:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}