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
    () =>
      ({
        x: histData,
        type: "histogram",
        nbinsx: Math.ceil(1.5 * Math.sqrt(histData.length)),
        marker: { color: "#505060" },
        histnorm: "probability",
      }) as const,
    [histData],
  );
  return (
    <LazyPlotlyPlot
      data={[data]}
      layout={{
        title: { text: title, font: { size: 12 } },
        xaxis: { title: variableName },
        yaxis: { title: "Count" },
        margin: { r: 0 },
      }}
    />
  );
};

export default Histogram;
