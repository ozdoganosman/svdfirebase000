import * as functions from "firebase-functions";
import { getStorage } from "firebase-admin/storage";
import express from "express";
import cors from "cors";
import slugify from "slugify";
import Busboy from "busboy";
import path from "path";
import os from "os";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";

import * as catalog from "./db/catalog.js";
import * as media from "./db/media.js";
import * as orders from "./db/orders.js";
import * as samples from "./db/samples.js";
import * as auth from "./db/auth.js";
import * as exchangeRates from "./db/exchange-rates.js";
import * as users from "./db/users.js";
import * as quotes from "./db/quotes.js";
import * as vip from "./db/vip.js";
import * as emailSender from "./email/sender.js";
import { fetchTCMBRate } from "./services/exchange-rate.js";
import { db } from "./db/client.js";
import admin from "firebase-admin";

// Load environment variables
dotenv.config();

const SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 1000 * 60 * 60 * 8);
const ADMIN_EMAIL_SOURCE = process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD_SOURCE = process.env.ADMIN_PASSWORD || "";

const ADMIN_EMAIL = (ADMIN_EMAIL_SOURCE || "admin@example.com").toLowerCase();
const ADMIN_PASSWORD = ADMIN_PASSWORD_SOURCE || "change-me-now";

const DEFAULT_MEDIA_FILE_SIZE_MB = 100;
const parsedMediaFileSizeMb = Number(process.env.ADMIN_MEDIA_MAX_FILE_SIZE_MB);
const MEDIA_FILE_SIZE_LIMIT_MB =
  Number.isFinite(parsedMediaFileSizeMb) && parsedMediaFileSizeMb > 0
    ? parsedMediaFileSizeMb
    : DEFAULT_MEDIA_FILE_SIZE_MB;
const MEDIA_FILE_SIZE_LIMIT_BYTES = MEDIA_FILE_SIZE_LIMIT_MB * 1024 * 1024;

if (!ADMIN_EMAIL_SOURCE) {
  functions.logger.warn("ADMIN_EMAIL environment variable missing; falling back to admin@example.com.");
}
if (!ADMIN_PASSWORD_SOURCE) {
  functions.logger.warn("ADMIN_PASSWORD environment variable missing; using insecure placeholder password.");
}

const createSession = async (email) => {
  await auth.pruneExpiredSessions();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return auth.createSession(email, token, expiresAt);
};

const validateSession = (token) => {
  return auth.validateSession(token);
};

const destroySession = (token) => {
  return auth.destroySession(token);
};

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    functions.logger.warn("Missing bearer authorization", { headers: req.headers });
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  
  try {
    const session = await validateSession(token);
    if (!session) {
      functions.logger.warn("Invalid or expired admin session", { token });
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Add session info to response headers
    if (session.expiryWarning) {
      res.set("X-Session-Expiring", "true");
      res.set("X-Session-Expires-At", session.expiresAt.toString());
    }

    req.admin = { 
      email: session.email, 
      token,
      sessionExpiresAt: session.expiresAt 
    };
    next();
  } catch (error) {
    functions.logger.error("Session validation failed", error);
    return res.status(500).json({ error: "Authentication failed. Please try again." });
  }
};

const app = express();

// Apply CORS middleware first
app.use(cors({ origin: "*", credentials: true }));

