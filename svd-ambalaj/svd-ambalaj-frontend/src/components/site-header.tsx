"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import ProductSearch from "@/components/product-search";

const links = [
  { href: "/products", label: "Ürünler" },
  { href: "/categories", label: "Kategoriler" },
  { href: "/cart", label: "Sepet" },
  { href: "/checkout", label: "Sipariş" },
];

export function SiteHeader() {
  const { items, totalBoxes } = useCart();
  const [showSearch, setShowSearch] = useState(false);
  
  // Show total boxes for packaged products, or item count for regular products
  const badgeCount = totalBoxes > 0 ? totalBoxes : items.length;
  
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <Image
            src="/images/logo.png"
            alt="SVD Ambalaj"
            width={48}
            height={48}
            className="h-12 w-12"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-amber-600">
            SVD Ambalaj
          </span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden lg:block flex-1 max-w-md">
          <ProductSearch placeholder="Ürün ara..." />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative transition hover:text-amber-600"
            >
              {link.label}
              {link.href === "/cart" && badgeCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {badgeCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="lg:hidden flex items-center justify-center h-10 w-10 rounded-full text-slate-600 hover:bg-slate-100"
          aria-label="Ara"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/checkout"
            className="hidden rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:border-amber-400 hover:bg-amber-50 lg:inline-flex"
          >
            Hızlı Satın Al
          </Link>
          <Link
            href="/#sample"
            className="hidden rounded-full border border-transparent bg-white px-4 py-2 text-sm font-semibold text-amber-600 shadow-sm shadow-amber-200/50 transition hover:border-amber-400 hover:bg-amber-50 md:inline-flex"
          >
            Numune Talep Et
          </Link>
          <a
            href="tel:+908501234567"
            className="hidden rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:border-amber-400 hover:bg-amber-50 sm:inline-flex"
          >
            0850 123 45 67
          </a>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="lg:hidden border-t border-slate-200 px-6 py-3">
          <ProductSearch placeholder="Ürün ara..." autoFocus />
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <nav className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700">
          {links.slice(0, 3).map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="relative transition hover:text-amber-600"
            >
              {link.label}
              {link.href === "/cart" && badgeCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {badgeCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
