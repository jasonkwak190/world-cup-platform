#!/usr/bin/env node

// 수정사항 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseState() {
  console.log('🧪 Testing database state...');
  
  try {
    // 1. 모든 월드컵 조회
    const { data: worldcups, error: worldcupsError } = await supabase
      .from('worldcups')
      .select('id, title, thumbnail_url');

    if (worldcupsError) {
      console.error('❌ Error fetching worldcups:', worldcupsError);
      return;
    }

    console.log(`📊 Found ${worldcups.length} worldcups`);

    // 2. 각 월드컵의 아이템들 확인
    let totalItems = 0;
    let corruptedItems = 0;
    let validItems = 0;

    for (const worldcup of worldcups) {
      const { data: items, error: itemsError } = await supabase
        .from('worldcup_items')
        .select('id, title, image_url')
        .eq('worldcup_id', worldcup.id);

      if (itemsError) {
        console.error(`❌ Error fetching items for ${worldcup.title}:`, itemsError);
        continue;
      }

      totalItems += items.length;

      console.log(`\n📋 ${worldcup.title} (${worldcup.id})`);
      console.log(`   Items: ${items.length}`);

      // 이미지 URL 검증
      for (const item of items) {
        if (!item.image_url) {
          console.log(`   ⚠️ No image: ${item.title}`);
          continue;
        }

        if (item.image_url.includes('localhost')) {
          console.log(`   ❌ Corrupted URL: ${item.title} - ${item.image_url}`);
          corruptedItems++;
        } else if (item.image_url.includes('supabase')) {
          console.log(`   ✅ Valid Supabase URL: ${item.title}`);
          validItems++;
        } else {
          console.log(`   ❓ Other URL: ${item.title} - ${item.image_url.substring(0, 50)}...`);
        }
      }
    }

    // 3. 요약
    console.log('\n📊 Database State Summary:');
    console.log(`   Total worldcups: ${worldcups.length}`);
    console.log(`   Total items: ${totalItems}`);
    console.log(`   Valid items: ${validItems}`);
    console.log(`   Corrupted items: ${corruptedItems}`);
    console.log(`   Health score: ${totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 0}%`);

    // 4. 권장 사항
    if (corruptedItems > 0) {
      console.log('\n⚠️ Issues found:');
      console.log(`   ${corruptedItems} items have corrupted localhost URLs`);
      console.log('   Run: node cleanup-database.js');
    } else {
      console.log('\n✅ Database is clean! No corrupted URLs found.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// URL 수정 함수 테스트
function testUrlFixes() {
  console.log('\n🧪 Testing URL fix functions...');
  
  const testUrls = [
    'http://localhost:3000/play/eddc202b-da95-4c2f-a740-405a8b7f1859/items/image.gif',
    'http://localhost:3000/eddc202b-da95-4c2f-a740-405a8b7f1859/items/test.jpg',
    'blob:http://localhost:3000/abc123',
    'https://rctoxfcyzz5iikopbsne.supabase.co/storage/v1/object/public/worldcup-images/test.jpg',
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  ];

  testUrls.forEach((url, index) => {
    console.log(`\nTest ${index + 1}: ${url}`);
    
    // 테스트 로직 (실제 GameScreen.tsx의 cleanAndFixImageUrl 함수 로직)
    let result = '';
    
    if (url.includes('localhost')) {
      console.log('   🚨 BLOCKING localhost URL');
      
      const patterns = [
        /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/items\/[^\/\?]+\.(gif|jpg|jpeg|png|webp))/i,
        /([0-9a-f-]+\/items\/[^\/\?]+\.(gif|jpg|jpeg|png|webp))/i,
        /(items\/[^\/\?]+\.(gif|jpg|jpeg|png|webp))/i
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          const path = match[1];
          result = `https://rctoxfcyzz5iikopbsne.supabase.co/storage/v1/object/public/worldcup-images/${path}`;
          console.log(`   🔧 Fixed to: ${result}`);
          break;
        }
      }
      
      if (!result) {
        console.log('   ❌ Cannot fix, blocking');
        result = '';
      }
    } else if (url.startsWith('blob:')) {
      console.log('   🚨 BLOCKING blob URL');
      result = '';
    } else if (url.includes('rctoxfcyzz5iikopbsne.supabase.co')) {
      console.log('   ✅ Valid Supabase URL');
      result = url;
    } else if (url.startsWith('http')) {
      console.log('   ✅ Valid HTTP URL');
      result = url;
    } else if (url.startsWith('data:image/')) {
      console.log('   ✅ Valid base64 image');
      result = url;
    } else {
      console.log('   ⚠️ Unknown format');
      result = url;
    }
    
    console.log(`   Result: ${result || '[BLOCKED]'}`);
  });
}

// 테스트 실행
console.log('🚀 Starting comprehensive tests...');

testDatabaseState().then(() => {
  testUrlFixes();
  console.log('\n✅ All tests completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Tests failed:', error);
  process.exit(1);
});