/**
 * Financial calculation utilities
 * @module utils/calculations
 */

/**
 * Calculates the principal loan amount from monthly payment using amortization formula
 * Formula: P = M × [(1 - (1 + r)^-n) / r]
 *
 * @param {number} monthlyPayment - Monthly payment amount
 * @param {number} annualRate - Annual interest rate as decimal (e.g., 0.05 for 5%)
 * @param {number} termMonths - Loan term in months
 * @returns {number} Principal loan amount
 *
 * @example
 * // $500/mo payment, 5% APR, 36 months
 * calculatePrincipalFromPayment(500, 0.05, 36) => 16,889.50
 */
export function calculatePrincipalFromPayment(monthlyPayment, annualRate, termMonths) {
  if (termMonths <= 0) return 0;
  if (monthlyPayment <= 0) return 0;

  const monthlyRate = annualRate / 12;

  // Handle 0% interest case
  if (monthlyRate === 0) {
    return monthlyPayment * termMonths;
  }

  // Standard amortization formula
  const principal = (monthlyPayment * (1 - Math.pow(1 + monthlyRate, -termMonths))) / monthlyRate;
  return principal;
}

/**
 * Calculates months until payoff given upfront cost and monthly savings
 *
 * @param {number} upfrontCost - Initial cost difference (can be negative for immediate benefit)
 * @param {number} monthlySavings - Monthly savings amount
 * @returns {number} Months until payoff, or Infinity if no payoff, or 0 if immediate benefit
 *
 * @example
 * // $5000 upfront cost, $200/mo savings
 * calculatePayoffMonths(5000, 200) => 25
 *
 * @example
 * // -$3000 upfront (immediate benefit), $100/mo savings
 * calculatePayoffMonths(-3000, 100) => 0
 *
 * @example
 * // $5000 upfront, losing $50/mo
 * calculatePayoffMonths(5000, -50) => Infinity
 */
export function calculatePayoffMonths(upfrontCost, monthlySavings) {
  // If saving money monthly
  if (monthlySavings > 0) {
    // If upfront cost is negative (immediate benefit), payoff is immediate
    if (upfrontCost <= 0) return 0;
    // Otherwise calculate months to recover upfront cost
    return upfrontCost / monthlySavings;
  }

  // If losing money monthly, never pays off
  return Infinity;
}

/**
 * Calculates monthly energy cost for electric vehicle
 *
 * @param {number} monthlyMiles - Miles driven per month
 * @param {number} efficiency - Vehicle efficiency in kWh per mile
 * @param {number} energyCostPerKwh - Cost per kWh of electricity
 * @returns {number} Monthly energy cost
 *
 * @example
 * // 1000 miles/mo, 0.26 kWh/mi efficiency, $0.45/kWh
 * calculateEVEnergyCost(1000, 0.26, 0.45) => 117
 */
export function calculateEVEnergyCost(monthlyMiles, efficiency, energyCostPerKwh) {
  return monthlyMiles * efficiency * energyCostPerKwh;
}

/**
 * Calculates monthly fuel cost for gasoline vehicle
 *
 * @param {number} monthlyMiles - Miles driven per month
 * @param {number} mpg - Miles per gallon
 * @param {number} fuelCostPerGallon - Cost per gallon of fuel
 * @returns {number} Monthly fuel cost
 *
 * @example
 * // 1000 miles/mo, 25 mpg, $3.50/gallon
 * calculateGasFuelCost(1000, 25, 3.50) => 140
 */
export function calculateGasFuelCost(monthlyMiles, mpg, fuelCostPerGallon) {
  if (mpg <= 0) return 0;
  return (monthlyMiles / mpg) * fuelCostPerGallon;
}
