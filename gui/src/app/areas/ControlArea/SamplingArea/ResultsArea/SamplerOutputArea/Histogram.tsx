import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import { FunctionComponent, useMemo } from "react";

type HistogramProps = {
  histData: number[];
  title: string;
  variableName: string;
};

const Histogram: FunctionComponent<HistogramProps> = ({
  histData,
  title,
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
      title: { text: title, font: { size: 12 } },
      xaxis: { title: { text: variableName } },
      yaxis: { title: { text: "Count" } },
      margin: { r: 0 },
    }),
    [title, variableName],
  );

  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default Histogram;
