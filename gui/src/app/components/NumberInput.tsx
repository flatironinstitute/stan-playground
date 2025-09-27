import TextField from "@mui/material/TextField";
import { unreachable } from "@SpUtil/unreachable";
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export type Selections = (number | "random")[];
export type NumRange = {
  min: number;
  max?: number;
  type: "int" | "float" | "intOrUndefined";
};
export type InputConfig = Selections | NumRange;

type NumberProps = {
  value: number | undefined;
  label: string;
  readOnly: boolean;
  onChange: (value: number | undefined) => void;
};

// Based on the type of input, either create a dropdown or a custom text input
const NumberInput: FunctionComponent<NumberProps & { options: InputConfig }> = (
  props,
) => {
  const { options } = props;
  if (Array.isArray(options)) {
    return <NumberSelect {...props} options={options} />;
  } else {
    return <NumberEdit {...props} options={options} />;
  }
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

const NumberEdit: FunctionComponent<NumberProps & { options: NumRange }> = ({
  value,
  onChange,
  options: { min, max, type },
  readOnly,
  label,
}) => {
  // "local" copy to allow invalid text without polluting the outside state
  const [localValue, setLocalValue] = useState<number | undefined>(value);
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const [error, setError] = useState<string>("");

  const parseValue = useCallback(
    (s: string): { value?: number; error?: string } => {
      let value: number;
      switch (type) {
        case "int":
          value = parseInt(s);
          if (isNaN(value)) {
            return { error: "Enter an integer" };
          }
          break;
        case "float":
          value = parseFloat(s);
          if (isNaN(value)) {
            return { error: "Enter a number" };
          }
          break;
        case "intOrUndefined":
          if (s.trim() === "") {
            return { value: undefined };
          }
          value = parseInt(s);
          if (isNaN(value)) {
            return { error: "Enter an integer or leave blank" };
          }
          break;
        default:
          unreachable(type);
          value = NaN; // to satisfy TS
      }

      if (value < min) {
        return { value, error: `Must be >= ${min}` };
      }
      if (max !== undefined && value > max) {
        return { value, error: `Must be <= ${max}` };
      }
      return { value };
    },
    [max, min, type],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value, error } = parseValue(e.target.value);
      setLocalValue(value);
      setError(error || "");
      if (!error) {
        onChange(value);
      }
    },
    [onChange, parseValue],
  );

  return (
    <TextField
      label={label}
      size="small"
      value={localValue ?? ""}
      type="number"
      onChange={handleChange}
      disabled={readOnly}
      inputProps={{
        min,
        max,
      }}
      error={error !== ""}
      helperText={error}
    />
  );
};

export default NumberInput;
