"use client";

import { useState } from "react";
import Image from "next/image";

type ImageGalleryProps = {
  images: string[];
  productTitle: string;
};

export function ImageGallery({ images, productTitle }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (index: number) => {
    setSelectedImage(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToPrevious = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
  };

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div
          onClick={() => openModal(selectedImage)}
          className="relative h-80 sm:h-96 lg:h-[450px] w-full overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-300 via-slate-200 to-blue-100 cursor-zoom-in shadow-lg hover:shadow-xl transition-shadow"
        >
          <Image
            src={images[selectedImage]}
            alt={`${productTitle} - Ana görsel`}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-contain p-4"
            priority
            quality={90}
          />
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
            Büyütmek için tıklayın
          </div>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={`thumb-${index}`}
                type="button"
                onClick={() => setSelectedImage(index)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  selectedImage === index
                    ? "border-amber-500 ring-2 ring-amber-200 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Image
                  src={image}
                  alt={`${productTitle} - Görsel ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                  quality={60}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label="Görsel galerisi"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={closeModal}
            className="absolute top-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            aria-label="Kapat"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 z-50 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
            {selectedImage + 1} / {images.length}
          </div>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              aria-label="Önceki görsel"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Main Image */}
          <div
            className="relative h-[85vh] w-[90vw] max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedImage]}
              alt={`${productTitle} - Görsel ${selectedImage + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
              quality={100}
              priority
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              aria-label="Sonraki görsel"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Thumbnail Strip in Modal */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/50 p-2 rounded-xl backdrop-blur-sm">
              {images.map((image, index) => (
                <button
                  key={`modal-thumb-${index}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index
                      ? "border-amber-500 ring-2 ring-amber-400"
                      : "border-transparent hover:border-white/50"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Görsel ${index + 1}`}
                    fill
                    sizes="56px"
                    className="object-contain"
                    quality={50}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
