import type { FunctionComponent } from "react";

import Collapsable from "@SpComponents/Collapsable";
import TracePlot from "./Plots/TracePlot";
import prettifyStanParamName from "@SpUtil/prettifyStanParamName";

type TracePlotsProps = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
};

const TracePlotsPanel: FunctionComponent<TracePlotsProps> = ({
  draws,
  paramNames,
  drawChainIds,
}) => {
  return (
    <>
      {paramNames.map(prettifyStanParamName).map((paramName, i) => (
        <Collapsable name={paramName} key={paramName}>
          <TracePlot
            key={paramName}
            variableName={paramName}
            columnIndex={i}
            draws={draws}
            drawChainIds={drawChainIds}
          />
        </Collapsable>
      ))}
    </>
  );
};

export default TracePlotsPanel;
