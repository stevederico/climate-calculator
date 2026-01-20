import { useState, useEffect } from "react";
import { trackEvent } from '../utils/analytics';

export default function SolarCalcView() {
  // Utility functions
  function formatNumber(val) {
    if (val === null || val === undefined || isNaN(val)) return '';
    return val.toLocaleString('en-US');
  }
  function parseNumberInput(val) {
    if (typeof val === 'string') {
      return parseFloat(val.replace(/,/g, '')) || 0;
    }
    return val || 0;
  }

  // State
  const [gridBill, setGridBill] = useState(330);
  const [solarDown, setSolarDown] = useState(1000);
  const [solarMonthly, setSolarMonthly] = useState(15); // bill after solar
  const [showSolarDetails, setShowSolarDetails] = useState(false);
  const [loanPayment, setLoanPayment] = useState(180); // editable loan payment
  const [termMonths, setTermMonths] = useState(120);
  const [apr, setApr] = useState(3.99);

  // Handlers
  const handleInputChange = setter => e => setter(Math.max(0, parseNumberInput(e.target.value)));

  // Track page view on mount
  useEffect(() => {
    trackEvent('solar-calculator-viewed');
  }, []);

  // Calculate solarAmount (system cost) from payment, term, apr, down
  // Formula: P = (A * r) / (1 - (1 + r)^-n), solve for A
  // A = (P * (1 - (1 + r)^-n)) / r
  const monthlyRate = apr / 100 / 12;
  const principal = monthlyRate > 0
    ? (loanPayment * (1 - Math.pow(1 + monthlyRate, -termMonths))) / monthlyRate
    : loanPayment * termMonths;
  const solarAmount = parseFloat(solarDown) + principal;

  // Calculations
  const gridTotal = parseFloat(gridBill) || 0;
  const solarTotal = (parseFloat(solarMonthly) || 0) + parseFloat(loanPayment);
  const diff = gridTotal - solarTotal;

  // Payoff calculation (total cost = loan payments + down payment)
  const totalLoanCost = parseFloat(loanPayment) * termMonths + parseFloat(solarDown);
  const monthlySavings = gridTotal - solarTotal;
  const payoffMonths = monthlySavings > 0 ? Math.ceil(totalLoanCost / monthlySavings) : 0;

  return (
    <>

      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
          {/* Grid Section */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-3xl my-4 text-center">⚡️ Grid</h3>
            <div className="p-0 rounded-lg shadow-md mb-4 flex-1 flex flex-col">
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Monthly Bill</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(gridBill)}
                    onChange={handleInputChange(setGridBill)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter monthly grid bill"
                  />
                </div>
              </div>
              <div className="flex-1" />
              <div className="flex items-center justify-center mb-2 mt-4">
                <div className="font-semibold text-3xl bg-accent px-4 py-2 rounded w-full text-center min-w-[180px]">
                  <span className="font-mono">${gridTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Solar Section */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-3xl my-4 text-center">☀️ Solar</h3>
            <div className="p-0 rounded-lg shadow-md mb-4 flex-1 flex flex-col">
              {/* Remove System Cost input from main form */}
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Monthly Bill</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(solarMonthly)}
                    onChange={handleInputChange(setSolarMonthly)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter monthly solar cost"
                  />
                </div>
              </div>
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Loan Payment {termMonths}mo @ {apr}%</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(loanPayment)}
                    onChange={handleInputChange(setLoanPayment)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter monthly loan payment"
                  />
                </div>
              </div>

              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Down Payment</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(solarDown)}
                    onChange={handleInputChange(setSolarDown)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter down payment"
                  />
                </div>
              </div>
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Loan Term (months)</label>
                <input
                  type="text"
                  value={formatNumber(termMonths)}
                  onChange={handleInputChange(setTermMonths)}
                  className="w-full p-0 pb-2 text-xl rounded"
                  placeholder="Enter loan term in months"
                />
              </div>
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">APR (%)</label>
                <input
                  type="text"
                  value={formatNumber(apr)}
                  onChange={handleInputChange(setApr)}
                  className="w-full p-0 pb-2 text-xl rounded"
                  placeholder="Enter APR"
                />
              </div>
              <div className="flex-1" />
              <div className="flex items-center justify-center mb-2 mt-4">
                <div
                  className={`font-semibold text-3xl bg-accent px-4 py-2 rounded w-full text-center min-w-[180px] cursor-pointer ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}
                  onClick={() => {
                    setShowSolarDetails(v => !v);
                    trackEvent('solar-details-toggled', {
                      show: !showSolarDetails,
                      savings: diff,
                      solarCost: solarTotal,
                      gridCost: gridTotal
                    });
                  }}
                >
                  <span className="font-mono">${solarTotal.toFixed(2)}</span>
                </div>
              </div>
              {showSolarDetails && (
                <div className="ml-4 mt-2 bg-background rounded p-2 border">
                  <div className="flex">System Cost: <span className="ml-auto font-mono">${formatNumber(solarAmount)}</span></div>
                  <div className="flex">Down Payment (upfront): <span className="ml-auto font-mono">${formatNumber(solarDown)}</span></div>
                  <div className="flex">Loan Payment: <span className="ml-auto font-mono">${loanPayment.toFixed(2)}</span></div>
                  <div className="flex">Monthly Bill: <span className="ml-auto font-mono">${formatNumber(solarMonthly)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 mb-2 px-3 py-3 bg-accent rounded-xl text-center text-xl font-semibold">
          {monthlySavings > 0
            ? `Payoff: ${payoffMonths} months (based on $${monthlySavings.toFixed(2)} monthly savings)`
            : 'Payoff: ∞'}
        </div>
        <div className="mt-8 mb-6 px-3 py-4 bg-green-700 text-white text-center text-3xl rounded-xl font-semibold">
          {diff > 0
            ? `Save $${diff.toFixed(2)} /month`
            : `+${Math.abs(diff).toFixed(2)} /month vs grid`}
        </div>
      </div>
    </>
  );
}
