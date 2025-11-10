/**
 * Encryption utility for sensitive data
 * Uses AES-256-GCM for encryption
 *
 * IMPORTANT: Set ENCRYPTION_KEY in Firebase Functions config:
 * firebase functions:config:set encryption.key="your-32-char-key-here"
 *
 * Generate a key with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from "crypto";

// Get encryption key from environment or use a default for development
// IMPORTANT: In production, ALWAYS use functions config
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ||
                       process.env.FUNCTIONS_CONFIG_encryption_key ||
                       "dev-key-change-in-production-00"; // Fallback for development only

// Ensure key is 32 bytes
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a string value
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text with IV and auth tag (format: iv:authTag:encrypted)
 */
export function encrypt(text) {
  if (!text) {
    return "";
  }

  try {
    // Generate a random IV for each encryption
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get auth tag for GCM mode
    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    // Format: iv:authTag:encrypted (all in hex)
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error.message);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - Encrypted text (format: iv:authTag:encrypted)
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) {
    return "";
  }

  try {
    // Split the encrypted text into components
    const parts = encryptedText.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash a string (one-way, for passwords)
 * @param {string} text - Text to hash
 * @returns {string} Hashed text
 */
export function hash(text) {
  if (!text) {
    return "";
  }

  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Compare a plain text with a hash
 * @param {string} text - Plain text
 * @param {string} hashedText - Hashed text
 * @returns {boolean} True if they match
 */
export function compareHash(text, hashedText) {
  if (!text || !hashedText) {
    return false;
  }

  return hash(text) === hashedText;
}

/**
 * Generate a random token
 * @param {number} length - Length in bytes (will be hex encoded, so output is 2x length)
 * @returns {string} Random token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Encrypt sensitive fields in an object
 * @param {Object} obj - Object containing sensitive data
 * @param {string[]} fields - Array of field names to encrypt
 * @returns {Object} Object with encrypted fields
 */
export function encryptFields(obj, fields) {
  if (!obj || !fields || fields.length === 0) {
    return obj;
  }

  const encrypted = { ...obj };

  fields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(String(encrypted[field]));
    }
  });

  return encrypted;
}

/**
 * Decrypt sensitive fields in an object
 * @param {Object} obj - Object containing encrypted data
 * @param {string[]} fields - Array of field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
export function decryptFields(obj, fields) {
  if (!obj || !fields || fields.length === 0) {
    return obj;
  }

  const decrypted = { ...obj };

  fields.forEach(field => {
    if (decrypted[field]) {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error.message);
        decrypted[field] = ""; // Set to empty on decrypt failure
      }
    }
  });

  return decrypted;
}

/**
 * Mask sensitive data for logs (show first 3 and last 3 chars)
 * @param {string} text - Text to mask
 * @returns {string} Masked text
 */
export function maskSensitive(text) {
  if (!text || text.length < 8) {
    return "***";
  }

  const start = text.substring(0, 3);
  const end = text.substring(text.length - 3);
  const middle = "*".repeat(Math.min(10, text.length - 6));

  return `${start}${middle}${end}`;
}

// Test the encryption setup on module load (only in development)
if (process.env.NODE_ENV === "development") {
  try {
    const testText = "test-encryption";
    const encrypted = encrypt(testText);
    const decrypted = decrypt(encrypted);

    if (decrypted !== testText) {
      console.error("⚠️  Encryption test failed! Key may be incorrect.");
    } else {
      console.log("✓ Encryption utility initialized successfully");
    }
  } catch (error) {
    console.error("⚠️  Encryption initialization error:", error.message);
  }
}
