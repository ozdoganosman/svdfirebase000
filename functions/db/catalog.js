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
    price: Number(data.price ?? 0),
    priceUSD: Number(data.priceUSD ?? 0),
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

const createProduct = async (payload) => {
  const now = FieldValue.serverTimestamp();
  const productData = {
    title: payload.title,
    slug: slugify(payload.title, { lower: true, strict: true }),
    description: payload.description || "",
    price: payload.price !== undefined ? Number(payload.price) : 0,
    priceUSD: payload.priceUSD !== undefined ? Number(payload.priceUSD) : 0,
    bulkPricing: normalizeBulkPricing(payload.bulkPricing),
    bulkPricingUSD: normalizeBulkPricing(payload.bulkPricingUSD),
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
    price: payload.price !== undefined ? Number(payload.price) : existing.price,
    priceUSD: payload.priceUSD !== undefined ? Number(payload.priceUSD) : existing.priceUSD,
    category: payload.category !== undefined ? payload.category : existing.category,
    stock: payload.stock !== undefined ? Number(payload.stock) : existing.stock,
    bulkPricing: payload.bulkPricing !== undefined ? normalizeBulkPricing(payload.bulkPricing) : existing.bulkPricing,
    bulkPricingUSD: payload.bulkPricingUSD !== undefined ? normalizeBulkPricing(payload.bulkPricingUSD) : existing.bulkPricingUSD,
    images: payload.images !== undefined ? normalizeImages(payload.images) : existing.images,
    packageInfo: payload.packageInfo !== undefined ? {
      itemsPerBox: Number(payload.packageInfo?.itemsPerBox ?? existing.packageInfo?.itemsPerBox ?? 1),
      minBoxes: Number(payload.packageInfo?.minBoxes ?? existing.packageInfo?.minBoxes ?? 1),
      boxLabel: payload.packageInfo?.boxLabel || existing.packageInfo?.boxLabel || "Koli",
    } : existing.packageInfo,
    specifications: payload.specifications !== undefined ? payload.specifications : existing.specifications,
    updatedAt: FieldValue.serverTimestamp(),
  };

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
  createProduct,
  updateProduct,
  deleteProduct,
};
