import React, { FunctionComponent, Suspense, useMemo } from "react";
import useMeasure from "react-use-measure";

import Loading from "@SpComponents/Loading";

import type { PlotParams } from "react-plotly.js";
import createPlotlyComponent from "react-plotly.js/factory";
const Plot = React.lazy(async () => {
  const plotly = await import("plotly-stan-playground-dist");
  return { default: createPlotlyComponent(plotly) };
});

const LazyPlotlyPlot: FunctionComponent<PlotParams> = ({ data, layout }) => {
  // Plotly's reactive setting only fires on Window resize
  // We want it to work with our splitters, so we work around it
  const [ref, { width }] = useMeasure({ debounce: 10 });

  const layoutWithWidth = useMemo(
    () =>
      ({
        width,
        autosize: true,
        colorway: chainColorway,
        plot_bgcolor: "rgba(240,240,240, 0.95)",
        paper_bgcolor: "rgba(255,255,255, .5)",
        legend: {
          x: 1,
          xanchor: "right",
          y: 0.95,
          itemsizing: "constant",
          bgcolor: "rgba(255,255,255, .8)",
        },
        ...layout,
      }) as const,
    [layout, width],
  );

  // react-use-measure gives this warning:
  // > consider that knowing bounds is only possible *after* the view renders
  // > so you'll get zero values on the first run and be informed later
  // to avoid 'snapping' from that initial zero, we hide the plot
  const hideWhenWidthIsZero = useMemo(() => {
    return { visibility: width === 0 ? "hidden" : "visible" } as const;
  }, [width]);

  return (
    <div ref={ref}>
      <Suspense fallback={<Loading name="Plotly.js" />}>
        <Plot
          data={data}
          layout={layoutWithWidth}
          style={hideWhenWidthIsZero}
        />
      </Suspense>
    </div>
  );
};

const chainColorway: string[] = [
  "#00ff00",
  "#ff00ff",
  "#0080ff",
  "#ff8000",
  "#80bf80",
  "#470ba7",
  "#c80b32",
  "#fd7ee5",
  "#027d30",
  "#00ffff",
  "#00ff80",
  "#9c5a86",
];

export default LazyPlotlyPlot;
