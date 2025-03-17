import { FunctionComponent, useMemo } from "react";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import chainColorList from "./chainColorway";

type ScatterMatrixProps = {
  variables: { name: string; draws: number[][] }[];
  chainIds: number[];
};

const ScatterPlotMatrix: FunctionComponent<ScatterMatrixProps> = ({
  variables,
  chainIds,
}) => {
  const data = useMemo(() => {
    return chainIds.map((chainId, i) => {
      return {
        name: `Chain ${chainId}`,
        dimensions: variables.map((variable) => ({
          label: variable.name,
          values: variable.draws[i],
        })),
        diagonal: { visible: false },
        showupperhalf: false,
        type: "splom",
        mode: "markers",
        marker: { size: 2 },
      } as const;
    });
  }, [chainIds, variables]);

  const layout = useMemo(() => {
    const axis = {
      showline: false,
      zeroline: false,
      gridcolor: "#ffff",
      ticklen: 4,
    };
    return {
      title: { text: "" },

      margin: { r: 10, l: 55, t: 0, b: 55, autoexpand: true },

      colorway: chainColorList,

      xaxis: axis,
      yaxis: axis,
      // this is a bit annoying, but each needs to be set separately
      // we know there are < 6, though
      xaxis2: axis,
      yaxis2: axis,
      xaxis3: axis,
      yaxis3: axis,
      xaxis4: axis,
      yaxis4: axis,
      xaxis5: axis,
      yaxis5: axis,
      xaxis6: axis,
      yaxis6: axis,
    } as const;
  }, []);

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default ScatterPlotMatrix;
