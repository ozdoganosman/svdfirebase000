import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";
import slugify from "slugify";

// Collection references
const categoriesCollection = db.collection("categories");
const productsCollection = db.collection("products");

const mapTimestamp = (value) => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  // Firestore Timestamp objesini Date objesine dönüştür
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(value).toISOString();
};

const normalizeImages = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeImages(parsed);
    } catch {
      return [value];
    }
  }
  return [];
};

const normalizeBulkPricing = (value) => {
  if (!value) {
    return [];
  }
  const tiers = Array.isArray(value) ? value : [value];
  return tiers
    .map((tier) => ({
      minQty: Number(
        tier.minQty ??
          tier.minqty ??
          tier.min_quantity ??
          tier.minquantity ??
          tier.min_qty ??
          0
      ),
      price: Number(tier.price ?? 0),
    }))
    .filter((tier) => Number.isFinite(tier.minQty) && Number.isFinite(tier.price))
    .sort((a, b) => a.minQty - b.minQty);
};

const mapCategoryDoc = (doc) => {
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    description: data.description || "",
    image: data.image || "",
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

const mapProductDoc = (doc) => {
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    slug: data.slug,
    description: data.description || "",
    price: data.price !== undefined ? Number(data.price) : undefined,
    priceUSD: data.priceUSD !== undefined ? Number(data.priceUSD) : undefined,
    bulkPricing: normalizeBulkPricing(data.bulkPricing),
    bulkPricingUSD: normalizeBulkPricing(data.bulkPricingUSD),
    category: data.category, // category_id yerine category
    images: normalizeImages(data.images),
    stock: Number(data.stock ?? 0),
    packageInfo: {
      itemsPerBox: Number(data.packageInfo?.itemsPerBox ?? 1),
      minBoxes: Number(data.packageInfo?.minBoxes ?? 1),
      boxLabel: data.packageInfo?.boxLabel || "Koli",
    },
    specifications: data.specifications ? {
      hoseLength: data.specifications.hoseLength || "",
      volume: data.specifications.volume || "",
      color: data.specifications.color || "",
      neckSize: data.specifications.neckSize || "",
    } : undefined,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

const listCategories = async () => {
  const snapshot = await categoriesCollection.orderBy("name", "asc").get();
  return snapshot.docs.map(mapCategoryDoc);
};

const getCategoryById = async (id) => {
  const doc = await categoriesCollection.doc(id).get();
  return mapCategoryDoc(doc);
};

const getCategoryBySlug = async (slug) => {
  const snapshot = await categoriesCollection.where("slug", "==", slug).limit(1).get();
  return snapshot.empty ? null : mapCategoryDoc(snapshot.docs[0]);
};

const createCategory = async ({ id, name, slug, description = "", image = "" }) => {
  const now = FieldValue.serverTimestamp();
  const categoryData = {
    name,
    slug, // Use the provided slug directly
    description,
    image,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = id ? categoriesCollection.doc(id) : categoriesCollection.doc();
  await docRef.set(categoryData);
  const doc = await docRef.get();
  return mapCategoryDoc(doc);
};

const updateCategory = async (id, payload) => {
  const existing = await getCategoryById(id);
  if (!existing) {
    return null;
  }

  const updatedData = {
    ...payload,
    slug: payload.name ? slugify(payload.name, { lower: true, strict: true }) : existing.slug,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await categoriesCollection.doc(id).update(updatedData);
  const doc = await categoriesCollection.doc(id).get();
  return mapCategoryDoc(doc);
};

const deleteCategory = async (id) => {
  const existing = await getCategoryById(id);
  if (!existing) {
    return null;
  }

  // Kategoriye bağlı ürün olup olmadığını kontrol et
  const productsSnapshot = await productsCollection.where("category", "==", id).limit(1).get();
  if (!productsSnapshot.empty) {
    throw new Error("Kategori, ilişkili ürünler nedeniyle silinemiyor.");
  }

  await categoriesCollection.doc(id).delete();
  return existing;
};

const listProducts = async () => {
  const snapshot = await productsCollection.orderBy("createdAt", "desc").get();
  return snapshot.docs.map(mapProductDoc);
};

const getProductById = async (id) => {
  const doc = await productsCollection.doc(id).get();
  return mapProductDoc(doc);
};

const getProductBySlug = async (slug) => {
  const snapshot = await productsCollection.where("slug", "==", slug).limit(1).get();
  return snapshot.empty ? null : mapProductDoc(snapshot.docs[0]);
};

const listProductsByCategory = async (categoryId) => {
  const snapshot = await productsCollection.where("category", "==", categoryId).get();
  return snapshot.docs.map(mapProductDoc);
};

/**
 * Search and filter products
 * @param {Object} filters - Search and filter options
 * @param {string} filters.q - Search query (searches in title, description)
 * @param {string} filters.category - Category ID to filter by
 * @param {number} filters.minPrice - Minimum price (USD)
 * @param {number} filters.maxPrice - Maximum price (USD)
 * @param {string} filters.sort - Sort option: 'title-asc', 'title-desc', 'price-asc', 'price-desc'
 * @param {string} filters.hoseLength - Filter by hose length
 * @param {string} filters.volume - Filter by volume
 * @param {string} filters.color - Filter by color
 * @param {string} filters.neckSize - Filter by neck size
 * @returns {Promise<Array>} Filtered and sorted products
 */
const searchProducts = async (filters = {}) => {
  let queryRef = productsCollection;

  // Apply category filter at database level if provided
  if (filters.category && filters.category !== "all") {
    queryRef = queryRef.where("category", "==", filters.category);
  }

  const snapshot = await queryRef.get();
  let products = snapshot.docs.map(mapProductDoc).filter(Boolean);

  // Apply text search filter
  if (filters.q && filters.q.trim()) {
    const searchTerm = filters.q.toLowerCase().trim();
    products = products.filter((product) => {
      const titleMatch = product.title?.toLowerCase().includes(searchTerm);
      const descMatch = product.description?.toLowerCase().includes(searchTerm);
      return titleMatch || descMatch;
    });
  }

  // Apply specification filters
  if (filters.hoseLength) {
    products = products.filter((product) => 
      product.specifications?.hoseLength === filters.hoseLength
    );
  }

  if (filters.volume) {
    products = products.filter((product) => 
      product.specifications?.volume === filters.volume
    );
  }

  if (filters.color) {
    products = products.filter((product) => 
      product.specifications?.color === filters.color
    );
  }

  if (filters.neckSize) {
    products = products.filter((product) => 
      product.specifications?.neckSize === filters.neckSize
    );
  }

  // Apply price range filters (using USD prices)
  if (filters.minPrice !== undefined && filters.minPrice !== null) {
    const minPrice = Number(filters.minPrice);
    if (Number.isFinite(minPrice)) {
      products = products.filter((product) => {
        const price = product.priceUSD ?? 0;
        return price >= minPrice;
      });
    }
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    const maxPrice = Number(filters.maxPrice);
    if (Number.isFinite(maxPrice)) {
      products = products.filter((product) => {
        const price = product.priceUSD ?? 0;
        return price <= maxPrice;
      });
    }
  }

  // Apply sorting
  if (filters.sort) {
    switch (filters.sort) {
      case "title-asc":
        products.sort((a, b) => (a.title || "").localeCompare(b.title || "", "tr"));
        break;
      case "title-desc":
        products.sort((a, b) => (b.title || "").localeCompare(a.title || "", "tr"));
        break;
      case "price-asc":
        products.sort((a, b) => (a.priceUSD ?? 0) - (b.priceUSD ?? 0));
        break;
      case "price-desc":
        products.sort((a, b) => (b.priceUSD ?? 0) - (a.priceUSD ?? 0));
        break;
      default:
        // Default: order by createdAt desc (already from query)
        break;
    }
  }

  return products;
};

const createProduct = async (payload) => {
  const now = FieldValue.serverTimestamp();
  const productData = {
    title: payload.title,
    slug: slugify(payload.title, { lower: true, strict: true }),
    description: payload.description || "",
    category: payload.category,
    images: normalizeImages(payload.images),
    stock: Number(payload.stock ?? 0),
    packageInfo: {
      itemsPerBox: Number(payload.packageInfo?.itemsPerBox ?? 1),
      minBoxes: Number(payload.packageInfo?.minBoxes ?? 1),
      boxLabel: payload.packageInfo?.boxLabel || "Koli",
    },
    specifications: payload.specifications || undefined,
    createdAt: now,
    updatedAt: now,
  };

  // Para birimi alanlarını sadece değer varsa ekle
  if (payload.price !== undefined && payload.price !== null) {
    productData.price = Number(payload.price);
  }
  if (payload.priceUSD !== undefined && payload.priceUSD !== null) {
    productData.priceUSD = Number(payload.priceUSD);
  }
  if (payload.bulkPricing !== undefined) {
    productData.bulkPricing = normalizeBulkPricing(payload.bulkPricing);
  }
  if (payload.bulkPricingUSD !== undefined) {
    productData.bulkPricingUSD = normalizeBulkPricing(payload.bulkPricingUSD);
  }

  const docRef = payload.id ? productsCollection.doc(payload.id) : productsCollection.doc();
  await docRef.set(productData);
  const doc = await docRef.get();
  return mapProductDoc(doc);
};

const updateProduct = async (id, payload) => {
  const existing = await getProductById(id);
  if (!existing) {
    return null;
  }

  const updatedData = {
    title: payload.title !== undefined ? payload.title : existing.title,
    slug: payload.title ? slugify(payload.title, { lower: true, strict: true }) : existing.slug,
    description: payload.description !== undefined ? payload.description : existing.description,
    category: payload.category !== undefined ? payload.category : existing.category,
    stock: payload.stock !== undefined ? Number(payload.stock) : existing.stock,
    images: payload.images !== undefined ? normalizeImages(payload.images) : existing.images,
    packageInfo: payload.packageInfo !== undefined ? {
      itemsPerBox: Number(payload.packageInfo?.itemsPerBox ?? existing.packageInfo?.itemsPerBox ?? 1),
      minBoxes: Number(payload.packageInfo?.minBoxes ?? existing.packageInfo?.minBoxes ?? 1),
      boxLabel: payload.packageInfo?.boxLabel || existing.packageInfo?.boxLabel || "Koli",
    } : existing.packageInfo,
    specifications: payload.specifications !== undefined ? payload.specifications : existing.specifications,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Para birimi alanlarını özel olarak işle
  // Sadece payload'da gönderilen değerleri güncelle, diğerlerini koru
  if (payload.price !== undefined && payload.price !== null) {
    updatedData.price = Number(payload.price);
  } else if (payload.price === null) {
    updatedData.price = FieldValue.delete();
  }

  if (payload.priceUSD !== undefined && payload.priceUSD !== null) {
    updatedData.priceUSD = Number(payload.priceUSD);
  } else if (payload.priceUSD === null) {
    updatedData.priceUSD = FieldValue.delete();
  }

  if (payload.bulkPricing !== undefined) {
    updatedData.bulkPricing = normalizeBulkPricing(payload.bulkPricing);
  }

  if (payload.bulkPricingUSD !== undefined) {
    updatedData.bulkPricingUSD = normalizeBulkPricing(payload.bulkPricingUSD);
  }

  await productsCollection.doc(id).update(updatedData);
  const doc = await productsCollection.doc(id).get();
  return mapProductDoc(doc);
};

const deleteProduct = async (id) => {
  const existing = await getProductById(id);
  if (!existing) {
    return null;
  }

  await productsCollection.doc(id).delete();
  return existing;
};

export {
  listCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  getProductById,
  getProductBySlug,
  listProductsByCategory,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};

// --- Migration utilities ---
/**
 * Migrate legacy TRY prices to USD-only pricing.
 * For any product that has price (TRY) but missing priceUSD, set priceUSD = price / rate.
 * For bulkPricing (TRY), create bulkPricingUSD converting each tier price by dividing by rate.
 * Then remove TRY fields (price, bulkPricing).
 */
export async function migrateTryToUSD(rate) {
  const snapshot = await productsCollection.get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const hasTry = data.price !== undefined || (Array.isArray(data.bulkPricing) && data.bulkPricing.length > 0);
    const missingUsd = data.priceUSD === undefined && (data.price !== undefined || data.bulkPricingUSD === undefined);
    if (!hasTry || !missingUsd) {
      continue;
    }

    const updatedData = { updatedAt: FieldValue.serverTimestamp() };

    if (data.price !== undefined && (data.priceUSD === undefined || data.priceUSD === null)) {
      const tryPrice = Number(data.price);
      if (Number.isFinite(tryPrice) && rate && Number.isFinite(rate) && rate > 0) {
        updatedData.priceUSD = Number((tryPrice / rate).toFixed(4));
      }
    }

    if (Array.isArray(data.bulkPricing) && (!Array.isArray(data.bulkPricingUSD) || data.bulkPricingUSD.length === 0)) {
      const tiers = normalizeBulkPricing(data.bulkPricing);
      if (tiers.length > 0 && rate && Number.isFinite(rate) && rate > 0) {
        updatedData.bulkPricingUSD = tiers.map(t => ({ minQty: t.minQty, price: Number((t.price / rate).toFixed(4)) }));
      }
    }

    // Remove TRY fields regardless if we set USD or not (moving to USD-only)
    updatedData.price = FieldValue.delete();
    updatedData.bulkPricing = FieldValue.delete();

    await productsCollection.doc(doc.id).update(updatedData);
    updated += 1;
  }
  return { total: snapshot.size, updated };
}
