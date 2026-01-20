import * as functions from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { getStorage } from "firebase-admin/storage";
import express from "express";
import cors from "cors";
import slugify from "slugify";
import Busboy from "busboy";
import path from "path";
import os from "os";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";
import dotenv from "dotenv";

import * as catalog from "./db/catalog.js";
import * as media from "./db/media.js";
import * as orders from "./db/orders.js";
import * as samples from "./db/samples.js";
import * as auth from "./db/auth.js";
import * as exchangeRates from "./db/exchange-rates.js";
import * as users from "./db/users.js";
import * as quotes from "./db/quotes.js";
import * as comboSettings from "./db/combo-settings.js";
import * as settings from "./db/settings.js";
import * as adminRoles from "./db/admin-roles.js";
import * as analytics from "./db/analytics.js";
import * as emailSender from "./email/sender.js";
import * as paytr from "./payment/paytr.js";
import { fetchTCMBRate } from "./services/exchange-rate.js";
import { db } from "./db/client.js";
import admin from "firebase-admin";

// Security middleware
import {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  formLimiter,
  securityHeaders,
  sanitizeBody,
  sanitizeQuery,
  preventNoSQLInjection,
  securityLogger,
  recaptchaMiddleware
} from "./middleware/security.js";

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

// Thumbnail settings
const THUMBNAIL_MAX_WIDTH = 800;
const THUMBNAIL_QUALITY = 80;

/**
 * Generate a WebP thumbnail from an image file
 * @param {string} inputPath - Path to the original image
 * @param {string} outputPath - Path to save the thumbnail
 * @returns {Promise<{success: boolean, size?: number, error?: string}>}
 */
const generateThumbnail = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .resize(THUMBNAIL_MAX_WIDTH, null, {
        withoutEnlargement: true, // Don't upscale small images
        fit: "inside"
      })
      .webp({ quality: THUMBNAIL_QUALITY })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    return { success: true, size: stats.size };
  } catch (error) {
    functions.logger.error("Thumbnail generation failed", { error: error.message });
    return { success: false, error: error.message };
  }
};

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

// Middleware to require super admin role
const requireSuperAdmin = async (req, res, next) => {
  if (!req.admin || !req.admin.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Check if this is the primary admin from .env (always has super_admin access)
    const primaryAdminEmail = process.env.ADMIN_EMAIL;
    if (primaryAdminEmail && req.admin.email.toLowerCase() === primaryAdminEmail.toLowerCase()) {
      req.admin.userId = "primary_admin";
      req.admin.isPrimaryAdmin = true;
      return next();
    }

    // Get user by email
    const user = await users.getUserByEmail(req.admin.email);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check if user is super admin
    const isSuperAdmin = await adminRoles.isSuperAdmin(user.uid);
    if (!isSuperAdmin) {
      functions.logger.warn("Insufficient permissions", {
        email: req.admin.email,
        uid: user.uid
      });
      return res.status(403).json({ error: "Insufficient permissions. Super admin role required." });
    }

    req.admin.userId = user.uid;
    next();
  } catch (error) {
    functions.logger.error("Super admin check failed", error);
    return res.status(500).json({ error: "Authorization check failed" });
  }
};

// Middleware to require admin role (admin or super_admin)
const requireAdmin = async (req, res, next) => {
  if (!req.admin || !req.admin.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Check if this is the primary admin from .env (always has admin access)
    const primaryAdminEmail = process.env.ADMIN_EMAIL;
    if (primaryAdminEmail && req.admin.email.toLowerCase() === primaryAdminEmail.toLowerCase()) {
      req.admin.userId = "primary_admin";
      req.admin.isPrimaryAdmin = true;
      return next();
    }

    const user = await users.getUserByEmail(req.admin.email);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isAdmin = await adminRoles.isAdmin(user.uid);
    if (!isAdmin) {
      functions.logger.warn("Insufficient permissions", {
        email: req.admin.email,
        uid: user.uid
      });
      return res.status(403).json({ error: "Insufficient permissions. Admin role required." });
    }

    req.admin.userId = user.uid;
    next();
  } catch (error) {
    functions.logger.error("Admin check failed", error);
    return res.status(500).json({ error: "Authorization check failed" });
  }
};

const app = express();

// Apply CORS middleware first
app.use(cors({ origin: "*", credentials: true }));

// Security middleware - applied before other middleware
app.use(securityHeaders); // Helmet security headers
app.use(securityLogger); // Request logging for security monitoring
app.use(generalLimiter); // General rate limiting (100 req/15min)

