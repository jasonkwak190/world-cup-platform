import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

// Validation schema
const deleteParamsSchema = z.object({
  id: z.string().uuid()
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ DELETE WorldCup API called');
    const startTime = Date.now();
    
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Validate ID format
    const validationResult = deleteParamsSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid worldcup ID format' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const worldcupId = params.id;
    console.log('🔍 Deleting worldcup:', worldcupId);

    // 1. Validation & Data Retrieval
    const { data: worldcupData, error: worldcupError } = await supabase
      .from('worldcups')
      .select('id, author_id, title, thumbnail_url, created_at')
      .eq('id', worldcupId)
      .eq('author_id', user.id)
      .single();

    if (worldcupError || !worldcupData) {
      console.error('❌ WorldCup not found or access denied:', worldcupError);
      return NextResponse.json(
        { error: 'WorldCup not found or access denied' },
        { status: 404 }
      );
    }

    console.log('✅ WorldCup found:', {
      id: worldcupData.id,
      title: worldcupData.title,
      thumbnail: worldcupData.thumbnail_url
    });

    // 2. Storage Analysis & Scanning
    const storageDeleteErrors: string[] = [];
    const filesToDelete: { bucket: string; path: string }[] = [];
    let totalFilesFound = 0;
    
    try {
      // Check external vs internal thumbnail
      const isExternalThumbnail = worldcupData.thumbnail_url && 
        (worldcupData.thumbnail_url.includes('youtube.com') || 
         worldcupData.thumbnail_url.includes('youtu.be') ||
         worldcupData.thumbnail_url.startsWith('http'));

      if (!isExternalThumbnail && worldcupData.thumbnail_url) {
        console.log('🔍 Scanning thumbnail storage...');
        
        // Scan thumbnail bucket
        const { data: thumbnailFiles, error: thumbnailScanError } = await supabase.storage
          .from('worldcup-thumbnails')
          .list(worldcupId);
        
        if (!thumbnailScanError && thumbnailFiles) {
          thumbnailFiles.forEach(file => {
            filesToDelete.push({ 
              bucket: 'worldcup-thumbnails', 
              path: `${worldcupId}/${file.name}` 
            });
          });
          totalFilesFound += thumbnailFiles.length;
          console.log(`📁 Found ${thumbnailFiles.length} thumbnail files`);
        } else if (thumbnailScanError) {
          console.warn('⚠️ Thumbnail scan error:', thumbnailScanError);
        }
      }

      // Scan images bucket with recursive folder scanning
      console.log('🔍 Scanning images storage...');
      const { data: imageFiles, error: imageScanError } = await supabase.storage
        .from('worldcup-images')
        .list(worldcupId, { limit: 1000 });
      
      if (!imageScanError && imageFiles) {
        for (const file of imageFiles) {
          if (file.name === 'items') {
            // Recursive scan of items subfolder
            const { data: itemFiles, error: itemsScanError } = await supabase.storage
              .from('worldcup-images')
              .list(`${worldcupId}/items`, { limit: 1000 });
            
            if (!itemsScanError && itemFiles) {
              itemFiles.forEach(itemFile => {
                filesToDelete.push({ 
                  bucket: 'worldcup-images', 
                  path: `${worldcupId}/items/${itemFile.name}` 
                });
              });
              totalFilesFound += itemFiles.length;
              console.log(`📁 Found ${itemFiles.length} item files`);
            } else if (itemsScanError) {
              console.warn('⚠️ Items scan error:', itemsScanError);
            }
          } else {
            filesToDelete.push({ 
              bucket: 'worldcup-images', 
              path: `${worldcupId}/${file.name}` 
            });
            totalFilesFound++;
          }
        }
      } else if (imageScanError) {
        console.warn('⚠️ Images scan error:', imageScanError);
      }

      console.log(`📊 Total files found for deletion: ${totalFilesFound}`);

      // 3. Bulk File Deletion
      if (filesToDelete.length > 0) {
        console.log('🗑️ Starting bulk file deletion...');
        
        // Group files by bucket for efficient deletion
        const filesByBucket = filesToDelete.reduce((acc, file) => {
          if (!acc[file.bucket]) acc[file.bucket] = [];
          acc[file.bucket].push(file.path);
          return acc;
        }, {} as Record<string, string[]>);

        // Delete files in batches
        const deletePromises = Object.entries(filesByBucket).map(async ([bucket, paths]) => {
          console.log(`🗑️ Deleting ${paths.length} files from ${bucket}`);
          
          const { error } = await supabase.storage
            .from(bucket)
            .remove(paths);
          
          if (error) {
            console.error(`❌ Failed to delete from ${bucket}:`, error);
            storageDeleteErrors.push(`${bucket}: ${error.message}`);
          } else {
            console.log(`✅ Successfully deleted ${paths.length} files from ${bucket}`);
          }
        });

        await Promise.allSettled(deletePromises);

        // 4. Folder Cleanup
        console.log('🧹 Cleaning up empty folders...');
        
        // Clean up empty folders (best effort)
        const cleanupFolders = [
          { bucket: 'worldcup-images', path: `${worldcupId}/items` },
          { bucket: 'worldcup-images', path: worldcupId },
          { bucket: 'worldcup-thumbnails', path: worldcupId }
        ];

        for (const folder of cleanupFolders) {
          try {
            const { error: folderError } = await supabase.storage
              .from(folder.bucket)
              .remove([folder.path]);
            
            if (folderError) {
              console.log(`📁 Folder cleanup (${folder.path}): ${folderError.message}`);
            }
          } catch (folderErr) {
            console.log(`📁 Folder cleanup failed for ${folder.path}:`, folderErr);
          }
        }
      }

      // 5. Critical Error Handling - Abort if storage errors
      if (storageDeleteErrors.length > 0) {
        console.error('🚫 Storage deletion errors detected:', storageDeleteErrors);
        console.error('🚫 Aborting database deletion to prevent orphaned data');
        
        return NextResponse.json({
          success: false,
          error: `Storage deletion failed: ${storageDeleteErrors.join(', ')}`,
          storageErrors: storageDeleteErrors
        }, { status: 500 });
      }

    } catch (storageError) {
      console.error('❌ Storage cleanup error:', storageError);
      storageDeleteErrors.push(`Storage error: ${storageError.message}`);
      
      // Critical: Don't proceed with database deletion if storage failed
      return NextResponse.json({
        success: false,
        error: 'Storage cleanup failed',
        storageErrors: storageDeleteErrors
      }, { status: 500 });
    }

    // 6. Database Deletion (only if storage cleanup was successful)
    console.log('🗑️ Starting database deletion...');
    
    // Delete items first (foreign key constraint)
    const { error: itemDeleteError } = await supabase
      .from('worldcup_items')
      .delete()
      .eq('worldcup_id', worldcupId);

    if (itemDeleteError) {
      console.error('❌ Failed to delete worldcup items:', itemDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete worldcup items' },
        { status: 500 }
      );
    }

    // Delete main worldcup record
    const { error: worldcupDeleteError } = await supabase
      .from('worldcups')
      .delete()
      .eq('id', worldcupId);

    if (worldcupDeleteError) {
      console.error('❌ Failed to delete worldcup:', worldcupDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete worldcup' },
        { status: 500 }
      );
    }

    // 7. Verification
    console.log('🔍 Verifying deletion...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('worldcups')
      .select('id')
      .eq('id', worldcupId)
      .maybeSingle();

    if (verifyError) {
      console.error('❌ Verification query failed:', verifyError);
      return NextResponse.json(
        { error: 'Deletion verification failed' },
        { status: 500 }
      );
    }

    if (verifyData) {
      console.error('❌ WorldCup still exists after deletion attempt');
      return NextResponse.json(
        { error: 'WorldCup deletion verification failed' },
        { status: 500 }
      );
    }

    const elapsed = Date.now() - startTime;
    
    console.log('✅ WorldCup deletion completed successfully:', {
      id: worldcupId,
      title: worldcupData.title,
      filesDeleted: totalFilesFound,
      performanceMs: elapsed
    });

    return NextResponse.json({
      success: true,
      message: 'WorldCup deleted successfully',
      filesDeleted: totalFilesFound,
      storageErrors: storageDeleteErrors.length > 0 ? storageDeleteErrors : undefined
    }, {
      headers: {
        'X-Performance-Timing': `${elapsed}ms`,
        'X-Files-Deleted': totalFilesFound.toString()
      }
    });

  } catch (error) {
    console.error('❌ API error in worldcup deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}