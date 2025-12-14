"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import ProductSearch from "@/components/product-search";

const links = [
  { href: "/products", label: "Ürünler", icon: "grid" },
  { href: "/categories", label: "Kategoriler", icon: "folder" },
  { href: "/cart", label: "Sepet", icon: "cart" },
];

const NavIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "grid":
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "folder":
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case "cart":
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    default:
      return null;
  }
};

export function SiteHeader() {
  const { items, totalBoxes } = useCart();
  const { user, signOut } = useAuth();
  const { siteSettings } = useSettings();
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Show total boxes for packaged products, or item count for regular products
  const badgeCount = totalBoxes > 0 ? totalBoxes : items.length;

  // Dynamic site name and logo
  const siteName = siteSettings?.siteName || "SVD Ambalaj";
  const logoUrl = siteSettings?.logoUrl || "/images/logo.png";
  const logoAlt = siteSettings?.logoAlt || siteName;

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      {/* Desktop Header */}
      <div className="hidden md:block border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
            )}
            <span className="text-xl font-bold tracking-tight text-amber-600">
              {siteName}
            </span>
          </Link>

          {/* Search Button - Desktop */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2 rounded-full border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 px-5 py-2.5 text-sm font-bold text-amber-700 shadow-sm transition hover:border-amber-600 hover:bg-gradient-to-r hover:from-amber-100 hover:to-amber-200 hover:shadow-md active:scale-95 cursor-pointer"
          >
            <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Ürün Ara</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-6 text-sm font-semibold text-slate-700">
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

          <div className="flex items-center gap-3">
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
      </div>

      {/* Mobile Header - Compact Single Line */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={32}
                height={32}
                className="h-8 w-8 object-contain rounded-full bg-white p-0.5"
                priority
              />
            )}
            <span className="text-lg font-bold text-white">
              {siteName}
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center justify-center h-9 w-9 rounded-full text-white/90 hover:bg-white/20 transition"
              aria-label="Ara"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Cart with Badge */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center h-9 w-9 rounded-full text-white/90 hover:bg-white/20 transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-amber-600">
                  {badgeCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Bottom Navigation - Fixed Tab Bar Style */}
        <div className="flex items-center bg-white border-t border-slate-100">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-slate-600 hover:text-amber-600 transition relative"
            >
              <div className="relative">
                <NavIcon type={link.icon} />
                {link.href === "/cart" && badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{link.label}</span>
            </Link>
          ))}
          {/* User/Account Tab */}
          <Link
            href={user ? "/account" : "/auth/login"}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-slate-600 hover:text-amber-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[11px] font-medium">{user ? "Hesap" : "Giriş"}</span>
          </Link>
        </div>
      </div>

      {/* Full Width Search Overlay - Shows when button clicked */}
      {showSearch && (
        <div className="border-t border-slate-200 bg-white shadow-lg">
          <div className="mx-auto max-w-6xl px-4 py-3 md:px-6 md:py-4 sm:px-10">
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
    </header>
  );
}