// Then add other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS for media uploads first
app.options("/media", cors({ 
  origin: "*",
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Medya yükleme rotasını özel multipart işleme ile tanımlayın
app.post("/media", requireAuth, (req, res) => {
  functions.logger.info("Media upload request received", { 
    headers: req.headers,
    contentType: req.headers["content-type"] 
  });
  
  if (!req.headers["content-type"]) {
    return res.status(400).json({ error: "Content-Type header is missing" });
  }

  // Check if it's a FormData request - boundary check is more reliable
  if (!req.headers["content-type"].includes("multipart/form-data")) {
    return res.status(400).json({ error: "Content-Type must be multipart/form-data" });
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: MEDIA_FILE_SIZE_LIMIT_BYTES, // Configurable limit via ADMIN_MEDIA_MAX_FILE_SIZE_MB
      files: 1 // Only handle one file at a time
    }
  });
  
  const uploads = [];
  let fileHandled = false;
  let customFilename = null;
  let uploadLimitExceeded = false;
  let uploadLimitMessage = "";

  // Handle regular form fields
  busboy.on("field", (fieldname, value) => {
    if (fieldname === "filename" && value) {
      customFilename = value;
    }
  });

  busboy.on("file", (fieldname, file, { filename, encoding, mimeType: mimetype }) => {
    functions.logger.info("Processing file upload", { fieldname, filename, customFilename, encoding, mimetype });
    
    // Use custom filename if provided, otherwise use the original filename
    const finalFilename = customFilename || filename;
    if (!finalFilename) {
      file.resume();
      return;
    }

    fileHandled = true;
    const safeName = `${Date.now()}-${slugify(finalFilename, { lower: true, strict: true })}`;
    const tempPath = path.join(os.tmpdir(), safeName);
    const writeStream = fs.createWriteStream(tempPath);
    file.pipe(writeStream);

    file.once("limit", () => {
      uploadLimitExceeded = true;
      uploadLimitMessage = `Dosya boyutu ${MEDIA_FILE_SIZE_LIMIT_MB}MB limitini asiyor.`;
      functions.logger.warn("Media upload aborted: file size limit reached", {
        fieldname,
        filename: finalFilename,
        limitBytes: MEDIA_FILE_SIZE_LIMIT_BYTES
      });
      file.unpipe(writeStream);
      writeStream.destroy(new Error("File size limit exceeded"));
      fs.unlink(tempPath, () => {});
      file.resume(); // drain the remainder of the stream
    });

    const uploadPromise = new Promise((resolve, reject) => {
      writeStream.on("error", (error) => {
        functions.logger.error("Write stream error", { error: error.message, path: tempPath });
        fs.unlink(tempPath, () => {});
        reject(new Error(`File write failed: ${error.message}`));
      });

      writeStream.on("finish", async () => {
        try {
          functions.logger.info("File write finished, checking stats", { path: tempPath });
          const stats = fs.statSync(tempPath);
          const bucket = getStorage().bucket();
          const destination = `uploads/${safeName}`;

          // Add file validation
          if (stats.size === 0) {
            throw new Error("Empty file");
          }

          functions.logger.info("Starting Firebase upload", {
            destination,
            size: stats.size,
            mimetype,
            filename: finalFilename
          });

          // Add specific metadata for videos
          const isVideo = mimetype.startsWith("video/");
          const metadata = {
            contentType: mimetype,
            metadata: {
              originalName: finalFilename,
              fileType: isVideo ? "video" : "image"
            }
          };

          const [uploadedFile] = await bucket.upload(tempPath, {
            destination,
            metadata,
            validation: "md5",
            public: true  // Make file publicly accessible
          });

          functions.logger.info("File uploaded to Firebase Storage", {
            destination,
            metadata: uploadedFile.metadata
          });

          // Create a public URL without signed URL
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;

          const created = await media.createMediaEntry({
            storageKey: destination,
            filename: safeName,
            originalName: filename,
            mimeType: mimetype,
            size: stats.size,
            url: publicUrl,
            checksum: null,
            metadata: { encoding },
          });

          fs.unlink(tempPath, () => {});
          resolve(created);
        } catch (error) {
          functions.logger.error("Error persisting uploaded media", error);
          fs.unlink(tempPath, () => {});
          reject(error);
        }
      });

      writeStream.on("error", (error) => {
        fs.unlink(tempPath, () => {});
        reject(error);
      });
    });

    uploads.push(uploadPromise);
  });

  busboy.on("finish", async () => {
    if (res.headersSent) {
      return;
    }
    if (uploadLimitExceeded) {
      uploads.forEach((promise) => {
        promise.catch(() => undefined);
      });
      return res.status(413).json({ error: uploadLimitMessage });
    }
    if (!fileHandled) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    try {
      functions.logger.info("Processing uploaded files", { uploadsCount: uploads.length });
      const createdItems = await Promise.all(uploads);
      functions.logger.info("Media upload successful", { count: createdItems.length, items: createdItems });
      res.status(201).json({ media: createdItems.length === 1 ? createdItems[0] : createdItems });
    } catch (error) {
      functions.logger.error("Media upload failed", { 
        error: error.message,
        stack: error.stack,
        code: error.code,
        details: error.details
      });
      res.status(500).json({ error: `Upload failed: ${error.message}` });
    }
  });

  busboy.on("error", (error) => {
    functions.logger.error("Busboy error", { error: error.message, stack: error.stack });
    if (res.headersSent) {
      return;
    }
    if (uploadLimitExceeded) {
      return res.status(413).json({ error: uploadLimitMessage });
    }
    res.status(500).json({ error: `Upload processing failed: ${error.message}` });
  });
  const hasRawBodyBuffer = Buffer.isBuffer(req.rawBody);
  if (hasRawBodyBuffer) {
    busboy.end(req.rawBody);
  } else {
    req.pipe(busboy);
  }
});

const handleError = (res, error, statusCode = 500) => {
  functions.logger.error("API error", error);
  res.status(statusCode).send({ error: error.message || "Bir hata oluştu." });
};

const parseBulkPricing = (input, fallback = []) => {
  if (input === undefined || input === null || input === "") {
    return fallback;
  }

  let source = input;
  if (typeof source === "string") {
    const trimmed = source.trim();
    if (!trimmed) {
      return fallback;
    }
    try {
      source = JSON.parse(trimmed);
    } catch (error) {
      functions.logger.error("Bulk pricing JSON parse error", error);
      return fallback;
    }
  }

  if (!Array.isArray(source)) {
    return fallback;
  }

  return source
    .map((item) => ({
      minQty: Number(item.minQty),
      price: Number(item.price),
    }))
    .filter((item) => Number.isFinite(item.minQty) && Number.isFinite(item.price) && item.minQty >= 0 && item.price >= 0);
};

const sanitizeImages = (input, fallback = []) => {
  if (input === undefined || input === null) {
    return fallback;
  }

  if (Array.isArray(input)) {
    return input
      .map((value) => (value != null ? String(value).trim() : ""))
      .filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return fallback;
};

const defaultLandingMedia = {
  heroGallery: [
    "/images/landing/24.png",
    "/images/landing/25.png",
    "/images/landing/27.png",
    "/images/landing/28.png",
  ],
  heroVideo: {
    src: "",
    poster: "/images/landing/24.png",
  },
  mediaHighlights: [
    {
      title: "Tam otomatik dolum hattı",
      caption: "Saha görüntüleriniz burada yer alabilir.",
      image: "/images/landing/25.png",
    },
  ],
};

const sanitizeLandingMedia = (input, fallback = defaultLandingMedia) => {
  if (!input || typeof input !== "object") {
    return fallback;
  }

  const heroGallery = Array.isArray(input.heroGallery)
    ? input.heroGallery.map((item) => (item ? String(item).trim() : "")).filter(Boolean)
    : fallback.heroGallery;

  const heroVideoRaw = input.heroVideo && typeof input.heroVideo === "object" ? input.heroVideo : {};
  const videoSrc = heroVideoRaw.src ? String(heroVideoRaw.src).trim() : "";
  const videoPoster = heroVideoRaw.poster ? String(heroVideoRaw.poster).trim() : "";
  
  const heroVideo = {
    src: videoSrc,
    poster: videoPoster,
  };

  const mediaHighlights = Array.isArray(input.mediaHighlights)
    ? input.mediaHighlights
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const image = item.image ? String(item.image).trim() : "";
          if (!image) {
            return null;
          }
          return {
            title: item.title ? String(item.title).trim() : "",
            caption: item.caption ? String(item.caption).trim() : "",
            image,
          };
        })
        .filter(Boolean)
    : fallback.mediaHighlights;

  return {
    heroGallery: heroGallery.length > 0 ? heroGallery : fallback.heroGallery,
    heroVideo,
    mediaHighlights: mediaHighlights.length > 0 ? mediaHighlights : fallback.mediaHighlights,
  };
};

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const providedPassword = typeof password === "string" ? password : "";

  if (!normalizedEmail || !providedPassword) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (normalizedEmail !== ADMIN_EMAIL || providedPassword !== ADMIN_PASSWORD) {
    functions.logger.warn("Failed admin login attempt", { email: normalizedEmail });
    return res.status(401).json({ error: "Invalid email or password." });
  }

  try {
    const session = await createSession(normalizedEmail);
    res.json(session);
  } catch (error) {
    functions.logger.error("Failed to create session", { error: error.message, stack: error.stack });
    res.status(500).json({ error: `Login failed: ${error.message}` });
  }
});

