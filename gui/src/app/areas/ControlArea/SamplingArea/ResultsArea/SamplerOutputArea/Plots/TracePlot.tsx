import { FunctionComponent, useMemo } from "react";
import type { StanDraw } from "../../SamplerOutputArea";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import chainColorList from "./chainColorway";

type TracePlotProps = {
  variable: StanDraw;
};

const TracePlot: FunctionComponent<TracePlotProps> = ({ variable }) => {
  const data = useMemo(() => {
    const n_chains = variable.draws.length;
    return [...new Array(n_chains)].map((_, i) => {
      return {
        name: `Chain ${i + 1}`,
        x: [...new Array(variable.draws[i].length).keys()].map((i) => i + 1),
        y: variable.draws[i],
        type: "scatter",
        mode: "lines+markers",
      } as const;
    });
  }, [variable.draws]);

  const layout = useMemo(() => {
    const axis = {
      showline: false,
      zeroline: false,
      gridcolor: "#ffff",
      ticklen: 4,
    };

    return {
      title: { text: "" },
      yaxis: { ...axis, title: { text: variable.name } },
      xaxis: { ...axis, title: { text: "draw" } },

      margin: { r: 10, l: 55, t: 10, b: 45 },
      height: 450,

      colorway: chainColorList,
    } as const;
  }, [variable]);

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default TracePlot;
