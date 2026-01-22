/**
 * Formatting utilities for number and currency display
 * @module utils/formatting
 */

/**
 * Formats a number with commas as thousand separators
 * @param {number|string} value - The number to format
 * @returns {string} Formatted number string
 * @example formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Formats a number as currency with dollar sign
 * @param {number|string} value - The number to format as currency
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 * @example formatCurrency(1234.56) => "$1,234.56"
 */
export function formatCurrency(value, decimals = 2) {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Parses user input, removing commas and converting to number
 * @param {string} value - The input string to parse
 * @returns {number} Parsed number
 * @example parseNumberInput("1,234.56") => 1234.56
 */
export function parseNumberInput(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Clamps a number between min and max bounds
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 * @example clamp(150, 0, 100) => 100
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Safely divides two numbers, returning fallback if divisor is zero
 * @param {number} numerator - The numerator
 * @param {number} denominator - The denominator
 * @param {number} fallback - Value to return if denominator is zero (default: 0)
 * @returns {number} Result of division or fallback
 * @example safeDivide(10, 0, Infinity) => Infinity
 */
export function safeDivide(numerator, denominator, fallback = 0) {
  return denominator !== 0 ? numerator / denominator : fallback;
}