app.post("/auth/logout", requireAuth, async (req, res) => {
  try {
    await destroySession(req.admin?.token);
    res.status(204).send();
  } catch (error) {
    functions.logger.error("Failed to destroy session", error);
    res.status(500).json({ error: "Logout failed. Please try again." });
  }
});

app.get("/auth/me", requireAuth, (req, res) => {
  res.json({ email: req.admin.email });
});

app.get("/categories", async (_req, res) => {
  try {
    const categories = await catalog.listCategories();
    res.status(200).send({ categories });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/categories/:id", async (req, res) => {
  try {
    const category = await catalog.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).send({ error: "Category not found." });
    }
    res.status(200).send(category);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/categories/slug/:slug", async (req, res) => {
  try {
    const category = await catalog.getCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).send({ error: "Category not found." });
    }
    res.status(200).send(category);
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/categories", requireAuth, async (req, res) => {
  try {
    const {
      id: incomingId,
      name,
      slug: incomingSlug,
      description = "",
      image = "",
    } = req.body || {};

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Category name is required." });
    }

    const slug = incomingSlug
      ? slugify(String(incomingSlug).trim(), { lower: true, strict: true })
      : slugify(name, { lower: true, strict: true });
    const id = incomingId && String(incomingId).trim() ? String(incomingId).trim() : slug;

    const [existingById, existingBySlug] = await Promise.all([
      catalog.getCategoryById(id),
      catalog.getCategoryBySlug(slug),
    ]);

    if (existingById) {
      return res.status(409).json({ error: "Category with the same id already exists." });
    }
    if (existingBySlug) {
      return res.status(409).json({ error: "Category with the same slug already exists." });
    }

    const category = await catalog.createCategory({
      id,
      name,
      slug,
      description,
      image,
    });

    res.status(201).json({ category });
  } catch (error) {
    functions.logger.error("Error creating category", error);
    res.status(500).json({ error: "Failed to create category." });
  }
});

app.put("/categories/:id", requireAuth, async (req, res) => {
  try {
    const existing = await catalog.getCategoryById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Category not found." });
    }

    const payload = {
      name: req.body?.name,
      description: req.body?.description ?? existing.description,
      image: req.body?.image ?? existing.image,
    };

    const updated = await catalog.updateCategory(req.params.id, payload);
    res.status(200).json({ category: updated });
  } catch (error) {
    functions.logger.error("Error updating category", error);
    res.status(500).json({ error: "Failed to update category." });
  }
});

app.delete("/categories/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await catalog.deleteCategory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Category not found." });
    }
    res.status(200).json({ category: deleted });
  } catch (error) {
    functions.logger.error("Error deleting category", error);
    res.status(500).json({ error: error.message || "Failed to delete category." });
  }
});

