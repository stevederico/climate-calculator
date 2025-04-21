import Header from '@stevederico/skateboard-ui/Header';
import { useEffect, useState } from "react";
import { isSubscriber } from '@stevederico/skateboard-ui/Utilities';
import * as icons from 'lucide-react';

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
    range: 363,
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
    range: 327,
    payment: 692,
    insurance: 120,
    registration: 600,
    milage: 12000,
    down: 2919,
    repairs: 295
  },
  {
    title: "Tesla Model Y Buy",
    method: "Buy",
    term: "72 mo",
    range: 327,
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
    range: 327,
    payment: 371,
    insurance: 120,
    registration: 600,
    milage: 12000,
    down: 0,
    repairs: 295
  }]
  const iceCars = [
    { title: "Toyota Camry 2020", tradeIn: 14600, payment: 475, registration: 379, insurance: 167, repairs: 441, range: 536 },
    { title: "Honda Accord 2020", tradeIn: 15965, payment: 450, registration: 371, insurance: 220, repairs: 428, range: 562 },
    { title: "Ford F-150 2020", tradeIn: 13830, payment: 489, registration: 468, insurance: 106, repairs: 775, range: 550 },
    { title: "Jeep Grand Cherokee", tradeIn: 14026, payment: 425, registration: 475, insurance: 179, repairs: 517 },
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

        {/* Payoff calculation in years */}
        {(() => {
          const monthlyDelta = totalIceCarCost - totalEVCost;
          const upfrontDelta = parseFloat(evDown) - parseFloat(tradeInValue);
          let payoffYears = null;
          if (monthlyDelta > 0 && upfrontDelta > 0) {
            payoffYears = (upfrontDelta / (monthlyDelta * 12));
          }
          return (
            <div className="text-center text-lg mb-4">
              Payoff: {payoffYears && isFinite(payoffYears) && payoffYears > 0 ? payoffYears.toFixed(1) + ' years' : '∞'}
            </div>
          );
        })()}

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">FAQ</h2>
          <div className="bg-background border border-accent rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <div className="mb-2 font-semibold text-lg">What about range?</div>
            <div className="text-base mb-4">
              Most ICE cars travel about 500 miles on a full tank. Model Y range is 327 miles. But ask yourself: have you ever driven your car with less than 2/3rds of a tank? Most daily driving is well within EV range, and you start every day with a full battery if you charge at home.
            </div>
            <div className="mb-2 font-semibold text-lg">How much does it cost to charge?</div>
            <div className="text-base mb-4">
              Typical home charging: $0.25–$0.50 per kWh. Full charge (75–80 kWh battery) costs ~$20–$40. Many public chargers are free or discounted, especially at work or shopping centers.
            </div>
            <div className="mb-2 font-semibold text-lg">How long does it take to charge?</div>
            <div className="text-base mb-4">
              <span className="font-semibold">Supercharger (0–80%):</span>
              <ul className="list-disc ml-6 mb-2">
                <li>Model 3 RWD: ~25–30 min</li>
                <li>Model Y RWD: ~25 min</li>
                <li>Model Y Long Range: ~32 min</li>
              </ul>
              <span className="font-semibold">Home (Level 2, 7.7kW):</span>
              <ul className="list-disc ml-6">
                <li>Model 3 RWD (62 kWh): 62 ÷ 7.7 ≈ 8 h</li>
                <li>Model Y RWD (60 kWh): 60 ÷ 7.7 ≈ 7.8 h</li>
                <li>Model Y Long Range (78.1 kWh): 78.1 ÷ 7.7 ≈ 10.1 h</li>
              </ul>
              Most charging is done at home while you sleep, not at public stations.
            </div>
            <div className="mb-2 font-semibold text-lg">How much for a home charger?</div>
            <div className="text-base">
              Most home chargers can be installed for under $1,000 USD.
            </div>
          </div>
        </div>

        <div id="detailsArea" className="mt-8">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: 'Home', text: 'Always leave home with a full tank (charge overnight)' },
              { icon: 'Car', text: 'Free HOV Lane access' },
              { icon: 'BadgeCheck', text: 'No more Smog Checks' },
              { icon: 'RefreshCw', text: 'Regenerative Braking: better in city driving' },
              { icon: 'RefreshCw', text: 'Free software updates' },
              { icon: 'Users', text: 'Your phone is your key' },
              { icon: 'BadgeCheck', text: 'Free Supercharging for 6 months' },
              { icon: 'Car', text: 'Self Driving: 3 months free' },
              { icon: 'Settings2', text: 'Tesla: 20 moving parts vs 20,000 in ICE = less repairs' },
              { icon: 'Settings2', text: 'ICE cars get less efficient over time, EVs don’t' },
              { icon: 'Home', text: 'Never go to a dirty gas station again' },
              { icon: 'ShieldCheck', text: 'Tesla battery: 8 year warranty, 100k+ miles' },
              { icon: 'Cloud', text: 'Free over-the-air updates' },
              { icon: 'Plug', text: 'Free charging at work? ', link: { href: 'https://www.plugshare.com/', label: 'Link to check' }, extra: ', does your work hand out free gas?' },
              { icon: 'TrendingUp', text: 'EVs efficiency gets better/same, ICE gets worse' },
              { icon: 'Volume2', text: 'Much quieter, no engine noise' },
              { icon: 'MonitorPlay', text: 'Watch Netflix, YouTube, and play video games while you charge' },
              { icon: 'BadgeDollarSign', text: '$7500 off instantly from Federal Government' },
              { icon: 'Droplets', text: 'No oil changes needed – just add washer fluid and change brakes every 50k miles, that\'s it!' },
            ].map((b, i) => {
              const Icon = icons[b.icon];
              return (
                <li key={i} className="flex flex-col items-center justify-center bg-background rounded-lg p-6 border border-accent">
                  {Icon && <Icon className="w-14 h-14 md:w-20 md:h-20 mb-3" />}
                  <span className="text-center text-lg font-medium">
                    {b.text}
                    {b.link && <a href={b.link.href} target="_blank" rel="noopener noreferrer" className="underline mx-1">{b.link.label}</a>}
                    {b.extra || ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Self-Driving</h2>
          <div className="bg-background border border-accent rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              {icons.Car && <icons.Car className="w-8 h-8" />}
              <span className="text-lg">AutoPilot - like cruise control but better</span>
            </div>
            <div className="flex items-center gap-4">
              {icons.Navigation && <icons.Navigation className="w-8 h-8" />}
              <span className="text-lg">FSD - full self driving, you type in where you want to go and it does everything</span>
            </div>
          </div>
        </div>

        <div className="py-44"></div>


      </div>
    </>
  );
}
