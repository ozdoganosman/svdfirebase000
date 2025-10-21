'use client';

import { useEffect, useState } from 'react';

interface HeroVideo {
  src: string;
  poster: string;
}

export function LandingVideoSection({ fallbackPoster }: { fallbackPoster: string }) {
  const [videoData, setVideoData] = useState<HeroVideo>({
    src: 'https://cdn.coverr.co/videos/coverr-plastic-bottles-on-a-production-line-5589/1080p.mp4',
    poster: fallbackPoster,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
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
          const heroVideo = data?.landingMedia?.heroVideo;
          
          if (heroVideo?.src) {
            setVideoData({
              src: heroVideo.src,
              poster: heroVideo.poster || fallbackPoster,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch landing video:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [fallbackPoster]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl shadow-black/40">
      <video
        key={videoData.src}
        className="absolute inset-0 h-full w-full object-cover"
        poster={videoData.poster}
        controls
        playsInline
      >
        <source src={videoData.src} type="video/mp4" />
        Tarayıcınız video etiketini desteklemiyor.
      </video>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 space-y-2 p-6">
        <span className="inline-flex rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
          Fabrika turu
        </span>
        <p className="text-lg font-semibold text-white">
          SVD Ambalaj üretim parkuruna yakından bakın, dolum ve paketleme istasyonlarının işleyişini izleyin.
        </p>
        <p className="text-sm text-slate-200/80">
          Videolarınızı buraya yükleyerek müşterilerinize tedarik güvencenizi gösterin.
        </p>
      </div>
    </div>
  );
}
