"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
};

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors = {
    success: "bg-green-500",
    error: "bg-rose-500",
    info: "bg-amber-500",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg ${bgColors[type]} px-6 py-4 text-white shadow-xl transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <span className="text-xl font-bold">{icons[type]}</span>
      <p className="font-semibold">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 text-white/80 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