// Then add other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input sanitization and protection
app.use(sanitizeBody); // XSS protection for request body
app.use(sanitizeQuery); // XSS protection for query params
app.use(preventNoSQLInjection); // NoSQL injection prevention

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
          const isImage = mimetype.startsWith("image/");
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

          // Generate thumbnail for images
          let thumbnailUrl = null;
          if (isImage) {
            // Handle both proper extensions (.jpg) and merged names (imagejpg from slugify)
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'avif'];
            let thumbName = safeName;
            let foundExt = false;
            for (const ext of imageExtensions) {
              if (safeName.toLowerCase().endsWith('.' + ext)) {
                thumbName = safeName.slice(0, -(ext.length + 1)) + '_thumb.webp';
                foundExt = true;
                break;
              } else if (safeName.toLowerCase().endsWith(ext)) {
                thumbName = safeName.slice(0, -ext.length) + '_thumb.webp';
                foundExt = true;
                break;
              }
            }
            if (!foundExt) {
              thumbName = safeName + '_thumb.webp';
            }
            const thumbTempPath = path.join(os.tmpdir(), thumbName);
            const thumbDestination = `uploads/${thumbName}`;

            const thumbResult = await generateThumbnail(tempPath, thumbTempPath);

            if (thumbResult.success) {
              try {
                await bucket.upload(thumbTempPath, {
                  destination: thumbDestination,
                  metadata: {
                    contentType: "image/webp",
                    metadata: {
                      originalName: finalFilename,
                      fileType: "thumbnail"
                    }
                  },
                  validation: "md5",
                  public: true
                });

                thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(thumbDestination)}?alt=media`;
                functions.logger.info("Thumbnail generated and uploaded", {
                  destination: thumbDestination,
                  size: thumbResult.size
                });
              } catch (thumbUploadError) {
                functions.logger.error("Thumbnail upload failed", { error: thumbUploadError.message });
              } finally {
                fs.unlink(thumbTempPath, () => {});
              }
            }
          }

          const created = await media.createMediaEntry({
            storageKey: destination,
            filename: safeName,
            originalName: filename,
            mimeType: mimetype,
            size: stats.size,
            url: publicUrl,
            thumbnailUrl: thumbnailUrl,
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

// Decode HTML entities that may have been encoded by browser/framework
const decodeHtmlEntities = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
};

const parseBulkPricing = (input, fallback = []) => {
  if (input === undefined || input === null || input === "") {
    return fallback;
  }

  let source = input;
  if (typeof source === "string") {
    // Decode HTML entities first (browser may encode JSON strings)
    const decoded = decodeHtmlEntities(source);
    const trimmed = decoded.trim();
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

// Auth login with strict rate limiting (5 attempts per 15 min)
app.post("/auth/login", authLimiter, async (req, res) => {
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
      productType = null,
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
      productType,
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
      productType: req.body?.productType !== undefined ? req.body.productType : existing.productType,
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

// Debug endpoint to see raw product data from Firestore
app.get("/admin/products/:id/raw", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const docRef = db.collection("products").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({
      id: doc.id,
      rawData: doc.data(),
    });
  } catch (error) {
    functions.logger.error("Error getting raw product", error);
    res.status(500).json({ error: error.message });
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
      variants,
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
      variants,
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

    // Debug logging
    functions.logger.info("Product update request", {
      productId: req.params.id,
      bulkPricingUSD_raw: body.bulkPricingUSD,
      bulkPricingUSD_type: typeof body.bulkPricingUSD,
      bulkPricingUSD_parsed: body.bulkPricingUSD !== undefined ? parseBulkPricing(body.bulkPricingUSD) : 'not_provided',
    });

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
      comboPriceUSD: body.comboPriceUSD,
      variants: body.variants,
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

// ==================== LANDING CONTENT (Homepage CMS) ====================

// Public endpoint - get landing page content
app.get("/landing-content", async (_req, res) => {
  try {
    const content = await settings.getLandingContent();
    res.json({ content });
  } catch (error) {
    functions.logger.error("Error fetching landing content", error);
    res.status(500).json({ error: "Failed to load landing content." });
  }
});

// Admin endpoint - update entire landing content
app.put("/admin/landing-content", requireAuth, async (req, res) => {
  try {
    const userId = req.admin?.email || "admin";
    const content = await settings.setLandingContent(req.body, userId);
    res.json({ content, message: "Landing content updated successfully" });
  } catch (error) {
    functions.logger.error("Error updating landing content", error);
    res.status(500).json({ error: "Failed to update landing content." });
  }
});

// Admin endpoint - update specific section
app.put("/admin/landing-content/:section", requireAuth, async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ["hero", "advantages", "howItWorks", "cta", "trustBadges", "sections"];

    if (!validSections.includes(section)) {
      return res.status(400).json({ error: `Invalid section. Valid sections: ${validSections.join(", ")}` });
    }

    const userId = req.admin?.email || "admin";
    const content = await settings.updateLandingContent(section, req.body, userId);
    res.json({ content, message: `${section} section updated successfully` });
  } catch (error) {
    functions.logger.error(`Error updating landing content section: ${req.params.section}`, error);
    res.status(500).json({ error: "Failed to update landing content section." });
  }
});

// Admin endpoint - reset landing content to defaults
app.post("/admin/landing-content/reset", requireAuth, async (req, res) => {
  try {
    const { section } = req.body; // Optional: reset specific section
    const userId = req.admin?.email || "admin";
    const content = await settings.resetLandingContent(section || null, userId);
    res.json({ content, message: section ? `${section} reset to defaults` : "All landing content reset to defaults" });
  } catch (error) {
    functions.logger.error("Error resetting landing content", error);
    res.status(500).json({ error: "Failed to reset landing content." });
  }
});

// Create order (rate limited: 10 per hour)
app.post("/orders", formLimiter, async (req, res) => {
  try {
    const order = await orders.createOrder(req.body || {});

    // For credit card payments, wait for PayTR callback to send emails
    // For bank transfer, send emails immediately
    if (order.paymentMethod !== "credit_card") {
      // Send order confirmation email to customer
      try {
        await emailSender.sendOrderConfirmationEmail(order);
        functions.logger.info("Order confirmation email sent", { orderId: order.id });
      } catch (emailError) {
        functions.logger.error("Failed to send order confirmation email", emailError);
        // Don't fail the request if email fails
      }

      // Send new order notification to admin
      try {
        const adminEmail = await emailSender.getAdminNotificationEmail();
        if (adminEmail) {
          await emailSender.sendNewOrderAdminEmail(order, adminEmail);
          functions.logger.info("New order admin notification sent", { orderId: order.id, adminEmail });
        }
      } catch (emailError) {
        functions.logger.error("Failed to send admin order notification", emailError);
      }
    } else {
      functions.logger.info("Credit card order - emails will be sent after payment confirmation", { orderId: order.id });
    }

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

// Public endpoint for users to get a single order by ID
app.get("/user/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const order = await orders.getOrderById(id);

    if (!order) {
      return res.status(404).json({ error: "Sipariş bulunamadı" });
    }

    // Verify that the order belongs to the user
    if (order.customer?.userId !== userId) {
      return res.status(403).json({ error: "Bu siparişe erişim yetkiniz yok" });
    }

    res.status(200).json({ order });
  } catch (error) {
    functions.logger.error("Error fetching user order", error);
    res.status(500).json({ error: "Sipariş yüklenirken hata oluştu" });
  }
});

// Upload payment receipt for bank transfer orders
app.post("/orders/:orderId/receipt", async (req, res) => {
  const { orderId } = req.params;

  try {
    // Check if order exists
    const order = await orders.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Sipariş bulunamadı" });
    }

    const Busboy = (await import("busboy")).default;
    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    });

    let uploadedFile = null;
    let uploadError = null;

    busboy.on("file", async (fieldname, file, { filename, mimeType }) => {
      functions.logger.info("Processing receipt upload", { orderId, filename, mimeType });

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(mimeType)) {
        uploadError = "Sadece resim (JPG, PNG, WebP) veya PDF dosyası yükleyebilirsiniz.";
        file.resume();
        return;
      }

      const timestamp = Date.now();
      const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `receipts/${orderId}/${timestamp}-${safeFilename}`;
      const tempPath = path.join(os.tmpdir(), `${timestamp}-${safeFilename}`);

      const writeStream = fs.createWriteStream(tempPath);
      file.pipe(writeStream);

      file.on("limit", () => {
        uploadError = "Dosya boyutu 10MB'dan büyük olamaz.";
        file.unpipe(writeStream);
        writeStream.destroy();
        fs.unlink(tempPath, () => {});
      });

      await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      if (uploadError) return;

      try {
        const bucket = getStorage().bucket();
        await bucket.upload(tempPath, {
          destination: storagePath,
          metadata: { contentType: mimeType },
          public: true,
        });

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

        uploadedFile = {
          url: publicUrl,
          filename: filename,
          mimeType: mimeType,
          uploadedAt: new Date().toISOString(),
        };

        functions.logger.info("Receipt uploaded successfully", { orderId, url: publicUrl });
      } catch (err) {
        functions.logger.error("Receipt upload to storage failed", { error: err.message });
        uploadError = "Dosya yüklenirken hata oluştu.";
      } finally {
        fs.unlink(tempPath, () => {});
      }
    });

    busboy.on("finish", async () => {
      if (uploadError) {
        return res.status(400).json({ error: uploadError });
      }

      if (!uploadedFile) {
        return res.status(400).json({ error: "Dosya seçilmedi." });
      }

      try {
        // Update order with receipt info
        await orders.updateOrder(orderId, {
          paymentReceipt: uploadedFile,
          paymentReceiptUploadedAt: uploadedFile.uploadedAt,
        });

        res.json({ success: true, receipt: uploadedFile });
      } catch (err) {
        functions.logger.error("Failed to update order with receipt", { error: err.message });
        res.status(500).json({ error: "Sipariş güncellenirken hata oluştu." });
      }
    });

    busboy.on("error", (error) => {
      functions.logger.error("Busboy error", { error: error.message });
      res.status(500).json({ error: "Dosya yüklenirken hata oluştu." });
    });

    // Check if rawBody is available and is a buffer (same pattern as /media endpoint)
    const hasRawBodyBuffer = Buffer.isBuffer(req.rawBody);
    if (hasRawBodyBuffer) {
      busboy.end(req.rawBody);
    } else {
      req.pipe(busboy);
    }
  } catch (error) {
    functions.logger.error("Receipt upload error", { error: error.message });
    res.status(500).json({ error: "Dekont yüklenirken hata oluştu." });
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
    let isNewUser = false;

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

        isNewUser = true;
        functions.logger.info("User profile created successfully", { userId, email: authUser.email });
      } catch (createError) {
        functions.logger.error("Failed to create user profile from Auth", { userId, error: createError });
        return res.status(404).json({ error: "User not found" });
      }
    }

    // Send welcome email if new user was created
    if (isNewUser && user.email) {
      try {
        await emailSender.sendWelcomeEmail(user);
        functions.logger.info("Welcome email sent to new user", { userId, email: user.email });
      } catch (emailError) {
        functions.logger.error("Failed to send welcome email", emailError);
        // Don't fail the request if email fails
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

    // Send welcome email to new user
    try {
      await emailSender.sendWelcomeEmail(newUser);
      functions.logger.info("Welcome email sent", { userId, email: newUser.email });
    } catch (emailError) {
      functions.logger.error("Failed to send welcome email", emailError);
      // Don't fail the request if email fails
    }

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

// Create new quote request (rate limited: 10 per hour, reCAPTCHA protected)
app.post("/quotes", formLimiter, recaptchaMiddleware("quote_request"), async (req, res) => {
  try {
    const quote = await quotes.createQuote(req.body);

    // Send new quote notification to admin
    try {
      const adminEmail = await emailSender.getAdminNotificationEmail();
      if (adminEmail) {
        await emailSender.sendNewQuoteAdminEmail(quote, adminEmail);
        functions.logger.info("New quote admin notification sent", { quoteId: quote.id, adminEmail });
      }
    } catch (emailError) {
      functions.logger.error("Failed to send admin quote notification", emailError);
    }

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
    const { status, trackingNumber, trackingUrl, adminNotes, carrier } = req.body || {};
    if (!status) {
      return res.status(400).send({ error: "Status is required." });
    }

    // Build update payload with optional fields
    const updateData = { status };
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (carrier !== undefined) updateData.carrier = carrier;
    if (status === "shipped") updateData.shippedAt = new Date().toISOString();

    const order = await orders.updateOrderStatus(req.params.id, status, updateData);
    if (!order) {
      return res.status(404).send({ error: "Order not found." });
    }

    // Send email notification based on status
    try {
      if (status === "shipped" && trackingNumber) {
        // Send dedicated shipping notification with tracking info
        await emailSender.sendShippingNotificationEmail(order);
        functions.logger.info("Shipping notification email sent", { orderId: order.id, trackingNumber });
      } else {
        // Send general status update email
        await emailSender.sendOrderStatusEmail(order);
        functions.logger.info("Order status email sent", { orderId: order.id, status });
      }
    } catch (emailError) {
      functions.logger.error("Failed to send order status email", emailError);
      // Don't fail the request if email fails
    }

    res.status(200).send({ order });
  } catch (error) {
    functions.logger.error("Error updating order status", error);
    res.status(500).json({ error: "Failed to update order status." });
  }
});

// Cancel order endpoint - used when user cancels payment
app.post("/orders/:id/cancel", async (req, res) => {
  try {
    const orderId = req.params.id;

    // First check if order exists and is in pending_payment status
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = orderDoc.data();

    // Only allow cancellation of pending_payment orders
    if (orderData.status !== "pending_payment") {
      return res.status(400).json({ error: "Order cannot be cancelled" });
    }

    // Update order status to cancelled
    await orders.updateOrder(orderId, {
      status: "cancelled",
      paymentStatus: "failed",
      cancelledAt: new Date().toISOString(),
      cancelReason: "user_cancelled"
    });

    functions.logger.info("Order cancelled by user", { orderId });
    res.json({ success: true });
  } catch (error) {
    functions.logger.error("Error cancelling order", error);
    res.status(500).json({ error: "Failed to cancel order" });
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

// ===== ADVANCED ANALYTICS ENDPOINTS =====

// Dashboard summary - quick overview for admin home
app.get("/admin/analytics/dashboard", requireAuth, async (req, res) => {
  try {
    const summary = await analytics.getDashboardSummary();
    res.status(200).json(summary);
  } catch (error) {
    functions.logger.error("Error getting dashboard summary", error);
    res.status(500).json({ error: "Failed to get dashboard summary" });
  }
});

// Sales report - detailed sales breakdown
app.get("/admin/analytics/sales", requireAuth, async (req, res) => {
  try {
    const { period, from, to, groupBy } = req.query;
    const report = await analytics.getSalesReport({ period, from, to, groupBy });
    res.status(200).json(report);
  } catch (error) {
    functions.logger.error("Error getting sales report", error);
    res.status(500).json({ error: "Failed to get sales report" });
  }
});

// Customer analytics
app.get("/admin/analytics/customers", requireAuth, async (req, res) => {
  try {
    const { period } = req.query;
    const customerData = await analytics.getCustomerAnalytics({ period });
    res.status(200).json(customerData);
  } catch (error) {
    functions.logger.error("Error getting customer analytics", error);
    res.status(500).json({ error: "Failed to get customer analytics" });
  }
});

// Product analytics
app.get("/admin/analytics/products", requireAuth, async (req, res) => {
  try {
    const { period, limit } = req.query;
    const productData = await analytics.getProductAnalytics({
      period,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    res.status(200).json(productData);
  } catch (error) {
    functions.logger.error("Error getting product analytics", error);
    res.status(500).json({ error: "Failed to get product analytics" });
  }
});

// Export data to CSV
app.get("/admin/analytics/export/:type", requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { period, from, to, groupBy } = req.query;

    if (!["orders", "customers", "products", "sales"].includes(type)) {
      return res.status(400).json({ error: "Invalid export type" });
    }

    const csvData = await analytics.exportToCSV(type, { period, from, to, groupBy });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${type}-export-${new Date().toISOString().slice(0, 10)}.csv`);
    res.status(200).send("\uFEFF" + csvData); // BOM for Excel UTF-8 compatibility
  } catch (error) {
    functions.logger.error("Error exporting data", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

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

app.post("/sample-requests", formLimiter, recaptchaMiddleware("sample_request"), createSampleRequestHandler);
app.post("/samples", formLimiter, recaptchaMiddleware("sample_request"), createSampleRequestHandler);

// ============ SAMPLES ENDPOINTS (NEW SYSTEM) ============

// NEW: Create sample request from cart (rate limited: 10 per hour, reCAPTCHA protected)
app.post("/samples/from-cart", formLimiter, recaptchaMiddleware("sample_from_cart"), async (req, res) => {
  try {
    const sample = await samples.createSampleFromCart(req.body);

    // Send new sample notification to admin
    try {
      const adminEmail = await emailSender.getAdminNotificationEmail();
      if (adminEmail) {
        await emailSender.sendNewSampleAdminEmail(sample, adminEmail);
        functions.logger.info("New sample admin notification sent", { sampleId: sample.id, adminEmail });
      }
    } catch (emailError) {
      functions.logger.error("Failed to send admin sample notification", emailError);
    }

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
    const { status, trackingNumber, carrier } = req.body;
    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }
    const shippingInfo = { trackingNumber, carrier };
    const updatedSample = await samples.updateSampleStatus(req.params.id, status, shippingInfo);

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

    // Send shipping notification when sample is shipped
    if (status === "shipped" && trackingNumber) {
      try {
        await emailSender.sendSampleShippingNotificationEmail(updatedSample);
        functions.logger.info(`Sample shipping notification sent to ${updatedSample.customer?.email}`);
      } catch (emailError) {
        functions.logger.error("Error sending sample shipping notification", emailError);
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

// ============ CONTACT ENDPOINT ============

// Contact form submission (rate limited: 10 per hour, reCAPTCHA protected)
app.post("/contact", formLimiter, recaptchaMiddleware("contact_form"), async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Ad, e-posta, konu ve mesaj alanları zorunludur." });
    }

    // Save contact message to Firestore
    const contactRef = db.collection("contactMessages").doc();
    const contactData = {
      id: contactRef.id,
      name,
      email,
      phone: phone || "",
      subject,
      message,
      status: "unread",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ip: req.headers["x-forwarded-for"] || req.ip,
      recaptchaScore: req.recaptchaResult?.score || null,
    };

    await contactRef.set(contactData);

    // Send email notification to admin
    try {
      const adminEmail = await emailSender.getAdminNotificationEmail();
      if (adminEmail) {
        await emailSender.sendMail({
          to: adminEmail,
          subject: `[Yeni İletişim] ${subject}`,
          html: `
            <h2>Yeni İletişim Formu Mesajı</h2>
            <p><strong>Ad Soyad:</strong> ${name}</p>
            <p><strong>E-posta:</strong> ${email}</p>
            <p><strong>Telefon:</strong> ${phone || "Belirtilmedi"}</p>
            <p><strong>Konu:</strong> ${subject}</p>
            <p><strong>Mesaj:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Bu mesaj spreyvalfdunyasi.com iletişim formundan gönderilmiştir.
            </p>
          `,
        });
        functions.logger.info("Contact form admin notification sent", { contactId: contactRef.id, adminEmail });
      }
    } catch (emailError) {
      functions.logger.error("Failed to send contact admin notification", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({ success: true, message: "Mesajınız başarıyla gönderildi." });
  } catch (error) {
    functions.logger.error("Error processing contact form", error);
    res.status(500).json({ error: "Mesaj gönderilirken bir hata oluştu." });
  }
});

// ===== COMBO DISCOUNT SETTINGS =====

// Get combo discount settings
app.get("/combo-settings", async (_req, res) => {
  try {
    let settings = await comboSettings.getComboSettings();

    // Initialize if not exists
    if (!settings) {
      settings = await comboSettings.initializeComboSettings();
    }

    res.status(200).json({ settings });
  } catch (error) {
    functions.logger.error("Error fetching combo settings", error);
    res.status(500).json({ error: "Failed to fetch combo settings." });
  }
});

// Update combo discount settings (admin)
app.put("/admin/combo-settings", requireAuth, async (req, res) => {
  try {
    const { isActive, discountType, discountValue, applicableTypes, requireSameNeckSize, minQuantity } = req.body;

    const updatedSettings = await comboSettings.setComboSettings({
      isActive,
      discountType,
      discountValue,
      applicableTypes,
      requireSameNeckSize,
      minQuantity,
    });

    res.status(200).json({ settings: updatedSettings });
  } catch (error) {
    functions.logger.error("Error updating combo settings", error);
    res.status(500).json({ error: "Failed to update combo settings." });
  }
});

// Toggle combo discount active status (admin)
app.post("/admin/combo-settings/toggle", requireAuth, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }

    const updatedSettings = await comboSettings.toggleComboActive(isActive);

    res.status(200).json({ settings: updatedSettings });
  } catch (error) {
    functions.logger.error("Error toggling combo active status", error);
    res.status(500).json({ error: "Failed to toggle combo status." });
  }
});

// List customers (admin)
app.get("/admin/customers", requireAuth, async (req, res) => {
  try {
    const usersCollection = db.collection("users");
    const snapshot = await usersCollection.get();
    const customers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || "",
        displayName: data.displayName || "",
        company: data.company || "",
        createdAt: data.createdAt,
      };
    });
    res.status(200).json({ customers });
  } catch (error) {
    functions.logger.error("Error listing customers", error);
    res.status(500).json({ error: "Failed to list customers." });
  }
});

