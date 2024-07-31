import { createTheme } from "@mui/material";
import { ThemeProvider } from "@mui/system";
import ProjectContextProvider from "@SpCore/ProjectContextProvider";
import HomePage from "@SpPages/HomePage";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter } from "react-router-dom";

const theme = createTheme();

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <div className="MainWindow">
          <ProjectContextProvider>
            <HomePage />
          </ProjectContextProvider>
          <Analytics />
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
