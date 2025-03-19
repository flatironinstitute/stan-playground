import { FunctionComponent, useMemo } from "react";
import type { StanDraw } from "../../SamplerOutputArea";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import chainColorList from "./chainColorway";

type ScatterMatrixProps = {
  variables: StanDraw[];
};

const ScatterPlotMatrix: FunctionComponent<ScatterMatrixProps> = ({
  variables,
}) => {
  const data = useMemo(() => {
    const n_chains = variables[0].draws.length;
    return [...new Array(n_chains)].map((_, i) => {
      return {
        name: `Chain ${i + 1}`,
        dimensions: variables.map((variable) => ({
          label: variable.name,
          values: variable.draws[i],
        })),
        diagonal: { visible: false },
        showupperhalf: false,
        type: "splom",
        mode: "markers",
        marker: { size: 2, opacity: 0.7 },
      } as const;
    });
  }, [variables]);

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

      height: Math.max(400, 115 * (variables.length - 1)),

      xaxis: axis,
      yaxis: axis,
      // this is a bit annoying, but each needs to be set separately it seems...
      // we know there are < 8, though
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
      xaxis7: axis,
      yaxis7: axis,
      xaxis8: axis,
      yaxis8: axis,
    } as const;
  }, [variables.length]);

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default ScatterPlotMatrix;
