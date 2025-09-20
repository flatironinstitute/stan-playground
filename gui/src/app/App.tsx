import CustomTheming from "@SpPages/CustomTheming";
import UserSettingsProvider from "@SpCore/Settings/UserSettingsProvider";
import ProjectContextProvider from "@SpCore/Project/ProjectContextProvider";
import CompileContextProvider from "@SpCore/Compilation/CompileContextProvider";

import HomePage from "@SpPages/HomePage";
import HomeEmbedded from "@SpPages/HomeEmbedded";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

const AppContent = () => {
  const location = useLocation();
  const isEmbedded = location.pathname === "/embedded";

  return (
    <CustomTheming>
      <UserSettingsProvider>
        <div className="MainWindow">
          <ProjectContextProvider
            disableLocalStorageForProjectState={isEmbedded}
          >
            <CompileContextProvider>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/embedded" element={<HomeEmbedded />} />
              </Routes>
            </CompileContextProvider>
          </ProjectContextProvider>
          <Analytics />
        </div>
      </UserSettingsProvider>
    </CustomTheming>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
