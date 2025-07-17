import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement autosave restore when supabase auth is properly configured
    return NextResponse.json({ message: 'Autosave restore not implemented yet' }, { status: 501 });
  } catch (error) {
    console.error('Auto-save restore error:', error);
    return NextResponse.json(
      { error: 'Failed to restore auto-save data' },
      { status: 500 }
    );
  }
}