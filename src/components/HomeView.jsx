import Header from '@stevederico/skateboard-ui/Header';
import { useEffect, useState } from "react";
import { isSubscriber } from '@stevederico/skateboard-ui/Utilities';

export default function HomeView() {
  const [gasCost, setGasCost] = useState(350); // Default monthly gas spending
  const [carValue, setCarValue] = useState(0);
  const [milesDriven, setMilesDriven] = useState(500); // Default miles driven monthly
  const [model3Cost, setModel3Cost] = useState(299); // Default Model 3 lease cost
  const [energyCost, setEnergyCost] = useState(0.45); // Default energy cost per kWh
  const [bayBridgeTolls, setBayBridgeTolls] = useState(160); // Default Bay Bridge tolls per month
  const [totalCurrentCost, setTotalCurrentCost] = useState(0);
  const [totalModel3Cost, setTotalModel3Cost] = useState(0);
  const [gasInsurance, setGasInsurance] = useState(50); // Gas vehicle insurance
  const [teslaInsurance, setTeslaInsurance] = useState(100); // Tesla insurance

  useEffect(() => {
    isSubscriber().then(s => {
      // Implement subscriber status handling if necessary
    });
  }, []);

  useEffect(() => {
    // Calculate total cost for gas vehicle (no depreciation)
    const gasMonthly = parseFloat(gasCost) || 0;
    const tollsMonthly = parseFloat(bayBridgeTolls) || 0;
    const insuranceMonthly = parseFloat(gasInsurance) || 0;
    setTotalCurrentCost(gasMonthly + tollsMonthly + insuranceMonthly);

    // Calculate total cost for Model 3
    const miles = parseFloat(milesDriven) || 0;
    const energyMonthly = miles * 0.25 * energyCost; // 0.25 kWh/mi
    const teslaTolls = tollsMonthly / 2; // Tesla toll cost is half
    const teslaIns = parseFloat(teslaInsurance) || 0;
    setTotalModel3Cost(model3Cost + energyMonthly + teslaTolls + teslaIns);
  }, [gasCost, carValue, milesDriven, model3Cost, energyCost, bayBridgeTolls, gasInsurance, teslaInsurance]);

  const handleInputChange = (setter) => (e) => {
    setter(parseFloat(e.target.value) || 0);
  };

  return (
    <>
      <Header
        buttonClass=""
        title={"EV Comparison Calculator"}
      ></Header>

      <div className="p-4 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-2">Gas Vehicle Costs</h3>
        <div className="bg-accent p-4 rounded-lg shadow-md mb-4">
          <div className="mb-3">
            <label className="block mb-1 font-medium">Monthly Gas Spending ($):</label>
            <input
              type="number"
              value={gasCost}
              onChange={handleInputChange(setGasCost)}
              className="w-full p-2 border rounded"
              placeholder="Enter monthly gas cost"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Gas Vehicle Value ($):</label>
            <input
              type="number"
              value={carValue}
              onChange={handleInputChange(setCarValue)}
              className="w-full p-2 border rounded"
              placeholder="Enter gas vehicle value"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Miles Driven Monthly:</label>
            <input
              type="number"
              value={milesDriven}
              onChange={handleInputChange(setMilesDriven)}
              className="w-full p-2 border rounded"
              placeholder="Enter miles driven per month"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Bay Bridge Tolls Monthly ($):</label>
            <input
              type="number"
              value={bayBridgeTolls}
              onChange={handleInputChange(setBayBridgeTolls)}
              className="w-full p-2 border rounded"
              placeholder="Enter monthly Bay Bridge tolls"
            />
          </div>
          <div className="mb-3">
          <label className="block mb-1 font-medium">Gas Vehicle Insurance Monthly ($):</label>
          <input
            type="number"
            value={gasInsurance}
            onChange={handleInputChange(setGasInsurance)}
            className="w-full p-2 border rounded"
            placeholder="Enter gas vehicle insurance cost"
          />
        </div>
        </div>

        <h3 className="text-xl font-semibold mb-2">Tesla Model 3 Lease</h3>
        <div className="bg-accent p-4 rounded-lg shadow-md mb-4">
          <div className="mb-3">
            <label className="block mb-1 font-medium">Monthly Lease Cost ($):</label>
            <input
              type="number"
              value={model3Cost}
              onChange={handleInputChange(setModel3Cost)}
              className="w-full p-2 border rounded"
              placeholder="Enter lease cost"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Energy Cost per kWh ($):</label>
            <input
              type="number"
              value={energyCost}
              onChange={handleInputChange(setEnergyCost)}
              className="w-full p-2 border rounded"
              placeholder="Enter energy cost per kWh"
            />
          </div>
          <div className="mb-3">
          <label className="block mb-1 font-medium">Tesla Insurance Monthly ($):</label>
          <input
            type="number"
            value={teslaInsurance}
            onChange={handleInputChange(setTeslaInsurance)}
            className="w-full p-2 border rounded"
            placeholder="Enter Tesla insurance cost"
          />
        </div>
        </div>

        <h3 className="text-xl font-semibold mb-2">Comparison</h3>
        <div className="mb-2">
          <div className="mb-1 font-semibold">Gas Vehicle:</div>
          <div className="ml-4">
            <div>Gas: <span className="font-mono">${parseFloat(gasCost).toFixed(2)}</span></div>
            <div>Tolls: <span className="font-mono">${parseFloat(bayBridgeTolls).toFixed(2)}</span></div>
            <div>Insurance: <span className="font-mono">${parseFloat(gasInsurance).toFixed(2)}</span></div>
            <div className="font-bold">Total: <span className="font-mono">${totalCurrentCost.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="mb-2">
          <div className="mb-1 font-semibold">Tesla Model 3:</div>
          <div className="ml-4">
            <div>Lease: <span className="font-mono">${parseFloat(model3Cost).toFixed(2)}</span></div>
            <div>Energy: <span className="font-mono">${(parseFloat(milesDriven) * 0.25 * parseFloat(energyCost)).toFixed(2)}</span></div>
            <div>Tolls: <span className="font-mono">${(parseFloat(bayBridgeTolls) / 2).toFixed(2)}</span></div>
            <div>Insurance: <span className="font-mono">${parseFloat(teslaInsurance).toFixed(2)}</span></div>
            <div className="font-bold">Total: <span className="font-mono">${totalModel3Cost.toFixed(2)}</span></div>
          </div>
        </div>
        <p className="font-bold">
          {totalModel3Cost < totalCurrentCost
            ? `Switching to a Model 3 could save you $${(totalCurrentCost - totalModel3Cost).toFixed(2)} per month!`
            : `Your gas vehicle is $${(totalModel3Cost - totalCurrentCost).toFixed(2)} cheaper per month than a Model 3.`}
        </p>
      </div>
    </>
  );
}
