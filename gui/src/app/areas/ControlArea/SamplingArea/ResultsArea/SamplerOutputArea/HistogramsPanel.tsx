import Button from "@mui/material/Button";
import ResponsiveGrid from "@SpComponents/ResponsiveGrid";
import Histogram from "./Histogram";
import { FunctionComponent, useMemo, useState } from "react";
import prettifyStanParamName from "@SpUtil/prettifyStanParamName";

type HistogramsProps = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
};

const HistogramsPanel: FunctionComponent<HistogramsProps> = ({
  draws,
  paramNames,
}) => {
  const paramNamesResorted = useMemo(() => {
    // put the names that don't end with __ first
    const names: [string, number][] = [];
    const namesWithSuffix: [string, number][] = [];

    for (const [index, name] of paramNames
      .map(prettifyStanParamName)
      .entries()) {
      if (name.endsWith("__")) {
        namesWithSuffix.push([name, index]);
      } else {
        names.push([name, index]);
      }
    }
    return [...names, ...namesWithSuffix];
  }, [paramNames]);

  const [abbreviatedToNumPlots, setAbbreviatedToNumPlots] =
    useState<number>(30);
  return (
    <>
      <ResponsiveGrid>
        {paramNamesResorted
          .slice(0, abbreviatedToNumPlots)
          .map(([paramName, index]) => (
            <Histogram
              key={paramName}
              histData={draws[index]}
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

export default HistogramsPanel;
