/**
 * Security Middleware for SVD Ambalaj API
 * Includes: Rate Limiting, Input Validation, XSS Protection, Security Headers
 */

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import validator from "validator";
import * as functions from "firebase-functions";

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.",
    retryAfter: 15
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { xForwardedForHeader: false }, // Disable IPv6 validation warning
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === "/health" || req.path === "/";
  },
  handler: (req, res) => {
    functions.logger.warn("Rate limit exceeded", {
      ip: req.headers["x-forwarded-for"] || req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: "Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.",
      retryAfter: 15
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: "Çok fazla giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.",
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // Disable IPv6 validation warning
  handler: (req, res) => {
    functions.logger.warn("Auth rate limit exceeded", {
      ip: req.headers["x-forwarded-for"] || req.ip,
      path: req.path
    });
    res.status(429).json({
      error: "Çok fazla giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.",
      retryAfter: 15
    });
  }
});

/**
 * Payment endpoint rate limiter
 * 10 requests per hour per IP
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 payment attempts per hour
  message: {
    error: "Çok fazla ödeme denemesi yapıldı. Lütfen 1 saat sonra tekrar deneyin.",
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // Disable IPv6 validation warning
  handler: (req, res) => {
    functions.logger.warn("Payment rate limit exceeded", {
      ip: req.headers["x-forwarded-for"] || req.ip
    });
    res.status(429).json({
      error: "Çok fazla ödeme denemesi yapıldı. Lütfen 1 saat sonra tekrar deneyin.",
      retryAfter: 60
    });
  }
});

/**
 * Form submission rate limiter (quotes, samples, contact)
 * 10 submissions per hour per IP
 */
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 form submissions per hour
  message: {
    error: "Çok fazla form gönderildi. Lütfen 1 saat sonra tekrar deneyin.",
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // Disable IPv6 validation warning
  handler: (req, res) => {
    functions.logger.warn("Form rate limit exceeded", {
      ip: req.headers["x-forwarded-for"] || req.ip,
      path: req.path
    });
    res.status(429).json({
      error: "Çok fazla form gönderildi. Lütfen 1 saat sonra tekrar deneyin.",
      retryAfter: 60
    });
  }
});

// ============================================
// SECURITY HEADERS (Helmet)
// ============================================

/**
 * Helmet middleware for security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Disable CSP for API (not serving HTML)
  crossOriginEmbedderPolicy: false, // Allow embedding
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" }, // Prevent clickjacking
  hidePoweredBy: true, // Remove X-Powered-By header
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true, // Prevent MIME type sniffing
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true // Enable XSS filter
});

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

/**
 * Sanitize a string to prevent XSS attacks
 * Note: We avoid full HTML entity encoding to preserve safe characters like /
 * Instead, we only escape the truly dangerous characters: < > " ' `
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== "string") return input;
  const trimmed = validator.trim(input);
  // Only escape dangerous HTML characters, preserve / and &
  return trimmed
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/`/g, "&#x60;");
};

/**
 * Sanitize an email address
 * @param {string} email - The email to sanitize and validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== "string") return null;
  const trimmed = validator.trim(email).toLowerCase();
  return validator.isEmail(trimmed) ? validator.normalizeEmail(trimmed) : null;
};

/**
 * Sanitize a phone number
 * @param {string} phone - The phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== "string") return "";
  // Remove all non-numeric characters except + for international format
  return phone.replace(/[^\d+]/g, "");
};

/**
 * Validate and sanitize a URL
 * @param {string} url - The URL to validate
 * @returns {string|null} - Valid URL or null
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== "string") return null;
  const trimmed = validator.trim(url);
  return validator.isURL(trimmed, {
    protocols: ["http", "https"],
    require_protocol: true
  }) ? trimmed : null;
};

/**
 * Sanitize an object recursively
 * @param {object} obj - The object to sanitize
 * @returns {object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return sanitizeString(obj);
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[sanitizeString(key)] = sanitizeObject(value);
  }
  return sanitized;
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  next();
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate required fields in request body
 * @param {string[]} fields - Array of required field names
 * @returns {Function} - Express middleware
 */
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: "Eksik alanlar",
        details: `Zorunlu alanlar: ${missing.join(", ")}`
      });
    }
    next();
  };
};

