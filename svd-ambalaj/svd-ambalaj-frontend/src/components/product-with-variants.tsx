'use client';

import { useState } from 'react';
import { AddToCartButton, SelectedVariants } from './add-to-cart-button';
import { VariantSelector } from './variant-selector';

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

type ProductWithVariantsProps = {
  product: {
    id: string;
    title: string;
    slug: string;
    price?: number;
    priceUSD?: number;
    priceTRY?: number;
    stock?: number;
    images?: string[];
    bulkPricing?: { minQty: number; price: number }[];
    bulkPricingUSD?: { minQty: number; price: number }[];
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
};

export function ProductWithVariants({ product }: ProductWithVariantsProps) {
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>({});
  const [variantStock, setVariantStock] = useState<number>(0);

  const hasVariants = product.hasVariants && product.variants && product.variants.length > 0;

  const handleSelectionChange = (selections: SelectedVariants, availableStock: number) => {
    setSelectedVariants(selections);
    setVariantStock(availableStock);
  };

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      {hasVariants && (
        <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
          <VariantSelector
            variants={product.variants!}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      )}

      {/* Add to Cart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AddToCartButton
          product={product}
          selectedVariants={hasVariants ? selectedVariants : undefined}
          variantStock={hasVariants ? variantStock : undefined}
        />
      </div>
    </div>
  );
}