// Update all products to inherit productType from their category (admin)
app.post("/admin/update-products-from-categories", requireAuth, async (_req, res) => {
  try {
    const { db } = await import("./db/client.js");
    const categoriesCollection = db.collection("categories");
    const productsCollection = db.collection("products");

    // Get all categories
    const categoriesSnapshot = await categoriesCollection.get();
    const categories = {};
    categoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      categories[doc.id] = {
        id: doc.id,
        name: data.name,
        productType: data.productType || null,
      };
    });

    // Get all products
    const productsSnapshot = await productsCollection.get();
    let updated = 0;
    let skipped = 0;

    const batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH = 500;

    for (const doc of productsSnapshot.docs) {
      const data = doc.data();
      const categoryId = data.category;
      const currentProductType = data.productType;

      if (!categoryId || !categories[categoryId]) {
        skipped++;
        continue;
      }

      const newProductType = categories[categoryId].productType;

      if (currentProductType === newProductType) {
        skipped++;
        continue;
      }

      batch.update(doc.ref, {
        productType: newProductType,
        updatedAt: new Date(),
      });

      updated++;
      batchCount++;

      if (batchCount >= MAX_BATCH) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    res.status(200).json({
      message: "Products updated successfully",
      total: productsSnapshot.size,
      updated,
      skipped,
    });
  } catch (error) {
    functions.logger.error("Error updating products from categories", error);
    res.status(500).json({ error: "Failed to update products." });
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

// Manual exchange rate update (admin enters custom rate)
app.post("/admin/exchange-rate/manual", requireAuth, async (req, res) => {
  try {
    const { rate } = req.body;

    if (!rate || !Number.isFinite(Number(rate)) || Number(rate) <= 0) {
      return res.status(400).json({ error: "Valid rate is required" });
    }

    const rateData = {
      currency: "USD",
      rate: Number(rate),
      source: "manual",
      effectiveDate: new Date().toISOString().split("T")[0],
    };

    const result = await exchangeRates.saveExchangeRate(rateData);

    functions.logger.info("Manual exchange rate set", { rate: rateData.rate });
    res.status(200).json({
      message: "Exchange rate updated manually",
      exchangeRate: result.data
    });
  } catch (error) {
    functions.logger.error("Error setting manual exchange rate", error);
    res.status(500).json({ error: "Failed to set exchange rate." });
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

// ==================== SETTINGS ENDPOINTS ====================

// Public endpoint to get pricing settings (for frontend to display correct VAT)
app.get("/pricing-settings", async (_req, res) => {
  try {
    const pricingSettings = await settings.getSiteSettings("pricing");

    // Only return public pricing info (not sensitive data)
    const publicSettings = {
      taxRate: pricingSettings?.taxRate || 20,
      currency: pricingSettings?.currency || "TRY",
      showPricesWithTax: pricingSettings?.showPricesWithTax ?? true,
    };

    res.status(200).json({ settings: publicSettings });
  } catch (error) {
    functions.logger.error("Failed to get pricing settings", error);
    // Return defaults on error
    res.status(200).json({
      settings: {
        taxRate: 20,
        currency: "TRY",
        showPricesWithTax: true
      }
    });
  }
});

// Get all site settings (authenticated users)
app.get("/settings", requireAuth, async (_req, res) => {
  try {
    const allSettings = await settings.getAllSiteSettings();
    res.status(200).json({ settings: allSettings });
  } catch (error) {
    functions.logger.error("Failed to get settings", error);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

// Get public site settings (no auth required - for header/footer)
app.get("/settings/site/public", async (_req, res) => {
  try {
    const siteSettings = await settings.getSiteSettings("site");

    // Return public site settings (no sensitive data)
    res.status(200).json({
      settings: {
        section: "site",
        siteName: siteSettings?.siteName || "SVD Ambalaj",
        siteDescription: siteSettings?.siteDescription || "",
        supportEmail: siteSettings?.supportEmail || "",
        supportPhone: siteSettings?.supportPhone || "",
        // Logo
        logoUrl: siteSettings?.logoUrl || "",
        logoAlt: siteSettings?.logoAlt || "",
        faviconUrl: siteSettings?.faviconUrl || "",
        // Address
        address: siteSettings?.address || "",
        city: siteSettings?.city || "",
        district: siteSettings?.district || "",
        postalCode: siteSettings?.postalCode || "",
        country: siteSettings?.country || "Türkiye",
        mapUrl: siteSettings?.mapUrl || "",
        // Social Media
        socialMedia: siteSettings?.socialMedia || {},
        // Working Hours
        workingHours: siteSettings?.workingHours || "",
        workingDays: siteSettings?.workingDays || "",
      },
    });
  } catch (error) {
    functions.logger.error("Failed to get public site settings", error);
    // Return defaults on error
    res.status(200).json({
      settings: {
        section: "site",
        siteName: "SVD Ambalaj",
        siteDescription: "",
        supportEmail: "",
        supportPhone: "",
        logoUrl: "",
        logoAlt: "",
        faviconUrl: "",
        address: "",
        city: "",
        district: "",
        postalCode: "",
        country: "Türkiye",
        mapUrl: "",
        socialMedia: {},
        workingHours: "",
        workingDays: "",
      },
    });
  }
});

// Get public payment settings (no auth required - for checkout page)
app.get("/settings/payment/public", async (_req, res) => {
  try {
    const paymentSettings = await settings.getSiteSettings("payment");

    // Only return non-sensitive payment settings
    res.status(200).json({
      paytrEnabled: paymentSettings?.paytrEnabled ?? false,
      paytrTestMode: paymentSettings?.paytrTestMode ?? true,
    });
  } catch (error) {
    functions.logger.error("Failed to get public payment settings", error);
    // Return defaults on error
    res.status(200).json({
      paytrEnabled: false,
      paytrTestMode: true,
    });
  }
});

// Get specific settings section
app.get("/settings/:section", requireAuth, async (req, res) => {
  try {
    const { section } = req.params;
    const sectionSettings = await settings.getSiteSettings(section);

    if (!sectionSettings) {
      return res.status(404).json({ error: "Settings section not found" });
    }

    res.status(200).json({ settings: sectionSettings });
  } catch (error) {
    functions.logger.error("Failed to get settings section", error);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

// Update settings section (super admin only)
app.put("/admin/settings/:section", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const settingsData = req.body;
    const userId = req.admin.userId;

    const updated = await settings.setSiteSettings(section, settingsData, userId);

    functions.logger.info("Settings updated", { section, userId });
    res.status(200).json({ settings: updated });
  } catch (error) {
    functions.logger.error("Failed to update settings", error);
    res.status(500).json({ error: "Failed to update settings: " + error.message });
  }
});

// Initialize default settings (super admin only)
app.post("/admin/settings/initialize", requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const initialized = await settings.initializeSiteSettings();
    res.status(200).json({ settings: initialized });
  } catch (error) {
    functions.logger.error("Failed to initialize settings", error);
    res.status(500).json({ error: "Failed to initialize settings" });
  }
});

// ==================== CONTENT ENDPOINTS ====================

// Get all content (public)
app.get("/content", async (_req, res) => {
  try {
    const content = await settings.getAllContent();
    res.status(200).json({ content });
  } catch (error) {
    functions.logger.error("Failed to get content", error);
    res.status(500).json({ error: "Failed to get content" });
  }
});

// Get specific content section (public)
app.get("/content/:section", async (req, res) => {
  try {
    const { section } = req.params;
    const content = await settings.getContent(section);

    if (!content) {
      return res.status(404).json({ error: "Content section not found" });
    }

    res.status(200).json({ content });
  } catch (error) {
    functions.logger.error("Failed to get content section", error);
    res.status(500).json({ error: "Failed to get content" });
  }
});

// Update content section (admin)
app.put("/admin/content/:section", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const contentData = req.body;
    const userId = req.admin.userId;

    const updated = await settings.setContent(section, contentData, userId);

    functions.logger.info("Content updated", { section, userId });
    res.status(200).json({ content: updated });
  } catch (error) {
    functions.logger.error("Failed to update content", error);
    res.status(500).json({ error: "Failed to update content: " + error.message });
  }
});

// ==================== ADMIN ROLES ENDPOINTS ====================

// Bootstrap first super admin (only works if no admins exist)
app.post("/admin/bootstrap", requireAuth, async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmins = await adminRoles.getAllAdmins();
    if (existingAdmins && existingAdmins.length > 0) {
      return res.status(403).json({ error: "Admin already exists. Bootstrap not allowed." });
    }

    // Create first super admin
    const userId = req.user.uid;
    const roleData = {
      role: "super_admin",
      permissions: {
        manageSettings: true,
        manageProducts: true,
        manageOrders: true,
        manageUsers: true,
        manageRoles: true,
      },
    };

    const role = await adminRoles.setAdminRole(userId, roleData, "bootstrap");
    functions.logger.info("Bootstrap: First super admin created", { userId, email: req.user.email });

    res.status(200).json({
      success: true,
      message: "First super admin created successfully",
      role
    });
  } catch (error) {
    functions.logger.error("Bootstrap failed", error);
    res.status(500).json({ error: "Bootstrap failed: " + error.message });
  }
});

// Get all admin users (super admin only)
app.get("/admin/roles", requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const admins = await adminRoles.getAllAdmins();
    res.status(200).json({ admins });
  } catch (error) {
    functions.logger.error("Failed to get admin roles", error);
    res.status(500).json({ error: "Failed to get admin roles" });
  }
});

// Get admin role by user ID
app.get("/admin/roles/:userId", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const role = await adminRoles.getAdminRole(userId);

    if (!role) {
      return res.status(404).json({ error: "Admin role not found" });
    }

    res.status(200).json({ role });
  } catch (error) {
    functions.logger.error("Failed to get admin role", error);
    res.status(500).json({ error: "Failed to get admin role" });
  }
});