app.get("/products", async (_req, res) => {
  try {
    const products = await catalog.listProducts();
    res.status(200).send({ products });
  } catch (error) {
    handleError(res, error);
  }
});

// Get unique specification values for filtering
app.get("/products/specifications", async (_req, res) => {
  try {
    const products = await catalog.listProducts();
    const specs = {
      hoseLengths: new Set(),
      volumes: new Set(),
      colors: new Set(),
      neckSizes: new Set(),
    };

    products.forEach(product => {
      if (product.specifications) {
        if (product.specifications.hoseLength) specs.hoseLengths.add(product.specifications.hoseLength);
        if (product.specifications.volume) specs.volumes.add(product.specifications.volume);
        if (product.specifications.color) specs.colors.add(product.specifications.color);
        if (product.specifications.neckSize) specs.neckSizes.add(product.specifications.neckSize);
      }
    });

    res.status(200).send({
      hoseLengths: Array.from(specs.hoseLengths).sort(),
      volumes: Array.from(specs.volumes).sort(),
      colors: Array.from(specs.colors).sort(),
      neckSizes: Array.from(specs.neckSizes).sort(),
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/products/search", async (req, res) => {
  try {
    const filters = {
      q: req.query.q,
      category: req.query.category,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      sort: req.query.sort,
      hoseLength: req.query.hoseLength,
      volume: req.query.volume,
      color: req.query.color,
      neckSize: req.query.neckSize,
    };
    const products = await catalog.searchProducts(filters);
    res.status(200).send({ products });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await catalog.getProductById(req.params.id);
    if (!product) {
      return res.status(404).send({ error: "Product not found." });
    }
    res.status(200).send({ product });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/products/slug/:slug", async (req, res) => {
  try {
    const product = await catalog.getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).send({ error: "Product not found." });
    }
    res.status(200).send({ product });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/categories/:id/products", async (req, res) => {
  try {
    const products = await catalog.listProductsByCategory(req.params.id);
    res.status(200).send({ products });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/products", requireAuth, async (req, res) => {
  try {
    const {
      id,
      title,
      slug,
      description = "",
      price,
      priceUSD,
      bulkPricing,
      bulkPricingUSD,
      category,
      images,
      stock,
      packageInfo,
      specifications,
    } = req.body || {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Product title is required." });
    }

    const payload = {
      id,
      title,
      slug,
      description,
      price: price !== undefined ? price : undefined,
      priceUSD: priceUSD !== undefined ? priceUSD : undefined,
      bulkPricing: parseBulkPricing(bulkPricing),
      bulkPricingUSD: parseBulkPricing(bulkPricingUSD),
      category,
      images: sanitizeImages(images),
      stock,
      packageInfo,
      specifications,
    };

    const product = await catalog.createProduct(payload);
    res.status(201).json({ product });
  } catch (error) {
    functions.logger.error("Error creating product", { 
      message: error.message, 
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ error: "Failed to create product." });
  }
});

app.put("/products/:id", requireAuth, async (req, res) => {
  try {
    const existing = await catalog.getProductById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Product not found." });
    }

    const body = req.body || {};
    const payload = {
      title: body.title,
      slug: body.slug,
      description: body.description,
      category: body.category,
      stock: body.stock,
      images: body.images !== undefined ? sanitizeImages(body.images, existing.images) : undefined,
      packageInfo: body.packageInfo,
      specifications: body.specifications,
      price: body.price,
      priceUSD: body.priceUSD,
      bulkPricing: body.bulkPricing !== undefined ? parseBulkPricing(body.bulkPricing) : undefined,
      bulkPricingUSD: body.bulkPricingUSD !== undefined ? parseBulkPricing(body.bulkPricingUSD) : undefined,
    };

    // Filter out undefined values so they don't overwrite existing data
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const product = await catalog.updateProduct(req.params.id, payload);
    res.status(200).json({ product });
  } catch (error) {
    functions.logger.error("Error updating product", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      productId: req.params.id
    });
    res.status(500).json({ error: "Failed to update product." });
  }
});

app.delete("/products/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await catalog.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.status(200).json({ product: deleted });
  } catch (error) {
    functions.logger.error("Error deleting product", error);
    res.status(500).json({ error: error.message || "Failed to delete product." });
  }
});

app.get("/media", requireAuth, async (_req, res) => {
  try {
    const items = await media.listMedia();
    res.status(200).json({ media: items });
  } catch (error) {
    functions.logger.error("Error listing media", error);
    res.status(500).json({ error: "Failed to list media." });
  }
});

app.delete("/media/:id", requireAuth, async (req, res) => {
  try {
    const existing = await media.deleteMedia(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Media item not found." });
    }

    try {
      const bucket = getStorage().bucket();
      if (existing.storageKey) {
        await bucket.file(existing.storageKey).delete({ ignoreNotFound: true });
      }
    } catch (error) {
      functions.logger.warn("Failed to delete media file from storage", { error, storageKey: existing.storageKey });
    }

    res.status(200).json({ media: existing });
  } catch (error) {
    functions.logger.error("Error deleting media", error);
    res.status(500).json({ error: "Failed to delete media." });
  }
});

