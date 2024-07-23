import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import { FunctionComponent, useMemo } from "react";

export type PlotSequence = {
  label: string;
  data: number[];
  color: string;
};

type Props = {
  plotSequences: PlotSequence[];
  variableName: string;
  highlightDrawRange?: [number, number];
};

const SequencePlotWidget: FunctionComponent<Props> = ({
  plotSequences,
  variableName,
  highlightDrawRange,
}) => {
  const shapes = useMemo(
    () =>
      (highlightDrawRange
        ? [
            {
              type: "rect",
              x0: highlightDrawRange[0],
              x1: highlightDrawRange[1],
              y0: 0,
              y1: 1,
              yref: "paper",
              fillcolor: "yellow",
              opacity: 0.1,
            },
          ]
        : []) as any,
    [highlightDrawRange],
  );
  const data: any[] = useMemo(
    () =>
      plotSequences.map((ps) => ({
        x: [...new Array(ps.data.length).keys()].map((i) => i + 1),
        y: ps.data,
        type: "scatter",
        mode: "lines+markers",
        marker: { color: ps.color },
      })),
    [plotSequences],
  );
  const layout = useMemo(
    () => ({
      title: "",
      yaxis: { title: variableName },
      xaxis: { title: "draw" },
      shapes,
      margin: {
        t: 30,
        b: 40,
        r: 0,
      },
      showlegend: false,
    }),
    [variableName, shapes],
  );
  return (
    <div className="SequencePlot">
      <LazyPlotlyPlot data={data} layout={layout} />
    </div>
  );
};

export default SequencePlotWidget;
