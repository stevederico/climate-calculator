import './assets/styles.css';
import { createSkateboardApp } from '@stevederico/skateboard-ui/App';
import { initializeUtilities } from '@stevederico/skateboard-ui/Utilities';
import constants from './constants.json';
import EVCalcView from './components/EVCalcView.jsx';
import SolarCalcView from './components/SolarCalcView.jsx';

// Initialize utilities before creating app
initializeUtilities(constants);

const appRoutes = [
  { path: 'ev', element: <EVCalcView /> },
  { path: 'solar', element: <SolarCalcView /> }
];

createSkateboardApp({
  constants,
  appRoutes,
  defaultRoute: 'ev'
});
