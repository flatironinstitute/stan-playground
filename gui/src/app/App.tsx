import ToggleableThemeProvider from "./ToggleableThemeProvider";
import ProjectContextProvider from "@SpCore/ProjectContextProvider";
import HomePage from "@SpPages/HomePage";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter } from "react-router-dom";
import { CompileContextProvider } from "./CompileContext/CompileContextProvider";

const App = () => {
  return (
    <BrowserRouter>
      <ToggleableThemeProvider>
        <div className="MainWindow">
          <ProjectContextProvider>
            <CompileContextProvider>
              <HomePage />
            </CompileContextProvider>
          </ProjectContextProvider>
          <Analytics />
        </div>
      </ToggleableThemeProvider>
    </BrowserRouter>
  );
};

export default App;