app.get("/landing-media", async (_req, res) => {
  try {
    const landingMedia = await media.fetchLandingMedia();
    res.json({ landingMedia: sanitizeLandingMedia(landingMedia, defaultLandingMedia) });
  } catch (error) {
    functions.logger.error("Error fetching landing media", error);
    res.status(500).json({ error: "Failed to load landing media." });
  }
});

app.put("/landing-media", requireAuth, async (req, res) => {
  try {
    const sanitizedPayload = sanitizeLandingMedia(req.body, defaultLandingMedia);
    const updated = await media.updateLandingMedia(sanitizedPayload);
    res.json({ landingMedia: sanitizeLandingMedia(updated, defaultLandingMedia) });
  } catch (error) {
    functions.logger.error("Error updating landing media", error);
    res.status(500).json({ error: "Failed to update landing media." });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const order = await orders.createOrder(req.body || {});
    res.status(201).send({ message: "Order received", order });
  } catch (error) {
    functions.logger.error("Error creating order", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// Public endpoint for users to get their own orders
app.get("/user/orders", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const orderList = await orders.listOrders({ userId });
    res.status(200).send({ orders: orderList });
  } catch (error) {
    functions.logger.error("Error fetching user orders", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// User profile endpoints
app.get("/user/profile", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    let user = await users.getUserById(userId);

    // If user profile doesn't exist in Firestore, create it from Firebase Auth
    if (!user) {
      functions.logger.info("User profile not found, attempting to create from Firebase Auth", { userId });

      try {
        // Get Firebase Auth user data
        const { getAuth } = await import("firebase-admin/auth");
        const authUser = await getAuth().getUser(userId);

        // Create user profile in Firestore
        user = await users.createUser(userId, {
          email: authUser.email || "",
          displayName: authUser.displayName || authUser.email?.split("@")[0] || "",
          phone: authUser.phoneNumber || "",
          company: "",
          taxNumber: "",
        });

        functions.logger.info("User profile created successfully", { userId, email: authUser.email });
      } catch (createError) {
        functions.logger.error("Failed to create user profile from Auth", { userId, error: createError });
        return res.status(404).json({ error: "User not found" });
      }
    }

    res.status(200).json({ user });
  } catch (error) {
    functions.logger.error("Error fetching user profile", error);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

app.put("/user/profile", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const updates = req.body;
    const updatedUser = await users.updateUser(userId, updates);

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    functions.logger.error("Error updating user profile", error);
    res.status(500).json({ error: "Failed to update user profile." });
  }
});

app.post("/user/profile", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const userData = req.body;
    const newUser = await users.createUser(userId, userData);

    res.status(201).json({ user: newUser });
  } catch (error) {
    functions.logger.error("Error creating user profile", error);
    res.status(500).json({ error: "Failed to create user profile." });
  }
});

// User address endpoints
app.get("/user/addresses", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const addresses = await users.getUserAddresses(userId);
    res.status(200).json({ addresses });
  } catch (error) {
    functions.logger.error("Error fetching user addresses", error);
    res.status(500).json({ error: "Failed to fetch addresses." });
  }
});

app.post("/user/addresses", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const addressData = req.body;
    const newAddress = await users.createAddress(userId, addressData);

    res.status(201).json({ address: newAddress });
  } catch (error) {
    functions.logger.error("Error creating address", error);
    res.status(500).json({ error: "Failed to create address." });
  }
});

app.put("/user/addresses/:addressId", async (req, res) => {
  try {
    const { userId } = req.query;
    const { addressId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const updates = req.body;
    const updatedAddress = await users.updateAddress(userId, addressId, updates);

    res.status(200).json({ address: updatedAddress });
  } catch (error) {
    functions.logger.error("Error updating address", error);
    res.status(500).json({ error: "Failed to update address." });
  }
});

app.delete("/user/addresses/:addressId", async (req, res) => {
  try {
    const { userId } = req.query;
    const { addressId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    await users.deleteAddress(userId, addressId);
    res.status(200).json({ success: true });
  } catch (error) {
    functions.logger.error("Error deleting address", error);
    res.status(500).json({ error: "Failed to delete address." });
  }
});

app.put("/user/addresses/:addressId/set-default", async (req, res) => {
  try {
    const { userId } = req.query;
    const { addressId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const updatedAddress = await users.setDefaultAddress(userId, addressId);
    res.status(200).json({ address: updatedAddress });
  } catch (error) {
    functions.logger.error("Error setting default address", error);
    res.status(500).json({ error: "Failed to set default address." });
  }
});

// ============ QUOTES ENDPOINTS ============

// Create new quote request
app.post("/quotes", async (req, res) => {
  try {
    const quote = await quotes.createQuote(req.body);
    res.status(201).json({ quote });
  } catch (error) {
    functions.logger.error("Error creating quote", error);
    res.status(500).json({ error: "Failed to create quote request." });
  }
});

// Get quote by ID
app.get("/quotes/:id", async (req, res) => {
  try {
    const quote = await quotes.getQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }
    res.status(200).json({ quote });
  } catch (error) {
    functions.logger.error("Error fetching quote", error);
    res.status(500).json({ error: "Failed to fetch quote." });
  }
});

// Get quotes by customer userId
app.get("/quotes", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const userQuotes = await quotes.getQuotesByCustomer(userId);
    res.status(200).json({ quotes: userQuotes });
  } catch (error) {
    functions.logger.error("Error fetching customer quotes", error);
    res.status(500).json({ error: "Failed to fetch quotes." });
  }
});

