"use client";

import { useEffect } from "react";
import { trackViewItem } from "./google-analytics";

type ProductViewTrackerProps = {
  productId: string;
  productName: string;
  price: number;
};

export function ProductViewTracker({ productId, productName, price }: ProductViewTrackerProps) {
  useEffect(() => {
    trackViewItem(productId, productName, price);
  }, [productId, productName, price]);

  return null;
}
