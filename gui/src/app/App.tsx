import CustomTheming from "@SpPages/CustomTheming";
import UserSettingsProvider from "@SpCore/Settings/UserSettingsProvider";
import ProjectContextProvider from "@SpCore/Project/ProjectContextProvider";
import CompileContextProvider from "@SpCore/Compilation/CompileContextProvider";

import HomePage from "@SpPages/HomePage";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
      <CustomTheming>
        <UserSettingsProvider>
          <div className="MainWindow">
            <ProjectContextProvider>
              <CompileContextProvider>
                <HomePage />
              </CompileContextProvider>
            </ProjectContextProvider>
            <Analytics />
          </div>
        </UserSettingsProvider>
      </CustomTheming>
    </BrowserRouter>
  );
};

export default App;
