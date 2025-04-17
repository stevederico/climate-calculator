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

export default function EVCalcView() {


  const cars = [{
    title: "Tesla Model 3",
    method: "Lease",
    term: "36 mo",
    payment: 450,
    insurance: 100,
    registration: 550,
    milage: 12000,
    down: 2635,
    repairs: 295
  },
  {
    title: "Tesla Model Y",
    method: "Lease",
    term: "36 mo",
    payment: 692,
    insurance: 120,
    registration: 600,
    milage: 12000,
    down: 2919,
    repairs: 295
  },
  {
    title: "Tesla Model Y Buy" ,
    method: "Buy",
    term: "72 mo",
    payment: 802,
    insurance: 120,
    registration: 600,
    milage: 12000,
    down: 0,
    repairs: 295
  },
  {
    title: "Used Tesla Model Y ",
    method: "Buy",
    term: "72 mo",

    payment: 371,
    insurance: 120,
    registration: 600,
    milage: 12000,
    down: 0,
    repairs: 295
  }]
  const iceCars = [
    { title: "Toyota Camry 2020", tradeIn: 14600, payment: 475, registration: 379, insurance: 167, repairs: 441 },
    { title: "Honda Accord 2020", tradeIn: 15965, payment: 450, registration: 371, insurance: 220, repairs: 428 },
    { title: "Ford F-150 2020", tradeIn: 13830, payment: 489, registration: 468, insurance: 106, repairs: 775 },
    { title: "Jeep Grand Cherokee", tradeIn: 14026, payment: 425, registration: 475, insurance: 179, repairs: 635 },
    { title: "Other", tradeIn: 8000, payment: 250, registration: 250, insurance: 75 }
  ];

  const [gasCost, setGasCost] = useState(350);
  const [milesDriven, setMilesDriven] = useState(1000);
  const [tradeInValue, setTradeInValue] = useState(iceCars[0].tradeIn); // Trade-in value of ice vehicle
  const [iceRegistration, setIceRegistration] = useState(iceCars[0].registration); // annual
  const [energyCost, setEnergyCost] = useState(0.45);
  const [iceInsurance, setIceInsurance] = useState(iceCars[0].insurance);
  const [tolls, setTolls] = useState(0);
  const [iceCarPayment, setIceCarPayment] = useState(iceCars[0].payment); // monthly ice car payment
  const [iceRepairs, setIceRepairs] = useState(iceCars[0].repairs); // annual repairs/maintenance
  const [totalIceCarCost, setTotalIceCarCost] = useState(0);

  const [selectedCarTitle, setSelectedCarTitle] = useState(cars[0].title);
  const [evPayment, setEVPayment] = useState(cars[0].payment);
  const [totalEVCost, setTotalEVCost] = useState(0);
  const [evInsurance, setEVInsurance] = useState(cars[0].insurance);
  const [evRegistration, setEVRegistration] = useState(cars[0].registration); // annual
  const [evDown, setEVDown] = useState(cars[0].down); // Tesla due at signing

  const LEASE_MONTHS = 36; // Tesla lease term in months

  useEffect(() => {
    const gasMonthly = parseFloat(gasCost) || 0;
    const tollsMonthly = parseFloat(tolls) || 0;
    const insuranceMonthly = parseFloat(iceInsurance) || 0;
    const iceRegMonthly = (parseFloat(iceRegistration) || 0) / 12;
    const iceRepairsMonthly = (parseFloat(iceRepairs) || 0) / 12;
    const icePaymentMonthly = parseFloat(iceCarPayment) || 0;
    setTotalIceCarCost(gasMonthly + tollsMonthly + insuranceMonthly + iceRegMonthly + iceRepairsMonthly + icePaymentMonthly);

    const miles = parseFloat(milesDriven) || 0;
    const energyMonthly = miles * 0.25 * (parseFloat(energyCost) || 0);
    const evTolls = tollsMonthly / 2;
    const evIns = parseFloat(evInsurance) || 0;
    const evRegMonthly = (parseFloat(evRegistration) || 0) / 12;
    const tradeInMonthly = (parseFloat(tradeInValue) || 0) / LEASE_MONTHS;
    const evDueMonthly = (parseFloat(evDown) || 0) / LEASE_MONTHS;
    setTotalEVCost((parseFloat(evPayment) || 0) + energyMonthly + evTolls + evIns + evRegMonthly + evDueMonthly - tradeInMonthly);
  }, [gasCost, milesDriven, evPayment, energyCost, tolls, iceInsurance, evInsurance, tradeInValue, iceRegistration, evRegistration, evDown, iceCarPayment, iceRepairs]);

  const handleInputChange = (setter) => (e) => {
    setter(parseNumberInput(e.target.value));
  };

  // Calculate EV energy cost and percent cheaper
  const evEnergyCost = (parseFloat(milesDriven) * 0.25 * parseFloat(energyCost)) || 0;
  const percentCheaper = gasCost > 0 ? Math.round(100 * (1 - (evEnergyCost / gasCost))) : 0;


  const [selectedIceCarTitle, setSelectedIceCarTitle] = useState(iceCars[0].title);
  const [showIceDetails, setShowIceDetails] = useState(false);
  const [showEVDetails, setShowEVDetails] = useState(false);

  useEffect(() => {
    const selected = iceCars.find(car => car.title === selectedIceCarTitle);
    if (selected) {
      setIceCarPayment(selected.payment);
      setIceRegistration(selected.registration);
      setIceInsurance(selected.insurance);
      setTradeInValue(selected.tradeIn);
      setIceRepairs(selected.repairs);
    }
  }, [selectedIceCarTitle]);

  const evIsLower = totalEVCost < totalIceCarCost;

  return (
    <>
      <Header
        buttonClass=""
        title={"EV Calculator"}
      ></Header>

      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
          {/* ICE Section */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-3xl my-4 text-center"> ⛽️ Gas</h3>
            <div id="iceParent" className="p-0 rounded-lg shadow-md mb-4 md:mb-0 flex-1 flex flex-col">
              <div className="my- mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 font-medium text-sm text-gray-400">Select Vehicle:</label>
                <select
                  value={selectedIceCarTitle}
                  onChange={e => setSelectedIceCarTitle(e.target.value)}
                  className="w-full p-0 pb-2 text-xl rounded"
                >
                  {iceCars.map(car => (
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
                    value={formatNumber(iceCarPayment)}
                    onChange={handleInputChange(setIceCarPayment)}
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
                    value={formatNumber(iceInsurance)}
                    onChange={handleInputChange(setIceInsurance)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter ICE vehicle insurance cost"
                  />
                </div>
              </div>


              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Annual Registration / Smog</label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(iceRegistration)}
                    onChange={handleInputChange(setIceRegistration)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter annual registration cost"
                  />
                </div>
              </div>

          


              <div className="mb-3 border px-3 pt-2 rounded">
                <label className="block mb-1 text-sm text-gray-400">Annual Repairs / Maintenance  </label>
                <div className="flex items-beginning">
                  <div className="text-xl mr-1">$</div>
                  <input
                    type="text"
                    value={formatNumber(iceRepairs)}
                    onChange={handleInputChange(setIceRepairs)}
                    className="w-full p-0 pb-2 text-xl rounded"
                    placeholder="Enter annual repairs/maintenance cost"
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
                <label className="block mb-1 text-sm text-gray-400">Miles Driven</label>
                <input
                  type="text"
                  value={formatNumber(milesDriven)}
                  onChange={handleInputChange(setMilesDriven)}
                  className="w-full p-0 pb-2 text-xl rounded"
                  placeholder="Enter miles driven per month"
                />
              </div>

              <div className="flex-1" />
              {/* ICE Vehicle Totals */}
              <div className="flex items-center justify-center mb-2 mt-4">
                <div id="iceTotal"
                  className={`font-semibold text-3xl cursor-pointer bg-accent px-4 py-2 rounded w-full text-center min-w-[220px]`}
                  onClick={() => setShowIceDetails(v => !v)}
                >
                  <span className="font-mono">${totalIceCarCost.toFixed(2)}</span>
                </div>
              </div>
              {showIceDetails && (
                <div className="ml-4 mt-2 bg-background rounded p-2 border">
                  <div className="flex">Payment: <span className="ml-auto font-mono">${parseFloat(iceCarPayment).toFixed(2)}</span></div>
                  <div className="flex">Gas: <span className="ml-auto font-mono">${parseFloat(gasCost).toFixed(2)}</span></div>
                  <div className="flex">Insurance: <span className="ml-auto font-mono">${parseFloat(iceInsurance).toFixed(2)}</span></div>
                  <div className="flex">Registration: <span className="ml-auto font-mono">${(parseFloat(iceRegistration) / 12).toFixed(2)}</span></div>
                  <div className="flex">Maintenance: <span className="ml-auto font-mono">${(parseFloat(iceRepairs) / 12).toFixed(2)}</span></div>
                  <div className="flex">Tolls: <span className="ml-auto font-mono">${parseFloat(tolls).toFixed(2)}</span></div>
                </div>
              )}
            </div>
          </div>
          {/* EV Section */}
          <div className="flex-1 flex flex-col">

            <h3 className="text-3xl my-4 text-center"> ⚡️ Electric</h3>
            <div id="evParent" className="p-0 rounded-lg shadow-md mb-0 flex-1 flex flex-col">
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
              <div className="flex-1" />
              {/* EV Vehicle Totals */}
              <div className="flex items-center justify-center mb-2 mt-4">
                <div id="evTotal"
                  className={`font-semibold text-3xl cursor-pointer bg-accent px-4 py-2 rounded w-full text-center min-w-[220px]${evIsLower ? ' text-green-500' : ''}`}
                  onClick={() => setShowEVDetails(v => !v)}
                >
                  <span className="font-mono">${totalEVCost.toFixed(2)}</span>
                </div>
              </div>
              {showEVDetails && (
                <div className="ml-4 mt-2 bg-background rounded p-2 border ">
                  <div className="flex">Payment: <span className="ml-auto font-mono">${parseFloat(evPayment).toFixed(2)}</span></div>
                  <div className="flex">Energy: <span className="ml-auto font-mono">${(parseFloat(milesDriven) * 0.254 * parseFloat(energyCost)).toFixed(2)}</span></div>
                  <div className="flex">Insurance: <span className="ml-auto font-mono">${parseFloat(evInsurance).toFixed(2)}</span></div>
                  <div className="flex">Registration: <span className="ml-auto font-mono">${(parseFloat(evRegistration) / 12).toFixed(2)}</span></div>
                  <div className="flex">Tolls: <span className="ml-auto font-mono">${(parseFloat(tolls) / 2).toFixed(2)}</span></div>
                  <div className="flex">Down: <span className="ml-auto font-mono">${(parseFloat(evDown) / LEASE_MONTHS).toFixed(2)}</span></div>
                  <div className="flex">Trade-In Credit: <span className="ml-auto font-mono">-${((parseFloat(tradeInValue) || 0) / LEASE_MONTHS).toFixed(2)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-12 mb-6 px-3 py-4 bg-green-700 text-white text-center text-3xl rounded-xl cursor-pointer font-semibold hover:bg-green-800 transition-colors"
          onClick={() => window.open('https://ts.la/stephen93119', '_blank')}
        >
          {totalEVCost < totalIceCarCost
            ? `Save $${(totalIceCarCost - totalEVCost).toFixed(2)} /month`
            : `Upgrade +$${(totalEVCost - totalIceCarCost).toFixed(2)} /month`}
        </div>

        {/* <p className=" text-center">
          {totalEVCost < totalIceCarCost
            ? `Switch and Save $${(totalIceCarCost - totalEVCost).toFixed(2)} per month!`
            : `Upgrade to a brand new ${selectedCarTitle} for only $${(totalEVCost - totalIceCarCost).toFixed(2)} more per month.`}
        </p> */}
        <div className="py-44"></div>

        {/* <div></div> */}
        {/* <p className="font-bold  mt-4">{selectedCarTitle} comes with <span className="font-mono">Free Supercharging for 6 Months</span>!</p> */}
      </div>
    </>
  );
}
