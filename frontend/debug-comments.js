const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  try {
    console.log('🔍 Checking database schema for comments...');
    
    // Check if comments table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .or('table_name.eq.comments,table_name.eq.worldcup_comments');
    
    if (tablesError) {
      console.error('❌ Failed to fetch tables:', tablesError);
    } else {
      console.log('📊 Comment-related tables found:', tables.map(t => t.table_name));
    }
    
    // Check RLS status for comments table
    console.log('\n🔒 Checking RLS status...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .or('relname.eq.comments,relname.eq.worldcup_comments');
    
    if (rlsError) {
      console.error('❌ Failed to check RLS:', rlsError);
    } else {
      console.log('🔒 RLS status:', rlsData);
    }
    
    // Check if we have any worldcups to test with
    console.log('\n🌐 Checking worldcups...');
    const { data: worldcups, error: worldcupsError } = await supabase
      .from('worldcups')
      .select('id, title')
      .limit(3);
    
    if (worldcupsError) {
      console.error('❌ Failed to fetch worldcups:', worldcupsError);
    } else {
      console.log('🎯 Available worldcups:', worldcups);
      
      if (worldcups.length > 0) {
        const testWorldcupId = worldcups[0].id;
        
        // Try to insert a test comment
        console.log(`\n🧪 Testing comment insertion for worldcup: ${testWorldcupId}...`);
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .insert({
            worldcup_id: testWorldcupId,
            content: 'Test comment for debugging',
            guest_name: 'Debug User',
            guest_session_id: 'debug-session-123'
          })
          .select()
          .single();
        
        if (commentError) {
          console.error('❌ Comment insertion error:', commentError);
          
          // Try with worldcup_comments table if comments failed
          console.log('\n🔄 Trying with worldcup_comments table...');
          const { data: altCommentData, error: altCommentError } = await supabase
            .from('worldcup_comments')
            .insert({
              worldcup_id: testWorldcupId,
              content: 'Test comment for debugging',
              guest_name: 'Debug User',
              guest_session_id: 'debug-session-123'
            })
            .select()
            .single();
            
          if (altCommentError) {
            console.error('❌ Alternative comment insertion error:', altCommentError);
          } else {
            console.log('✅ Comment inserted successfully to worldcup_comments:', altCommentData);
          }
        } else {
          console.log('✅ Comment inserted successfully to comments:', commentData);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
})();