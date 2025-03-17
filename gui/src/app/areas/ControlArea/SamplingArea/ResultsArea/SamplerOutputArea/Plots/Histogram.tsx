import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import { FunctionComponent, useMemo } from "react";

type HistogramProps = {
  histData: number[];
  variableName: string;
};

const Histogram: FunctionComponent<HistogramProps> = ({
  histData,
  variableName,
}) => {
  const data = useMemo(
    () => [
      {
        x: histData,
        type: "histogram",
        nbinsx: Math.ceil(1.5 * Math.sqrt(histData.length)),
        marker: { color: "#505060" },
        histnorm: "probability",
      } as const,
    ],
    [histData],
  );

  const layout = useMemo(
    () => ({
      xaxis: { title: { text: variableName } },
      yaxis: { title: { text: "Count" } },

      margin: { r: 10, l: 55, t: 45, b: 45 },
    }),
    [variableName],
  );

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default Histogram;
