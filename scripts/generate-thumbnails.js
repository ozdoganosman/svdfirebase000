/**
 * Migration Script: Generate thumbnails for existing images
 *
 * This script:
 * 1. Lists all images in Firebase Storage uploads/ folder
 * 2. For each image that doesn't have a _thumb.webp version:
 *    - Downloads the original
 *    - Creates a thumbnail (800px, 80% quality, WebP)
 *    - Uploads the thumbnail
 * 3. Reports progress and statistics
 *
 * Usage:
 *   cd scripts
 *   node generate-thumbnails.js
 *
 * NOTE: Run this from project root or scripts folder.
 *       Requires GOOGLE_APPLICATION_CREDENTIALS env var or ADC.
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use require to load modules from functions folder
const require = createRequire(path.join(__dirname, '../functions/package.json'));
const { initializeApp } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const sharp = require('sharp');

// Configuration
const THUMBNAIL_MAX_WIDTH = 800;
const THUMBNAIL_QUALITY = 80;
const BATCH_SIZE = 5; // Process 5 images concurrently

// Initialize Firebase Admin
// Use default credentials (from GOOGLE_APPLICATION_CREDENTIALS env var or ADC)
initializeApp({
  storageBucket: 'svdfirebase000.firebasestorage.app'
});

const bucket = getStorage().bucket();

/**
 * Check if a file is an image based on content type or extension
 */
function isImage(filename) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

/**
 * Check if this is already a thumbnail
 */
function isThumbnail(filename) {
  return filename.includes('_thumb.');
}

/**
 * Get thumbnail filename from original
 */
function getThumbnailFilename(originalFilename) {
  return originalFilename.replace(/\.[^.]+$/, '_thumb.webp');
}

/**
 * Generate thumbnail for a single image
 */
async function generateThumbnail(file) {
  const filename = file.name;
  const thumbFilename = getThumbnailFilename(filename);

  try {
    // Check if thumbnail already exists
    const [thumbExists] = await bucket.file(thumbFilename).exists();
    if (thumbExists) {
      return { status: 'skipped', reason: 'thumbnail exists', filename };
    }

    // Download original to temp
    const tempOriginal = path.join(os.tmpdir(), path.basename(filename));
    const tempThumb = path.join(os.tmpdir(), path.basename(thumbFilename));

    await file.download({ destination: tempOriginal });

    // Generate thumbnail with sharp
    await sharp(tempOriginal)
      .resize(THUMBNAIL_MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: THUMBNAIL_QUALITY })
      .toFile(tempThumb);

    // Get original and thumbnail sizes for reporting
    const originalStats = fs.statSync(tempOriginal);
    const thumbStats = fs.statSync(tempThumb);

    // Upload thumbnail
    await bucket.upload(tempThumb, {
      destination: thumbFilename,
      metadata: {
        contentType: 'image/webp',
        metadata: {
          originalName: path.basename(filename),
          fileType: 'thumbnail'
        }
      },
      public: true
    });

    // Cleanup temp files
    fs.unlinkSync(tempOriginal);
    fs.unlinkSync(tempThumb);

    const savings = ((1 - thumbStats.size / originalStats.size) * 100).toFixed(1);

    return {
      status: 'created',
      filename,
      originalSize: originalStats.size,
      thumbSize: thumbStats.size,
      savings: `${savings}%`
    };
  } catch (error) {
    return {
      status: 'error',
      filename,
      error: error.message
    };
  }
}

/**
 * Process images in batches
 */
async function processBatch(files, batchNum, totalBatches) {
  console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${files.length} files)...`);

  const results = await Promise.all(files.map(generateThumbnail));

  results.forEach(result => {
    if (result.status === 'created') {
      const origKB = (result.originalSize / 1024).toFixed(1);
      const thumbKB = (result.thumbSize / 1024).toFixed(1);
      console.log(`  ✅ ${path.basename(result.filename)}: ${origKB}KB → ${thumbKB}KB (${result.savings} smaller)`);
    } else if (result.status === 'skipped') {
      console.log(`  ⏭️  ${path.basename(result.filename)}: ${result.reason}`);
    } else {
      console.log(`  ❌ ${path.basename(result.filename)}: ${result.error}`);
    }
  });

  return results;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🖼️  Thumbnail Migration Script');
  console.log('================================');
  console.log(`Settings: ${THUMBNAIL_MAX_WIDTH}px max width, ${THUMBNAIL_QUALITY}% quality, WebP format`);
  console.log('');

  // List all files in uploads/
  console.log('📂 Listing files in uploads/...');
  const [files] = await bucket.getFiles({ prefix: 'uploads/' });

  // Filter to only original images (not thumbnails)
  const imagesToProcess = files.filter(file => {
    const filename = file.name;
    return isImage(filename) && !isThumbnail(filename);
  });

  console.log(`Found ${files.length} total files, ${imagesToProcess.length} original images to process`);

  if (imagesToProcess.length === 0) {
    console.log('\n✨ No images to process!');
    return;
  }

  // Process in batches
  const batches = [];
  for (let i = 0; i < imagesToProcess.length; i += BATCH_SIZE) {
    batches.push(imagesToProcess.slice(i, i + BATCH_SIZE));
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let totalOriginalSize = 0;
  let totalThumbSize = 0;

  for (let i = 0; i < batches.length; i++) {
    const results = await processBatch(batches[i], i + 1, batches.length);

    results.forEach(result => {
      if (result.status === 'created') {
        created++;
        totalOriginalSize += result.originalSize;
        totalThumbSize += result.thumbSize;
      } else if (result.status === 'skipped') {
        skipped++;
      } else {
        errors++;
      }
    });
  }

  // Summary
  console.log('\n================================');
  console.log('📊 Migration Summary:');
  console.log(`  ✅ Created: ${created}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Errors: ${errors}`);

  if (created > 0) {
    const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
    const totalThumbMB = (totalThumbSize / 1024 / 1024).toFixed(2);
    const totalSavings = ((1 - totalThumbSize / totalOriginalSize) * 100).toFixed(1);
    console.log(`\n💾 Storage savings: ${totalOriginalMB}MB → ${totalThumbMB}MB (${totalSavings}% reduction)`);
  }

  console.log('\n✨ Migration complete!');
}

// Run
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
