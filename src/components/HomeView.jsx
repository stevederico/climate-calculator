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
  const [bayBridgeTolls, setBayBridgeTolls] = useState(160);
  const [gasCarPayment, setGasCarPayment] = useState(0); // monthly gas car payment
  const [totalGasCost, setTotalGasCost] = useState(0);

  const [selectedCarTitle, setSelectedCarTitle] = useState(teslaModel3.title);
  const [evPayment, setEVPayment] = useState(teslaModel3.payment);
  const [totalEVCost, setTotalEVCost] = useState(0);
  const [evInsurance, setEVInsurance] = useState(teslaModel3.insurance);
  const [evRegistration, setEVRegistration] = useState(teslaModel3.registration); // annual
  const [evDown, setEVDown] = useState(teslaModel3.down); // Tesla due at signing

  const LEASE_MONTHS = 36; // Tesla lease term in months

  useEffect(() => {
    const gasMonthly = parseFloat(gasCost) || 0;
    const tollsMonthly = parseFloat(bayBridgeTolls) || 0;
    const insuranceMonthly = parseFloat(gasInsurance) || 0;
    const gasRegMonthly = (parseFloat(gasRegistration) || 0) / 12;
    const gasPaymentMonthly = parseFloat(gasCarPayment) || 0;
    setTotalGasCost(gasMonthly + tollsMonthly + insuranceMonthly + gasRegMonthly + gasPaymentMonthly);

    const miles = parseFloat(milesDriven) || 0;
    const energyMonthly = miles * 0.25 * (parseFloat(energyCost) || 0);
    const evTolls = tollsMonthly / 2;
    const evIns = parseFloat(evInsurance) || 0;
    const evRegMonthly = (parseFloat(evRegistration) || 0) / 12;
    const tradeInMonthly = (parseFloat(tradeInValue) || 0) / LEASE_MONTHS;
    const evDueMonthly = (parseFloat(evDown) || 0) / LEASE_MONTHS;
    setTotalEVCost((parseFloat(evPayment) || 0) + energyMonthly + evTolls + evIns + evRegMonthly + evDueMonthly - tradeInMonthly);
  }, [gasCost, milesDriven, evPayment, energyCost, bayBridgeTolls, gasInsurance, evInsurance, tradeInValue, gasRegistration, evRegistration, evDown, gasCarPayment]);

  const handleInputChange = (setter) => (e) => {
    setter(parseNumberInput(e.target.value));
  };

  return (
    <>
      <Header
        buttonClass=""
        title={"EV Comparison Calculator"}
      ></Header>

      <div className="p-4 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-2">Gas Vehicle Costs</h3>
        <div className=" p-0 rounded-lg shadow-md mb-4">
          <div className="mb-3 border px-3 pt-2 rounded">
            <label className="block mb-1 text-sm text-gray-400">Monthly Gas Spending </label>
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
            <label className="block mb-1 text-sm text-gray-400">Miles Driven Monthly</label>
            <input
              type="text"
              value={formatNumber(milesDriven)}
              onChange={handleInputChange(setMilesDriven)}
              className="w-full p-0 pb-2 text-xl rounded"
              placeholder="Enter miles driven per month"
            />
          </div>
          <div className="mb-3 border px-3 pt-2 rounded">
            <label className="block mb-1 text-sm text-gray-400">Bay Bridge Tolls Monthly</label>
            <div className="flex items-beginning">
              <div className="text-xl mr-1">$</div>
              <input
                type="text"
                value={formatNumber(bayBridgeTolls)}
                onChange={handleInputChange(setBayBridgeTolls)}
                className="w-full p-0 pb-2 text-xl rounded"
                placeholder="Enter monthly Bay Bridge tolls"
              />
            </div>
          </div>
          <div className="mb-3 border px-3 pt-2 rounded">
            <label className="block mb-1 text-sm text-gray-400">Gas Vehicle Insurance Monthly</label>
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
            <label className="block mb-1 text-sm text-gray-400">Trade-In Value of Gas Vehicle</label>
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
            <label className="block mb-1 text-sm text-gray-400">Annual Registration Cost</label>
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
            <label className="block mb-1 text-sm text-gray-400">Monthly Car Payment</label>
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
        </div>

        <div className="mb-3 border px-3 pt-2 rounded">
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
        <div className=" p-0 rounded-lg shadow-md mb-4">

          <div className="mb-3 border px-3 pt-2 rounded">
            <label className="block mb-1 text-sm text-gray-400">Energy Cost per kWh</label>
            <div className="flex items-beginning">
              <div className="text-xl mr-1">$</div>
              <input
                type="text"
                value={formatNumber(energyCost)}
                onChange={handleInputChange(setEnergyCost)}
                className="w-full p-0 pb-2 text-xl rounded"
                placeholder="Enter energy cost per kWh"
              />
            </div>
          </div>
          <div className="mb-3 border px-3 pt-2 rounded">
            <label className="block mb-1 text-sm text-gray-400">EV Insurance Monthly</label>
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
            <label className="block mb-1 text-sm text-gray-400">Annual Registration Cost</label>
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
            <label className="block mb-1 text-sm text-gray-400">Due at Signing</label>
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

        <h3 className="text-xl font-semibold mb-2">Comparison</h3>
        <div className="mb-2">
          <div className="mb-1 font-semibold">Gas Vehicle:</div>
          <div className="ml-4">
            <div>Gas: <span className="font-mono">${parseFloat(gasCost).toFixed(2)}</span></div>
            <div>Tolls: <span className="font-mono">${parseFloat(bayBridgeTolls).toFixed(2)}</span></div>
            <div>Insurance: <span className="font-mono">${parseFloat(gasInsurance).toFixed(2)}</span></div>
            <div>Registration: <span className="font-mono">${(parseFloat(gasRegistration) / 12).toFixed(2)}</span></div>
            <div>Car Payment: <span className="font-mono">${parseFloat(gasCarPayment).toFixed(2)}</span></div>
            <div className="font-bold">Total: <span className="font-mono">${totalGasCost.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="mb-2">
          <div className="mb-1 font-semibold">{selectedCarTitle}:</div>
          <div className="ml-4">
            <div>Lease: <span className="font-mono">${parseFloat(evPayment).toFixed(2)}</span></div>
            <div>Energy: <span className="font-mono">${(parseFloat(milesDriven) * 0.254 * parseFloat(energyCost)).toFixed(2)}</span></div>
            <div>Tolls: <span className="font-mono">${(parseFloat(bayBridgeTolls) / 2).toFixed(2)}</span></div>
            <div>Insurance: <span className="font-mono">${parseFloat(evInsurance).toFixed(2)}</span></div>
            <div>Registration: <span className="font-mono">${(parseFloat(evRegistration) / 12).toFixed(2)}</span></div>
            <div>Due at Signing: <span className="font-mono">${(parseFloat(evDown) / LEASE_MONTHS).toFixed(2)}</span></div>
            <div>Trade-In Credit: <span className="font-mono">-${((parseFloat(tradeInValue) || 0) / LEASE_MONTHS).toFixed(2)}</span></div>
            <div className="font-bold">Total: <span className="font-mono">${totalEVCost.toFixed(2)}</span></div>
          </div>
        </div>
        <p className="font-bold">
          {totalEVCost < totalGasCost
            ? `Switching to a ${selectedCarTitle} could save you $${(totalGasCost - totalEVCost).toFixed(2)} per month!`
            : `You could upgrade to a brand new ${selectedCarTitle} for only $${(totalEVCost - totalGasCost).toFixed(2)} more per month.`}
        </p>
        <p className="font-bold text-green-600 mt-4">{selectedCarTitle} comes with <span className="font-mono">Free Supercharging for 6 Months</span>!</p>
      </div>
    </>
  );
}
