import { BrowserRouter } from "react-router-dom";
import ProjectContextProvider from "@SpCore/ProjectContextProvider";
import HomePage from "@SpPages/HomePage";

function App() {
  return (
    <BrowserRouter>
      <div className="MainWindow">
        <ProjectContextProvider>
          <HomePage />
        </ProjectContextProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
