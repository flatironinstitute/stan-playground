/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ReactDOM from "react-dom/client";

import App from "./app/App";
import "./draws-table.css";
import "./index.css";
import "./localStyles.css";
import "./project-summary-table.css";
import "./scientific-table.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  // <StrictMode>
  <App />,
  // </StrictMode>
);
