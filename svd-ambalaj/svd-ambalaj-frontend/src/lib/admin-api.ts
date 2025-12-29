const DEFAULT_API_BASE = "http://localhost:5001/svdfirebase000/us-central1/api";
const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

type ApiOptions = RequestInit & { parseJson?: boolean };
type UnauthorizedHandler = () => void;

const PATH_ALIASES: Record<string, string> = {
  "/stats/overview": "/orders/stats/overview",
  "/samples": "/sample-requests",
};

let adminAuthToken: string | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

// Note: keep type space minimal; remove unused aliases to satisfy lint

const isBrowser = typeof window !== "undefined";

const normalizeBase = (base: string): string => base.replace(/\/$/, "");

function selectApiBase(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_ADMIN_API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_BASE,
    process.env.NEXT_PUBLIC_FUNCTIONS_URL,
    process.env.ADMIN_API_URL,
  ].filter((value): value is string => Boolean(value && value.trim()));

  for (const candidate of candidates) {
    try {
      // If running in the browser on a non-localhost host, avoid honoring
      // candidates that explicitly point to localhost/127.0.0.1. This prevents
      // deployed sites from attempting to call a developer's local functions
      // emulator (eg. http://localhost:5001) which would cause
      // ERR_CONNECTION_REFUSED in users' browsers.
      if (isBrowser && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const isRunningOnLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
        const candidateIsLocalhost = /^https?:\/\/(?:localhost|127(?:\.0){0,2}\.1)(:\d+)?\//i.test(candidate);
        if (!isRunningOnLocalHost && candidateIsLocalhost) {
          // skip this candidate since we're in production (not localhost)
          continue;
        }
      }

      if (ABSOLUTE_URL_REGEX.test(candidate)) {
        return normalizeBase(candidate);
      }
      if (isBrowser) {
        const absolute = new URL(candidate, window.location.origin);
        return normalizeBase(absolute.toString());
      }
    } catch (error) {
      console.warn("Admin API base parse error:", error);
    }
  }

  if (isBrowser) {
    return normalizeBase(`${window.location.origin}/api`);
  }

  return null;
}

export const resolveAdminApiBase = (): string => selectApiBase() ?? normalizeBase(DEFAULT_API_BASE);

export const resolveAdminApiOrigin = (): string => {
  try {
    return new URL(resolveAdminApiBase()).origin;
  } catch {
    return "";
  }
};

const mapPathAlias = (path: string): string => {
  if (!path || ABSOLUTE_URL_REGEX.test(path)) {
    return path;
  }
  const [rawPathname, search = ""] = path.split("?");
  const pathname = rawPathname.startsWith("/") ? rawPathname : `/${rawPathname}`;
  const aliased = PATH_ALIASES[pathname] ?? pathname;
  return `${aliased}${search ? `?${search}` : ""}`;
};

const resolveRequestUrl = (path: string): string => {
  if (!path) {
    return resolveAdminApiBase();
  }
  if (ABSOLUTE_URL_REGEX.test(path)) {
    return path;
  }
  const mapped = mapPathAlias(path);
  const base = resolveAdminApiBase();
  return `${base}${mapped.startsWith("/") ? mapped : `/${mapped}`}`;
};

export function setAdminAuthToken(token: string | null): void {
  adminAuthToken = token;
}

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

