/**
 * reCAPTCHA v3 Utility Functions
 *
 * Site Key: Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env.local
 * Secret Key: Set RECAPTCHA_SECRET_KEY in backend .env
 */

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

// Load reCAPTCHA script dynamically
let recaptchaLoaded = false;
let recaptchaLoadPromise: Promise<void> | null = null;

export function loadRecaptcha(): Promise<void> {
  if (recaptchaLoaded) {
    return Promise.resolve();
  }

  if (recaptchaLoadPromise) {
    return recaptchaLoadPromise;
  }

  if (!RECAPTCHA_SITE_KEY) {
    console.warn("reCAPTCHA site key not configured");
    return Promise.resolve();
  }

  recaptchaLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      recaptchaLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error("Failed to load reCAPTCHA script"));
    };

    document.head.appendChild(script);
  });

  return recaptchaLoadPromise;
}

// Execute reCAPTCHA and get token
export async function executeRecaptcha(action: string): Promise<string> {
  if (!RECAPTCHA_SITE_KEY) {
    console.warn("reCAPTCHA site key not configured, skipping verification");
    return "";
  }

  await loadRecaptcha();

  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error("reCAPTCHA not loaded"));
      return;
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then((token: string) => {
          resolve(token);
        })
        .catch((error: Error) => {
          reject(error);
        });
    });
  });
}

// Extend Window interface for grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}
