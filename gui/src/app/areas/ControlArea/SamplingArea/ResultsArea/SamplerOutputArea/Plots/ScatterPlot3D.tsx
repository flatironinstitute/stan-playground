import { FunctionComponent, useMemo } from "react";
import type { StanDraw } from "../../SamplerOutputArea";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import chainColorList from "./chainColorway";

type Scatter3DProps = {
  x: StanDraw;
  y: StanDraw;
  z: StanDraw;
};

const ScatterPlot3D: FunctionComponent<Scatter3DProps> = ({ x, y, z }) => {
  const data = useMemo(() => {
    const n_chains = x.draws.length;
    return [...new Array(n_chains)].map((_, i) => {
      return {
        name: `Chain ${i + 1}`,
        x: x.draws[i],
        y: y.draws[i],
        z: z.draws[i],

        type: "scatter3d",
        mode: "markers",
        marker: { size: 2, opacity: 0.7 },
      } as const;
    });
  }, [x.draws, y.draws, z.draws]);

  const layout = useMemo(
    () =>
      ({
        title: { text: "" },
        scene: {
          xaxis: {
            title: { text: x.name },
            backgroundcolor: "rgba(230, 230, 230, 0.95)",
            showbackground: true,
            zeroline: false,
          },
          yaxis: {
            title: { text: y.name },
            backgroundcolor: "rgba(230, 230, 230, 0.95)",
            showbackground: true,
            zeroline: false,
          },
          zaxis: {
            title: { text: z.name },
            backgroundcolor: "rgba(230, 230, 230, 0.95)",
            showbackground: true,
            zeroline: false,
          },
        },

        margin: { r: 10, l: 10, t: 0, b: 0 },

        colorway: chainColorList,
      }) as const,
    [x.name, y.name, z.name],
  );

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default ScatterPlot3D;
