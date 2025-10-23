"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductSearch from "@/components/product-search";

const links = [
  { href: "/products", label: "Ürünler" },
  { href: "/categories", label: "Kategoriler" },
  { href: "/cart", label: "Sepet" },
];

export function SiteHeader() {
  const { items, totalBoxes } = useCart();
  const { user, signOut } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Show total boxes for packaged products, or item count for regular products
  const badgeCount = totalBoxes > 0 ? totalBoxes : items.length;

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50">
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

        {/* Search Button - Desktop */}
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="hidden lg:flex items-center gap-2 rounded-full border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 px-5 py-2.5 text-sm font-bold text-amber-700 shadow-sm transition hover:border-amber-600 hover:bg-gradient-to-r hover:from-amber-100 hover:to-amber-200 hover:shadow-md active:scale-95 cursor-pointer"
        >
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Ürün Ara</span>
        </button>

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
          {/* Auth Buttons */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden lg:inline">{user.displayName || "Hesabım"}</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-slate-200 py-1 z-50">
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-amber-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Hesabım
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-amber-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Siparişlerim
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-amber-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Adreslerim
                  </Link>
                  <hr className="my-1 border-slate-200" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50"
              >
                Giriş
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-amber-700"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Full Width Search Overlay - Shows when button clicked */}
      {showSearch && (
        <div className="border-t border-slate-200 bg-white shadow-lg">
          <div className="mx-auto max-w-6xl px-6 py-4 sm:px-10">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <ProductSearch placeholder="Ürün, kategori veya özellik ara..." autoFocus />
              </div>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="flex items-center justify-center h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100 transition"
                aria-label="Kapat"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
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