// Set admin role (super admin only)
app.put("/admin/roles/:userId", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const roleData = req.body;
    const adminUserId = req.admin.userId;

    // Prevent super admin from demoting themselves
    if (userId === adminUserId && roleData.role !== "super_admin") {
      return res.status(400).json({ error: "Cannot change your own super admin role" });
    }

    const role = await adminRoles.setAdminRole(userId, roleData, adminUserId);

    functions.logger.info("Admin role set", { userId, role: roleData.role, by: adminUserId });
    res.status(200).json({ role });
  } catch (error) {
    functions.logger.error("Failed to set admin role", error);
    res.status(500).json({ error: "Failed to set admin role: " + error.message });
  }
});

// Delete admin role (super admin only)
app.delete("/admin/roles/:userId", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminUserId = req.admin.userId;

    // Prevent super admin from removing their own role
    if (userId === adminUserId) {
      return res.status(400).json({ error: "Cannot delete your own admin role" });
    }

    await adminRoles.deleteAdminRole(userId);

    functions.logger.info("Admin role deleted", { userId, by: adminUserId });
    res.status(200).json({ success: true });
  } catch (error) {
    functions.logger.error("Failed to delete admin role", error);
    res.status(500).json({ error: "Failed to delete admin role" });
  }
});

// ==================== EMAIL TEST ENDPOINT ====================

