import { FunctionComponent, useMemo, useState } from "react";

import Button from "@mui/material/Button";

import ResponsiveGrid from "@SpComponents/ResponsiveGrid";

import Histogram from "./Plots/Histogram";
import type { StanDraw } from "../SamplerOutputArea";

type HistogramsProps = {
  variables: StanDraw[];
};

const HistogramsPanel: FunctionComponent<HistogramsProps> = ({ variables }) => {
  const variablesResorted = useMemo(() => {
    // put the names that don't end with __ first
    const vars: StanDraw[] = [];
    const varsWithSuffix: StanDraw[] = [];

    for (const v of variables) {
      if (v.name.endsWith("__")) {
        varsWithSuffix.push(v);
      } else {
        vars.push(v);
      }
    }
    return [...vars, ...varsWithSuffix];
  }, [variables]);

  const [abbreviatedToNumPlots, setAbbreviatedToNumPlots] =
    useState<number>(30);
  return (
    <>
      <ResponsiveGrid>
        {variablesResorted.slice(0, abbreviatedToNumPlots).map((v) => (
          <Histogram key={v.name} variable={v} />
        ))}
      </ResponsiveGrid>
      {abbreviatedToNumPlots < variablesResorted.length && (
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
