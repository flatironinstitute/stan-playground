import React, { FunctionComponent, Suspense, useMemo } from "react";
import useMeasure from "react-use-measure";

import Loading from "@SpComponents/Loading";

import type { PlotParams } from "react-plotly.js";
import createPlotlyComponent from "react-plotly.js/factory";
const Plot = React.lazy(async () => {
  const plotly = await import("plotly.js-cartesian-dist");
  return { default: createPlotlyComponent(plotly) };
});

const LazyPlotlyPlot: FunctionComponent<PlotParams> = ({ data, layout }) => {
  // plotly has a reactive setting, but it is buggy
  const [ref, { width }] = useMeasure({ debounce: 100 });

  const layoutWithWidth = useMemo(
    () => ({
      ...layout,
      width: width,
    }),
    [layout, width],
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
