import { FunctionComponent, useMemo } from "react";
import type { StanDraw } from "../../SamplerOutputArea";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";

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
    } as const;

    // layout needs 'xaxis', 'yaxis', 'xaxis2', 'yaxis2', etc.
    // rather than copy-paste the same code for each axis, we generate it
    const i_to_str = (i: number) => (i === 0 ? "axis" : `axis${i + 1}`);
    const mapbase = [...new Array(variables.length)].map(
      (_, i) => `${i_to_str(i)}`,
    );
    const axismap = Object.assign(
      {},
      ...mapbase.map((s) => ({ [`x${s}`]: axis })),
      ...mapbase.map((s) => ({ [`y${s}`]: axis })),
    );

    return {
      title: { text: "" },
      margin: { r: 10, l: 55, t: 0, b: 55, autoexpand: true },
      height: Math.max(400, 115 * (variables.length - 1)),
      ...axismap,
    } as const;
  }, [variables.length]);

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default ScatterPlotMatrix;
