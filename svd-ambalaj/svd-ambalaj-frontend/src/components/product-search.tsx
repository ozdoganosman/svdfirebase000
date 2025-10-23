"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Product = {
  id: string;
  title: string;
  slug: string;
  priceUSD?: number;
  images: string[];
};

type ProductSearchProps = {
  initialValue?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export default function ProductSearch({
  initialValue = "",
  onSearch,
  placeholder = "Ürün ara...",
  autoFocus = false,
}: ProductSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/svdfirebase000/us-central1/api";
        const response = await fetch(`${apiBase}/products/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setResults(data.products?.slice(0, 5) || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        router.push(`/products?q=${encodeURIComponent(query)}`);
      }
      setShowDropdown(false);
    }
  };

  const handleResultClick = (slug: string) => {
    setShowDropdown(false);
    router.push(`/products/${slug}`);
  };

  const formatPrice = (priceUSD?: number) => {
    if (!priceUSD) return "";
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(priceUSD);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-500 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500"></div>
            </div>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="max-h-80 overflow-y-auto">
            {results.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleResultClick(product.slug)}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 last:border-b-0"
              >
                {product.images?.[0] && (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{product.title}</p>
                  {product.priceUSD && (
                    <p className="text-xs text-amber-600 font-semibold">
                      {formatPrice(product.priceUSD)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
            <button
              type="button"
              onClick={() => {
                router.push(`/products?q=${encodeURIComponent(query)}`);
                setShowDropdown(false);
              }}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              Tüm sonuçları gör ({results.length > 5 ? "5+" : results.length})
            </button>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {showDropdown && !isSearching && results.length === 0 && query.trim().length >= 2 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <p className="text-sm text-slate-500">Sonuç bulunamadı</p>
        </div>
      )}
    </div>
  );
}
