import { useState, type FunctionComponent } from "react";

import TabWidget from "@SpComponents/TabWidget";
import DataPyPanel from "./DataGenerationArea/DataPyPanel";
import DataRPanel from "./DataGenerationArea/DataRPanel";
import DataFilesPanel from "./DataGenerationArea/DataFilesPanel";
import { File } from "@SpUtil/files";

const DataGenerationArea: FunctionComponent = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <TabWidget labels={["Python", "R", "Additional files"]}>
      <DataPyPanel files={files} />
      <DataRPanel files={files} />
      <DataFilesPanel files={files} setFiles={setFiles} />
    </TabWidget>
  );
};

export default DataGenerationArea;
