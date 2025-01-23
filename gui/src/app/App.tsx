import ProjectContextProvider from "@SpCore/ProjectContextProvider";
import HomePage from "@SpPages/HomePage";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter } from "react-router-dom";
import UserSettingsProvider from "@SpSettings/UserSettingsProvider";

const App = () => {
  return (
    <BrowserRouter>
      <UserSettingsProvider>
        <div className="MainWindow">
          <ProjectContextProvider>
            <HomePage />
          </ProjectContextProvider>
          <Analytics />
        </div>
      </UserSettingsProvider>
    </BrowserRouter>
  );
};

export default App;