// Send test email (super admin only)
app.post("/admin/email/test", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { to } = req.body;

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return res.status(400).json({ error: "Valid email address is required" });
    }

    await emailSender.sendTestEmail(to);

    functions.logger.info("Test email sent", { to, by: req.admin.email });
    res.status(200).json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    functions.logger.error("Failed to send test email", error);
    res.status(500).json({ error: "Failed to send test email: " + error.message });
  }
});

// ==================== EMAIL TEMPLATES ENDPOINTS ====================

// Get all email templates (super admin only)
app.get("/admin/email/templates", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const templates = await settings.getAllEmailTemplates();
    res.status(200).json({ templates });
  } catch (error) {
    functions.logger.error("Failed to get email templates", error);
    res.status(500).json({ error: "Failed to get email templates: " + error.message });
  }
});

// Get single email template (super admin only)
app.get("/admin/email/templates/:templateId", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await settings.getEmailTemplate(templateId);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.status(200).json({ template });
  } catch (error) {
    functions.logger.error("Failed to get email template", error);
    res.status(500).json({ error: "Failed to get email template: " + error.message });
  }
});

// Update email template (super admin only)
app.put("/admin/email/templates/:templateId", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { subject, htmlTemplate, textTemplate } = req.body;

    if (!subject && !htmlTemplate && !textTemplate) {
      return res.status(400).json({ error: "At least one field (subject, htmlTemplate, textTemplate) is required" });
    }

    const updateData = {};
    if (subject) updateData.subject = subject;
    if (htmlTemplate) updateData.htmlTemplate = htmlTemplate;
    if (textTemplate) updateData.textTemplate = textTemplate;

    const template = await settings.updateEmailTemplate(templateId, updateData, req.admin.email);

    functions.logger.info("Email template updated", { templateId, by: req.admin.email });
    res.status(200).json({ template });
  } catch (error) {
    functions.logger.error("Failed to update email template", error);
    res.status(500).json({ error: "Failed to update email template: " + error.message });
  }
});

