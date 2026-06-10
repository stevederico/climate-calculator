/**
 * Input validation utilities
 * @module utils/validation
 */

import { clamp, parseNumberInput } from './formatting';

/** Min/max/default bounds for a single validated field. */
interface ValidationRule {
  min: number;
  max: number;
  default: number;
}

/**
 * Validation rules for common calculator inputs
 * Each rule defines min, max, and default values
 */
export const VALIDATION_RULES: Record<string, ValidationRule> = {
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
 * @param value - The value to validate
 * @param fieldName - Name of the field (must exist in VALIDATION_RULES)
 * @returns Validated and clamped number
 *
 * @example
 * validateInput("5000", "miles") => 5000
 * validateInput("15000", "miles") => 10000 // clamped to max
 */
export function validateInput(value: string | number, fieldName: string): number {
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
 * @param setter - State setter function
 * @param fieldName - Name of the field (must exist in VALIDATION_RULES)
 * @returns Change handler function
 *
 * @example
 * const handleMilesChange = createValidatedHandler(setMiles, 'miles');
 * <input onChange={(e) => handleMilesChange(e.target.value)} />
 */
export function createValidatedHandler(
  setter: (value: number) => void,
  fieldName: string
): (value: string | number) => void {
  return (value: string | number) => {
    const validated = validateInput(value, fieldName);
    setter(validated);
  };
}
