#!/usr/bin/env node

// Script to fix localhost URLs in Supabase database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLocalhostUrls() {
  console.log('🔍 Searching for localhost URLs in database...');
  
  try {
    // Get all worldcup items with image URLs
    const { data: items, error } = await supabase
      .from('worldcup_items')
      .select('id, title, image_url, worldcup_id')
      .not('image_url', 'is', null);

    if (error) {
      console.error('❌ Error fetching items:', error);
      return;
    }

    console.log(`📊 Found ${items.length} items with images`);

    let fixedCount = 0;

    for (const item of items) {
      if (item.image_url && item.image_url.includes('localhost:3000')) {
        console.log(`❌ Found corrupted URL in item ${item.id}: ${item.image_url}`);
        
        // Try to extract the actual path
        const pathMatch = item.image_url.match(/([0-9a-f-]+\/items\/[^\/]+\.(gif|jpg|jpeg|png|webp))$/i);
        
        if (pathMatch) {
          const path = pathMatch[1];
          const fixedUrl = `https://rctoxfcyzz5iikopbsne.supabase.co/storage/v1/object/public/worldcup-images/${path}`;
          
          console.log(`🔧 Fixing URL for item ${item.id}: ${item.title}`);
          console.log(`   From: ${item.image_url}`);
          console.log(`   To:   ${fixedUrl}`);
          
          // Update the database
          const { error: updateError } = await supabase
            .from('worldcup_items')
            .update({ image_url: fixedUrl })
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`❌ Failed to update item ${item.id}:`, updateError);
          } else {
            console.log(`✅ Fixed item ${item.id}`);
            fixedCount++;
          }
        } else {
          console.warn(`⚠️ Could not extract path from URL: ${item.image_url}`);
        }
      }
    }

    console.log(`🎉 Fixed ${fixedCount} corrupted URLs`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the fix
fixLocalhostUrls().then(() => {
  console.log('✅ Localhost URL fix script completed');
  process.exit(0);
});