// Reset email template to default (super admin only)
app.post("/admin/email/templates/:templateId/reset", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await settings.resetEmailTemplate(templateId, req.admin.email);

    functions.logger.info("Email template reset to default", { templateId, by: req.admin.email });
    res.status(200).json({ template });
  } catch (error) {
    functions.logger.error("Failed to reset email template", error);
    res.status(500).json({ error: "Failed to reset email template: " + error.message });
  }
});

// ==================== STOCK ALERT ENDPOINTS ====================

// Get low stock products (admin only)
app.get("/admin/stock/alerts", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    // Get stock settings
    const stockSettings = await settings.getSettings("stock");
    const lowThreshold = stockSettings?.lowStockThreshold || 100;
    const criticalThreshold = stockSettings?.criticalStockThreshold || 20;

    const stockData = await catalog.getLowStockProducts(lowThreshold, criticalThreshold);

    res.status(200).json(stockData);
  } catch (error) {
    functions.logger.error("Failed to get low stock products", error);
    res.status(500).json({ error: "Failed to get low stock products: " + error.message });
  }
});

// Send stock alert email (admin only)
app.post("/admin/stock/send-alert", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    // Get stock settings
    const stockSettings = await settings.getSettings("stock");

    if (!stockSettings?.notifyOnLowStock) {
      return res.status(400).json({ error: "Stok bildirimleri kapalı. Ayarlar > Stok sayfasından aktifleştirin." });
    }

    if (!stockSettings?.notifyEmail) {
      return res.status(400).json({ error: "Bildirim e-posta adresi ayarlanmamış. Ayarlar > Stok sayfasından ayarlayın." });
    }

    const lowThreshold = stockSettings?.lowStockThreshold || 100;
    const criticalThreshold = stockSettings?.criticalStockThreshold || 20;

    const stockData = await catalog.getLowStockProducts(lowThreshold, criticalThreshold);

    if (stockData.summary.totalAlerts === 0) {
      return res.status(400).json({ error: "Stok uyarısı gerektiren ürün bulunmuyor." });
    }

    await emailSender.sendStockAlertEmail(stockData, stockSettings.notifyEmail);

    functions.logger.info("Stock alert email sent", {
      to: stockSettings.notifyEmail,
      alerts: stockData.summary,
      by: req.admin.email
    });

    res.status(200).json({
      success: true,
      message: `Stok uyarısı ${stockSettings.notifyEmail} adresine gönderildi`,
      summary: stockData.summary
    });
  } catch (error) {
    functions.logger.error("Failed to send stock alert email", error);
    res.status(500).json({ error: "Stok uyarı e-postası gönderilemedi: " + error.message });
  }
});