/**
 * Validate email format
 */
export const validateEmail = (req, res, next) => {
  if (req.body.email) {
    const sanitized = sanitizeEmail(req.body.email);
    if (!sanitized) {
      return res.status(400).json({
        error: "Geçersiz e-posta adresi"
      });
    }
    req.body.email = sanitized;
  }
  next();
};

/**
 * Validate numeric fields
 * @param {string[]} fields - Array of field names that should be numeric
 * @returns {Function} - Express middleware
 */
export const validateNumeric = (fields) => {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        const num = Number(req.body[field]);
        if (isNaN(num)) {
          return res.status(400).json({
            error: "Geçersiz sayısal değer",
            details: `${field} sayısal bir değer olmalıdır`
          });
        }
        req.body[field] = num;
      }
    }
    next();
  };
};

/**
 * Validate string length
 * @param {object} limits - Object with field names as keys and {min, max} as values
 * @returns {Function} - Express middleware
 */
export const validateLength = (limits) => {
  return (req, res, next) => {
    for (const [field, { min, max }] of Object.entries(limits)) {
      const value = req.body[field];
      if (value !== undefined && value !== null && typeof value === "string") {
        if (min !== undefined && value.length < min) {
          return res.status(400).json({
            error: "Değer çok kısa",
            details: `${field} en az ${min} karakter olmalıdır`
          });
        }
        if (max !== undefined && value.length > max) {
          return res.status(400).json({
            error: "Değer çok uzun",
            details: `${field} en fazla ${max} karakter olabilir`
          });
        }
      }
    }
    next();
  };
};

// ============================================
// SQL INJECTION & NOSQL INJECTION PREVENTION
// ============================================

/**
 * Check for potential NoSQL injection patterns
 * @param {*} value - Value to check
 * @returns {boolean} - True if suspicious pattern found
 */
const hasSuspiciousPattern = (value) => {
  if (typeof value !== "string") return false;

  // Check for MongoDB operators
  const suspiciousPatterns = [
    /\$where/i,
    /\$gt/i,
    /\$lt/i,
    /\$ne/i,
    /\$in/i,
    /\$regex/i,
    /\$or/i,
    /\$and/i,
    /\$not/i,
    /\$exists/i,
    /\$elemMatch/i,
    /\{\s*"\$[a-z]+"/i, // JSON object with $ operator
  ];

  return suspiciousPatterns.some(pattern => pattern.test(value));
};

/**
 * Middleware to prevent NoSQL injection
 */
export const preventNoSQLInjection = (req, res, next) => {
  const checkObject = (obj, path = "") => {
    if (obj === null || obj === undefined) return false;

    if (typeof obj === "string") {
      if (hasSuspiciousPattern(obj)) {
        functions.logger.warn("Potential NoSQL injection detected", {
          path,
          value: obj.substring(0, 100),
          ip: req.headers["x-forwarded-for"] || req.ip
        });
        return true;
      }
      return false;
    }

    if (typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        // Check if key starts with $ (MongoDB operator)
        if (key.startsWith("$")) {
          functions.logger.warn("Potential NoSQL injection detected in key", {
            path: `${path}.${key}`,
            ip: req.headers["x-forwarded-for"] || req.ip
          });
          return true;
        }
        if (checkObject(value, `${path}.${key}`)) {
          return true;
        }
      }
    }

    return false;
  };

  if (checkObject(req.body, "body") || checkObject(req.query, "query")) {
    return res.status(400).json({
      error: "Geçersiz istek formatı"
    });
  }

  next();
};

// ============================================
// RECAPTCHA VERIFICATION
// ============================================

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || "";
const RECAPTCHA_MIN_SCORE = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");

/**
 * Verify reCAPTCHA v3 token
 * @param {string} token - The reCAPTCHA token from frontend
 * @param {string} expectedAction - The expected action name
 * @returns {Promise<{success: boolean, score?: number, action?: string, error?: string}>}
 */
