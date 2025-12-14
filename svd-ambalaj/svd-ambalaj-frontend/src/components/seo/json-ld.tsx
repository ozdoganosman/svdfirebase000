/**
 * JSON-LD Structured Data Components for SEO
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spreyvalfdunyasi.com";

// Organization Schema
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sprey Valf Dünyası",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "Türkiye'nin en geniş sprey valf ve ambalaj ürünleri yelpazesi",
    address: {
      "@type": "PostalAddress",
      addressCountry: "TR",
      addressLocality: "İstanbul",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-507-607-8906",
      contactType: "customer service",
      availableLanguage: "Turkish",
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// WebSite Schema with SearchAction
export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sprey Valf Dünyası",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Product Schema
type BulkPriceTier = {
  minQty: number;
  price: number;
};

type ProductJsonLdProps = {
  name: string;
  description: string;
  image: string;
  slug: string;
  price?: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  sku?: string;
  category?: string;
  bulkPricing?: BulkPriceTier[];
};

export function ProductJsonLd({
  name,
  description,
  image,
  slug,
  price,
  priceCurrency = "TRY",
  availability = "InStock",
  sku,
  category,
  bulkPricing,
}: ProductJsonLdProps) {
  // If bulk pricing exists, use AggregateOffer
  const hasMultiplePrices = bulkPricing && bulkPricing.length > 0;
  const lowestPrice = hasMultiplePrices
    ? Math.min(price || Infinity, ...bulkPricing.map(t => t.price))
    : price;
  const highestPrice = hasMultiplePrices
    ? Math.max(price || 0, ...bulkPricing.map(t => t.price))
    : price;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image.startsWith("http") ? image : `${siteUrl}${image}`,
    url: `${siteUrl}/products/${slug}`,
    sku: sku || slug,
    category,
    brand: {
      "@type": "Brand",
      name: "Sprey Valf Dünyası",
    },
    ...(hasMultiplePrices && lowestPrice && highestPrice ? {
      offers: {
        "@type": "AggregateOffer",
        lowPrice: lowestPrice.toFixed(2),
        highPrice: highestPrice.toFixed(2),
        priceCurrency,
        offerCount: (bulkPricing?.length || 0) + 1,
        availability: `https://schema.org/${availability}`,
        seller: {
          "@type": "Organization",
          name: "Sprey Valf Dünyası",
        },
      },
    } : price ? {
      offers: {
        "@type": "Offer",
        price: price.toFixed(2),
        priceCurrency,
        availability: `https://schema.org/${availability}`,
        seller: {
          "@type": "Organization",
          name: "Sprey Valf Dünyası",
        },
      },
    } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// BreadcrumbList Schema
type BreadcrumbItem = {
  name: string;
  url: string;
};

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// LocalBusiness Schema
export function LocalBusinessJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Sprey Valf Dünyası",
    image: `${siteUrl}/logo.png`,
    url: siteUrl,
    telephone: "+90-507-607-8906",
    priceRange: "₺₺",
    address: {
      "@type": "PostalAddress",
      addressCountry: "TR",
      addressLocality: "İstanbul",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// FAQPage Schema
type FAQItem = {
  question: string;
  answer: string;
};

export function FAQJsonLd({ items }: { items: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
