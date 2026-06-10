/**
 * Financial calculation utilities
 * @module utils/calculations
 */

/**
 * Calculates the principal loan amount from monthly payment using amortization formula
 * Formula: P = M × [(1 - (1 + r)^-n) / r]
 *
 * @param monthlyPayment - Monthly payment amount
 * @param annualRate - Annual interest rate as decimal (e.g., 0.05 for 5%)
 * @param termMonths - Loan term in months
 * @returns Principal loan amount
 *
 * @example
 * // $500/mo payment, 5% APR, 36 months
 * calculatePrincipalFromPayment(500, 0.05, 36) => 16,889.50
 */
export function calculatePrincipalFromPayment(monthlyPayment: number, annualRate: number, termMonths: number): number {
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
 * @param upfrontCost - Initial cost difference (can be negative for immediate benefit)
 * @param monthlySavings - Monthly savings amount
 * @returns Months until payoff, or Infinity if no payoff, or 0 if immediate benefit
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
export function calculatePayoffMonths(upfrontCost: number, monthlySavings: number): number {
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
 * @param monthlyMiles - Miles driven per month
 * @param efficiency - Vehicle efficiency in kWh per mile
 * @param energyCostPerKwh - Cost per kWh of electricity
 * @returns Monthly energy cost
 *
 * @example
 * // 1000 miles/mo, 0.26 kWh/mi efficiency, $0.45/kWh
 * calculateEVEnergyCost(1000, 0.26, 0.45) => 117
 */
export function calculateEVEnergyCost(monthlyMiles: number, efficiency: number, energyCostPerKwh: number): number {
  return monthlyMiles * efficiency * energyCostPerKwh;
}

/**
 * Calculates monthly fuel cost for gasoline vehicle
 *
 * @param monthlyMiles - Miles driven per month
 * @param mpg - Miles per gallon
 * @param fuelCostPerGallon - Cost per gallon of fuel
 * @returns Monthly fuel cost
 *
 * @example
 * // 1000 miles/mo, 25 mpg, $3.50/gallon
 * calculateGasFuelCost(1000, 25, 3.50) => 140
 */
export function calculateGasFuelCost(monthlyMiles: number, mpg: number, fuelCostPerGallon: number): number {
  if (mpg <= 0) return 0;
  return (monthlyMiles / mpg) * fuelCostPerGallon;
}
