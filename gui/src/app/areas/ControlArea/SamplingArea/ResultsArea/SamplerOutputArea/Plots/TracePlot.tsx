import { FunctionComponent, useMemo } from "react";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import chainColorList from "./chainColorway";

type TracePlotProps = {
  variableName: string;
  draws: number[][];
  columnIndex: number;
  drawChainIds: number[];
};

const TracePlot: FunctionComponent<TracePlotProps> = ({
  variableName,
  draws,
  columnIndex,
  drawChainIds,
}) => {
  const plotSequences = useMemo(() => {
    const uniqueChainIds = Array.from(new Set(drawChainIds)).sort();
    return uniqueChainIds.map(
      (chainId) => {
        return {
          label: `Chain ${chainId}`,
          data: draws[columnIndex].filter(
            (_, i) => drawChainIds[i] === chainId,
          ),
        };
      },
      [draws, columnIndex],
    );
  }, [draws, columnIndex, drawChainIds]);

  const data = useMemo(
    () =>
      plotSequences.map(
        (ps) =>
          ({
            x: [...new Array(ps.data.length).keys()].map((i) => i + 1),
            y: ps.data,
            name: ps.label,
            type: "scatter",
            mode: "lines+markers",
          }) as const,
      ),
    [plotSequences],
  );
  const layout = useMemo(() => {
    const axis = {
      showline: false,
      zeroline: false,
      gridcolor: "#ffff",
      ticklen: 4,
    };

    return {
      title: { text: "" },
      yaxis: { ...axis, title: { text: variableName } },
      xaxis: { ...axis, title: { text: "draw" } },

      margin: { r: 10, l: 55, t: 10, b: 45 },
      height: 450,

      colorway: chainColorList,
    } as const;
  }, [variableName]);

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default TracePlot;
