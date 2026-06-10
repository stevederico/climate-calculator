/**
 * Formatting utilities for number and currency display
 * @module utils/formatting
 */

/**
 * Formats a number with commas as thousand separators
 * @param value - The number to format
 * @returns Formatted number string
 * @example formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(value: number | string): string {
  const num = parseFloat(String(value));
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Formats a number as currency with dollar sign
 * @param value - The number to format as currency
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 * @example formatCurrency(1234.56) => "$1,234.56"
 */
export function formatCurrency(value: number | string, decimals = 2): string {
  const num = parseFloat(String(value));
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
 * @param value - The input string to parse
 * @returns Parsed number
 * @example parseNumberInput("1,234.56") => 1234.56
 */
export function parseNumberInput(value: string | number): number {
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Clamps a number between min and max bounds
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 * @example clamp(150, 0, 100) => 100
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Safely divides two numbers, returning fallback if divisor is zero
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param fallback - Value to return if denominator is zero (default: 0)
 * @returns Result of division or fallback
 * @example safeDivide(10, 0, Infinity) => Infinity
 */
export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  return denominator !== 0 ? numerator / denominator : fallback;
}
