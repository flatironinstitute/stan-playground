import ResponsiveGrid from "@SpComponents/ResponsiveGrid";
import SequenceHistogramWidget from "@SpComponents/SequenceHistogramWidget";
import { FunctionComponent, useMemo } from "react";

type HistsViewProps = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
};

const HistsView: FunctionComponent<HistsViewProps> = ({
  draws,
  paramNames,
}) => {
  const paramNamesResorted = useMemo(() => {
    // put the names that don't end with __ first
    const names = paramNames.filter((name) => !name.endsWith("__"));
    const namesWithSuffix = paramNames.filter((name) => name.endsWith("__"));
    return [...names, ...namesWithSuffix];
  }, [paramNames]);
  return (
    <ResponsiveGrid>
      {paramNamesResorted.map((paramName) => (
        <SequenceHistogramWidget
          key={paramName}
          histData={draws[paramNames.indexOf(paramName)]}
          title={paramName}
          variableName={paramName}
        />
      ))}
    </ResponsiveGrid>
  );
};

export default HistsView;
