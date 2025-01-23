import { CompileContextProvider } from "@SpCompilation/CompileContextProvider";
import ToggleableThemeProvider from "./Settings/ToggleableThemeProvider";
import ProjectContextProvider from "@SpCore/ProjectContextProvider";
import HomePage from "@SpPages/HomePage";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter } from "react-router-dom";
import PedanticSettingProvider from "@SpSettings/PedanticSettingProvider";

const App = () => {
  return (
    <BrowserRouter>
      <ToggleableThemeProvider>
        <div className="MainWindow">
          <ProjectContextProvider>
            <CompileContextProvider>
              <PedanticSettingProvider>
                <HomePage />
              </PedanticSettingProvider>
            </CompileContextProvider>
          </ProjectContextProvider>
          <Analytics />
        </div>
      </ToggleableThemeProvider>
    </BrowserRouter>
  );
};

export default App;
