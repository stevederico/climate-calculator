/**
 * Umami analytics wrapper utilities
 * Safely handles umami not being loaded and sanitizes data
 */

/** Minimal subset of the Umami tracker API loaded via script tag. */
interface Umami {
  track: (eventName?: string, data?: Record<string, unknown>) => void;
  identify: (idOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    umami?: Umami;
  }
}

/** Sanitized event payload — only primitive values survive sanitization. */
type SanitizedData = Record<string, string | number | boolean>;

/** True if running on localhost — skip all tracking */
const isLocal = (): boolean => ['localhost', '127.0.0.1'].includes(window.location.hostname);

/**
 * Sanitize event data for Umami
 * Ensures data is always a valid object with proper types
 * @param data - Arbitrary event data to sanitize
 * @returns Object with only primitive (string/number/boolean) values
 */
const sanitizeEventData = (data: unknown): SanitizedData => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }

  const sanitized: SanitizedData = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || typeof value === 'function') {
      continue;
    }

    if (typeof value === 'number') {
      sanitized[key] = Math.round(value * 10000) / 10000;
    } else if (typeof value === 'string') {
      sanitized[key] = value.substring(0, 500);
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = JSON.stringify(value).substring(0, 500);
    } else if (typeof value === 'object') {
      sanitized[key] = JSON.stringify(value).substring(0, 500);
    } else {
      sanitized[key] = String(value).substring(0, 500);
    }
  }

  return sanitized;
};

/**
 * Track an event with optional data
 * @param eventName - Event name (kebab-case recommended)
 * @param data - Optional event data object
 */
export const trackEvent = (eventName: string, data: Record<string, unknown> = {}): void => {
  if (isLocal()) return;
  if (typeof window !== 'undefined' && window.umami) {
    try {
      const sanitizedData = sanitizeEventData(data);
      window.umami.track(eventName, sanitizedData);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
};

/**
 * Identify a user with optional metadata
 * @param userId - User ID
 * @param data - Optional user metadata
 */
export const identifyUser = (userId: string, data: Record<string, unknown> = {}): void => {
  if (isLocal()) return;
  if (typeof window !== 'undefined' && window.umami) {
    try {
      if (userId) {
        window.umami.identify(userId, data);
      } else {
        window.umami.identify(data);
      }
    } catch (error) {
      console.warn('User identification failed:', error);
    }
  }
};

/**
 * Track a page view
 */
export const trackPageView = (): void => {
  if (isLocal()) return;
  if (typeof window !== 'undefined' && window.umami) {
    try {
      window.umami.track();
    } catch (error) {
      console.warn('Page view tracking failed:', error);
    }
  }
};
