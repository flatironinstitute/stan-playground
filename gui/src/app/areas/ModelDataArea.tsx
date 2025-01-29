import type { FunctionComponent } from "react";

import { Split } from "@geoffcox/react-splitter";

import ModelEditorPanel from "@SpAreas/ModelDataArea/ModelEditorPanel";
import DataEditorPanel from "@SpAreas/ModelDataArea/DataEditorPanel";

const ModelDataArea: FunctionComponent = () => {
  return (
    <Split horizontal>
      <ModelEditorPanel />
      <DataEditorPanel />
    </Split>
  );
};

export default ModelDataArea;
