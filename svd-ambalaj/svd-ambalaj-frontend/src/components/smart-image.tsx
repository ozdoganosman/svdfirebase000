"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { getThumbnailUrl } from "@/lib/image-utils";

interface SmartImageProps extends Omit<ImageProps, "src" | "onError"> {
  src: string;
  useThumbnail?: boolean;
}

/**
 * Smart Image component that tries to load thumbnail first,
 * falls back to original image if thumbnail doesn't exist
 */
export function SmartImage({ src, useThumbnail = true, alt, ...props }: SmartImageProps) {
  const thumbnailUrl = useThumbnail ? getThumbnailUrl(src) : src;
  const [currentSrc, setCurrentSrc] = useState(thumbnailUrl);
  const [triedFallback, setTriedFallback] = useState(false);

  const handleError = () => {
    // If thumbnail failed and we haven't tried fallback yet, use original
    if (currentSrc === thumbnailUrl && thumbnailUrl !== src && !triedFallback) {
      setCurrentSrc(src);
      setTriedFallback(true);
    }
  };

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
    />
  );
}
