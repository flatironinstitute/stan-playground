import { FunctionComponent, useState } from "react";

import Button from "@mui/material/Button";

import ResponsiveGrid from "@SpComponents/ResponsiveGrid";

import Histogram from "./Plots/Histogram";
import type { StanDraw } from "../SamplerOutputArea";

type HistogramsProps = {
  variables: StanDraw[];
};

const HistogramsPanel: FunctionComponent<HistogramsProps> = ({ variables }) => {
  const [abbreviatedToNumPlots, setAbbreviatedToNumPlots] =
    useState<number>(30);
  return (
    <>
      <ResponsiveGrid>
        {variables.slice(0, abbreviatedToNumPlots).map((v) => (
          <Histogram key={v.name} variable={v} />
        ))}
      </ResponsiveGrid>
      {abbreviatedToNumPlots < variables.length && (
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