async function parseResponse<T>(response: Response, parseJson: boolean): Promise<T> {
  if (response.status === 401 || response.status === 403) {
    if (unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new Error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
  }

  if (!response.ok) {
    let message = `İstek başarısız oldu (${response.status})`;
    try {
      const data = await response.clone().json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
      const fallback = await response.text();
      if (fallback) {
        message = fallback;
      }
    }
    throw new Error(message);
  }

  if (!parseJson || response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const text = await response.text();
    return text as unknown as T;
  }

  return (await response.json()) as T;
}

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

const isHeadersInstance = (value: unknown): value is Headers =>
  typeof Headers !== "undefined" && value instanceof Headers;

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { parseJson = true, ...rest } = options;
  const requestInit: RequestInit = { ...rest };
  const headers = isHeadersInstance(rest.headers) ? rest.headers : new Headers(rest.headers ?? {});

  if (adminAuthToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${adminAuthToken}`);
  }

  if (requestInit.body && !isFormData(requestInit.body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if ([...headers.keys()].length > 0) {
    requestInit.headers = headers;
  }

  const url = resolveRequestUrl(path);
  const response = await fetch(url, requestInit);

  // Check for session expiry warning
  const isExpiring = response.headers.get("X-Session-Expiring");
  const expiresAt = response.headers.get("X-Session-Expires-At");
  
  if (isExpiring === "true" && expiresAt) {
    const remaining = Math.floor((Number(expiresAt) - Date.now()) / 1000 / 60);
    // Dispatch a custom event that the UI can listen for
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("session-expiring", { 
        detail: { 
          expiresInMinutes: remaining 
        }
      }));
    }
  }

  return parseResponse<T>(response, parseJson);
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }

  const normalized = url.trim();
  if (!normalized) {
    return "";
  }

  if (ABSOLUTE_URL_REGEX.test(normalized) || normalized.startsWith("data:") || normalized.startsWith("blob:")) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  const origin = resolveAdminApiOrigin();
  if (!origin) {
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }
  return normalized.startsWith("/") ? `${origin}${normalized}` : `${origin}/${normalized}`;
}

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productType?: string | null; // "başlık" | "şişe" | "nötr" | null
  createdAt?: string;
  updatedAt?: string;
};

export type AdminBulkPricingTier = {
  minQty: number;
  price: number;
};

export type AdminProduct = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  price?: number;
  priceUSD?: number;
  comboPriceUSD?: number;
  bulkPricing: AdminBulkPricingTier[];
  bulkPricingUSD?: AdminBulkPricingTier[];
  category: string;
  images: string[];
  stock: number;
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
  createdAt?: string;
  updatedAt?: string;
};

export type AdminMedia = {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  storageKey: string;
  checksum?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
};

export type LandingMediaHighlight = {
  title: string;
  caption: string;
  image: string;
};

export type LandingMedia = {
  id?: string;
  heroGallery: string[];
  heroVideo: {
    src: string;
    poster: string;
  };
  mediaHighlights: LandingMediaHighlight[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdminOrderItem = {
  id: string;
  title: string;
  quantity: number;
  price: number;
  subtotal: number;
  category?: string | null;
};

export type AdminOrder = {
  id: string;
  orderNumber?: string | null;
  exchangeRate?: number | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  customer: {
    id?: string;
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    taxNumber?: string;
    address?: string;
    city?: string;
    notes?: string;
  };
  items: AdminOrderItem[];
  totals: {
    subtotal: number;
    currency?: string;
    discountTotal?: number;
    shippingTotal?: number;
    total?: number;
  };
  metadata?: Record<string, unknown>;
};

export type AdminStatsOverview = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  categorySales: { category: string; total: number }[];
  monthlySales: { month: string; total: number }[];
};

export type StatsFiltersPayload = {
  from?: string;
  to?: string;
  category?: string;
  status?: string;
};

export async function fetchMediaList(): Promise<AdminMedia[]> {
  const response = await apiFetch<{ media: AdminMedia[] }>("/media");
  return response.media ?? [];
}

export type UploadProgressCallback = (progress: {
  loaded: number;
  total: number;
  percent: number;
  stage: 'preparing' | 'uploading' | 'processing' | 'complete';
  message: string;
}) => void;

export async function uploadMediaFile(file: File, onProgress?: UploadProgressCallback): Promise<AdminMedia> {
  // Validate file
  if (!file) {
    throw new Error("No file provided");
  }

  if (file.size === 0) {
    throw new Error("File is empty");
  }

  // For video files, check size limit (e.g., 100MB)
  if (file.type.startsWith("video/") && file.size > 100 * 1024 * 1024) {
    throw new Error("Video files must be under 100MB");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("filename", file.name);

  // Notify preparing stage
  onProgress?.({
    loaded: 0,
    total: file.size,
    percent: 0,
    stage: 'preparing',
    message: 'Dosya hazirlanıyor...'
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = resolveRequestUrl("/media");

    xhr.open("POST", url, true);

    // Add auth header if available
    if (adminAuthToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${adminAuthToken}`);
    }

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percent,
          stage: 'uploading',
          message: percent < 100 ? `Yükleniyor... %${percent}` : 'Sunucuda isleniyor...'
        });
      }
    };

    // Handle upload complete (but server still processing)
    xhr.upload.onload = () => {
      onProgress?.({
        loaded: file.size,
        total: file.size,
        percent: 100,
        stage: 'processing',
        message: 'Sunucuda isleniyor...'
      });
    };

    // Handle response
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (!response?.media) {
            reject(new Error("Medya yüklenemedi - sunucu yanıtı geçersiz."));
            return;
          }
          onProgress?.({
            loaded: file.size,
            total: file.size,
            percent: 100,
            stage: 'complete',
            message: 'Yükleme tamamlandi!'
          });
          resolve(response.media);
        } catch {
          reject(new Error("Sunucu yanıtı işlenemedi."));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error || `HTTP ${xhr.status}: ${xhr.statusText}`));
        } catch {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Ağ hatası - bağlantı kurulamadı."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Yükleme zaman aşımına uğradı."));
    };

    // Set timeout (2 minutes for large files)
    xhr.timeout = 120000;

    console.log("Starting media upload with progress", { filename: file.name, type: file.type, size: file.size });
    xhr.send(formData);
  });
}

