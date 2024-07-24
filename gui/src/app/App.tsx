import { BrowserRouter } from "react-router-dom";
import ProjectContextProvider from "@SpCore/ProjectContextProvider";
import HomePage from "@SpPages/HomePage";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <BrowserRouter>
      <div className="MainWindow">
        <ProjectContextProvider>
          <HomePage />
        </ProjectContextProvider>
        <Analytics />
      </div>
    </BrowserRouter>
  );
}

export default App;
