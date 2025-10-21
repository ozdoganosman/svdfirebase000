"use client";

import { useEffect, useState } from "react";

export function SessionWarning() {
  const [warning, setWarning] = useState<{ expiresInMinutes: number } | null>(null);

  useEffect(() => {
    const handleSessionWarning = (event: CustomEvent<{ expiresInMinutes: number }>) => {
      setWarning(event.detail);
    };

    window.addEventListener("session-expiring", handleSessionWarning as EventListener);
    return () => {
      window.removeEventListener("session-expiring", handleSessionWarning as EventListener);
    };
  }, []);

  if (!warning) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-lg bg-amber-50 p-4 shadow-lg ring-1 ring-amber-100">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg 
              className="h-5 w-5 text-amber-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">
              Oturumunuz {warning.expiresInMinutes} dakika içinde sona erecek
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Oturumunuz otomatik olarak yenilenecektir. Sorun yaşarsanız tekrar giriş yapabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}