import TextField from "@mui/material/TextField";
import { unreachable } from "@SpUtil/unreachable";
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export type Selections = (number | "random")[];
export type NumRange = { min: number; max?: number };
export type Option = Selections | NumRange;

type NumberProps = {
  value: number | undefined;
  label?: string;
  onChange: (value: number | undefined) => void;
  readOnly: boolean;
  type: "int" | "float" | "intOrUndefined";
};

const NumberInput: FunctionComponent<
  NumberProps & {
    options: Option;
  }
> = (props) => {
  if (Array.isArray(props.options)) {
    return <NumberSelect {...props} options={props.options} />;
  }
  return <NumberEdit {...props} options={props.options} />;
};

const NumberSelect: FunctionComponent<
  NumberProps & { options: Selections }
> = ({ value, onChange, readOnly, label, options }) => {
  return (
    <FormControl size="small" sx={{ minWidth: 90 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value === undefined ? "random" : value}
        label="Warmup"
        disabled={readOnly}
        onChange={(e) =>
          onChange(
            e.target.value === "random"
              ? undefined
              : (e.target.value as number),
          )
        }
      >
        {options.map((n) => (
          <MenuItem key={n} value={n}>
            {n}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const NumberEdit: FunctionComponent<
  NumberProps & {
    options: NumRange;
  }
> = ({ value, onChange, options: { min, max }, readOnly, type, label }) => {
  const [localValue, setLocalValue] = useState<number | undefined>(value);
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const [error, setError] = useState<string>("");

  const parse = useCallback(
    (s: string): { value: number | undefined; error?: string } => {
      let value: number | undefined;
      switch (type) {
        case "int":
          value = parseInt(s);
          if (isNaN(value)) {
            return { value: undefined, error: "Enter an integer" };
          }
          break;
        case "float":
          value = parseFloat(s);
          if (isNaN(value)) {
            return { value: undefined, error: "Enter a number" };
          }
          break;
        case "intOrUndefined":
          value = parseInt(s);
          if (isNaN(value)) {
            value = undefined;
          }
          break;
        default:
          unreachable(type);
      }
      if (value === undefined) {
        return { value: undefined };
      }
      if (value < min) {
        return { value: value, error: `Must be >= ${min}` };
      }
      if (max !== undefined && value > max) {
        return { value: value, error: `Must be <= ${max}` };
      }
      return { value: value };
    },
    [max, min, type],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value: newValue, error } = parse(e.target.value);
      setLocalValue(newValue);
      setError(error || "");
      if (!error) {
        onChange(newValue);
      }
    },
    [onChange, parse],
  );

  return (
    <TextField
      label={label}
      size="small"
      value={localValue === undefined ? "" : localValue}
      type="number"
      onChange={handleChange}
      disabled={readOnly}
      inputProps={{
        min,
        max,
      }}
      error={error !== ""}
      helperText={error}
      className="SamplingOptsNumberEditBox"
    />
  );
};

export default NumberInput;
