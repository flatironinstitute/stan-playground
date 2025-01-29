import type { FunctionComponent } from "react";

import TabWidget from "@SpComponents/TabWidget";

import DataGenerationArea from "./ControlArea/DataGenerationArea";
import SamplingArea from "./ControlArea/SamplingArea";

const ControlArea: FunctionComponent = () => {
  return (
    <TabWidget labels={["Sampling", "Data Generation"]}>
      <SamplingArea />
      <DataGenerationArea />
    </TabWidget>
  );
};

export default ControlArea;
