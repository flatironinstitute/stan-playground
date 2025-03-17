import { FunctionComponent, useMemo } from "react";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import chainColorList from "./chainColorway";

type Scatter2DProps = {
  x: { name: string; draws: number[][] };
  y: { name: string; draws: number[][] };
  chainIds: number[];
};

const ScatterPlot2D: FunctionComponent<Scatter2DProps> = ({
  x,
  y,
  chainIds,
}) => {
  const data = useMemo(() => {
    return chainIds.map((chainId, i) => {
      return {
        name: `Chain ${chainId}`,
        x: x.draws[i],
        y: y.draws[i],

        type: "scatter",
        mode: "markers",
      } as const;
    });
  }, [chainIds, x.draws, y.draws]);

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

      colorway: chainColorList,
    } as const;
  }, [x.name, y.name]);

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default ScatterPlot2D;