// ==================== DATA FIX ENDPOINTS ====================

// Fix HTML-encoded product data (one-time use)
app.post("/admin/fix-encoded-products", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    // Helper function to decode HTML entities
    const decodeHtmlEntities = (str) => {
      if (typeof str !== "string") return str;
      return str
        .replace(/&#x2F;/g, "/")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x60;/g, "`")
        // Handle double-encoded entities
        .replace(/&amp;#x2F;/g, "/")
        .replace(/&amp;amp;/g, "&");
    };

    // Recursively decode object
    const decodeObject = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "string") return decodeHtmlEntities(obj);
      if (Array.isArray(obj)) return obj.map(decodeObject);
      if (typeof obj === "object") {
        const decoded = {};
        for (const [key, value] of Object.entries(obj)) {
          decoded[key] = decodeObject(value);
        }
        return decoded;
      }
      return obj;
    };

    // Check if string has encoded entities
    const hasEncodedEntities = (str) => {
      if (typeof str !== "string") return false;
      return /&#x2F;|&amp;|&lt;|&gt;|&quot;|&#x27;|&#x60;/.test(str);
    };

    const objectHasEncodedEntities = (obj) => {
      if (obj === null || obj === undefined) return false;
      if (typeof obj === "string") return hasEncodedEntities(obj);
      if (Array.isArray(obj)) return obj.some(objectHasEncodedEntities);
      if (typeof obj === "object") {
        return Object.values(obj).some(objectHasEncodedEntities);
      }
      return false;
    };

    // Get all products
    const productsRef = db.collection("products");
    const snapshot = await productsRef.get();

    let fixedCount = 0;
    const fixedProducts = [];
    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      if (objectHasEncodedEntities(data)) {
        const decoded = decodeObject(data);
        batch.update(doc.ref, decoded);
        fixedCount++;
        fixedProducts.push({
          id: doc.id,
          originalTitle: data.title,
          fixedTitle: decoded.title,
        });
      }
    }

    if (fixedCount > 0) {
      await batch.commit();
      functions.logger.info("Fixed encoded products", {
        count: fixedCount,
        products: fixedProducts,
        by: req.admin.email
      });
    }

    res.status(200).json({
      success: true,
      message: `${fixedCount} ürün düzeltildi`,
      fixedProducts,
    });
  } catch (error) {
    functions.logger.error("Failed to fix encoded products", error);
    res.status(500).json({ error: "Veriler düzeltilemedi: " + error.message });
  }
});

// ==================== PAYMENT ENDPOINTS ====================

