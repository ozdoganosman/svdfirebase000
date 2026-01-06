"use client";

import { useState } from "react";
import Image from "next/image";
import { getThumbnailUrl } from "@/lib/image-utils";

interface HeroProductImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
}

/**
 * Hero product image with thumbnail fallback
 * Tries thumbnail first, falls back to original if not found
 */
export function HeroProductImage({ src, alt, className, sizes, loading }: HeroProductImageProps) {
  const thumbnailUrl = getThumbnailUrl(src);
  const [currentSrc, setCurrentSrc] = useState(thumbnailUrl || src);
  const [triedFallback, setTriedFallback] = useState(false);

  const handleError = () => {
    // If thumbnail failed and we haven't tried fallback yet, use original
    if (!triedFallback && currentSrc !== src) {
      setCurrentSrc(src);
      setTriedFallback(true);
    }
  };

  if (!src) return null;

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      loading={loading}
      onError={handleError}
    />
  );
}
