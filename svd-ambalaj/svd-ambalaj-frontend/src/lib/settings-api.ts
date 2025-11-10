/**
 * Settings API Client
 * Handles all settings-related API calls
 */

import { apiFetch } from "./admin-api";

// ==================== TYPES ====================

export type SiteSettings = {
  section: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: unknown;
};

export type PricingSettings = SiteSettings & {
  section: "pricing";
  currency?: string;
  taxRate?: number;
  showPricesWithTax?: boolean;
  allowGuestCheckout?: boolean;
};

export type SiteInfoSettings = SiteSettings & {
  section: "site";
  siteName?: string;
  siteDescription?: string;
  supportEmail?: string;
  supportPhone?: string;
  maintenanceMode?: boolean;
};

export type EmailSettings = SiteSettings & {
  section: "email";
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string; // Encrypted
  fromEmail?: string;
  fromName?: string;
};

export type PaymentSettings = SiteSettings & {
  section: "payment";
  paytrMerchantId?: string;
  paytrMerchantKey?: string; // Encrypted
  paytrMerchantSalt?: string; // Encrypted
  paytrEnabled?: boolean;
};

export type SEOSettings = SiteSettings & {
  section: "seo";
  defaultTitle?: string;
  defaultDescription?: string;
  defaultKeywords?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
};

export type Campaign = {
  id: string;
  name: string;
  type: "discount" | "free_shipping" | "bundle";
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  conditions?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  priority: number;
  applicableProducts: string[];
  applicableCategories: string[];
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};

export type Content = {
  section: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: unknown;
};

export type AdminRole = {
  userId: string;
  role: "super_admin" | "admin" | "editor" | "viewer";
  permissions: {
    manageSettings: boolean;
    manageProducts: boolean;
    manageOrders: boolean;
    manageUsers: boolean;
    manageRoles: boolean;
    manageCampaigns: boolean;
    manageContent: boolean;
    viewReports: boolean;
    viewLogs: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};

export type UserRoleInfo = {
  role: AdminRole | null;
  isStaff: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

// ==================== SETTINGS API ====================

/**
 * Get all site settings
 */
export async function getAllSettings(): Promise<Record<string, SiteSettings>> {
  const response = await apiFetch<{ settings: Record<string, SiteSettings> }>("/settings");
  return response.settings;
}

/**
 * Get specific settings section
 */
export async function getSettings<T extends SiteSettings>(section: string): Promise<T> {
  const response = await apiFetch<{ settings: T }>(`/settings/${section}`);
  return response.settings;
}

/**
 * Update settings section (super admin only)
 */
export async function updateSettings<T extends SiteSettings>(
  section: string,
  data: Partial<T>
): Promise<T> {
  const response = await apiFetch<{ settings: T }>(`/admin/settings/${section}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.settings;
}

/**
 * Initialize default settings (super admin only)
 */
export async function initializeSettings(): Promise<Record<string, SiteSettings>> {
  const response = await apiFetch<{ settings: Record<string, SiteSettings> }>(
    "/admin/settings/initialize",
    {
      method: "POST",
    }
  );
  return response.settings;
}

// ==================== CAMPAIGNS API ====================

/**
 * Get all campaigns
 */
export async function getCampaigns(filters?: {
  isActive?: boolean;
  type?: string;
}): Promise<Campaign[]> {
  const query = new URLSearchParams();
  if (filters?.isActive !== undefined) {
    query.set("isActive", String(filters.isActive));
  }
  if (filters?.type) {
    query.set("type", filters.type);
  }

  const path = `/admin/campaigns${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await apiFetch<{ campaigns: Campaign[] }>(path);
  return response.campaigns;
}

/**
 * Get active campaigns (public)
 */
export async function getActiveCampaigns(): Promise<Campaign[]> {
  const response = await apiFetch<{ campaigns: Campaign[] }>("/campaigns/active");
  return response.campaigns;
}

/**
 * Get campaign by ID
 */
export async function getCampaign(id: string): Promise<Campaign> {
  const response = await apiFetch<{ campaign: Campaign }>(`/admin/campaigns/${id}`);
  return response.campaign;
}

/**
 * Create campaign
 */
export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const response = await apiFetch<{ campaign: Campaign }>("/admin/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.campaign;
}

/**
 * Update campaign
 */
export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  const response = await apiFetch<{ campaign: Campaign }>(`/admin/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.campaign;
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: string): Promise<void> {
  await apiFetch(`/admin/campaigns/${id}`, {
    method: "DELETE",
  });
}

// ==================== CONTENT API ====================

/**
 * Get all content
 */
export async function getAllContent(): Promise<Record<string, Content>> {
  const response = await apiFetch<{ content: Record<string, Content> }>("/content");
  return response.content;
}

/**
 * Get specific content section
 */
export async function getContent(section: string): Promise<Content> {
  const response = await apiFetch<{ content: Content }>(`/content/${section}`);
  return response.content;
}

/**
 * Update content section (admin)
 */
export async function updateContent(section: string, data: Partial<Content>): Promise<Content> {
  const response = await apiFetch<{ content: Content }>(`/admin/content/${section}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.content;
}

// ==================== ADMIN ROLES API ====================

/**
 * Get all admin users (super admin only)
 */
export async function getAllAdminRoles(): Promise<AdminRole[]> {
  const response = await apiFetch<{ admins: AdminRole[] }>("/admin/roles");
  return response.admins;
}

/**
 * Get admin role by user ID
 */
export async function getAdminRole(userId: string): Promise<AdminRole> {
  const response = await apiFetch<{ role: AdminRole }>(`/admin/roles/${userId}`);
  return response.role;
}

/**
 * Set admin role (super admin only)
 */
export async function setAdminRole(
  userId: string,
  data: Partial<AdminRole>
): Promise<AdminRole> {
  const response = await apiFetch<{ role: AdminRole }>(`/admin/roles/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.role;
}

/**
 * Delete admin role (super admin only)
 */
export async function deleteAdminRole(userId: string): Promise<void> {
  await apiFetch(`/admin/roles/${userId}`, {
    method: "DELETE",
  });
}

/**
 * Get current user's role and permissions
 */
export async function getCurrentUserRole(): Promise<UserRoleInfo> {
  const response = await apiFetch<UserRoleInfo>("/admin/me/role");
  return response;
}
