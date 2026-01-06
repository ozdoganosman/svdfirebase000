// Firebase Image Processing Extension Loader
// Bu loader görselleri Firebase Extension üzerinden optimize eder

const IMAGE_PROCESSING_URL = 'https://us-central1-svdfirebase000.cloudfunctions.net/ext-image-processing-api-handler';

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function firebaseImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Development'ta orijinal URL'i kullan
  if (process.env.NODE_ENV === 'development') {
    return src;
  }

  // Eğer src zaten tam URL değilse, orijinal döndür
  if (!src.startsWith('http://') && !src.startsWith('https://')) {
    return src;
  }

  // Placeholder veya data URL'ler için orijinal döndür
  if (src.startsWith('data:') || src.includes('placeholder')) {
    return src;
  }

  // Firebase Storage URL'inden path çıkar ve gcs:// formatına çevir
  // Extension Cloud Storage'dan direkt okuyabilir
  let inputOp: { operation: string; type: string; source?: string; path?: string; url?: string };

  if (src.includes('firebasestorage.googleapis.com')) {
    // URL'den path çıkar: .../o/uploads%2Ffile.png?alt=media -> uploads/file.png
    const match = src.match(/\/o\/([^?]+)/);
    if (match) {
      const path = decodeURIComponent(match[1]);
      inputOp = { operation: 'input', type: 'gcs', source: 'svdfirebase000.firebasestorage.app', path: path };
    } else {
      inputOp = { operation: 'input', type: 'url', url: src };
    }
  } else {
    inputOp = { operation: 'input', type: 'url', url: src };
  }

  const operations = [
    inputOp,
    { operation: 'resize', width: width },
    { operation: 'output', format: 'webp', quality: quality || 80 },
  ];

  const encodedOperations = encodeURIComponent(JSON.stringify(operations));

  return `${IMAGE_PROCESSING_URL}/process?operations=${encodedOperations}`;
}
