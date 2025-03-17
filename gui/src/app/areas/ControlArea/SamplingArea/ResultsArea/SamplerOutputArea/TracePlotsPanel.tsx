import type { FunctionComponent } from "react";

import type { StanDraw } from "../SamplerOutputArea";

import Collapsable from "@SpComponents/Collapsable";
import TracePlot from "./Plots/TracePlot";

type TracePlotsProps = {
  variables: StanDraw[];
};

const TracePlotsPanel: FunctionComponent<TracePlotsProps> = ({ variables }) => {
  return (
    <>
      {variables.map((variable) => (
        <Collapsable name={variable.name} key={variable.name}>
          <TracePlot key={variable.name} variable={variable} />
        </Collapsable>
      ))}
    </>
  );
};

export default TracePlotsPanel;
