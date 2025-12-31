'use client';

import { useCallback, useEffect, useState } from "react";
import { AdminMedia, fetchMediaList, resolveMediaUrl } from "@/lib/admin-api";
import Image from "next/image";

type MediaPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: AdminMedia) => void;
};

export function MediaPicker({ isOpen, onClose, onSelect }: MediaPickerProps) {
  const [items, setItems] = useState<AdminMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<AdminMedia | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const media = await fetchMediaList();
      setItems(media.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadItems();
      setSelectedItem(null);
      setSearchTerm("");
    }
  }, [isOpen, loadItems]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter items by search term
  const filteredItems = items.filter((item) =>
    item.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) {
    return null;
  }

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      setSelectedItem(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-[95vh] sm:h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white shadow-lg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Medya Kütüphanesi</h2>
                <p className="text-xs text-slate-600 sm:text-sm">
                  {items.length} dosya{searchTerm && ` (${filteredItems.length} sonuç)`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 sm:relative sm:right-auto sm:top-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-md transition hover:bg-red-50 hover:text-red-600"
              aria-label="Kapat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search & Actions */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Dosya ara..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <button
              type="button"
              onClick={loadItems}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-600"></div>
              <p className="mt-4 text-sm text-slate-500">Medya yükleniyor...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16">
              <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-4 text-base font-medium text-slate-600">
                {searchTerm ? "Arama sonucu bulunamadı" : "Henüz medya yüklenmemiş"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm ? "Farklı bir arama terimi deneyin" : "Ürün formundan doğrudan yükleyebilirsiniz"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
              {filteredItems.map((item) => {
                const fileUrl = resolveMediaUrl(item.url);
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(isSelected ? null : item)}
                    onDoubleClick={() => onSelect(item)}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border-2 bg-white text-left shadow-sm transition-all duration-200 hover:shadow-lg ${
                      isSelected
                        ? 'border-green-500 ring-2 ring-green-500/30 shadow-green-100'
                        : 'border-slate-200 hover:border-green-300'
                    }`}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      <Image
                        src={fileUrl}
                        alt={item.originalName}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className={`object-cover transition-transform duration-300 ${
                          isSelected ? 'scale-105' : 'group-hover:scale-105'
                        }`}
                      />
                      {/* Hover overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="truncate text-xs font-medium text-white drop-shadow-lg">
                            {item.originalName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info - visible on larger screens */}
                    <div className="hidden border-t border-slate-100 px-2.5 py-2 sm:block">
                      <p className={`truncate text-xs font-medium ${isSelected ? 'text-green-700' : 'text-slate-700'}`}>
                        {item.originalName}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 sm:text-sm">
              {selectedItem ? (
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="font-medium text-slate-700">{selectedItem.originalName}</span> seçildi
                </span>
              ) : (
                "Bir görsel seçin veya çift tıklayarak hızlıca ekleyin"
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:flex-none"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSelect}
                disabled={!selectedItem}
                className="flex-1 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-600/30 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:flex-none"
              >
                Seç ve Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
