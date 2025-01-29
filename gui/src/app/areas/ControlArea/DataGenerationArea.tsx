import type { FunctionComponent } from "react";

import TabWidget from "@SpComponents/TabWidget";
import DataPyPanel from "./DataGenerationArea/DataPyPanel";
import DataRPanel from "./DataGenerationArea/DataRPanel";

const DataGenerationArea: FunctionComponent = () => {
  return (
    <TabWidget labels={["Python", "R"]}>
      <DataPyPanel />
      <DataRPanel />
    </TabWidget>
  );
};

export default DataGenerationArea;
