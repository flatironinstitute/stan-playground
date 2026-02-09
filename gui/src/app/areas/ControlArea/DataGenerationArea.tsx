import { type FunctionComponent } from "react";

import TabWidget from "@SpComponents/TabWidget";
import DataPyPanel from "./DataGenerationArea/DataPyPanel";
import DataRPanel from "./DataGenerationArea/DataRPanel";
import DataFilesPanel from "./DataGenerationArea/DataFilesPanel";

const DataGenerationArea: FunctionComponent = () => {
  return (
    <TabWidget labels={["Python", "R", "Additional files"]}>
      <DataPyPanel />
      <DataRPanel />
      <DataFilesPanel />
    </TabWidget>
  );
};

export default DataGenerationArea;
