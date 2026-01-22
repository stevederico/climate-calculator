/**
 * Input validation utilities
 * @module utils/validation
 */

import { clamp, parseNumberInput } from './formatting.js';

/**
 * Validation rules for common calculator inputs
 * Each rule defines min, max, and default values
 */
export const VALIDATION_RULES = {
  // EV Calculator
  miles: { min: 0, max: 10000, default: 1000 },
  mpg: { min: 1, max: 100, default: 25 },
  fuelCost: { min: 0, max: 20, default: 3.5 },
  energyCost: { min: 0, max: 5, default: 0.45 },
  iceCarCost: { min: 0, max: 10000, default: 500 },
  evDown: { min: 0, max: 100000, default: 2000 },
  tradeInValue: { min: 0, max: 100000, default: 0 },

  // Solar Calculator
  gridBill: { min: 0, max: 10000, default: 200 },
  loanPayment: { min: 0, max: 10000, default: 150 },
  annualRate: { min: 0, max: 1, default: 0.05 },
  termMonths: { min: 1, max: 360, default: 240 },

  // Shared
  percentage: { min: 0, max: 100, default: 0 },
  currency: { min: 0, max: 1000000, default: 0 }
};

/**
 * Validates an input value against defined rules
 * @param {string|number} value - The value to validate
 * @param {string} fieldName - Name of the field (must exist in VALIDATION_RULES)
 * @returns {number} Validated and clamped number
 *
 * @example
 * validateInput("5000", "miles") => 5000
 * validateInput("15000", "miles") => 10000 // clamped to max
 */
export function validateInput(value, fieldName) {
  const rules = VALIDATION_RULES[fieldName];
  if (!rules) {
    console.warn(`No validation rules for field: ${fieldName}`);
    return parseNumberInput(value);
  }

  const parsed = parseNumberInput(value);
  return clamp(parsed, rules.min, rules.max);
}

/**
 * Creates a validated input change handler for React
 * @param {Function} setter - State setter function
 * @param {string} fieldName - Name of the field (must exist in VALIDATION_RULES)
 * @returns {Function} Change handler function
 *
 * @example
 * const handleMilesChange = createValidatedHandler(setMiles, 'miles');
 * <input onChange={(e) => handleMilesChange(e.target.value)} />
 */
export function createValidatedHandler(setter, fieldName) {
  return (value) => {
    const validated = validateInput(value, fieldName);
    setter(validated);
  };
}
