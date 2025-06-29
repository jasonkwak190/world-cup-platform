#!/usr/bin/env node

// 데이터베이스 정리 및 localhost URL 수정 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rctoxfcyzz5iikopbsne.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdG94ZmN5eno1aWlrb3Bic25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ5Mzg4NDMsImV4cCI6MjAyMDUxNDg0M30.ZOykG1kqvSF3FQmxHLIK7kLSgYU8XVLSXJDGzW9bDu4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // 1. localhost URL이 포함된 아이템들 찾기 및 수정
    console.log('🔍 Searching for localhost URLs...');
    
    const { data: corruptedItems, error } = await supabase
      .from('worldcup_items')
      .select('id, title, image_url, worldcup_id')
      .like('image_url', '%localhost%');

    if (error) {
      console.error('❌ Error fetching corrupted items:', error);
      return;
    }

    console.log(`📊 Found ${corruptedItems.length} corrupted items`);

    let fixedCount = 0;
    let deletedCount = 0;

    for (const item of corruptedItems) {
      console.log(`\n🔧 Processing item: ${item.title} (${item.id})`);
      console.log(`   Corrupted URL: ${item.image_url}`);
      
      // UUID 패턴 추출 시도
      const patterns = [
        /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/items\/[^\/\?]+\.(gif|jpg|jpeg|png|webp))/i,
        /([0-9a-f-]+\/items\/[^\/\?]+\.(gif|jpg|jpeg|png|webp))/i,
        /(items\/[^\/\?]+\.(gif|jpg|jpeg|png|webp))/i
      ];
      
      let fixed = false;
      
      for (const pattern of patterns) {
        const match = item.image_url.match(pattern);
        if (match) {
          const path = match[1];
          const fixedUrl = `https://rctoxfcyzz5iikopbsne.supabase.co/storage/v1/object/public/worldcup-images/${path}`;
          
          console.log(`   Fixed URL: ${fixedUrl}`);
          
          // URL 업데이트
          const { error: updateError } = await supabase
            .from('worldcup_items')
            .update({ image_url: fixedUrl })
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`   ❌ Failed to update: ${updateError.message}`);
          } else {
            console.log(`   ✅ Successfully fixed`);
            fixedCount++;
            fixed = true;
          }
          break;
        }
      }
      
      if (!fixed) {
        console.log(`   ⚠️ Cannot fix URL, deleting item...`);
        
        // 수정할 수 없는 아이템 삭제
        const { error: deleteError } = await supabase
          .from('worldcup_items')
          .delete()
          .eq('id', item.id);
        
        if (deleteError) {
          console.error(`   ❌ Failed to delete: ${deleteError.message}`);
        } else {
          console.log(`   🗑️ Successfully deleted`);
          deletedCount++;
        }
      }
    }

    // 2. 빈 월드컵 찾기 및 정리
    console.log('\n🔍 Searching for empty worldcups...');
    
    const { data: allWorldcups } = await supabase
      .from('worldcups')
      .select('id, title');

    let emptyWorldcupCount = 0;

    if (allWorldcups) {
      for (const worldcup of allWorldcups) {
        const { data: items } = await supabase
          .from('worldcup_items')
          .select('id')
          .eq('worldcup_id', worldcup.id);

        if (!items || items.length === 0) {
          console.log(`🗑️ Deleting empty worldcup: ${worldcup.title} (${worldcup.id})`);
          
          const { error: deleteError } = await supabase
            .from('worldcups')
            .delete()
            .eq('id', worldcup.id);

          if (deleteError) {
            console.error(`❌ Failed to delete worldcup: ${deleteError.message}`);
          } else {
            emptyWorldcupCount++;
          }
        }
      }
    }

    // 3. 요약 출력
    console.log('\n🎉 Database cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Fixed items: ${fixedCount}`);
    console.log(`   - Deleted corrupted items: ${deletedCount}`);
    console.log(`   - Deleted empty worldcups: ${emptyWorldcupCount}`);

  } catch (error) {
    console.error('❌ Critical error during cleanup:', error);
  }
}

// 스크립트 실행
cleanupDatabase().then(() => {
  console.log('✅ Cleanup script finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});