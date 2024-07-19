import ProjectContextProvider from "@SpCore/ProjectContextProvider";
import HomePage from "@SpPages/HomePage";
import { FunctionComponent } from "react";

type Props = {
  // none
};

const MainWindow: FunctionComponent<Props> = () => {
  return (
    <div className="MainWindow">
      <ProjectContextProvider>
        <HomePage />
      </ProjectContextProvider>
    </div>
  );
};

export default MainWindow;
