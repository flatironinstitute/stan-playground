import CircularProgress from "@mui/material/CircularProgress";
import React, { FunctionComponent, Suspense } from "react";

import type { PlotParams } from "react-plotly.js";
import createPlotlyComponent from "react-plotly.js/factory";
import useMeasure from "react-use-measure";
const Plot = React.lazy(async () => {
  const plotly = await import("plotly.js-cartesian-dist");
  return { default: createPlotlyComponent(plotly) };
});

const LazyPlotlyPlot: FunctionComponent<PlotParams> = ({ data, layout }) => {
  // plotly has a reactive setting, but it is buggy
  const [ref, { width }] = useMeasure();

  const layoutWithWidth = {
    ...layout,
    width: width,
  };

  return (
    <div ref={ref}>
      <Suspense
        fallback={
          <>
            <CircularProgress />
            <p>Loading Plotly.js</p>
          </>
        }
      >
        <Plot data={data} layout={layoutWithWidth} />
      </Suspense>
    </div>
  );
};

export default LazyPlotlyPlot;
