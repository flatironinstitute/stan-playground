import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
} from "react";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import prettifyStanParamName from "@SpUtil/prettifyStanParamName";
import ScatterPlot2D from "./Plots/ScatterPlot2D";
import ScatterPlot3D from "./Plots/ScatterPlot3D";
import ScatterPlotMatrix from "./Plots/ScatterPlotMatrix";

type ScatterPlotsPanel = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
};

const ScatterPlotsPanel: FunctionComponent<ScatterPlotsPanel> = ({
  draws,
  paramNames,
  drawChainIds,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [prefers3D, setPrefers3D] = useState(true);

  const prettyParamNames = useMemo(
    () => paramNames.map(prettifyStanParamName),
    [paramNames],
  );

  const chainIds = useMemo(
    () => Array.from(new Set(drawChainIds)).sort(),
    [drawChainIds],
  );

  const [variables, setVariables] = useState<
    { name: string; draws: number[][] }[]
  >([]);

  useEffect(() => {
    setVariables(
      selected.map((name) => {
        const index = prettyParamNames.indexOf(name);
        return {
          name,
          draws: chainIds.map((chainId) =>
            draws[index].filter((_, i) => drawChainIds[i] === chainId),
          ),
        };
      }),
    );
  }, [selected, draws, prettyParamNames, chainIds, drawChainIds]);

  return (
    <Box display="flex" height="100%" width="100%" flexDirection="column">
      <Box flex="0" marginTop="0.75rem" marginBottom="0.75rem">
        <VariableSelection
          options={prettyParamNames}
          value={selected}
          setValue={setSelected}
          prefers3D={prefers3D}
          setPrefers3D={setPrefers3D}
        />
      </Box>
      <Box flex="0 1 auto" overflow="auto">
        <PlotArea
          variables={variables}
          chainIds={chainIds}
          prefers3D={prefers3D}
        />
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
                defaultChecked
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
  // draws is an n_samples x n_chains array
  variables: { name: string; draws: number[][] }[];
  chainIds: number[];
  prefers3D: boolean;
};

const PlotArea: FunctionComponent<PlotAreaProps> = ({
  variables,
  chainIds,
  prefers3D,
}) => {
  if (variables.length < 2) {
    return <span>Select between two and eight variables.</span>;
  }
  if (variables.length === 2) {
    const [x, y] = variables;
    return <ScatterPlot2D x={x} y={y} chainIds={chainIds} />;
  }
  if (prefers3D && variables.length === 3) {
    const [x, y, z] = variables;
    return <ScatterPlot3D x={x} y={y} z={z} chainIds={chainIds} />;
  }
  return <ScatterPlotMatrix variables={variables} chainIds={chainIds} />;
};

export default ScatterPlotsPanel;