// Create PayTR payment token (rate limited: 10 per hour)
app.post("/payment/create-token", paymentLimiter, async (req, res) => {
  try {
    const { orderId, customer, cart_items, total_amount } = req.body;

    functions.logger.info("Payment token request received", { orderId, customer, cart_items_count: cart_items?.length, total_amount });

    if (!orderId || !customer || !cart_items || !total_amount) {
      functions.logger.warn("Missing required fields", { orderId: !!orderId, customer: !!customer, cart_items: !!cart_items, total_amount: !!total_amount });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get client IP
    const ip_address = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "127.0.0.1";
    functions.logger.info("Client IP", { ip_address });

    const result = await paytr.createIframeToken({
      cart_items,
      customer: {
        email: customer.email,
        name: customer.name,
        phone: customer.phone || "0000000000",
        address: customer.address || "Adres belirtilmedi",
      },
      total_amount,
      ip_address,
    });

    functions.logger.info("PayTR createIframeToken result", { success: result.success, error: result.error, hasToken: !!result.token });

    if (result.success) {
      // Store payment info in order
      await orders.updateOrder(orderId, {
        paymentMethod: "credit_card",
        paymentStatus: "pending",
        paymentMerchantOid: result.merchantOid,
      });

      res.json({
        success: true,
        token: result.token,
        merchantOid: result.merchantOid,
      });
    } else {
      functions.logger.warn("PayTR token creation failed", { error: result.error });
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    functions.logger.error("Payment token creation failed with exception", { message: error.message, stack: error.stack });
    res.status(500).json({ error: "Payment token creation failed: " + error.message });
  }
});

// PayTR callback endpoint
app.post("/payment/callback", async (req, res) => {
  try {
    const callbackData = req.body;
    functions.logger.info("PayTR callback received", callbackData);

    const verification = await paytr.verifyCallback(callbackData);

    if (!verification.valid) {
      functions.logger.error("PayTR callback verification failed");
      return res.send("FAIL");
    }

    // Find order by merchant_oid
    const ordersSnapshot = await db.collection("orders")
      .where("paymentMerchantOid", "==", callbackData.merchant_oid)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      functions.logger.error("Order not found for merchant_oid:", callbackData.merchant_oid);
      return res.send("OK"); // Still send OK to prevent retries
    }

    const orderDoc = ordersSnapshot.docs[0];
    const orderId = orderDoc.id;

    if (callbackData.status === "success") {
      await orders.updateOrder(orderId, {
        paymentStatus: "paid",
        paymentCompletedAt: new Date().toISOString(),
        status: "confirmed",
      });
      functions.logger.info("Payment successful for order:", orderId);

      // Payment confirmed - now send confirmation emails
      try {
        const updatedOrder = await orders.getOrder(orderId);
        if (updatedOrder) {
          // Send order confirmation email to customer
          await emailSender.sendOrderConfirmationEmail(updatedOrder);
          functions.logger.info("Order confirmation email sent after payment", { orderId });

          // Send new order notification to admin
          const adminEmail = await emailSender.getAdminNotificationEmail();
          if (adminEmail) {
            await emailSender.sendNewOrderAdminEmail(updatedOrder, adminEmail);
            functions.logger.info("Admin notification sent after payment", { orderId, adminEmail });
          }
        }
      } catch (emailError) {
        functions.logger.error("Failed to send emails after payment confirmation", emailError);
        // Don't fail the callback if email fails
      }
    } else {
      await orders.updateOrder(orderId, {
        paymentStatus: "failed",
        paymentFailedAt: new Date().toISOString(),
      });
      functions.logger.info("Payment failed for order:", orderId);
    }

    res.send("OK");
  } catch (error) {
    functions.logger.error("PayTR callback processing failed", error);
    res.send("OK"); // Still send OK to prevent retries
  }
});

// Get current user's role and permissions
app.get("/admin/me/role", requireAuth, async (req, res) => {
  try {
    const user = await users.getUserByEmail(req.admin.email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const role = await adminRoles.getAdminRole(user.uid);

    res.status(200).json({
      role: role || null,
      isStaff: role !== null,
      isAdmin: role && ["super_admin", "admin"].includes(role.role),
      isSuperAdmin: role && role.role === "super_admin"
    });
  } catch (error) {
    functions.logger.error("Failed to get user role", error);
    res.status(500).json({ error: "Failed to get role information" });
  }
});

// Debug endpoint to list storage files
app.get("/admin/debug-storage", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ maxResults: 50 });
    const fileNames = files.map(f => f.name);
    res.json({
      bucketName: bucket.name,
      totalFiles: files.length,
      files: fileNames
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Thumbnail Migration Endpoint
// Generates thumbnails for existing images that don't have them
// Processes in batches to avoid memory issues
app.post("/admin/migrate-thumbnails", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const BATCH_SIZE = 5; // Process 5 images at a time to avoid memory issues
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'uploads/' });

    // Filter to only original images (not thumbnails)
    // Support both proper extensions (.jpg) and merged names (imagejpg)
    const imagePatterns = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'avif'];
    const imagesToProcess = files.filter(file => {
      const filename = file.name.toLowerCase();
      // Skip thumbnails and videos
      if (filename.includes('_thumb')) return false;
      if (filename.endsWith('mp4') || filename.endsWith('webm') || filename.endsWith('mov')) return false;
      // Check if filename ends with image extension (with or without dot)
      return imagePatterns.some(ext => filename.endsWith(ext) || filename.endsWith('.' + ext));
    });

    let created = 0;
    let skipped = 0;
    let errors = 0;
    const results = [];

    // Helper function to get thumb filename
    const getThumbFilename = (filename) => {
      for (const ext of imagePatterns) {
        if (filename.toLowerCase().endsWith('.' + ext)) {
          return filename.slice(0, -(ext.length + 1)) + '_thumb.webp';
        } else if (filename.toLowerCase().endsWith(ext)) {
          return filename.slice(0, -ext.length) + '_thumb.webp';
        }
      }
      return filename + '_thumb.webp';
    };

    // Process a single image
    const processImage = async (file) => {
      const filename = file.name;
      const thumbFilename = getThumbFilename(filename);

      try {
        // Check if thumbnail already exists
        const [thumbExists] = await bucket.file(thumbFilename).exists();
        if (thumbExists) {
          return { status: 'skipped' };
        }

        // Download original to temp
        const tempOriginal = path.join(os.tmpdir(), `orig_${Date.now()}_${path.basename(filename)}`);
        const tempThumb = path.join(os.tmpdir(), `thumb_${Date.now()}_${path.basename(thumbFilename)}`);

        try {
          await file.download({ destination: tempOriginal });

          // Generate thumbnail with sharp
          await sharp(tempOriginal)
            .resize(THUMBNAIL_MAX_WIDTH, null, {
              withoutEnlargement: true,
              fit: 'inside'
            })
            .webp({ quality: THUMBNAIL_QUALITY })
            .toFile(tempThumb);

          // Get sizes for reporting
          const originalStats = fs.statSync(tempOriginal);
          const thumbStats = fs.statSync(tempThumb);

          // Upload thumbnail
          await bucket.upload(tempThumb, {
            destination: thumbFilename,
            metadata: {
              contentType: 'image/webp',
              metadata: {
                originalName: path.basename(filename),
                fileType: 'thumbnail'
              }
            },
            public: true
          });

          const savings = ((1 - thumbStats.size / originalStats.size) * 100).toFixed(1);

          // Cleanup temp files
          try { fs.unlinkSync(tempOriginal); } catch (e) { /* ignore */ }
          try { fs.unlinkSync(tempThumb); } catch (e) { /* ignore */ }

          return {
            status: 'created',
            filename: path.basename(filename),
            originalSize: originalStats.size,
            thumbSize: thumbStats.size,
            savings: `${savings}%`
          };
        } finally {
          // Always cleanup temp files
          try { fs.unlinkSync(tempOriginal); } catch (e) { /* ignore */ }
          try { fs.unlinkSync(tempThumb); } catch (e) { /* ignore */ }
        }
      } catch (error) {
        functions.logger.error("Thumbnail generation failed", { filename, error: error.message });
        return { status: 'error', filename: path.basename(filename), error: error.message };
      }
    };

    // Process images in batches
    for (let i = 0; i < imagesToProcess.length; i += BATCH_SIZE) {
      const batch = imagesToProcess.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(processImage));

      for (const result of batchResults) {
        if (result.status === 'created') {
          created++;
          results.push(result);
        } else if (result.status === 'skipped') {
          skipped++;
        } else if (result.status === 'error') {
          errors++;
        }
      }

      // Force garbage collection between batches if available
      if (global.gc) {
        global.gc();
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        total: imagesToProcess.length,
        created,
        skipped,
        errors
      },
      results: results.slice(0, 50) // Limit results to avoid large response
    });
  } catch (error) {
    functions.logger.error("Thumbnail migration failed", error);
    res.status(500).json({ error: `Migration failed: ${error.message}` });
  }
});

// Export scheduled functions
export { updateExchangeRate, forceUpdateExchangeRate, keepSiteWarm } from "./scheduled/update-exchange-rate.js";

// Export API handler with v2 functions (increased memory for media uploads)
export const api = onRequest(
  {
    memory: "2GiB",
    timeoutSeconds: 120,
    cors: [
      "https://spreyvalfdunyasi.com",
      "https://www.spreyvalfdunyasi.com",
      "https://svdfirebase000.web.app",
      "https://svdfirebase000.firebaseapp.com",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
  },
  app
);
