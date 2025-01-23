import Button from "@mui/material/Button";
import ResponsiveGrid from "@SpComponents/ResponsiveGrid";
import SequenceHistogramWidget from "@SpComponents/SequenceHistogramWidget";
import { FunctionComponent, useMemo, useState } from "react";

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
  const [abbreviatedToNumPlots, setAbbreviatedToNumPlots] =
    useState<number>(30);
  return (
    <>
      <ResponsiveGrid>
        {paramNamesResorted.slice(0, abbreviatedToNumPlots).map((paramName) => (
          <SequenceHistogramWidget
            key={paramName}
            histData={draws[paramNames.indexOf(paramName)]}
            title={paramName}
            variableName={paramName}
          />
        ))}
      </ResponsiveGrid>
      {abbreviatedToNumPlots < paramNamesResorted.length && (
        <div className="PlotAbbreviationToggle">
          <Button
            onClick={() => {
              setAbbreviatedToNumPlots((x) => x + 30);
            }}
          >
            Show more
          </Button>
        </div>
      )}
    </>
  );
};

export default HistsView;
