import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
} from "react";

import type { StanDraw } from "../SamplerOutputArea";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import ScatterPlot2D from "./Plots/ScatterPlot2D";
import ScatterPlot3D from "./Plots/ScatterPlot3D";
import ScatterPlotMatrix from "./Plots/ScatterPlotMatrix";

type ScatterPlotsPanel = {
  variables: StanDraw[];
};

const ScatterPlotsPanel: FunctionComponent<ScatterPlotsPanel> = ({
  variables,
}) => {
  const paramNames = useMemo(() => variables.map((v) => v.name), [variables]);
  const [selected, setSelected] = useState<string[]>([]);
  const [prefers3D, setPrefers3D] = useState(true);

  const selectedVariables = useMemo(
    () => variables.filter((v) => selected.includes(v.name)),
    [selected, variables],
  );

  return (
    <Box display="flex" height="100%" width="100%" flexDirection="column">
      <Box flex="0" marginTop="0.75rem" marginBottom="0.75rem">
        <VariableSelection
          options={paramNames}
          value={selected}
          setValue={setSelected}
          prefers3D={prefers3D}
          setPrefers3D={setPrefers3D}
        />
      </Box>
      <Box flex="0 1 auto" overflow="auto">
        <PlotArea variables={selectedVariables} prefers3D={prefers3D} />
      </Box>
    </Box>
  );
};

type SelectionProps = {
  options: string[];
  value: string[];
  setValue: (newValue: string[]) => void;
  prefers3D: boolean;
  setPrefers3D: (newValue: boolean | ((v: boolean) => boolean)) => void;
};

const MAX_SELECTED = 8;

const VariableSelection: FunctionComponent<SelectionProps> = ({
  options,
  value,
  setValue,
  prefers3D,
  setPrefers3D,
}) => {
  const [hitLimit, setHitLimit] = useState(false);
  const onChange = (_: any, newValue: string[]) => {
    setValue(newValue);
    setHitLimit(newValue.length >= MAX_SELECTED);
  };
  const getOptionDisabled = useCallback(
    (option: string) => {
      return hitLimit && !value.includes(option);
    },
    [hitLimit, value],
  );

  const [showCheckbox, setShowCheckbox] = useState(false);
  useEffect(() => {
    setShowCheckbox(value.length === 3);
  }, [value.length]);

  return (
    <Stack
      maxWidth={1000}
      margin="auto"
      direction="row"
      spacing={2}
      justifyContent="center"
    >
      <Autocomplete
        multiple
        disableCloseOnSelect
        autoHighlight
        limitTags={5}
        size="small"
        options={options}
        value={value}
        fullWidth
        onChange={onChange}
        getOptionDisabled={getOptionDisabled}
        renderInput={(params) => (
          <TextField {...params} label="Variables" variant="outlined" />
        )}
      />
      {showCheckbox && (
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={prefers3D}
                onChange={() => setPrefers3D((prev) => !prev)}
              />
            }
            label="Show in 3D"
            sx={{ whiteSpace: "nowrap" }}
          />
        </FormGroup>
      )}
    </Stack>
  );
};

type PlotAreaProps = {
  variables: { name: string; draws: number[][] }[];
  prefers3D: boolean;
};

const PlotArea: FunctionComponent<PlotAreaProps> = ({
  variables,
  prefers3D,
}) => {
  if (variables.length < 2) {
    return <span>Select between two and eight variables.</span>;
  }
  if (variables.length === 2) {
    const [x, y] = variables;
    return <ScatterPlot2D x={x} y={y} />;
  }
  if (prefers3D && variables.length === 3) {
    const [x, y, z] = variables;
    return <ScatterPlot3D x={x} y={y} z={z} />;
  }
  return <ScatterPlotMatrix variables={variables} />;
};

export default ScatterPlotsPanel;
