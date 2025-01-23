import UserSettingsProvider from "@SpSettings/UserSettingsProvider";
import ProjectContextProvider from "@SpCore/ProjectContextProvider";
import CompileContextProvider from "app/Compile/CompileContextProvider";

import HomePage from "@SpPages/HomePage";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};

export default App;