export const verifyRecaptcha = async (token, expectedAction) => {
  if (!RECAPTCHA_SECRET_KEY) {
    functions.logger.warn("reCAPTCHA secret key not configured, skipping verification");
    return { success: true, score: 1.0, action: expectedAction };
  }

  if (!token) {
    return { success: false, error: "reCAPTCHA token eksik" };
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${encodeURIComponent(RECAPTCHA_SECRET_KEY)}&response=${encodeURIComponent(token)}`,
    });

    const data = await response.json();

    if (!data.success) {
      functions.logger.warn("reCAPTCHA verification failed", {
        errorCodes: data["error-codes"],
      });
      return { success: false, error: "reCAPTCHA doğrulaması başarısız" };
    }

    // Check score (v3)
    if (data.score !== undefined && data.score < RECAPTCHA_MIN_SCORE) {
      functions.logger.warn("reCAPTCHA score too low", {
        score: data.score,
        minScore: RECAPTCHA_MIN_SCORE,
        action: data.action,
      });
      return { success: false, error: "Güvenlik doğrulaması başarısız", score: data.score };
    }

    // Check action matches (v3)
    if (expectedAction && data.action && data.action !== expectedAction) {
      functions.logger.warn("reCAPTCHA action mismatch", {
        expected: expectedAction,
        received: data.action,
      });
      return { success: false, error: "Güvenlik doğrulaması başarısız" };
    }

    return {
      success: true,
      score: data.score,
      action: data.action,
    };
  } catch (error) {
    functions.logger.error("reCAPTCHA verification error", { error: error.message });
    // On error, allow request to proceed (fail open) but log the issue
    return { success: true, score: 0, action: expectedAction };
  }
};

/**
 * Middleware to verify reCAPTCHA token
 * @param {string} action - Expected action name for verification
 * @returns {Function} - Express middleware
 */
export const recaptchaMiddleware = (action) => {
  return async (req, res, next) => {
    const token = req.body.recaptchaToken || req.headers["x-recaptcha-token"];

    const result = await verifyRecaptcha(token, action);

    if (!result.success) {
      functions.logger.warn("reCAPTCHA middleware blocked request", {
        action,
        ip: req.headers["x-forwarded-for"] || req.ip,
        error: result.error,
        score: result.score,
      });
      return res.status(400).json({
        error: result.error || "Güvenlik doğrulaması başarısız",
        code: "RECAPTCHA_FAILED",
      });
    }

    // Add reCAPTCHA result to request for logging
    req.recaptchaResult = result;
    next();
  };
};

// ============================================
// LOGGING MIDDLEWARE
// ============================================

/**
 * Request logging middleware for security monitoring
 */
export const securityLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.headers["x-forwarded-for"] || req.ip,
      userAgent: req.headers["user-agent"]?.substring(0, 100)
    };

    // Log warnings for failed requests
    if (res.statusCode >= 400) {
      functions.logger.warn("Request failed", logData);
    } else if (res.statusCode >= 500) {
      functions.logger.error("Server error", logData);
    }
  });

  next();
};

// ============================================
// COMBINED SECURITY MIDDLEWARE
// ============================================

/**
 * Apply all security middleware to an Express app
 * @param {Express} app - Express application
 */
export const applySecurityMiddleware = (app) => {
  // Security headers
  app.use(securityHeaders);

  // General rate limiting
  app.use(generalLimiter);

  // Security logging
  app.use(securityLogger);

  // Body sanitization
  app.use(sanitizeBody);

  // Query sanitization
  app.use(sanitizeQuery);

  // NoSQL injection prevention
  app.use(preventNoSQLInjection);
};

export default {
  // Rate limiters
  generalLimiter,
  authLimiter,
  paymentLimiter,
  formLimiter,

  // Security headers
  securityHeaders,

  // Sanitization
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,

  // Validation
  validateRequired,
  validateEmail,
  validateNumeric,
  validateLength,

  // Protection
  preventNoSQLInjection,

  // reCAPTCHA
  verifyRecaptcha,
  recaptchaMiddleware,

  // Logging
  securityLogger,

  // Combined
  applySecurityMiddleware
};
