import { useState } from 'https://cdn.jsdelivr.net/npm/react@19.0.0-rc-f994737d14-20240522/+esm';
import { useNavigate } from 'https://cdn.jsdelivr.net/npm/react-router-dom@7.2.0/+esm';

export default function SolarCalculator() {
  const [kwh, setKwh] = useState('');
  const [systemSize, setSystemSize] = useState(null);
  const navigate = useNavigate();

  const calculateSolarSize = (e) => {
    e.preventDefault();
    const monthlyKwh = parseFloat(kwh);
    if (!isNaN(monthlyKwh)) {
      const annualKwh = monthlyKwh * 12;
      const kwhPerKw = 5 * 365 * 0.8; // 5 peak sun hours, 80% efficiency
      const size = Math.ceil(annualKwh / kwhPerKw);
      setSystemSize(size);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="bg-accent p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Solar System Size Calculator</h1>
        <div className="space-y-4">
          <input
            type="number"
            value={kwh}
            onChange={(e) => setKwh(e.target.value)}
            placeholder="Monthly kWh usage"
            className="w-full p-2 border rounded bg-background"
          />
          <button
            onClick={calculateSolarSize}
            className="w-full bg-blue-500 hover:bg-blue-600 p-2 rounded"
          >
            Calculate
          </button>
          {systemSize && (
            <p className="text-lg">
              Recommended Solar System Size: {systemSize} kW
            </p>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-500 hover:bg-gray-600 p-2 rounded"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}