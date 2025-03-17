import React, { FunctionComponent, Suspense, useMemo } from "react";
import useMeasure from "react-use-measure";

import Loading from "@SpComponents/Loading";

import type { PlotParams } from "react-plotly.js";
import createPlotlyComponent from "react-plotly.js/factory";
const Plot = React.lazy(async () => {
  const plotly = await import("plotly.js-strict-dist");
  return { default: createPlotlyComponent(plotly) };
});

const LazyPlotlyPlot: FunctionComponent<PlotParams> = ({ data, layout }) => {
  // plotly has a reactive setting, but it is buggy
  const [ref, { width }] = useMeasure({ debounce: 10 });

  // allow it to be overridden
  const widthToUse = useMemo(
    () => layout.width ?? width,
    [layout.width, width],
  );

  const layoutWithWidth = useMemo(
    () =>
      ({
        width: widthToUse,
        autosize: true,
        plot_bgcolor: "rgba(240,240,240, 0.95)",
        paper_bgcolor: "rgba(255,255,255, .5)",
        legend: {
          x: 1,
          xanchor: "right",
          y: 1,
        },
        ...layout,
      }) as const,
    [layout, widthToUse],
  );

  return (
    <div ref={ref}>
      <Suspense fallback={<Loading name="Plotly.js" />}>
        <Plot data={data} layout={layoutWithWidth} />
      </Suspense>
    </div>
  );
};

export default LazyPlotlyPlot;
