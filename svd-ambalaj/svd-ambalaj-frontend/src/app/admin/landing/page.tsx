"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/admin-api";
import Image from "next/image";

// Types for landing content
interface HeroButton {
  text: string;
  href: string;
}

interface HeroStat {
  value: string;
  label: string;
}

interface HeroContent {
  badge: string;
  title: string;
  titleHighlight: string;
  description: string;
  primaryButton: HeroButton;
  secondaryButton: HeroButton;
  stats: HeroStat[];
}

interface AdvantageItem {
  icon: string;
  title: string;
  description: string;
  highlight: string;
}

interface HowItWorksCard {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  description: string;
  example: string;
}

interface HowItWorksContent {
  title: string;
  subtitle: string;
  cards: HowItWorksCard[];
}

interface CTAContent {
  title: string;
  description: string;
  primaryButton: HeroButton;
  secondaryButton: HeroButton;
}

interface TrustBadge {
  icon: string;
  text: string;
}

interface SectionsContent {
  categoriesTitle: string;
  categoriesSubtitle: string;
  productsTitle: string;
  productsSubtitle: string;
}

interface LandingContent {
  hero: HeroContent;
  advantages: AdvantageItem[];
  howItWorks: HowItWorksContent;
  cta: CTAContent;
  trustBadges: TrustBadge[];
  sections: SectionsContent;
  featuredProducts: string[];
  sectionOrder: string[];
  updatedAt?: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  images?: string[];
  image?: string;
  priceUSD?: number;
}

type TabType = "hero" | "advantages" | "howItWorks" | "cta" | "trustBadges" | "sections" | "featuredProducts" | "sectionOrder";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "sectionOrder", label: "Sıralama", icon: "↕️" },
  { id: "featuredProducts", label: "Öne Çıkan Ürünler", icon: "🏷️" },
  { id: "hero", label: "Hero", icon: "🏠" },
  { id: "advantages", label: "Avantajlar", icon: "⭐" },
  { id: "howItWorks", label: "Nasıl Çalışır", icon: "📋" },
  { id: "cta", label: "CTA", icon: "📢" },
  { id: "trustBadges", label: "Güven Rozetleri", icon: "🏆" },
  { id: "sections", label: "Bölüm Başlıkları", icon: "📝" },
];

const DEFAULT_SECTION_ORDER = ["hero", "advantages", "categories", "howItWorks", "products", "cta", "trustBadges"];

const SECTION_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  hero: { label: "Hero", icon: "🏠", description: "Ana banner ve başlık alanı" },
  advantages: { label: "Avantajlar Şeridi", icon: "⭐", description: "4 avantaj kartı" },
  categories: { label: "Kategoriler", icon: "📦", description: "Ürün kategorileri" },
  howItWorks: { label: "Nasıl Çalışır", icon: "📋", description: "Bilgi kartları" },
  products: { label: "Öne Çıkan Ürünler", icon: "🏷️", description: "Seçili ürünler" },
  cta: { label: "CTA", icon: "📢", description: "Harekete geçirici alan" },
  trustBadges: { label: "Güven Rozetleri", icon: "🏆", description: "Alt şerit" },
};

