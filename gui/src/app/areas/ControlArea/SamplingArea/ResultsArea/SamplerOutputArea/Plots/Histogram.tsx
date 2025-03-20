import { FunctionComponent, useMemo } from "react";
import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import type { StanDraw } from "../../SamplerOutputArea";

type HistogramProps = {
  variable: StanDraw;
};

const Histogram: FunctionComponent<HistogramProps> = ({ variable }) => {
  const data = useMemo(() => {
    const x = variable.draws.flat();
    return [
      {
        x,
        type: "histogram",
        nbinsx: Math.ceil(1.5 * Math.sqrt(x.length)),
        marker: { color: "#505060" },
        histnorm: "probability",
      } as const,
    ];
  }, [variable.draws]);

  const layout = useMemo(
    () => ({
      xaxis: { title: { text: variable.name } },
      yaxis: { title: { text: "Count" } },

      margin: { r: 10, l: 55, t: 45, b: 45 },
    }),
    [variable],
  );

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default Histogram;