// Update quote (admin only)
app.put("/quotes/:id", requireAuth, async (req, res) => {
  try {
    const { status, editedItems } = req.body;
    const updatePayload = { ...req.body };

    // Handle price edits if provided
    if (editedItems && Array.isArray(editedItems)) {
      // Get current quote to merge with edited prices
      const currentQuote = await quotes.getQuoteById(req.params.id);
      if (!currentQuote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      // Create updated items array with edited prices
      const updatedItems = currentQuote.items.map((item) => {
        const editedItem = editedItems.find((e) => e.id === item.id);
        if (editedItem) {
          const newPrice = Number(editedItem.price);
          const newSubtotal = newPrice * item.quantity;
          return {
            ...item,
            price: newPrice,
            subtotal: newSubtotal,
          };
        }
        return item;
      });

      // Recalculate totals
      const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = subtotal * 0.20; // 20% KDV
      const total = subtotal + tax;

      // Add items and totals to update payload
      updatePayload.items = updatedItems;
      updatePayload.totals = {
        subtotal,
        tax,
        total,
        currency: currentQuote.totals?.currency || "TRY",
      };

      functions.logger.info("Quote prices updated", {
        quoteId: req.params.id,
        oldSubtotal: currentQuote.totals?.subtotal,
        newSubtotal: subtotal,
      });
    }

    const updatedQuote = await quotes.updateQuote(req.params.id, updatePayload);

    // Send email notification when status changes
    if (status === "approved") {
      try {
        // Generate PDF for approved quote
        const { generateQuotePDF } = await import("./pdf/quote-generator.js");
        const pdfBuffer = await generateQuotePDF(updatedQuote);

        // Send approval email with PDF attachment
        await emailSender.sendQuoteApprovedEmail(updatedQuote, pdfBuffer);
        functions.logger.info(`Quote approved email sent to ${updatedQuote.customer.email}`);
      } catch (emailError) {
        functions.logger.error("Error sending quote approved email", emailError);
        // Don't fail the request if email fails
      }
    } else if (status === "rejected") {
      try {
        // Send rejection email
        await emailSender.sendQuoteRejectedEmail(updatedQuote);
        functions.logger.info(`Quote rejected email sent to ${updatedQuote.customer.email}`);
      } catch (emailError) {
        functions.logger.error("Error sending quote rejected email", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({ quote: updatedQuote });
  } catch (error) {
    functions.logger.error("Error updating quote", error);
    res.status(500).json({ error: "Failed to update quote." });
  }
});

// List all quotes (admin only)
app.get("/admin/quotes", requireAuth, async (req, res) => {
  try {
    const allQuotes = await quotes.listQuotes(req.query || {});
    res.status(200).json({ quotes: allQuotes });
  } catch (error) {
    functions.logger.error("Error listing quotes", error);
    res.status(500).json({ error: "Failed to list quotes." });
  }
});

// Delete quote (admin only)
app.delete("/quotes/:id", requireAuth, async (req, res) => {
  try {
    await quotes.deleteQuote(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    functions.logger.error("Error deleting quote", error);
    res.status(500).json({ error: "Failed to delete quote." });
  }
});

// Generate PDF for quote
app.get("/quotes/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const quote = await quotes.getQuoteById(id);

    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    // Import PDF generator
    const { generateQuotePDF } = await import("./pdf/quote-generator.js");

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(quote);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="teklif-${quote.quoteNumber || quote.id}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    functions.logger.error("Error generating quote PDF", error);
    res.status(500).json({ error: "Failed to generate PDF." });
  }
});

// ============ ORDERS ENDPOINTS ============

app.get("/orders", requireAuth, async (req, res) => {
  try {
    const orderList = await orders.listOrders(req.query || {});
    res.status(200).send({ orders: orderList });
  } catch (error) {
    functions.logger.error("Error listing orders", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

app.get("/orders/:id", requireAuth, async (req, res) => {
  try {
    const order = await orders.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).send({ error: "Order not found." });
    }
    res.status(200).send({ order });
  } catch (error) {
    handleError(res, error);
  }
});

app.put("/orders/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).send({ error: "Status is required." });
    }
    const order = await orders.updateOrderStatus(req.params.id, status);
    if (!order) {
      return res.status(404).send({ error: "Order not found." });
    }
    res.status(200).send({ order });
  } catch (error) {
    functions.logger.error("Error updating order status", error);
    res.status(500).json({ error: "Failed to update order status." });
  }
});

const statsOverviewHandler = async (req, res) => {
  try {
    const stats = await orders.getStatsOverview(req.query || {});
    res.status(200).send(stats);
  } catch (error) {
    functions.logger.error("Error computing order statistics", error);
    res.status(500).json({ error: "Failed to compute statistics." });
  }
};

app.get("/orders/stats/overview", requireAuth, statsOverviewHandler);
app.get("/stats/overview", requireAuth, statsOverviewHandler);

// OLD: Single product sample request (legacy)
const createSampleRequestHandler = async (req, res) => {
  try {
    const { name, email, product } = req.body || {};
    if (!name || !email || !product) {
      return res.status(400).send({ error: "Name, email, and product are required." });
    }
    const sample = await samples.createSampleRequest(req.body || {});
    res.status(201).send({ message: "Sample request received", sample });
  } catch (error) {
    functions.logger.error("Error creating sample request", error);
    res.status(500).json({ error: "Failed to create sample request." });
  }
};

app.post("/sample-requests", createSampleRequestHandler);
app.post("/samples", createSampleRequestHandler);

// ============ SAMPLES ENDPOINTS (NEW SYSTEM) ============

// NEW: Create sample request from cart
app.post("/samples/from-cart", async (req, res) => {
  try {
    const sample = await samples.createSampleFromCart(req.body);
    res.status(201).json({ sample });
  } catch (error) {
    functions.logger.error("Error creating cart sample", error);
    res.status(500).json({ error: "Failed to create sample request." });
  }
});

// Get sample by ID
app.get("/samples/:id", async (req, res) => {
  try {
    const sample = await samples.getSampleById(req.params.id);
    if (!sample) {
      return res.status(404).json({ error: "Sample not found" });
    }
    res.status(200).json({ sample });
  } catch (error) {
    functions.logger.error("Error fetching sample", error);
    res.status(500).json({ error: "Failed to fetch sample." });
  }
});

// Get samples by customer userId
app.get("/samples/customer/:userId", async (req, res) => {
  try {
    const userSamples = await samples.getSamplesByCustomer(req.params.userId);
    res.status(200).json({ samples: userSamples });
  } catch (error) {
    functions.logger.error("Error fetching customer samples", error);
    res.status(500).json({ error: "Failed to fetch samples." });
  }
});

// Update sample status (admin only)
app.put("/samples/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }
    const updatedSample = await samples.updateSampleStatus(req.params.id, status);

    // Send email notification when sample is approved
    if (status === "approved") {
      try {
        await emailSender.sendSampleApprovedEmail(updatedSample);
        functions.logger.info(`Sample approved email sent to ${updatedSample.customer.email}`);
      } catch (emailError) {
        functions.logger.error("Error sending sample approved email", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({ sample: updatedSample });
  } catch (error) {
    functions.logger.error("Error updating sample status", error);
    res.status(500).json({ error: "Failed to update sample status." });
  }
});

// List all samples (admin only)
app.get("/admin/samples", requireAuth, async (req, res) => {
  try {
    const allSamples = await samples.listSamples(req.query || {});
    res.status(200).json({ samples: allSamples });
  } catch (error) {
    functions.logger.error("Error listing samples", error);
    res.status(500).json({ error: "Failed to list samples." });
  }
});

// ============ VIP CUSTOMER MANAGEMENT ENDPOINTS ============

// Get user VIP status (authenticated users)
app.get("/user/vip-status", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const user = await vip.getUserWithVIPStatus(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ vipStatus: user.vipStatus });
  } catch (error) {
    functions.logger.error("Error fetching VIP status", error);
    res.status(500).json({ error: "Failed to fetch VIP status." });
  }
});

