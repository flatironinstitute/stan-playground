import { FunctionComponent, useCallback } from "react";

import IconButton from "@mui/material/IconButton";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";

import {
  defaultSamplingOpts,
  SamplingOpts,
} from "@SpCore/Project/ProjectDataModel";
import NumberInput, { type InputConfig } from "@SpComponents/NumberInput";

const LABELS = {
  num_chains: "# chains",
  num_warmup: "# warmup",
  num_samples: "# samples",
  init_radius: "init radius",
  seed: "seed",
};

type SamplingOptsPanelProps = {
  samplingOpts: SamplingOpts;
  setSamplingOpts?: (opts: SamplingOpts) => void;
  config: {
    [K in keyof SamplingOpts]: InputConfig;
  };
  direction?: "row" | "column";
};

const SamplingOptsPanel: FunctionComponent<SamplingOptsPanelProps> = ({
  samplingOpts,
  setSamplingOpts,
  config,
  direction = "column",
}) => {
  const readOnly = !setSamplingOpts;

  const handleReset = useCallback(() => {
    setSamplingOpts && setSamplingOpts(defaultSamplingOpts);
  }, [setSamplingOpts]);

  return (
    <Stack direction={direction} spacing={1}>
      {Object.keys(config).map((key) => {
        const k = key as keyof SamplingOpts;
        const options = config[k];
        return (
          <NumberInput
            key={k}
            value={samplingOpts[k]}
            onChange={(value) =>
              setSamplingOpts &&
              setSamplingOpts({
                ...samplingOpts,
                [k]: value,
              })
            }
            options={options}
            readOnly={readOnly}
            label={LABELS[k]}
          />
        );
      })}

      <Stack direction="row" alignItems="center" sx={{ height: "100%" }}>
        <Tooltip title="Reset to default values">
          <IconButton onClick={handleReset} disabled={readOnly} size="small">
            <RestartAltIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

export default SamplingOptsPanel;
