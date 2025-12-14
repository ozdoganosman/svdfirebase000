"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  title: string;
  slug: string;
  images?: string[];
  priceUSD?: number;
  category?: string;
};

type RelatedProductsProps = {
  currentProductId: string;
  categoryId: string;
  apiBase: string;
  exchangeRate: number;
};

export function RelatedProducts({
  currentProductId,
  categoryId,
  apiBase,
  exchangeRate,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedProducts() {
      try {
        // Fetch products from the same category
        const response = await fetch(`${apiBase}/products?category=${categoryId}&limit=8`);
        if (response.ok) {
          const data = await response.json();
          const allProducts = data?.products || [];
          // Filter out current product and limit to 4
          const related = allProducts
            .filter((p: Product) => p.id !== currentProductId)
            .slice(0, 4);
          setProducts(related);
        }
      } catch (error) {
        console.error("Failed to fetch related products:", error);
      } finally {
        setLoading(false);
      }
    }

    if (categoryId) {
      fetchRelatedProducts();
    } else {
      setLoading(false);
    }
  }, [currentProductId, categoryId, apiBase]);

  if (loading) {
    return (
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Benzer Ürünler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-200 rounded-xl h-40" />
              <div className="mt-3 h-4 bg-slate-200 rounded w-3/4" />
              <div className="mt-2 h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  const formatPrice = (priceUSD: number) => {
    const priceTRY = priceUSD * exchangeRate;
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(priceTRY);
  };

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Benzer Ürünler</h2>
        <Link
          href={`/categories/${categoryId}`}
          className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          Tümünü Gör
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div className="relative h-40 bg-slate-100">
              <Image
                src={product.images?.[0] || "/images/placeholders/product.jpg"}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-amber-600 transition">
                {product.title}
              </h3>
              {product.priceUSD && exchangeRate > 0 && (
                <p className="mt-2 text-sm font-bold text-amber-600">
                  {formatPrice(product.priceUSD)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
