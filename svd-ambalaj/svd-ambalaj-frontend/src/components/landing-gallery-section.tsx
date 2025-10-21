'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface MediaHighlight {
  title: string;
  caption: string;
  image: string;
}

const defaultHighlights: MediaHighlight[] = [
  {
    title: 'Tam otomatik dolum hatlarımız',
    caption: 'Günlük 180K adetlik kadın-erkek bakım dolum kapasitesi',
    image: '/images/landing/25.png',
  },
  {
    title: 'Trigger pompa montaj istasyonu',
    caption: 'Inline tork ve sızıntı testleriyle %0,02 hata oranı',
    image: '/images/landing/27.png',
  },
  {
    title: 'PET şişe şişirme ve depo alanı',
    caption: '7.000 m² stoklu sevkiyat alanı ile haftalık konteyner çıkışı',
    image: '/images/landing/28.png',
  },
];

export function LandingGallerySection() {
  const [highlights, setHighlights] = useState<MediaHighlight[]>(defaultHighlights);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const apiBase = 'https://api-tfi7rlxtca-uc.a.run.app';
        const response = await fetch(`${apiBase}/landing-media`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const mediaHighlights = data?.landingMedia?.mediaHighlights;

          if (Array.isArray(mediaHighlights) && mediaHighlights.length > 0) {
            setHighlights(mediaHighlights);
          }
        }
      } catch (error) {
        console.error('Failed to fetch gallery highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Fotoğraf galerisi</h3>
          <p className="text-sm text-slate-300">
            Geniş ekranlı cihazlar için optimize edilmiş yatay galeri ile üretim hattınızı detaylı bir şekilde sergileyin.
          </p>
        </div>
        <span className="rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
          Sürükleyerek inceleyin
        </span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {highlights.map((item, index) => (
            <figure
              key={`${item.title}-${index}`}
              className="relative h-64 w-[320px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/30"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 80vw, 320px"
              />
              <figcaption className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 text-sm">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-200/90">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
