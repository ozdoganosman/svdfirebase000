"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { trackPurchase } from "@/components/google-analytics";
import { useCart } from "@/context/CartContext";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/svdfirebase000/us-central1/api";

// Bank account information
const BANK_ACCOUNTS = [
  { bank: "GARANTİ BANKASI - ELEKTROKENT ŞB.", iban: "TR64 0006 2001 4950 0006 2969 00" },
  { bank: "HALKBANK - D.EVLER ŞB.", iban: "TR29 0001 2009 3920 0010 2608 07" },
];

// Receipt Upload Component
function ReceiptUpload({ orderId, orderNumber }: { orderId: string | null; orderNumber?: string }) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Sadece resim (JPG, PNG) veya PDF dosyası yükleyebilirsiniz.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Dosya boyutu 10MB'dan küçük olmalıdır.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiBase}/orders/${orderId}/receipt`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Yükleme başarısız");

      setUploaded(true);
    } catch {
      setError("Dekont yüklenirken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="mt-3 flex items-center gap-2 text-green-600">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Dekont yüklendi!</span>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
        {uploading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
            <span>Yükleniyor...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Dekont Seç</span>
          </>
        )}
        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
      </label>
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}

const formatNow = () =>
  new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

type OrderStatus = "pending" | "pending_payment" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed";

