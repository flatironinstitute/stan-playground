import { useCallback, useMemo, useState, type FunctionComponent } from "react";

import prettifyStanParamName from "@SpUtil/prettifyStanParamName";
import ScatterPlot from "./ScatterPlot";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

type ScatterPlotsPanel = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
};

const MAX_SELECTED = 6;

const ScatterPlotsPanel: FunctionComponent<ScatterPlotsPanel> = ({
  draws,
  paramNames,
  drawChainIds,
}) => {
  const prettyParamNames = useMemo(
    () => paramNames.map(prettifyStanParamName),
    [paramNames],
  );

  const [hitLimit, setHitLimit] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const onChange = (_: any, newValue: string[]) => {
    setSelected(newValue);
    setHitLimit(newValue.length >= MAX_SELECTED);
  };

  const getOptionDisabled = useCallback(
    (option: string) => {
      return hitLimit && !selected.includes(option);
    },
    [hitLimit, selected],
  );

  const variableName1 = selected[0] || "";
  const variableName2 = selected[1] || "";
  const columnIndex1 = prettyParamNames.indexOf(variableName1);
  const columnIndex2 = prettyParamNames.indexOf(variableName2);
  const variableName3 = selected[2] || undefined;
  const columnIndex3 = variableName3
    ? prettyParamNames.indexOf(variableName3)
    : undefined;

  return (
    <Box display="flex" height="100%" width="100%" flexDirection="column">
      <Box flex="0" marginTop="0.75rem" marginBottom="0.75rem">
        <Autocomplete
          multiple
          disableCloseOnSelect
          autoHighlight
          limitTags={5}
          size="small"
          options={prettyParamNames}
          value={selected}
          onChange={onChange}
          sx={{ maxWidth: 1000, margin: "auto" }}
          getOptionDisabled={getOptionDisabled}
          renderInput={(params) => (
            <TextField {...params} label="Variables" variant="outlined" />
          )}
        />
      </Box>
      <Box flex="0 1 auto" overflow="auto">
        {/* TODO: If < 2, show message. If == 2, show one 2d plot. If 3, show one 3-d plot. If > 3, show a matrix */}
        {variableName1 === "" || variableName2 === "" ? (
          <span>Select between two and six variables</span>
        ) : (
          <ScatterPlot
            variableName1={variableName1}
            variableName2={variableName2}
            columnIndex1={columnIndex1}
            columnIndex2={columnIndex2}
            variableName3={variableName3}
            columnIndex3={columnIndex3}
            draws={draws}
            drawChainIds={drawChainIds}
          />
        )}
      </Box>
    </Box>
  );
};

export default ScatterPlotsPanel;
