import { FunctionComponent, useMemo } from "react";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import chainColorList from "./chainColorway";

type Scatter3DProps = {
  x: { name: string; draws: number[][] };
  y: { name: string; draws: number[][] };
  z: { name: string; draws: number[][] };
  chainIds: number[];
};

const ScatterPlot3D: FunctionComponent<Scatter3DProps> = ({
  x,
  y,
  z,
  chainIds,
}) => {
  const data = useMemo(() => {
    return chainIds.map((chainId, i) => {
      return {
        name: `Chain ${chainId}`,
        x: x.draws[i],
        y: y.draws[i],
        z: z.draws[i],

        type: "scatter3d",
        mode: "markers",
        marker: { size: 2 },
      } as const;
    });
  }, [chainIds, x.draws, y.draws, z.draws]);

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

        margin: { r: 0, l: 0, t: 0, b: 0 },

        colorway: chainColorList,
      }) as const,
    [x.name, y.name, z.name],
  );

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default ScatterPlot3D;
