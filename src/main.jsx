import './assets/styles.css';
import { createSkateboardApp } from '@stevederico/skateboard-ui/App';
import constants from './constants.json';
import EVCalcView from './components/EVCalcView.jsx';
import SolarCalcView from './components/SolarCalcView.jsx';

const appRoutes = [
  { path: 'ev', element: <EVCalcView /> },
  { path: 'solar', element: <SolarCalcView /> }
];

createSkateboardApp({
  constants,
  appRoutes,
  defaultRoute: 'ev'
});
