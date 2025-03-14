import { FunctionComponent, useMemo } from "react";

import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";

type ScatterPlotProps = {
  draws: number[][];
  drawChainIds: number[];
  variableName1: string;
  variableName2: string;
  variableName3?: string;
  columnIndex1: number;
  columnIndex2: number;
  columnIndex3?: number;
};

const ScatterPlot: FunctionComponent<ScatterPlotProps> = ({
  variableName1,
  columnIndex1,
  variableName2,
  columnIndex2,
  variableName3,
  columnIndex3,
  draws,
  drawChainIds,
}) => {
  const data = useMemo(() => {
    const uniqueChainIds = Array.from(new Set(drawChainIds)).sort();
    return uniqueChainIds.map(
      (chainId) => {
        return {
          name: `Chain ${chainId}`,
          x: draws[columnIndex1].filter((_, i) => drawChainIds[i] === chainId),
          y: draws[columnIndex2].filter((_, i) => drawChainIds[i] === chainId),
          z:
            columnIndex3 !== undefined
              ? draws[columnIndex3].filter(
                  (_, i) => drawChainIds[i] === chainId,
                )
              : undefined,
          type: columnIndex3 !== undefined ? "scatter3d" : "scatter",
          mode: "markers",
          marker: { size: 3 },
        } as const;
      },
      [draws],
    );
  }, [drawChainIds, draws, columnIndex1, columnIndex2, columnIndex3]);

  const layout = useMemo(
    () => ({
      title: { text: "" },
      yaxis: { title: { text: variableName2 } },
      xaxis: { title: { text: variableName1 } },
      // annoying: need both because the above only sets the title for 2d plots
      // and the below only sets the title for 3d plots
      scene: {
        yaxis: { title: { text: variableName2 } },
        xaxis: { title: { text: variableName1 } },
        zaxis: { title: { text: variableName3 } },
      },
      margin: { r: 0, autoexpand: true },
      colorway: chainColorList,
    }),
    [variableName1, variableName2, variableName3],
  );

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

// TODO move to independent file, copied from traceplot
const chainColorList: string[] = [
  "#00ff00",
  "#ff00ff",
  "#0080ff",
  "#ff8000",
  "#80bf80",
  "#470ba7",
  "#c80b32",
  "#fd7ee5",
  "#027d30",
  // '#f0fd23',
  "#00ffff",
  "#00ff80",
  "#9c5a86",
  "#808000",
  "#8ed7fa",
  "#80ff00",
  "#6e52ff",
  "#0000ff",
  "#119c9b",
  "#feb982",
  "#56333d",
  "#fb2b97",
  "#8000ff",
  "#c3f1a2",
  "#b3bd25",
  "#45bc2d",
  "#1c4b88",
  "#49f3c0",
  "#a90c9c",
  "#c436ea",
  "#13055b",
  "#7f93d0",
  "#c4552d",
  "#ee7381",
  "#800000",
  "#58fe60",
  "#4f825e",
  "#21bde8",
  "#d7b8e0",
  "#1e40ee",
  "#324a01",
  "#fc2b03",
  "#723cb9",
  "#3a6ac1",
  "#aef14e",
  "#14c568",
  "#bd9c9b",
  "#f9c506",
  "#b579fa",
  // '#ffff80',
  "#810e5e",
  "#b38d4d",
  "#854810",
  "#02ea3a",
  "#0b3b3c",
  "#f90161",
  "#07c304",
  "#fe4c54",
  "#be02ea",
  "#0521bb",
  "#338b05",
  "#4989ff",
  "#52b8b3",
  "#be3271",
  "#f1a441",
  "#0b776b",
  "#0ccfac",
  "#cd61bd",
  "#85fc95",
  "#fe43fe",
  "#bd810d",
  "#cce9e6",
  "#644179",
  "#fedfbe",
  "#80bd00",
  "#99c4bd",
  "#48e5fa",
  "#400626",
  "#bcfc01",
  "#866b3f",
  "#5422e9",
  "#ea03bd",
  "#69809a",
  "#bfca76",
  "#40e60e",
  "#f1da52",
  "#3d5f3b",
  "#63b3f8",
  "#7cd83d",
  "#b52f02",
  "#9364ca",
  "#80a740",
  "#3ce183",
  "#a6a9f6",
  "#fba2bb",
  "#e3763f",
  "#ae3cae",
  "#91414a",
  "#1e94cf",
  "#06f6c9",
];

export default ScatterPlot;