export async function deleteMediaItem(id: string): Promise<AdminMedia> {
  const response = await apiFetch<{ media: AdminMedia }>(`/media/${id}`, {
    method: "DELETE",
  });

  if (!response?.media) {
    throw new Error("Medya silinemedi.");
  }

  return response.media;
}

export async function fetchLandingMedia(): Promise<LandingMedia> {
  const response = await apiFetch<{ landingMedia: LandingMedia }>("/landing-media");
  return response.landingMedia;
}

export async function updateLandingMedia(payload: LandingMedia): Promise<LandingMedia> {
  const response = await apiFetch<{ landingMedia: LandingMedia }>("/landing-media", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.landingMedia;
}

export type AdminQuoteItem = {
  id: string;
  title: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type AdminQuote = {
  id: string;
  quoteNumber: string | null;
  status: string; // pending, approved, rejected, converted
  customer: {
    userId?: string | null;
    name: string;
    company: string;
    email: string;
    phone: string;
    taxNumber?: string;
    address?: string;
    city?: string;
  };
  items: AdminQuoteItem[];
  totals: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  };
  paymentTerms: {
    termMonths: number;
    guaranteeType: string;
    guaranteeDetails: string;
  };
  adminNotes?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt?: string;
};

export type AdminSampleItem = {
  id: string;
  title: string;
  quantity: number;
};

export type AdminSample = {
  id: string;
  sampleNumber?: string | null;
  customer: {
    userId?: string | null;
    name: string;
    company: string;
    email: string;
    phone: string;
  };
  items: AdminSampleItem[];
  shippingFee: number;
  status: string; // requested, approved, preparing, shipped, delivered, rejected
  notes?: string;
  adminNotes?: string;
  trackingNumber?: string;
  carrier?: string; // Kargo firması
  createdAt: string;
  updatedAt?: string;
};

export type AdminCustomer = {
  uid: string;
  email: string;
  displayName: string;
  company: string;
  createdAt?: string;
};

export async function fetchStatsOverview(filters: StatsFiltersPayload = {}): Promise<AdminStatsOverview> {
  const query = new URLSearchParams();
  if (filters.from) {
    query.set("from", filters.from);
  }
  if (filters.to) {
    query.set("to", filters.to);
  }
  if (filters.category && filters.category !== "all") {
    query.set("category", filters.category);
  }
  if (filters.status && filters.status !== "all") {
    query.set("status", filters.status);
  }

  const search = query.toString();
  const path = `/stats/overview${search ? `?${search}` : ""}`;
  return apiFetch<AdminStatsOverview>(path);
}

export async function fetchCustomers(): Promise<AdminCustomer[]> {
  const response = await apiFetch<{ customers: AdminCustomer[] }>("/admin/customers");
  return response.customers ?? [];
}

// ===== ANALYTICS TYPES =====

export type DashboardSummary = {
  todayRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  totalRevenue: number;
  revenueGrowth: number;
  todayOrders: number;
  thisMonthOrders: number;
  totalOrders: number;
  statusCounts: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  totalCustomers: number;
  newCustomersThisMonth: number;
  pendingOrders: number;
  pendingQuotes: number;
  pendingSamples: number;
  averageOrderValue: number;
};

export type SalesReportData = {
  period: string;
  revenue: number;
  orders: number;
  items: number;
  statusBreakdown: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
};

export type SalesReport = {
  salesData: SalesReportData[];
  totals: {
    revenue: number;
    orders: number;
    items: number;
    averageOrderValue: number;
  };
  period: { from: string; to: string };
  groupBy: string;
};

export type CustomerSegments = {
  new: number;
  returning: number;
  loyal: number;
  dormant: number;
};

export type TopCustomer = {
  id: string;
  name: string;
  email: string;
  orders: number;
  revenue: number;
  lastOrder: string | null;
};

export type CustomerAnalytics = {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  segments: CustomerSegments;
  topCustomers: TopCustomer[];
  averageCustomerValue: number;
  averageOrdersPerCustomer: number;
};

export type ProductPerformance = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
  currentStock: number;
  stockStatus: "in_stock" | "low" | "critical" | "out_of_stock";
};

