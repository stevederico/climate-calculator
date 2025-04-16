import Header from '@stevederico/skateboard-ui/Header';
import { useEffect, useState } from "react";
import { isSubscriber } from '@stevederico/skateboard-ui/Utilities';

// Utility to format numbers with commas
function formatNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return '';
  return val.toLocaleString('en-US');
}

// Utility to parse input, removing commas
function parseNumberInput(val) {
  if (typeof val === 'string') {
    return parseFloat(val.replace(/,/g, '')) || 0;
  }
  return val || 0;
}

export default function HomeView() {

  const teslaModel3 = {
    title: "Tesla Model 3",
    payment: 450,
    insurance: 100,
    registration: 500,
    down: 2635,
  };

  const teslaModelY = {
    title: "Tesla Model Y",
    payment: 500,
    insurance: 120,
    registration: 600,
    down: 3000,
  };
  const cars = [teslaModel3, teslaModelY]

  const [gasCost, setGasCost] = useState(350);
  const [milesDriven, setMilesDriven] = useState(1000);
  const [tradeInValue, setTradeInValue] = useState(8000); // Trade-in value of gas vehicle
  const [gasRegistration, setGasRegistration] = useState(250); // annual
  const [energyCost, setEnergyCost] = useState(0.45);
  const [gasInsurance, setGasInsurance] = useState(75);
  const [tolls, setTolls] = useState(0);
  const [gasCarPayment, setGasCarPayment] = useState(250); // monthly gas car payment
  const [totalGasCarCost, setTotalGasCarCost] = useState(0);

  const [selectedCarTitle, setSelectedCarTitle] = useState(teslaModel3.title);
  const [evPayment, setEVPayment] = useState(teslaModel3.payment);
  const [totalEVCost, setTotalEVCost] = useState(0);
  const [evInsurance, setEVInsurance] = useState(teslaModel3.insurance);
  const [evRegistration, setEVRegistration] = useState(teslaModel3.registration); // annual
  const [evDown, setEVDown] = useState(teslaModel3.down); // Tesla due at signing

  const LEASE_MONTHS = 36; // Tesla lease term in months

  useEffect(() => {
    const gasMonthly = parseFloat(gasCost) || 0;
    const tollsMonthly = parseFloat(tolls) || 0;
    const insuranceMonthly = parseFloat(gasInsurance) || 0;
    const gasRegMonthly = (parseFloat(gasRegistration) || 0) / 12;
    const gasPaymentMonthly = parseFloat(gasCarPayment) || 0;
    setTotalGasCarCost(gasMonthly + tollsMonthly + insuranceMonthly + gasRegMonthly + gasPaymentMonthly);

    const miles = parseFloat(milesDriven) || 0;
    const energyMonthly = miles * 0.25 * (parseFloat(energyCost) || 0);
    const evTolls = tollsMonthly / 2;
    const evIns = parseFloat(evInsurance) || 0;
    const evRegMonthly = (parseFloat(evRegistration) || 0) / 12;
    const tradeInMonthly = (parseFloat(tradeInValue) || 0) / LEASE_MONTHS;
    const evDueMonthly = (parseFloat(evDown) || 0) / LEASE_MONTHS;
    setTotalEVCost((parseFloat(evPayment) || 0) + energyMonthly + evTolls + evIns + evRegMonthly + evDueMonthly - tradeInMonthly);
  }, [gasCost, milesDriven, evPayment, energyCost, tolls, gasInsurance, evInsurance, tradeInValue, gasRegistration, evRegistration, evDown, gasCarPayment]);

  const handleInputChange = (setter) => (e) => {
    setter(parseNumberInput(e.target.value));
  };

  // Calculate EV energy cost and percent cheaper
  const evEnergyCost = (parseFloat(milesDriven) * 0.25 * parseFloat(energyCost)) || 0;
  const percentCheaper = gasCost > 0 ? Math.round(100 * (1 - (evEnergyCost / gasCost))) : 0;

  const gasCars = [
    { title: "Toyota Camry" },
    { title: "Honda Accord" },
    { title: "Ford F-150" },
    { title: "Other" }
  ];
  const [selectedGasCarTitle, setSelectedGasCarTitle] = useState(gasCars[0].title);

  return (
    <>
      <Header
        buttonClass=""
        title={"EV Comparison Calculator"}
      ></Header>

      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
          <div className="flex-1">
            <h3 className="text-xl my-4">Gas Vehicle Costs (Monthly)</h3>
            <div id="gasParent" className="p-0 rounded-lg shadow-md mb-4 md:mb-0">
              <div className="my- mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 font-medium text-sm text-gray-400">Select Vehicle:</label>
                <select
                  value={selectedGasCarTitle}
                  onChange={e => setSelectedGasCarTitle(e.target.value)}
                  className="w-full p-0 pb-2 text-xl rounded"
                >
                  {gasCars.map(car => (
                    <option key={car.title} value={car.title}>{car.title}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Payment</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(gasCarPayment)}
                    onChange={handleInputChange(setGasCarPayment)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter monthly car payment"
                  />
                </div>
              </div>
              <div className="mb-3 border px-3 pt-2 pb-5 rounded">
                <label className="block mb-1 text-sm text-gray-400">Gas</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(gasCost)}
                    onChange={handleInputChange(setGasCost)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter monthly gas cost"
                  />
                </div>
              </div>

              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Insurance</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(gasInsurance)}
                    onChange={handleInputChange(setGasInsurance)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter gas vehicle insurance cost"
                  />
                </div>
              </div>


              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Annual Registration</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(gasRegistration)}
                    onChange={handleInputChange(setGasRegistration)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter annual registration cost"
                  />
                </div>
              </div>

              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Miles</label>
                <input
                  type="text"
                  value={formatNumber(milesDriven)}
                  onChange={handleInputChange(setMilesDriven)}
                  className="w-full p-0 pb-2 text-xl rounded"
                  placeholder="Enter miles driven per month"
                />
              </div>

              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Trade-In Value</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(tradeInValue)}
                    onChange={handleInputChange(setTradeInValue)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter trade-in value"
                  />
                </div>
              </div>


              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Tolls</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(tolls)}
                    onChange={handleInputChange(setTolls)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter monthly tolls"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl my-4">EV Vehicle Costs (Monthly)</h3>
            <div id="evParent" className="p-0 rounded-lg shadow-md mb-4">
              <div className="my- mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 font-medium text-sm text-gray-400">Select EV:</label>
                <select
                  value={selectedCarTitle}
                  onChange={(e) => {
                    const selectedCar = cars.find(car => car.title === e.target.value);
                    if (selectedCar) {
                      setSelectedCarTitle(selectedCar.title);
                      setEVPayment(selectedCar.payment);
                      setEVInsurance(selectedCar.insurance);
                      setEVRegistration(selectedCar.registration);
                      setEVDown(selectedCar.down);
                    }
                  }}
                  className="w-full p-0 pb-2 text-xl rounded"
                >
                  {cars.map(car => (
                    <option key={car.title} value={car.title}>{car.title}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Payment</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(evPayment)}
                    onChange={handleInputChange(setEVPayment)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter monthly payment"
                  />
                </div>
              </div>

              <div className="mb-3 border px-3 pt-2 pb-2 rounded">
                <label className="block mb-1 text-sm text-gray-400 flex items-center gap-2">
                  Energy
                  {percentCheaper > 0 && (
                    <span className="ml-auto inline-block px-2 py-0.5 rounded-full bg-green-700 text-white text-xs font-semibold">
                      {percentCheaper}% Savings
                    </span>
                  )}
                </label>
                <div className="flex flex-row gap-2 items-center">
                  <div className="w-1/2 flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">{formatNumber(milesDriven)} miles </span>
                    <div className="flex items-center">
                      <div className="text-xl mr-1">$</div>
                      <input
                        type="text"
                        value={evEnergyCost.toFixed(2)}
                        readOnly
                        className="w-full p-0 pb-0 text-xl rounded border-none cursor-default"
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                  <div className="w-1/2 flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">$/kWh</span>
                    <div className="flex items-center">
                      <div className="text-xl mr-1">$</div>
                      <input
                        type="text"
                        value={formatNumber(energyCost)}
                        onChange={handleInputChange(setEnergyCost)}
                        className="w-full p-0  text-xl rounded"
                        placeholder="Enter energy cost per kWh"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Insurance</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(evInsurance)}
                    onChange={handleInputChange(setEVInsurance)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter EV insurance cost"
                  />
                </div>
              </div>
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Annual Registration</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(evRegistration)}
                    onChange={handleInputChange(setEVRegistration)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter annual registration cost"
                  />
                </div>
              </div>
              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Down</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(evDown)}
                    onChange={handleInputChange(setEVDown)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter due at signing"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2">Comparison</h3>
        <div className="mb-2">
          <div className="mb-1 font-semibold">Gas Vehicle:</div>
          <div className="ml-4">
            <div>Payment: <span className="font-mono">${parseFloat(gasCarPayment).toFixed(2)}</span></div>
            <div>Gas: <span className="font-mono">${parseFloat(gasCost).toFixed(2)}</span></div>
            <div>Insurance: <span className="font-mono">${parseFloat(gasInsurance).toFixed(2)}</span></div>
            <div>Registration: <span className="font-mono">${(parseFloat(gasRegistration) / 12).toFixed(2)}</span></div>
            <div>Tolls: <span className="font-mono">${parseFloat(tolls).toFixed(2)}</span></div>
            <div className="font-bold">Total: <span className="font-mono">${totalGasCarCost.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="mb-2">
          <div className="mb-1 font-semibold">{selectedCarTitle}:</div>
          <div className="ml-4">
            <div>Payment: <span className="font-mono">${parseFloat(evPayment).toFixed(2)}</span></div>
            <div>Energy: <span className="font-mono">${(parseFloat(milesDriven) * 0.254 * parseFloat(energyCost)).toFixed(2)}</span></div>
            <div>Insurance: <span className="font-mono">${parseFloat(evInsurance).toFixed(2)}</span></div>
            <div>Registration: <span className="font-mono">${(parseFloat(evRegistration) / 12).toFixed(2)}</span></div>
            <div>Tolls: <span className="font-mono">${(parseFloat(tolls) / 2).toFixed(2)}</span></div>
            <div>Down: <span className="font-mono">${(parseFloat(evDown) / LEASE_MONTHS).toFixed(2)}</span></div>
            <div>Trade-In Credit: <span className="font-mono">-${((parseFloat(tradeInValue) || 0) / LEASE_MONTHS).toFixed(2)}</span></div>
            <div className="font-bold">Total: <span className="font-mono">${totalEVCost.toFixed(2)}</span></div>
          </div>
        </div>
        <p className="font-bold">
          {totalEVCost < totalGasCarCost
            ? `Switching to a ${selectedCarTitle} could save you $${(totalGasCarCost - totalEVCost).toFixed(2)} per month!`
            : `You could upgrade to a brand new ${selectedCarTitle} for only $${(totalEVCost - totalGasCarCost).toFixed(2)} more per month.`}
        </p>
        <p className="font-bold text-green-600 mt-4">{selectedCarTitle} comes with <span className="font-mono">Free Supercharging for 6 Months</span>!</p>
      </div>
    </>
  );
}
