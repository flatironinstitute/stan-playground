import LazyPlotlyPlot from "@SpComponents/LazyPlotlyPlot";
import { FunctionComponent, useMemo } from "react";

type Props = {
  histData: number[];
  title: string;
  variableName: string;
  width: number;
  height: number;
};

const SequenceHistogramWidget: FunctionComponent<Props> = ({
  histData,
  title,
  width,
  height,
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
      }) as any, // had to do it this way because ts was not recognizing nbinsx
    [histData],
  );
  return (
    <div style={{ position: "relative", width, height }}>
      <LazyPlotlyPlot
        data={[data]}
        layout={{
          width: width,
          height,
          title: { text: title, font: { size: 12 } },
          xaxis: { title: variableName },
          yaxis: { title: "Count" },
          margin: { r: 0 },
        }}
      />
    </div>
  );
};

export default SequenceHistogramWidget;
