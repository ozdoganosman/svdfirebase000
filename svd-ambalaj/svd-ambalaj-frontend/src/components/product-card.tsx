"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton, SelectedVariants } from "@/components/add-to-cart-button";
import { formatDualPrice } from "@/lib/currency";

type VariantOption = {
  id: string;
  name: string;
  stock: number;
  priceModifier: number;
};

type VariantSegment = {
  id: string;
  name: string;
  required: boolean;
  options: VariantOption[];
};

type BulkTier = {
  minQty: number;
  price: number;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  price?: number;
  priceUSD?: number;
  bulkPricing?: BulkTier[];
  bulkPricingUSD?: BulkTier[];
  images?: string[];
  image?: string;
  category?: string;
  stock?: number;
  productType?: string | null;
  neckSize?: string | null;
  packageInfo?: {
    itemsPerBox: number;
    minBoxes: number;
    boxLabel: string;
  };
  specifications?: {
    hoseLength?: string;
    volume?: string;
    color?: string;
    neckSize?: string;
  };
  variants?: VariantSegment[];
  hasVariants?: boolean;
};

type ProductCardProps = {
  product: Product;
  rate: number;
};

export function ProductCard({ product, rate }: ProductCardProps) {
  // Initialize selected variants with first option of each segment
  const initialVariants = useMemo(() => {
    const initial: SelectedVariants = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((segment) => {
        if (segment.options.length > 0) {
          initial[segment.id] = segment.options[0].id;
        }
      });
    }
    return initial;
  }, [product.variants]);

  const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>(initialVariants);

  const handleVariantChange = (segmentId: string, optionId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [segmentId]: optionId,
    }));
  };

  // Calculate variant stock (minimum of selected options' stock)
  const variantStock = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return product.stock ?? 0;
    }
    const stocks = product.variants.map((segment) => {
      const selectedOptionId = selectedVariants[segment.id];
      const option = segment.options.find((opt) => opt.id === selectedOptionId);
      return option?.stock ?? 0;
    });
    return Math.min(...stocks);
  }, [product.variants, selectedVariants, product.stock]);

  // Calculate price modifier from selected variants
  const priceModifier = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants.reduce((total, segment) => {
      const selectedOptionId = selectedVariants[segment.id];
      const option = segment.options.find((opt) => opt.id === selectedOptionId);
      return total + (option?.priceModifier ?? 0);
    }, 0);
  }, [product.variants, selectedVariants]);

  const effectivePriceUSD = (product.priceUSD ?? 0) + priceModifier;

  const resolveProductImage = (): string => {
    const imagePath = product.images?.[0] ?? product.image;
    if (!imagePath) {
      return "/images/placeholders/product.jpg";
    }
    return imagePath;
  };

  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-slate-300 via-slate-200 to-blue-100 block cursor-pointer">
        <Image
          src={resolveProductImage()}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 transition duration-300 hover:scale-105"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/products/${product.slug}`}>
          <h2 className="text-sm font-semibold text-slate-900 hover:text-amber-600 transition cursor-pointer line-clamp-2 leading-tight">
            {product.title}
          </h2>
        </Link>

        {product.packageInfo && (
          <p className="text-xs text-slate-500">
            📦 {product.packageInfo.itemsPerBox} adet/{product.packageInfo.boxLabel.toLowerCase()}
          </p>
        )}

        {/* Technical Specifications - Compact */}
        {(product.specifications?.hoseLength ||
          product.specifications?.volume ||
          product.specifications?.color ||
          product.specifications?.neckSize) && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
            {product.specifications?.hoseLength && (
              <span>🔹 {product.specifications.hoseLength}</span>
            )}
            {product.specifications?.volume && (
              <span>🔹 {product.specifications.volume}</span>
            )}
            {product.specifications?.color && (
              <span>🔹 {product.specifications.color}</span>
            )}
            {product.specifications?.neckSize && (
              <span>🔹 {product.specifications.neckSize}</span>
            )}
          </div>
        )}

        {/* Variant Segments - Compact */}
        {hasVariants && (
          <div className="space-y-1.5">
            {product.variants!.map((segment) => (
              <div key={segment.id}>
                <p className="text-[10px] font-medium text-slate-500 mb-0.5 uppercase tracking-wide">
                  {segment.name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {segment.options.map((option) => {
                    const isSelected = selectedVariants[segment.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleVariantChange(segment.id, option.id)}
                        className={`px-2 py-0.5 text-[10px] rounded-full border transition-all ${
                          isSelected
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-amber-400"
                        }`}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Pricing - Compact */}
        {product.priceUSD && product.bulkPricingUSD && product.bulkPricingUSD.length > 0 && (
          <div className="bg-amber-50 rounded-lg px-2 py-1.5 text-[10px]">
            <p className="font-semibold text-amber-700 mb-1">Toplu Alım:</p>
            <div className="space-y-0.5 text-amber-800">
              {product.bulkPricingUSD?.slice(0, 2).map((tier) => {
                const tierPrice = tier.price + priceModifier;
                return (
                  <div key={`tier-${tier.minQty}`} className="flex justify-between">
                    <span>{tier.minQty}+ koli</span>
                    <span className="font-medium">{formatDualPrice(tierPrice, rate, true)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-slate-100">
          <p className="text-lg font-bold text-amber-600">
            {effectivePriceUSD && rate > 0
              ? formatDualPrice(effectivePriceUSD, rate, true)
              : "—"}
            <span className="text-[10px] font-normal text-slate-400 ml-1">+KDV</span>
          </p>
          {product.packageInfo && (
            <p className="text-[10px] text-slate-500">
              1 {product.packageInfo.boxLabel.toLowerCase()} = {effectivePriceUSD && rate > 0
                ? formatDualPrice(effectivePriceUSD, rate, false, product.packageInfo.itemsPerBox)
                : "—"}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <AddToCartButton
            product={{
              id: product.id,
              title: product.title,
              slug: product.slug,
              price: effectivePriceUSD && rate > 0 ? effectivePriceUSD * rate : 0,
              priceUSD: effectivePriceUSD,
              stock: variantStock,
              images: product.images,
              bulkPricing:
                product.priceUSD && product.bulkPricingUSD
                  ? product.bulkPricingUSD.map((tier) => ({
                      minQty: tier.minQty,
                      price: (tier.price + priceModifier) * rate,
                    }))
                  : undefined,
              bulkPricingUSD: product.bulkPricingUSD?.map((tier) => ({
                minQty: tier.minQty,
                price: tier.price + priceModifier,
              })),
              packageInfo: product.packageInfo,
              specifications: product.specifications,
              variants: product.variants,
              hasVariants: hasVariants,
            }}
            selectedVariants={hasVariants ? selectedVariants : undefined}
            variantStock={variantStock}
            compact
          />
          <Link
            href={`/products/${product.slug}`}
            className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
          >
            Detay
          </Link>
        </div>
      </div>
    </article>
  );
}