// Update VIP status for a user (recalculate based on stats)
app.post("/admin/vip/calculate/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const vipStatus = await vip.updateUserVIPStatus(userId);
    res.status(200).json({ message: "VIP status updated", vipStatus });
  } catch (error) {
    functions.logger.error("Error calculating VIP status", error);
    res.status(500).json({ error: "Failed to calculate VIP status." });
  }
});

// Manually set VIP tier (admin override)
app.put("/admin/vip/set-tier/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;

    if (!tier && tier !== null) {
      return res.status(400).json({ error: "tier is required" });
    }

    const vipStatus = await vip.manuallySetVIPTier(userId, tier);
    res.status(200).json({ message: "VIP tier set manually", vipStatus });
  } catch (error) {
    functions.logger.error("Error setting VIP tier", error);
    res.status(500).json({ error: error.message || "Failed to set VIP tier." });
  }
});

// Calculate all customer VIP statuses (batch operation)
app.post("/admin/vip/calculate-all", requireAuth, async (_req, res) => {
  try {
    functions.logger.info("Starting batch VIP calculation for all customers");
    const results = await vip.calculateAllCustomerVIPStatuses();
    res.status(200).json({
      message: "Batch VIP calculation completed",
      results,
    });
  } catch (error) {
    functions.logger.error("Error in batch VIP calculation", error);
    res.status(500).json({ error: "Failed to calculate VIP statuses." });
  }
});

// Get all VIP tiers information
app.get("/vip/tiers", async (_req, res) => {
  try {
    const tiers = vip.getAllVIPTiers();
    res.status(200).json({ tiers });
  } catch (error) {
    functions.logger.error("Error fetching VIP tiers", error);
    res.status(500).json({ error: "Failed to fetch VIP tiers." });
  }
});

// List customers with VIP/segment filtering (admin)
app.get("/admin/customers", requireAuth, async (req, res) => {
  try {
    const { tier, segment } = req.query;
    const customers = await vip.listCustomersWithVIP({ tier, segment });
    res.status(200).json({ customers });
  } catch (error) {
    functions.logger.error("Error listing customers", error);
    res.status(500).json({ error: "Failed to list customers." });
  }
});

