/**
 * Image utility functions for thumbnail handling
 */

// Enable thumbnails when thumbnail files exist in storage
const THUMBNAILS_ENABLED = true;

/**
 * Convert an original image URL to its thumbnail URL
 * Original: uploads/1704067200000-product.jpg -> uploads/1704067200000-product_thumb.webp
 *
 * @param originalUrl - The original image URL from Firebase Storage
 * @returns The thumbnail URL, or original URL if thumbnails disabled
 */
export function getThumbnailUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return '';

  // Don't process placeholders or data URLs
  if (originalUrl.startsWith('data:') || originalUrl.includes('placeholder')) {
    return originalUrl;
  }

  // Return original if thumbnails not yet enabled
  if (!THUMBNAILS_ENABLED) {
    return originalUrl;
  }

  // Image extensions to match (without dots, since filenames may not have dots)
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'avif'];

  // Firebase Storage URL format:
  // https://firebasestorage.googleapis.com/v0/b/BUCKET/o/uploads%2Ffilename.ext?alt=media
  // The filename is URL-encoded between /o/ and ?alt=media

  // Extract the path between /o/ and ?
  const oMatch = originalUrl.match(/\/o\/([^?]+)/);
  if (oMatch) {
    const encodedPath = oMatch[1];
    const decodedPath = decodeURIComponent(encodedPath);

    // Find and replace the image extension
    let newPath = decodedPath;
    for (const ext of imageExtensions) {
      // Check for .ext or just ext at the end
      if (decodedPath.toLowerCase().endsWith('.' + ext)) {
        newPath = decodedPath.slice(0, -(ext.length + 1)) + '_thumb.webp';
        break;
      } else if (decodedPath.toLowerCase().endsWith(ext)) {
        newPath = decodedPath.slice(0, -ext.length) + '_thumb.webp';
        break;
      }
    }

    // Re-encode and reconstruct the URL
    const newEncodedPath = encodeURIComponent(newPath).replace(/%2F/g, '%2F');
    return originalUrl.replace(/\/o\/[^?]+/, '/o/' + newEncodedPath);
  }

  // Fallback: return original
  return originalUrl;
}

/**
 * Get the appropriate image URL based on context
 * Uses thumbnail for listings/previews, original for detail views
 *
 * @param originalUrl - The original image URL
 * @param useThumbnail - Whether to use thumbnail version
 * @returns The appropriate image URL
 */
export function getImageUrl(originalUrl: string | null | undefined, useThumbnail: boolean = false): string {
  if (!originalUrl) return '';

  if (useThumbnail) {
    return getThumbnailUrl(originalUrl);
  }

  return originalUrl;
}
