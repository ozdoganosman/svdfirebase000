"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);

export default function CartPage() {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    subtotal,
    totalBoxes,
    totalItems,
    getEffectivePrice,
    getAppliedTier,
    getNextTier,
    calculateItemTotal,
    getTotalItemCount
  } = useCart();

  const handleQuantityChange = (productId: string, value: string, packageInfo?: { itemsPerBox: number; minBoxes: number; boxLabel: string }) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    // Enforce minimum boxes if packageInfo exists
    if (packageInfo && parsed < packageInfo.minBoxes) {
      return;
    }
    updateQuantity(productId, parsed);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
              Sepetiniz
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Siparişinizi tamamlamaya hazırsınız</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Ürün adetlerini güncelleyebilir, istediğiniz ürünleri çıkarabilir ve siparişinizi tamamlamak için ödeme adımına geçebilirsiniz.
            </p>
          </div>
          <Link
            href="/checkout"
            className="inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600"
          >
            Siparişi Tamamla
          </Link>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
                Sepetiniz boş. Ürünleri incelemek için
                <Link href="/" className="font-semibold text-amber-600 hover:underline">
                  {" "}anasayfaya dönün.
                </Link>
              </div>
            )}

            {items.map((item) => {
              const effectivePrice = getEffectivePrice(item);
              const appliedTier = getAppliedTier(item);
              const nextTier = getNextTier(item);
              const itemTotal = calculateItemTotal(item);
              const totalItemCount = getTotalItemCount(item);
              const savings = item.packageInfo 
                ? (item.price - effectivePrice) * totalItemCount
                : (item.price - effectivePrice) * item.quantity;

              return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                      {item.packageInfo && (
                        <p className="mt-1 text-xs text-slate-500">
                          📦 {item.packageInfo.itemsPerBox} adet/{item.packageInfo.boxLabel.toLowerCase()}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                    >
                      Kaldır
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        {item.packageInfo ? 'Birim Fiyat' : 'Fiyat'}
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatCurrency(effectivePrice)}
                        {effectivePrice < item.price && (
                          <span className="ml-2 text-xs text-green-600 line-through">
                            {formatCurrency(item.price)}
                          </span>
                        )}
                      </p>
                    </div>
                    {item.packageInfo && (
                      <div>
                        <p className="text-xs text-slate-500">
                          {item.packageInfo.boxLabel} Fiyatı
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {formatCurrency(effectivePrice * item.packageInfo.itemsPerBox)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="text-sm font-semibold text-slate-700">
                      {item.packageInfo ? `${item.packageInfo.boxLabel} Sayısı` : 'Adet'}
                      <input
                        type="number"
                        min={item.packageInfo?.minBoxes || 1}
                        value={item.quantity}
                        onChange={(event) => handleQuantityChange(item.id, event.target.value, item.packageInfo)}
                        className="ml-3 w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      />
                    </label>
                    {item.packageInfo && (
                      <p className="text-xs text-slate-500">
                        = {totalItemCount.toLocaleString('tr-TR')} adet
                      </p>
                    )}
                  </div>

                  {appliedTier && (
                    <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                      ✅ Toplu alım indirimi uygulandı! ({appliedTier.minQty}+ {item.packageInfo?.boxLabel.toLowerCase() || 'adet'})
                      {savings > 0 && ` - ${formatCurrency(savings)} tasarruf`}
                    </div>
                  )}

                  {nextTier && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      💡 {nextTier.minQty - item.quantity} {item.packageInfo?.boxLabel.toLowerCase() || 'adet'} daha ekleyin, 
                      birim fiyat {formatCurrency(nextTier.price)} olsun!
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-700">Toplam</span>
                  <span className="text-xl font-bold text-amber-600">
                    {formatCurrency(itemTotal)}
                  </span>
                </div>
              </div>
              );
            })}
          </div>

          <aside className="rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-800">Sipariş Özeti</h2>
            <dl className="mt-6 space-y-3 text-sm">
              {totalBoxes > 0 && (
                <div className="flex items-center justify-between text-slate-700">
                  <dt>Toplam Koli</dt>
                  <dd className="font-semibold">{totalBoxes.toLocaleString('tr-TR')}</dd>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-700">
                <dt>Toplam Ürün</dt>
                <dd className="font-semibold">{totalItems.toLocaleString('tr-TR')} adet</dd>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <dt>Ara toplam</dt>
                <dd className="font-semibold">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <dt>KDV (%20)</dt>
                <dd>{formatCurrency(subtotal * 0.20)}</dd>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <dt>Kargo</dt>
                <dd>Teklifte belirtilecek</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-amber-100 pt-4">
              <div className="flex items-center justify-between text-base font-bold text-amber-700">
                <span>Toplam (KDV Dahil)</span>
                <span>{formatCurrency(subtotal * 1.20)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                KDV hariç: {formatCurrency(subtotal)}
              </p>
            </div>
            <Link
              href="/checkout"
              className="mt-6 block rounded-full bg-amber-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600"
            >
              Siparişe Devam Et
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