// Get customer statistics (admin)
app.get("/admin/customers/:userId/stats", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await vip.calculateCustomerStats(userId);
    res.status(200).json({ stats });
  } catch (error) {
    functions.logger.error("Error fetching customer stats", error);
    res.status(500).json({ error: "Failed to fetch customer stats." });
  }
});

// ============ EXCHANGE RATE ENDPOINTS ============

// Exchange Rate endpoints
app.get("/exchange-rate", async (_req, res) => {
  try {
    const rate = await exchangeRates.getCurrentRate("USD");
    res.status(200).json({ exchangeRate: rate });
  } catch (error) {
    functions.logger.error("Error fetching exchange rate", error);
    res.status(500).json({ error: "Failed to fetch exchange rate." });
  }
});

app.get("/exchange-rate/history", requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query?.limit || "30", 10);
    const history = await exchangeRates.getRateHistory("USD", limit);
    res.status(200).json({ history });
  } catch (error) {
    functions.logger.error("Error fetching rate history", error);
    res.status(500).json({ error: "Failed to fetch rate history." });
  }
});

app.post("/exchange-rate/update", requireAuth, async (_req, res) => {
  try {
    functions.logger.info("Manual exchange rate update requested");
    const rateData = await fetchTCMBRate();
    const result = await exchangeRates.saveExchangeRate(rateData);
    res.status(200).json({ 
      message: "Exchange rate updated successfully", 
      exchangeRate: result.data 
    });
  } catch (error) {
    functions.logger.error("Error manually updating exchange rate", error);
    res.status(500).json({ error: "Failed to update exchange rate." });
  }
});

// Migration: Convert legacy TRY pricing to USD-only
app.post("/products/migrate-try-to-usd", requireAuth, async (_req, res) => {
  try {
    const rate = await exchangeRates.getCurrentRate("USD");
    const fx = rate?.rate;
    if (!fx || !Number.isFinite(fx) || fx <= 0) {
      return res.status(500).json({ error: "Invalid exchange rate." });
    }
    const result = await catalog.migrateTryToUSD(fx);
    res.status(200).json({ message: "Migration completed", exchangeRate: fx, result });
  } catch (error) {
    functions.logger.error("TRY->USD migration failed", { message: error.message, stack: error.stack });
    res.status(500).json({ error: "Migration failed." });
  }
});

// Migration endpoint: Fix orders with packageInfo
app.post("/admin/migrate-orders", async (req, res) => {
  try {
    functions.logger.info("Starting order migration...");

    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    // Get all orders
    const ordersSnapshot = await ordersCollection.get();
    functions.logger.info(`Found ${ordersSnapshot.size} orders to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const orderDoc of ordersSnapshot.docs) {
      const orderId = orderDoc.id;
      const orderData = orderDoc.data();

      try {
        let needsUpdate = false;
        const updatedItems = [];

        for (const item of orderData.items || []) {
          // Skip if already has packageInfo
          if (item.packageInfo) {
            updatedItems.push(item);
            continue;
          }

          // Fetch product data
          const productDoc = await productsCollection.doc(item.id).get();
          if (!productDoc.exists) {
            updatedItems.push(item);
            continue;
          }

          const productData = productDoc.data();
          const packageInfo = productData.packageInfo || null;
          const category = productData.category || item.category || null;

          // Calculate correct subtotal
          let subtotal = item.subtotal;
          if (packageInfo && packageInfo.itemsPerBox) {
            const actualQuantity = item.quantity * packageInfo.itemsPerBox;
            subtotal = item.price * actualQuantity;
            needsUpdate = true;
          }

          updatedItems.push({
            ...item,
            packageInfo,
            category,
            subtotal
          });
        }

        // Update order if needed
        if (needsUpdate) {
          // Recalculate order subtotal
          const newSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
          const shippingTotal = orderData.totals?.shippingTotal || 0;
          const discountTotal = orderData.totals?.discountTotal || 0;
          const newTotal = newSubtotal + shippingTotal - discountTotal;

          await ordersCollection.doc(orderId).update({
            items: updatedItems,
            "totals.subtotal": newSubtotal,
            "totals.total": newTotal,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          results.push({
            orderId,
            status: "updated",
            oldSubtotal: orderData.totals?.subtotal || 0,
            newSubtotal
          });
          updatedCount++;
        } else {
          skippedCount++;
        }

      } catch (error) {
        functions.logger.error(`Error processing order ${orderId}`, error);
        results.push({
          orderId,
          status: "error",
          error: error.message
        });
        errorCount++;
      }
    }

    functions.logger.info("Migration complete", { updatedCount, skippedCount, errorCount });
    res.status(200).json({
      message: "Migration completed",
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      results
    });

  } catch (error) {
    functions.logger.error("Migration failed", error);
    res.status(500).json({ error: "Migration failed: " + error.message });
  }
});

// Export scheduled functions
export { updateExchangeRate, forceUpdateExchangeRate } from "./scheduled/update-exchange-rate.js";

export const api = functions.https.onRequest(app);
