/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ReactDOM from 'react-dom/client';

import App from './app/App';
import './localStyles.css';
import './index.css';
import './nwb-table.css';
import './nwb-table-2.css';
import './scientific-table.css';
import './table1.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <StrictMode>
  <App />
  // </StrictMode>
);
