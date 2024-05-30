/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ReactDOM from 'react-dom/client';

import App from './app/App';
import './draws-table-2.css';
import './draws-table.css';
import './index.css';
import './localStyles.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <StrictMode>
  <App />
  // </StrictMode>
);