export type CategoryBreakdown = {
  category: string;
  revenue: number;
  quantity: number;
  products: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  category: string;
};

export type ProductAnalytics = {
  topSellers: ProductPerformance[];
  mostPopular: ProductPerformance[];
  lowStock: LowStockProduct[];
  outOfStock: { id: string; name: string; sku: string; category: string }[];
  categoryBreakdown: CategoryBreakdown[];
  totalProducts: number;
  totalSoldQuantity: number;
  totalRevenue: number;
};

// ===== ANALYTICS API FUNCTIONS =====

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/admin/analytics/dashboard");
}

export type SalesReportFilters = {
  period?: string;
  from?: string;
  to?: string;
  groupBy?: "hourly" | "daily" | "weekly" | "monthly";
};

export async function fetchSalesReport(filters: SalesReportFilters = {}): Promise<SalesReport> {
  const query = new URLSearchParams();
  if (filters.period) query.set("period", filters.period);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (filters.groupBy) query.set("groupBy", filters.groupBy);

  const search = query.toString();
  return apiFetch<SalesReport>(`/admin/analytics/sales${search ? `?${search}` : ""}`);
}

export async function fetchCustomerAnalytics(period?: string): Promise<CustomerAnalytics> {
  const query = period ? `?period=${period}` : "";
  return apiFetch<CustomerAnalytics>(`/admin/analytics/customers${query}`);
}

export async function fetchProductAnalytics(period?: string, limit?: number): Promise<ProductAnalytics> {
  const query = new URLSearchParams();
  if (period) query.set("period", period);
  if (limit) query.set("limit", limit.toString());

  const search = query.toString();
  return apiFetch<ProductAnalytics>(`/admin/analytics/products${search ? `?${search}` : ""}`);
}

export function getExportUrl(type: "orders" | "customers" | "products" | "sales", filters?: SalesReportFilters): string {
  const base = resolveAdminApiBase();
  const query = new URLSearchParams();

  if (filters?.period) query.set("period", filters.period);
  if (filters?.from) query.set("from", filters.from);
  if (filters?.to) query.set("to", filters.to);
  if (filters?.groupBy) query.set("groupBy", filters.groupBy);

  const search = query.toString();
  return `${base}/admin/analytics/export/${type}${search ? `?${search}` : ""}`;
}