// Predefined options
const EMOJI_CATEGORIES = {
  business: ["💼", "📊", "📈", "💰", "🏭", "🏢"],
  shipping: ["🚚", "📦", "✈️", "🚀", "⏰", "📬"],
  quality: ["✅", "🏆", "⭐", "🎯", "💎", "🔒"],
  communication: ["📞", "💬", "📧", "🤝", "👥", "💡"],
  discount: ["🔄", "💳", "🎁", "🎉", "💸", "🏷️"],
  global: ["🌍", "🌎", "🌏", "🗺️", "✨", "🔥"],
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

const COLOR_OPTIONS = [
  { id: "amber", label: "Sarı", preview: "bg-amber-500" },
  { id: "blue", label: "Mavi", preview: "bg-blue-500" },
  { id: "green", label: "Yeşil", preview: "bg-green-500" },
  { id: "red", label: "Kırmızı", preview: "bg-red-500" },
  { id: "purple", label: "Mor", preview: "bg-purple-500" },
];

// Predefined button link options
const BUTTON_LINK_OPTIONS = [
  { value: "/products", label: "Ürünler Sayfası" },
  { value: "/categories", label: "Kategoriler Sayfası" },
  { value: "/cart", label: "Sepet / Teklif Al" },
  { value: "/auth/register", label: "Kayıt Ol" },
  { value: "/auth/login", label: "Giriş Yap" },
  { value: "mailto:info@svdambalaj.com", label: "E-posta Gönder" },
  { value: "tel:+902125551234", label: "Telefon Et" },
  { value: "custom", label: "Özel Link..." },
];

// Predefined advantage templates
const ADVANTAGE_TEMPLATES = [
  { icon: "🔄", title: "Kombo İndirimi", description: "Başlık + Şişe birlikte alana indirim", highlight: "%10" },
  { icon: "📦", title: "Toplu Alım Avantajı", description: "Adet arttıkça birim fiyat düşer", highlight: "Kademeli" },
  { icon: "🚚", title: "Ücretsiz Kargo", description: "Belirli tutarın üzerinde ücretsiz kargo", highlight: "Ücretsiz" },
  { icon: "💳", title: "Güvenli Ödeme", description: "Kredi kartı ve havale ile ödeme", highlight: "3D Secure" },
  { icon: "⏰", title: "Hızlı Teslimat", description: "24 saat içinde kargoya teslim", highlight: "24 Saat" },
  { icon: "🔒", title: "Güvenli Alışveriş", description: "256-bit SSL güvenlik sertifikası", highlight: "SSL" },
  { icon: "🏆", title: "Kalite Garantisi", description: "ISO sertifikalı ürünler", highlight: "ISO 9001" },
  { icon: "📞", title: "7/24 Destek", description: "Her zaman yanınızdayız", highlight: "Canlı" },
];

// Predefined trust badge templates
const TRUST_BADGE_TEMPLATES = [
  { icon: "🏭", text: "1998'den Beri" },
  { icon: "🌍", text: "24 Ülkeye İhracat" },
  { icon: "✅", text: "ISO 9001:2015" },
  { icon: "🔒", text: "Güvenli Ödeme" },
  { icon: "📞", text: "7/24 Destek" },
  { icon: "🚚", text: "Hızlı Kargo" },
  { icon: "💳", text: "Taksit İmkanı" },
  { icon: "🏆", text: "Müşteri Memnuniyeti" },
  { icon: "📦", text: "Stokta Hazır" },
  { icon: "🎁", text: "Hediye Paketleme" },
];

// Predefined How It Works card templates
const HOW_IT_WORKS_TEMPLATES = [
  {
    icon: "🔄",
    color: "amber",
    title: "Kombo İndirimi",
    subtitle: "%10 Anında İndirim",
    description: "Aynı ağız ölçüsüne sahip başlık + şişe birlikte aldığınızda otomatik indirim!",
    example: "24/410 başlık + 24/410 şişe = Her iki üründe %10 indirim",
  },
  {
    icon: "📊",
    color: "blue",
    title: "Kademeli Fiyat",
    subtitle: "Çok Al Az Öde",
    description: "Sipariş miktarı arttıkça birim fiyat düşer.",
    example: "5 koli = ₺2.50/adet → 20 koli = ₺2.10/adet",
  },
  {
    icon: "🚚",
    color: "green",
    title: "Kargo Koşulları",
    subtitle: "50.000+ Adet Ücretsiz",
    description: "50.000 adet ve üzeri siparişlerde ücretsiz kargo.",
    example: "Altında: Koli başına ₺120 kargo ücreti",
  },
  {
    icon: "💳",
    color: "purple",
    title: "Ödeme Seçenekleri",
    subtitle: "Esnek Ödeme",
    description: "Kredi kartı, havale veya kapıda ödeme seçenekleri.",
    example: "6 taksit imkanı mevcut",
  },
];

export default function AdminLandingPage() {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("sectionOrder");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadContent();
    loadProducts();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch<{ content: LandingContent }>("/landing-content");
      // Ensure defaults for new fields
      const contentWithDefaults = {
        ...response.content,
        featuredProducts: response.content.featuredProducts ?? [],
        sectionOrder: response.content.sectionOrder ?? DEFAULT_SECTION_ORDER,
      };
      setContent(contentWithDefaults);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiFetch<{ products: Product[] }>("/products");
      setProducts(response.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const handleSave = async () => {
    if (!content) return;

    try {
      setSaving(true);
      setError(null);
      await apiFetch("/admin/landing-content", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      setSuccess("Değişiklikler başarıyla kaydedildi!");
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (section?: string) => {
    if (!confirm(section ? `${section} bölümünü varsayılana sıfırlamak istediğinize emin misiniz?` : "Tüm içeriği varsayılana sıfırlamak istediğinize emin misiniz?")) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await apiFetch<{ content: LandingContent }>("/admin/landing-content/reset", {
        method: "POST",
        body: JSON.stringify({ section }),
      });
      setContent(response.content);
      setSuccess(section ? `${section} varsayılana sıfırlandı` : "Tüm içerik varsayılana sıfırlandı");
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updateContent = <K extends keyof LandingContent>(key: K, value: LandingContent[K]) => {
    if (!content) return;
    setContent({ ...content, [key]: value });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <span className="ml-3 text-slate-600">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700">İçerik yüklenemedi. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Anasayfa İçerik Yönetimi</h1>
            <p className="mt-1 text-sm text-slate-600">
              Ana sayfanın tüm bölümlerini buradan düzenleyebilirsiniz
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleReset()}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Tümü Sıfırla
            </button>
            <button
              onClick={loadContent}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Yenile
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : hasChanges ? "Kaydet ✓" : "Kaydet"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {content.updatedAt && (
          <p className="mt-4 text-xs text-slate-500">
            Son güncelleme: {new Date(content.updatedAt).toLocaleString("tr-TR")}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-6 py-4 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-amber-500 text-amber-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "hero" && (
            <HeroEditor hero={content.hero} onChange={(hero) => updateContent("hero", hero)} />
          )}
          {activeTab === "advantages" && (
            <AdvantagesEditor advantages={content.advantages} onChange={(advantages) => updateContent("advantages", advantages)} />
          )}
          {activeTab === "howItWorks" && (
            <HowItWorksEditor howItWorks={content.howItWorks} onChange={(howItWorks) => updateContent("howItWorks", howItWorks)} />
          )}
          {activeTab === "cta" && (
            <CTAEditor cta={content.cta} onChange={(cta) => updateContent("cta", cta)} />
          )}
          {activeTab === "trustBadges" && (
            <TrustBadgesEditor badges={content.trustBadges} onChange={(badges) => updateContent("trustBadges", badges)} />
          )}
          {activeTab === "sections" && (
            <SectionsEditor sections={content.sections} onChange={(sections) => updateContent("sections", sections)} />
          )}
          {activeTab === "featuredProducts" && (
            <FeaturedProductsEditor
              selectedIds={content.featuredProducts}
              products={products}
              onChange={(ids) => updateContent("featuredProducts", ids)}
            />
          )}
          {activeTab === "sectionOrder" && (
            <SectionOrderEditor
              order={content.sectionOrder}
              onChange={(order) => updateContent("sectionOrder", order)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== REUSABLE COMPONENTS ====================

function EmojiPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {label && <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-xl hover:bg-slate-50"
      >
        {value}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <div className="grid grid-cols-6 gap-1">
              {ALL_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onChange(emoji);
                    setIsOpen(false);
                  }}
                  className={`rounded p-1.5 text-xl hover:bg-slate-100 ${value === emoji ? "bg-amber-100" : ""}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div>
      {label && <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>}
      <div className="flex gap-2">
        {COLOR_OPTIONS.map((color) => (
          <button
            key={color.id}
            onClick={() => onChange(color.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${color.preview} ${
              value === color.id ? "ring-2 ring-offset-2 ring-slate-900" : ""
            }`}
            title={color.label}
          >
            {value === color.id && <span className="text-white text-xs">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function LinkSelector({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [isCustom, setIsCustom] = useState(!BUTTON_LINK_OPTIONS.find((o) => o.value === value && o.value !== "custom"));
  const selectedOption = BUTTON_LINK_OPTIONS.find((o) => o.value === value);

  return (
    <div>
      {label && <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>}
      <div className="flex gap-2">
        <select
          value={isCustom ? "custom" : value}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setIsCustom(true);
            } else {
              setIsCustom(false);
              onChange(e.target.value);
            }
          }}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {BUTTON_LINK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isCustom && (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/custom-link"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        )}
      </div>
      {selectedOption && !isCustom && (
        <p className="mt-1 text-xs text-slate-500">Link: {value}</p>
      )}
    </div>
  );
}

function TemplateSelector<T extends Record<string, unknown>>({
  templates,
  onSelect,
  label,
  renderItem,
}: {
  templates: T[];
  onSelect: (t: T) => void;
  label: string;
  renderItem: (t: T) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
      >
        <span>📋</span>
        {label}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-80 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {templates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelect(template);
                  setIsOpen(false);
                }}
                className="w-full rounded-lg p-2 text-left hover:bg-slate-50"
              >
                {renderItem(template)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ==================== HERO EDITOR ====================
function HeroEditor({ hero, onChange }: { hero: HeroContent; onChange: (h: HeroContent) => void }) {
  const updateField = <K extends keyof HeroContent>(key: K, value: HeroContent[K]) => {
    onChange({ ...hero, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Hero Bölümü</h2>
          <p className="text-xs text-slate-500">Ana sayfa üst kısmı - ilk görünen alan</p>
        </div>
      </div>

      {/* Preview Card */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
          {hero.badge || "Badge"}
        </div>
        <h3 className="mt-3 text-xl font-bold">
          {hero.title || "Başlık"}
          <span className="block text-amber-400">{hero.titleHighlight || "Vurgu"}</span>
        </h3>
        <p className="mt-2 text-sm text-slate-300">{hero.description || "Açıklama..."}</p>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold">{hero.primaryButton.text}</span>
          <span className="rounded-full border border-white/30 px-3 py-1 text-xs">{hero.secondaryButton.text}</span>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Badge (Üst Etiket)</label>
          <input
            type="text"
            value={hero.badge}
            onChange={(e) => updateField("badge", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="B2B Ambalaj Çözümleri"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Başlık Vurgu (Renkli)</label>
          <input
            type="text"
            value={hero.titleHighlight}
            onChange={(e) => updateField("titleHighlight", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Toptan Satış"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Ana Başlık</label>
        <input
          type="text"
          value={hero.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Sprey, Pompa ve PET Şişe"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Açıklama</label>
        <textarea
          value={hero.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Kozmetik, temizlik ve kişisel bakım sektörü için..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Birincil Buton (Turuncu)</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={hero.primaryButton.text}
              onChange={(e) => updateField("primaryButton", { ...hero.primaryButton, text: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Buton metni"
            />
            <LinkSelector
              value={hero.primaryButton.href}
              onChange={(href) => updateField("primaryButton", { ...hero.primaryButton, href })}
              label="Buton Linki"
            />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">İkincil Buton (Şeffaf)</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={hero.secondaryButton.text}
              onChange={(e) => updateField("secondaryButton", { ...hero.secondaryButton, text: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Buton metni"
            />
            <LinkSelector
              value={hero.secondaryButton.href}
              onChange={(href) => updateField("secondaryButton", { ...hero.secondaryButton, href })}
              label="Buton Linki"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">Ek İstatistikler</h4>
          <button
            onClick={() => updateField("stats", [...hero.stats, { value: "", label: "" }])}
            className="text-xs font-medium text-amber-600 hover:text-amber-700"
          >
            + Yeni Ekle
          </button>
        </div>
        <p className="mb-2 text-xs text-slate-500">Ürün ve kategori sayıları otomatik eklenir</p>
        <div className="space-y-2">
          {hero.stats.map((stat, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={stat.value}
                onChange={(e) => {
                  const newStats = [...hero.stats];
                  newStats[index] = { ...stat, value: e.target.value };
                  updateField("stats", newStats);
                }}
                className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="24"
              />
              <input
                type="text"
                value={stat.label}
                onChange={(e) => {
                  const newStats = [...hero.stats];
                  newStats[index] = { ...stat, label: e.target.value };
                  updateField("stats", newStats);
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Ülkeye İhracat"
              />
              <button
                onClick={() => updateField("stats", hero.stats.filter((_, i) => i !== index))}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== ADVANTAGES EDITOR ====================
function AdvantagesEditor({ advantages, onChange }: { advantages: AdvantageItem[]; onChange: (a: AdvantageItem[]) => void }) {
  const updateItem = (index: number, updates: Partial<AdvantageItem>) => {
    const newAdvantages = [...advantages];
    newAdvantages[index] = { ...newAdvantages[index], ...updates };
    onChange(newAdvantages);
  };

  const addFromTemplate = (template: typeof ADVANTAGE_TEMPLATES[0]) => {
    onChange([...advantages, { ...template }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Avantajlar Şeridi</h2>
          <p className="text-xs text-slate-500">Hero altındaki 4 avantaj kartı</p>
        </div>
        <div className="flex gap-2">
          <TemplateSelector
            templates={ADVANTAGE_TEMPLATES}
            onSelect={addFromTemplate}
            label="Şablondan Ekle"
            renderItem={(t) => (
              <div className="flex items-center gap-2">
                <span className="text-lg">{t.icon}</span>
                <div>
                  <div className="font-medium text-sm">{t.title}</div>
                  <div className="text-xs text-slate-500">{t.highlight}</div>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {advantages.map((item, index) => (
          <div key={index} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <EmojiPicker value={item.icon} onChange={(icon) => updateItem(index, { icon })} />
                <div>
                  <div className="font-semibold text-slate-900">{item.title || "Başlık"}</div>
                  <div className="text-xs text-amber-600">{item.highlight || "Vurgu"}</div>
                </div>
              </div>
              <button
                onClick={() => onChange(advantages.filter((_, i) => i !== index))}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Sil
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Başlık"
              />
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Açıklama"
              />
              <input
                type="text"
                value={item.highlight}
                onChange={(e) => updateItem(index, { highlight: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Vurgu etiketi (örn: %10)"
              />
            </div>
          </div>
        ))}
      </div>

      {advantages.length < 4 && (
        <p className="text-center text-xs text-slate-500">
          {4 - advantages.length} adet daha ekleyebilirsiniz (önerilen: 4 adet)
        </p>
      )}
    </div>
  );
}

// ==================== HOW IT WORKS EDITOR ====================
function HowItWorksEditor({ howItWorks, onChange }: { howItWorks: HowItWorksContent; onChange: (h: HowItWorksContent) => void }) {
  const updateCard = (index: number, updates: Partial<HowItWorksCard>) => {
    const newCards = [...howItWorks.cards];
    newCards[index] = { ...newCards[index], ...updates };
    onChange({ ...howItWorks, cards: newCards });
  };

  const addFromTemplate = (template: typeof HOW_IT_WORKS_TEMPLATES[0]) => {
    onChange({ ...howItWorks, cards: [...howItWorks.cards, { ...template }] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Nasıl Çalışır Bölümü</h2>
          <p className="text-xs text-slate-500">Fiyatlandırma ve avantaj kartları</p>
        </div>
        <TemplateSelector
          templates={HOW_IT_WORKS_TEMPLATES}
          onSelect={addFromTemplate}
          label="Şablondan Ekle"
          renderItem={(t) => (
            <div className="flex items-center gap-2">
              <span className="text-lg">{t.icon}</span>
              <div>
                <div className="font-medium text-sm">{t.title}</div>
                <div className="text-xs text-slate-500">{t.subtitle}</div>
              </div>
            </div>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Bölüm Başlığı</label>
          <input
            type="text"
            value={howItWorks.title}
            onChange={(e) => onChange({ ...howItWorks, title: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Alt Başlık</label>
          <input
            type="text"
            value={howItWorks.subtitle}
            onChange={(e) => onChange({ ...howItWorks, subtitle: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {howItWorks.cards.map((card, index) => (
          <div key={index} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <EmojiPicker value={card.icon} onChange={(icon) => updateCard(index, { icon })} />
                <ColorPicker value={card.color} onChange={(color) => updateCard(index, { color })} />
              </div>
              <button
                onClick={() => onChange({ ...howItWorks, cards: howItWorks.cards.filter((_, i) => i !== index) })}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Kartı Sil
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={card.title}
                onChange={(e) => updateCard(index, { title: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Kart Başlığı"
              />
              <input
                type="text"
                value={card.subtitle}
                onChange={(e) => updateCard(index, { subtitle: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Alt Başlık (Vurgu)"
              />
              <textarea
                value={card.description}
                onChange={(e) => updateCard(index, { description: e.target.value })}
                rows={2}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Açıklama metni"
              />
              <input
                type="text"
                value={card.example}
                onChange={(e) => updateCard(index, { example: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Örnek: 5 koli = ₺2.50/adet"
              />
            </div>

            {/* Preview */}
            <div className={`mt-3 rounded-lg border p-3 border-${card.color}-200 bg-${card.color}-50`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{card.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{card.title}</div>
                  <div className={`text-xs text-${card.color}-600`}>{card.subtitle}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {howItWorks.cards.length < 3 && (
        <p className="text-center text-xs text-slate-500">
          {3 - howItWorks.cards.length} adet daha ekleyebilirsiniz (önerilen: 3 adet)
        </p>
      )}
    </div>
  );
}

// ==================== CTA EDITOR ====================
function CTAEditor({ cta, onChange }: { cta: CTAContent; onChange: (c: CTAContent) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">CTA (Call to Action) Bölümü</h2>
        <p className="text-xs text-slate-500">Turuncu şerit - harekete geçirici alan</p>
      </div>

      {/* Preview */}
      <div className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
        <h3 className="text-lg font-bold">{cta.title || "Başlık"}</h3>
        <p className="mt-1 text-sm text-amber-100">{cta.description || "Açıklama"}</p>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-600">
            {cta.primaryButton.text}
          </span>
          <span className="rounded-full border border-white px-3 py-1 text-xs text-white">
            {cta.secondaryButton.text}
          </span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Başlık</label>
        <input
          type="text"
          value={cta.title}
          onChange={(e) => onChange({ ...cta, title: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Açıklama</label>
        <textarea
          value={cta.description}
          onChange={(e) => onChange({ ...cta, description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Birincil Buton (Beyaz)</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={cta.primaryButton.text}
              onChange={(e) => onChange({ ...cta, primaryButton: { ...cta.primaryButton, text: e.target.value } })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Buton metni"
            />
            <LinkSelector
              value={cta.primaryButton.href}
              onChange={(href) => onChange({ ...cta, primaryButton: { ...cta.primaryButton, href } })}
              label="Buton Linki"
            />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">İkincil Buton (Şeffaf)</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={cta.secondaryButton.text}
              onChange={(e) => onChange({ ...cta, secondaryButton: { ...cta.secondaryButton, text: e.target.value } })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Buton metni"
            />
            <LinkSelector
              value={cta.secondaryButton.href}
              onChange={(href) => onChange({ ...cta, secondaryButton: { ...cta.secondaryButton, href } })}
              label="Buton Linki"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TRUST BADGES EDITOR ====================
function TrustBadgesEditor({ badges, onChange }: { badges: TrustBadge[]; onChange: (b: TrustBadge[]) => void }) {
  const addFromTemplate = (template: typeof TRUST_BADGE_TEMPLATES[0]) => {
    // Check if already exists
    if (badges.some((b) => b.text === template.text)) {
      return;
    }
    onChange([...badges, { ...template }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Güven Rozetleri</h2>
          <p className="text-xs text-slate-500">Sayfa altındaki güven şeridi</p>
        </div>
      </div>

      {/* Quick Add Badges */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Hızlı Ekle (tıklayarak seçin)</label>
        <div className="flex flex-wrap gap-2">
          {TRUST_BADGE_TEMPLATES.map((template, idx) => {
            const isAdded = badges.some((b) => b.text === template.text);
            return (
              <button
                key={idx}
                onClick={() => !isAdded && addFromTemplate(template)}
                disabled={isAdded}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
                  isAdded
                    ? "bg-green-100 text-green-700 cursor-default"
                    : "bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-700"
                }`}
              >
                <span>{template.icon}</span>
                <span>{template.text}</span>
                {isAdded && <span className="ml-1">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Önizleme:</p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-lg">{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Badges */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Eklenen Rozetler (düzenle veya sil)</label>
        <div className="space-y-2">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
              <EmojiPicker
                value={badge.icon}
                onChange={(icon) => {
                  const newBadges = [...badges];
                  newBadges[index] = { ...badge, icon };
                  onChange(newBadges);
                }}
              />
              <input
                type="text"
                value={badge.text}
                onChange={(e) => {
                  const newBadges = [...badges];
                  newBadges[index] = { ...badge, text: e.target.value };
                  onChange(newBadges);
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                placeholder="Metin"
              />
              <button
                onClick={() => onChange(badges.filter((_, i) => i !== index))}
                className="rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onChange([...badges, { icon: "✅", text: "" }])}
        className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        + Özel Rozet Ekle
      </button>
    </div>
  );
}

// ==================== FEATURED PRODUCTS EDITOR ====================
function FeaturedProductsEditor({
  selectedIds,
  products,
  onChange,
}: {
  selectedIds: string[];
  products: Product[];
  onChange: (ids: string[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProduct = (productId: string) => {
    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter((id) => id !== productId));
    } else {
      onChange([...selectedIds, productId]);
    }
  };

  const moveProduct = (index: number, direction: "up" | "down") => {
    const newIds = [...selectedIds];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newIds.length) return;
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    onChange(newIds);
  };

  const selectedProducts = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Öne Çıkan Ürünler</h2>
        <p className="text-xs text-slate-500">
          Anasayfada gösterilecek ürünleri seçin. Boş bırakılırsa ilk 8 ürün gösterilir.
        </p>
      </div>

      {/* Selected Products Preview */}
      {selectedIds.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-800">
              Seçili Ürünler ({selectedIds.length})
            </h3>
            <button
              onClick={() => onChange([])}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Tümünü Kaldır
            </button>
          </div>
          <div className="space-y-2">
            {selectedProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveProduct(index, "up")}
                    disabled={index === 0}
                    className="rounded px-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveProduct(index, "down")}
                    disabled={index === selectedIds.length - 1}
                    className="rounded px-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                  {index + 1}
                </span>
                {(product.images?.[0] || product.image) && (
                  <Image
                    src={product.images?.[0] || product.image || ""}
                    alt={product.title}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-cover"
                    unoptimized
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {product.title}
                  </div>
                  <div className="text-xs text-slate-500">{product.slug}</div>
                </div>
                <button
                  onClick={() => toggleProduct(product.id)}
                  className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Product List */}
      <div>
        <div className="mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ürün ara..."
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
        </div>

        <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {products.length === 0 ? "Ürün bulunamadı" : "Arama sonucu yok"}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`flex w-full items-center gap-3 p-3 text-left transition hover:bg-slate-50 ${
                      isSelected ? "bg-amber-50" : ""
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                        isSelected
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && <span className="text-xs">✓</span>}
                    </div>
                    {(product.images?.[0] || product.image) && (
                      <Image
                        src={product.images?.[0] || product.image || ""}
                        alt={product.title}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg object-cover"
                        unoptimized
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {product.title}
                      </div>
                      <div className="text-xs text-slate-500">{product.slug}</div>
                    </div>
                    {isSelected && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        #{selectedIds.indexOf(product.id) + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        İpucu: Ürünleri sürükleyerek veya ok tuşlarıyla sıralayabilirsiniz
      </p>
    </div>
  );
}

// ==================== SECTION ORDER EDITOR ====================
function SectionOrderEditor({
  order,
  onChange,
}: {
  order: string[];
  onChange: (order: string[]) => void;
}) {
  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...order];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    onChange(newOrder);
  };

  const resetToDefault = () => {
    onChange(DEFAULT_SECTION_ORDER);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Bölüm Sıralaması</h2>
          <p className="text-xs text-slate-500">
            Anasayfadaki bölümlerin sırasını yukarı/aşağı okları ile değiştirin
          </p>
        </div>
        <button
          onClick={resetToDefault}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Varsayılana Dön
        </button>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Önizleme (Yukarıdan Aşağıya)</p>
        <div className="flex flex-wrap gap-2">
          {order.map((sectionId, idx) => {
            const section = SECTION_LABELS[sectionId];
            return (
              <span
                key={sectionId}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm shadow-sm"
              >
                <span className="text-slate-400">{idx + 1}.</span>
                <span>{section?.icon}</span>
                <span className="font-medium">{section?.label || sectionId}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Section List */}
      <div className="space-y-2">
        {order.map((sectionId, index) => {
          const section = SECTION_LABELS[sectionId];
          if (!section) return null;

          return (
            <div
              key={sectionId}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveSection(index, "up")}
                  disabled={index === 0}
                  className="rounded bg-slate-100 px-2 py-1 text-sm font-bold text-slate-600 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-600"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveSection(index, "down")}
                  disabled={index === order.length - 1}
                  className="rounded bg-slate-100 px-2 py-1 text-sm font-bold text-slate-600 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-600"
                >
                  ▼
                </button>
              </div>

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                {index + 1}
              </span>

              <span className="text-2xl">{section.icon}</span>

              <div className="flex-1">
                <div className="font-semibold text-slate-900">{section.label}</div>
                <div className="text-xs text-slate-500">{section.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-700">
          <strong>İpucu:</strong> Hero bölümü genellikle en üstte kalmalıdır. Trust Badges ve CTA
          bölümleri sayfanın alt kısımlarında daha etkilidir.
        </p>
      </div>
    </div>
  );
}

// ==================== SECTIONS EDITOR ====================
function SectionsEditor({ sections, onChange }: { sections: SectionsContent; onChange: (s: SectionsContent) => void }) {
  // Predefined titles
  const categoryTitleOptions = ["Kategoriler", "Ürün Kategorileri", "Kategorilerimiz", "Tüm Kategoriler"];
  const categorySubtitleOptions = [
    "İhtiyacınıza uygun ürünleri keşfedin",
    "Aradığınız ürünleri kolayca bulun",
    "Geniş ürün yelpazemizi inceleyin",
    "Size özel çözümler",
  ];
  const productTitleOptions = ["Öne Çıkan Ürünler", "Popüler Ürünler", "En Çok Satanlar", "Ürünlerimiz"];
  const productSubtitleOptions = [
    "En çok tercih edilen ürünlerimiz",
    "Müşterilerimizin favorileri",
    "Kaliteli ambalaj çözümleri",
    "Toptan fiyat avantajı",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Bölüm Başlıkları</h2>
        <p className="text-xs text-slate-500">Kategoriler ve ürünler bölümlerinin başlıkları</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Categories Section */}
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="mb-4 text-sm font-semibold text-slate-700">📦 Kategoriler Bölümü</h4>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Başlık</label>
              <select
                value={categoryTitleOptions.includes(sections.categoriesTitle) ? sections.categoriesTitle : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    onChange({ ...sections, categoriesTitle: e.target.value });
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {categoryTitleOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="custom">Özel...</option>
              </select>
              {!categoryTitleOptions.includes(sections.categoriesTitle) && (
                <input
                  type="text"
                  value={sections.categoriesTitle}
                  onChange={(e) => onChange({ ...sections, categoriesTitle: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Özel başlık"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Alt Başlık</label>
              <select
                value={categorySubtitleOptions.includes(sections.categoriesSubtitle) ? sections.categoriesSubtitle : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    onChange({ ...sections, categoriesSubtitle: e.target.value });
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {categorySubtitleOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="custom">Özel...</option>
              </select>
              {!categorySubtitleOptions.includes(sections.categoriesSubtitle) && (
                <input
                  type="text"
                  value={sections.categoriesSubtitle}
                  onChange={(e) => onChange({ ...sections, categoriesSubtitle: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Özel alt başlık"
                />
              )}
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-900">{sections.categoriesTitle}</div>
              <div className="text-xs text-slate-500">{sections.categoriesSubtitle}</div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="mb-4 text-sm font-semibold text-slate-700">🏷️ Ürünler Bölümü</h4>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Başlık</label>
              <select
                value={productTitleOptions.includes(sections.productsTitle) ? sections.productsTitle : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    onChange({ ...sections, productsTitle: e.target.value });
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {productTitleOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="custom">Özel...</option>
              </select>
              {!productTitleOptions.includes(sections.productsTitle) && (
                <input
                  type="text"
                  value={sections.productsTitle}
                  onChange={(e) => onChange({ ...sections, productsTitle: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Özel başlık"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Alt Başlık</label>
              <select
                value={productSubtitleOptions.includes(sections.productsSubtitle) ? sections.productsSubtitle : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    onChange({ ...sections, productsSubtitle: e.target.value });
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {productSubtitleOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="custom">Özel...</option>
              </select>
              {!productSubtitleOptions.includes(sections.productsSubtitle) && (
                <input
                  type="text"
                  value={sections.productsSubtitle}
                  onChange={(e) => onChange({ ...sections, productsSubtitle: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Özel alt başlık"
                />
              )}
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-900">{sections.productsTitle}</div>
              <div className="text-xs text-slate-500">{sections.productsSubtitle}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