interface OrderInfo {
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  orderNumber?: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");
  const orderNumber = searchParams.get("number");
  const total = searchParams.get("total");
  const tracked = useRef(false);
  const cartCleared = useRef(false);
  const redirected = useRef(false);
  const { clearCart } = useCart();

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);

  // Fetch order status to check payment
  useEffect(() => {
    const checkOrderStatus = async () => {
      if (!orderId) {
        setLoading(false);
        // No order ID - just clear cart (bank transfer direct redirect)
        if (!cartCleared.current) {
          clearCart();
          cartCleared.current = true;
        }
        return;
      }

      try {
        const response = await fetch(`${apiBase}/orders/${orderId}`);

        // API hatası durumunda yönlendirme yapma, sipariş oluşturulmuş olabilir
        if (!response.ok) {
          console.error("Error fetching order:", response.status);
          // Sipariş zaten oluşturulduğu için success sayfasını göster
          // URL parametrelerinden gelen bilgileri kullan
          if (!cartCleared.current) {
            clearCart();
            cartCleared.current = true;
          }
          return;
        }

        const data = await response.json();
        const order = data.order;

        // Sipariş verisi yoksa da success sayfasını göster
        if (!order) {
          console.error("Order data not found in response");
          if (!cartCleared.current) {
            clearCart();
            cartCleared.current = true;
          }
          return;
        }

        // GÜVENLIK: Ödeme başarısız veya sipariş iptal edildiyse failed sayfasına yönlendir
        if (order.paymentStatus === "failed" || order.status === "cancelled") {
          if (!redirected.current) {
            redirected.current = true;
            router.push(`/checkout/failed?orderId=${orderId}&reason=payment_failed`);
          }
          return;
        }

        setOrderInfo({
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          orderNumber: order.orderNumber,
        });

        // If credit card payment is still pending, show waiting message
        if (order.paymentMethod === "credit_card" && order.paymentStatus !== "paid") {
          setPaymentPending(true);
        } else {
          setPaymentPending(false);
        }

        // Clear cart if payment is successful or if it's bank transfer
        if (!cartCleared.current) {
          if (order.paymentMethod !== "credit_card" || order.paymentStatus === "paid") {
            clearCart();
            cartCleared.current = true;
          }
        }
      } catch (error) {
        console.error("Error fetching order status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkOrderStatus();

    // If payment pending, poll for status updates
    let pollInterval: NodeJS.Timeout | null = null;
    if (paymentPending) {
      pollInterval = setInterval(checkOrderStatus, 5000); // Check every 5 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderId, clearCart, paymentPending, router]);

  useEffect(() => {
    // Track purchase only once
    if (orderNumber && !tracked.current) {
      tracked.current = true;
      const totalAmount = total ? parseFloat(total) : 0;
      trackPurchase(orderNumber, totalAmount, []);
    }
  }, [orderNumber, total]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 lg:py-20 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Siparis durumu kontrol ediliyor...</p>
        </div>
      </main>
    );
  }

  // Payment pending state for credit card
  if (paymentPending && orderInfo?.paymentStatus !== "paid") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 lg:py-20 text-slate-900">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="rounded-2xl border border-amber-200 bg-white p-6 sm:p-10 text-center shadow-xl overflow-hidden relative">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-amber-100/50 blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-100/50 blur-3xl"></div>
            </div>

            <div className="relative">
              {/* Spinner Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-200/50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent"></div>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                <svg className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Odeme Bekleniyor
              </span>

              <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900">
                Odemeniz Isleniyor...
              </h1>

              {(orderNumber || orderInfo?.orderNumber) && (
                <div className="mt-6 inline-block rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white px-6 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Siparis Numarasi</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-amber-700">{orderNumber || orderInfo?.orderNumber}</p>
                </div>
              )}

              <p className="mt-6 text-base text-slate-600 max-w-md mx-auto">
                Kredi karti odemeniz isleniyor. Lutfen bu sayfadan ayrilmayin.
                Odeme onaylandiginda otomatik olarak yonlendirileceksiniz.
              </p>

              <div className="mt-8 rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-600 text-left">
                    Bu islem birkac dakika surebilir. Eger uzun sure beklerseniz,
                    siparisleriniz sayfasindan durumu kontrol edebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold transition-colors"
                >
                  Siparislerimi Goruntule
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Success state
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 lg:py-20 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="rounded-2xl border border-green-200 bg-white p-6 sm:p-10 text-center shadow-xl overflow-hidden relative">
          {/* Decorative Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-green-100/50 blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-green-100/50 blur-3xl"></div>
          </div>

          <div className="relative">
            {/* Success Icon with Animation */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30 animate-[bounce_1s_ease-in-out]">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {orderInfo?.paymentMethod === "credit_card" ? "Odeme Alindi" : "Siparis Talebi Gonderildi"}
            </span>

            <h1 className="mt-6 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              {orderInfo?.paymentMethod === "credit_card"
                ? "Odemeniz Basariyla Alindi!"
                : "Tesekkurler! Talebinizi aldik."}
            </h1>

            {(orderNumber || orderInfo?.orderNumber) && (
              <div className="mt-6 inline-block rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white px-6 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Siparis Numarasi</p>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-green-700">{orderNumber || orderInfo?.orderNumber}</p>
              </div>
            )}

            <p className="mt-6 text-base text-slate-600 max-w-md mx-auto">
              {orderInfo?.paymentMethod === "credit_card"
                ? `Siparisiniz onaylandi ve hazirlanmaya baslandi. Kargoya verildiginde size bilgi verecegiz.`
                : `Satis ekibimiz ${formatNow()} tarihli talebinizi inceleyecek ve odeme & teslimat seceneklerini paylasmak icin en kisa surede sizinle iletisime gececek.`}
            </p>

            {orderInfo?.paymentMethod === "credit_card" && (
              <div className="mt-6 rounded-xl bg-green-50 border border-green-100 p-4">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Odeme Durumu: Basarili</span>
                </div>
              </div>
            )}

            {orderInfo?.paymentMethod !== "credit_card" && (
              <>
                {/* IBAN Bilgileri */}
                <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-5 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-semibold text-amber-800">Banka Hesap Bilgileri</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    {BANK_ACCOUNTS.map((account, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-amber-100">
                        <p className="font-medium text-slate-700">{account.bank}</p>
                        <p className="font-mono text-slate-900 mt-1 text-xs sm:text-sm">{account.iban}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-700 mt-3">
                    Aciklama kismina siparis numaranizi (<strong>{orderNumber || orderInfo?.orderNumber}</strong>) yaziniz.
                  </p>
                </div>

                {/* Dekont Yukleme */}
                <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-5">
                  <div className="flex items-start gap-3 text-left">
                    <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800">Dekont Yukleyin</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Odemenizi yaptiktan sonra dekontunuzu buraya yukleyin. Siparisiniz daha hizli onaylanacaktir.
                      </p>
                      <ReceiptUpload orderId={orderId} orderNumber={orderNumber || orderInfo?.orderNumber} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-500/30 transition-all hover:from-green-600 hover:to-green-700 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Alisverise Devam Et
              </Link>
              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-green-500 px-6 py-3.5 text-sm font-semibold text-green-600 transition-all hover:bg-green-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Siparislerimi Goruntule
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-10 pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Sorulariniz icin{" "}
                <a href="mailto:destek@svdambalaj.com" className="text-green-600 hover:text-green-700 font-medium">
                  destek@svdambalaj.com
                </a>{" "}
                adresinden bize ulasabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 lg:py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-solid border-green-600 border-r-transparent"></div>
          </div>
          <p className="mt-4 text-slate-600">Yukleniyor...</p>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
