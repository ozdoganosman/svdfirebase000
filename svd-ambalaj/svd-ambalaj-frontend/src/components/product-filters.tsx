"use client";

import { useState, useEffect } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ProductFiltersProps = {
  categories: Category[];
  selectedCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  onFilterChange: (filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }) => void;
};

const sortOptions = [
  { value: "", label: "Varsayılan" },
  { value: "title-asc", label: "İsim (A-Z)" },
  { value: "title-desc", label: "İsim (Z-A)" },
  { value: "price-asc", label: "Fiyat (Düşükten Yükseğe)" },
  { value: "price-desc", label: "Fiyat (Yüksekten Düşüğe)" },
];

export default function ProductFilters({
  categories,
  selectedCategory = "all",
  minPrice,
  maxPrice,
  sortBy = "",
  onFilterChange,
}: ProductFiltersProps) {
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice?.toString() || "");
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice?.toString() || "");
  const [localSort, setLocalSort] = useState(sortBy);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setLocalCategory(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    setLocalMinPrice(minPrice?.toString() || "");
  }, [minPrice]);

  useEffect(() => {
    setLocalMaxPrice(maxPrice?.toString() || "");
  }, [maxPrice]);

  useEffect(() => {
    setLocalSort(sortBy);
  }, [sortBy]);

  const handleCategoryChange = (categoryId: string) => {
    setLocalCategory(categoryId);
    onFilterChange({
      category: categoryId === "all" ? undefined : categoryId,
      minPrice: localMinPrice ? Number(localMinPrice) : undefined,
      maxPrice: localMaxPrice ? Number(localMaxPrice) : undefined,
      sort: localSort || undefined,
    });
  };

  const handleSortChange = (sort: string) => {
    setLocalSort(sort);
    onFilterChange({
      category: localCategory === "all" ? undefined : localCategory,
      minPrice: localMinPrice ? Number(localMinPrice) : undefined,
      maxPrice: localMaxPrice ? Number(localMaxPrice) : undefined,
      sort: sort || undefined,
    });
  };

  const handlePriceFilter = () => {
    onFilterChange({
      category: localCategory === "all" ? undefined : localCategory,
      minPrice: localMinPrice ? Number(localMinPrice) : undefined,
      maxPrice: localMaxPrice ? Number(localMaxPrice) : undefined,
      sort: localSort || undefined,
    });
  };

  const handleClearFilters = () => {
    setLocalCategory("all");
    setLocalMinPrice("");
    setLocalMaxPrice("");
    setLocalSort("");
    onFilterChange({});
  };

  const hasActiveFilters = localCategory !== "all" || localMinPrice || localMaxPrice || localSort;

  return (
    <div className="space-y-4">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <span>Filtreler</span>
          <svg
            className={`h-5 w-5 transition-transform ${showMobileFilters ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filters Container */}
      <div className={`space-y-6 ${showMobileFilters ? "block" : "hidden lg:block"}`}>
        {/* Sort Dropdown */}
        <div className="space-y-2">
          <label htmlFor="sort" className="block text-sm font-semibold text-slate-900">
            Sıralama
          </label>
          <select
            id="sort"
            value={localSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Kategori</h3>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value="all"
                checked={localCategory === "all"}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="h-4 w-4 border-slate-300 text-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <span className="text-sm text-slate-700">Tüm Kategoriler</span>
            </label>
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.id}
                  checked={localCategory === category.id}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="h-4 w-4 border-slate-300 text-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-sm text-slate-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Fiyat Aralığı (USD)</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                placeholder="Min"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Max"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handlePriceFilter}
            className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
          >
            Fiyat Filtresini Uygula
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>
    </div>
  );
}
