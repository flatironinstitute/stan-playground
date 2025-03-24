import { FunctionComponent, useMemo } from "react";
import type { StanDraw } from "../../SamplerOutputArea";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";

type Scatter2DProps = {
  x: StanDraw;
  y: StanDraw;
};

const ScatterPlot2D: FunctionComponent<Scatter2DProps> = ({ x, y }) => {
  const data = useMemo(() => {
    const n_chains = x.draws.length;
    return [...new Array(n_chains)].map((_, i) => {
      return {
        name: `Chain ${i + 1}`,
        x: x.draws[i],
        y: y.draws[i],

        type: "scatter",
        mode: "markers",
        marker: { opacity: 0.7 },
      } as const;
    });
  }, [x.draws, y.draws]);

  const layout = useMemo(() => {
    const axis = {
      showline: false,
      zeroline: false,
      gridcolor: "#ffff",
      ticklen: 4,
    };
    return {
      title: { text: "" },
      xaxis: { ...axis, title: { text: x.name } },
      yaxis: { ...axis, title: { text: y.name } },

      margin: { r: 10, l: 55, t: 0, b: 55, autoexpand: true },
    } as const;
  }, [x.name, y.name]);

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default ScatterPlot2D;
