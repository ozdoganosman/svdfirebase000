"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getThumbnailUrl } from "@/lib/image-utils";

type Product = {
  id: string;
  title: string;
  slug: string;
  images?: string[];
  image?: string;
};

interface FloatingProductsProps {
  products: Product[];
  apiOrigin?: string;
}

function ProductImage({ src, alt, loading }: { src: string; alt: string; loading: "eager" | "lazy" }) {
  const thumbnailUrl = getThumbnailUrl(src);
  const [currentSrc, setCurrentSrc] = useState(thumbnailUrl || src);
  const [triedFallback, setTriedFallback] = useState(false);

  const handleError = () => {
    if (!triedFallback && currentSrc !== src) {
      setCurrentSrc(src);
      setTriedFallback(true);
    }
  };

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      className="object-contain"
      sizes="128px"
      loading={loading}
      onError={handleError}
    />
  );
}

export function FloatingProducts({ products, apiOrigin }: FloatingProductsProps) {
  const resolveMediaPath = (path: string | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (path.startsWith('/uploads/') && apiOrigin) {
      return `${apiOrigin}${path}`;
    }
    return path;
  };

  const resolveProductImage = (product: Product): string =>
    resolveMediaPath(product.images?.[0] ?? product.image) || '/images/placeholders/product.jpg';

  return (
    <>
      {products.map((product, index) => {
        // Her ürün için benzersiz seed değerleri
        const seed1 = (index * 7919 + 13) % 101;
        const seed2 = (index * 6563 + 29) % 103;

        // Dinamik grid - ürün sayısına göre
        const totalProducts = products.length;
        const gridCols = Math.ceil(Math.sqrt(totalProducts * 1.5));
        const gridRows = Math.ceil(totalProducts / gridCols);
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);

        // Geniş dağılım
        const baseLeft = gridCols > 1 ? (col / (gridCols - 1)) * 90 + 3 : 50;
        const baseTop = gridRows > 1 ? (row / (gridRows - 1)) * 80 + 5 : 50;

        // Küçük rastgele ofsetler
        const offsetX = ((seed1 / 101) - 0.5) * 10;
        const offsetY = ((seed2 / 103) - 0.5) * 8;

        const finalLeft = Math.max(0, Math.min(95, baseLeft + offsetX));
        const finalTop = Math.max(0, Math.min(85, baseTop + offsetY));

        // Boyutlar - ürün sayısına göre küçült
        const sizes = totalProducts > 15
          ? ['xs', 'sm', 'sm', 'md'] as const
          : ['sm', 'sm', 'md', 'md', 'lg'] as const;
        const sizeIndex = (seed1 + seed2) % sizes.length;
        const size = sizes[sizeIndex];

        // Boyut sınıfları - %30 büyütülmüş
        const sizeClasses = {
          xs: 'w-14 h-14 sm:w-16 sm:h-16 lg:w-[72px] lg:h-[72px]',
          sm: 'w-16 h-16 sm:w-[72px] sm:h-[72px] lg:w-[84px] lg:h-[84px]',
          md: 'w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] lg:w-[104px] lg:h-[104px]',
          lg: 'w-[84px] h-[84px] sm:w-[104px] sm:h-[104px] lg:w-[124px] lg:h-[124px]',
        };

        // Z-index - satıra göre (üst satırlar arkada)
        const zIndex = (row + 1) * 10 + (seed1 % 5);

        // Hafif rotasyon
        const rotate = ((seed1 / 101) - 0.5) * 10;

        // Yavaş animasyon
        const duration = 25 + (seed1 / 101) * 10;
        const delay = (seed2 / 103) * 5;

        const imageSrc = resolveProductImage(product);

        return (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="absolute transition-all duration-700 hover:scale-125 hover:z-[60]"
            style={{
              top: `${finalTop}%`,
              left: `${finalLeft}%`,
              transform: `rotate(${rotate}deg)`,
              animation: `slowFloat ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
              zIndex,
            }}
            title={product.title}
          >
            <div className={`relative ${sizeClasses[size]} drop-shadow-[0_8px_25px_rgba(0,0,0,0.3)] hover:drop-shadow-[0_15px_40px_rgba(251,191,36,0.5)] transition-all duration-500`}>
              <ProductImage
                src={imageSrc}
                alt={product.title}
                loading={index < 6 ? "eager" : "lazy"}
              />
            </div>
          </Link>
        );
      })}

      {/* Soft glow efektleri */}
      <div className="absolute top-[25%] left-[30%] w-40 h-40 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-32 h-32 rounded-full bg-blue-400/8 blur-3xl pointer-events-none" />
    </>
  );
}
