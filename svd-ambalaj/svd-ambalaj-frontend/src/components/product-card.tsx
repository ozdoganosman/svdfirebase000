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
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative h-56 w-full overflow-hidden bg-slate-100 block cursor-pointer">
        <Image
          src={resolveProductImage()}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-2 transition duration-500 hover:scale-110"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <header className="space-y-2">
          <Link href={`/products/${product.slug}`}>
            <h2 className="text-xl font-semibold text-slate-900 hover:text-amber-600 transition cursor-pointer">{product.title}</h2>
          </Link>
          {product.description && (
            <p className="text-sm text-slate-600">{product.description}</p>
          )}
        </header>

        {product.packageInfo && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm">
            <p className="font-semibold text-amber-900">
              📦 {product.packageInfo.itemsPerBox} adet/{product.packageInfo.boxLabel.toLowerCase()}
            </p>
          </div>
        )}

        {/* Technical Specifications */}
        {(product.specifications?.hoseLength ||
          product.specifications?.volume ||
          product.specifications?.color ||
          product.specifications?.neckSize) && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Teknik Özellikler
            </p>
            <ul className="space-y-1 text-xs text-slate-600">
              {product.specifications?.hoseLength && (
                <li>
                  • <strong>Hortum Boyu:</strong> {product.specifications.hoseLength}
                </li>
              )}
              {product.specifications?.volume && (
                <li>
                  • <strong>Hacim:</strong> {product.specifications.volume}
                </li>
              )}
              {product.specifications?.color && (
                <li>
                  • <strong>Renk:</strong> {product.specifications.color}
                </li>
              )}
              {product.specifications?.neckSize && (
                <li>
                  • <strong>Boyun Ölçüsü:</strong> {product.specifications.neckSize}
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Variant Segments */}
        {hasVariants && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Seçenekler
            </p>
            <div className="space-y-3">
              {product.variants!.map((segment) => (
                <div key={segment.id}>
                  <p className="text-xs font-medium text-slate-700 mb-1 capitalize">
                    {segment.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {segment.options.map((option) => {
                      const isSelected = selectedVariants[segment.id] === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleVariantChange(segment.id, option.id)}
                          className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:text-blue-600"
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
          </div>
        )}

        <div className="mt-auto space-y-3">
          <div>
            <span className="text-sm text-slate-500">
              {product.packageInfo ? "Birim fiyat" : "Başlangıç fiyatı"}
            </span>
            <p className="text-2xl font-bold text-amber-600">
              {effectivePriceUSD && rate > 0
                ? formatDualPrice(effectivePriceUSD, rate, true)
                : "Fiyat için iletişime geçin"}{" "}
              <span className="text-sm font-normal text-slate-500">+KDV</span>
            </p>
            {product.packageInfo && (
              <p className="text-sm text-slate-600">
                1 {product.packageInfo.boxLabel.toLowerCase()} ={" "}
                {effectivePriceUSD && rate > 0
                  ? formatDualPrice(effectivePriceUSD, rate, false, product.packageInfo.itemsPerBox)
                  : "—"}{" "}
                <span className="text-xs text-slate-500">+KDV</span>
              </p>
            )}
          </div>
          {product.priceUSD && product.bulkPricingUSD && product.bulkPricingUSD.length > 0 && (
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Toplu Alım Avantajı
              </p>
              <ul className="mt-3 space-y-2 text-sm text-amber-800">
                {product.bulkPricingUSD?.slice(0, 3).map((tier) => {
                  const itemsPerBox = product.packageInfo?.itemsPerBox || 1;
                  const totalItems = tier.minQty * itemsPerBox;
                  const tierPrice = tier.price + priceModifier;
                  return (
                    <li
                      key={`${product.id}-tier-${tier.minQty}`}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {tier.minQty}+ koli
                        {itemsPerBox > 1 && (
                          <span className="text-xs text-slate-600">
                            {" "}
                            ({totalItems.toLocaleString("tr-TR")}+ adet)
                          </span>
                        )}
                      </span>
                      <span className="font-semibold">
                        {formatDualPrice(tierPrice, rate, true)}{" "}
                        <span className="text-xs font-normal">+KDV</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3">
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
          />
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center justify-center rounded-full border border-amber-500 px-5 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-500 hover:text-white"
          >
            Detayları Gör
          </Link>
        </div>
      </div>
    </article>
  );
}
