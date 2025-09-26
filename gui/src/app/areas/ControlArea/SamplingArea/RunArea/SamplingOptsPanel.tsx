import IconButton from "@mui/material/IconButton";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Tooltip from "@mui/material/Tooltip";
import {
  defaultSamplingOpts,
  SamplingOpts,
} from "@SpCore/Project/ProjectDataModel";
import { FunctionComponent, useCallback } from "react";
import Stack from "@mui/material/Stack";
import NumberInput from "@SpComponents/NumberInput";

import type { Option } from "@SpComponents/NumberInput";

type SamplingOptsPanelProps = {
  samplingOpts: SamplingOpts;
  setSamplingOpts?: (opts: SamplingOpts) => void;
  options: {
    num_chains: Option;
    num_warmup: Option;
    num_samples: Option;
    init_radius: Option;
    seed: Option;
  };
  direction?: "row" | "column";
};

const SamplingOptsPanel: FunctionComponent<SamplingOptsPanelProps> = ({
  samplingOpts,
  setSamplingOpts,
  options,
  direction = "column",
}) => {
  const readOnly = !setSamplingOpts;

  const handleReset = useCallback(() => {
    setSamplingOpts && setSamplingOpts(defaultSamplingOpts);
  }, [setSamplingOpts]);

  return (
    <Stack direction={direction} spacing={1}>
      <NumberInput
        value={samplingOpts.num_chains}
        onChange={(value) =>
          setSamplingOpts &&
          setSamplingOpts({
            ...samplingOpts,
            num_chains: value as number,
          })
        }
        options={options.num_chains}
        readOnly={readOnly}
        type="int"
        label="# chains"
      />
      <NumberInput
        value={samplingOpts.num_warmup}
        onChange={(value) =>
          setSamplingOpts &&
          setSamplingOpts({
            ...samplingOpts,
            num_warmup: value as number,
          })
        }
        options={options.num_warmup}
        readOnly={readOnly}
        type="int"
        label="# warmup"
      />
      <NumberInput
        value={samplingOpts.num_samples}
        onChange={(value) =>
          setSamplingOpts &&
          setSamplingOpts({
            ...samplingOpts,
            num_samples: value as number,
          })
        }
        options={options.num_samples}
        readOnly={readOnly}
        type="int"
        label="# samples"
      />
      <NumberInput
        value={samplingOpts.init_radius}
        onChange={(value) =>
          setSamplingOpts &&
          setSamplingOpts({
            ...samplingOpts,
            init_radius: value as number,
          })
        }
        options={options.init_radius}
        readOnly={readOnly}
        type="float"
        label="init radius"
      />
      <NumberInput
        value={samplingOpts.seed}
        onChange={(value) =>
          setSamplingOpts && setSamplingOpts({ ...samplingOpts, seed: value })
        }
        options={options.seed}
        readOnly={readOnly}
        type="intOrUndefined"
        label="seed"
      />
      <Tooltip title="Reset to default values">
        <IconButton
          onClick={handleReset}
          disabled={readOnly}
          size="small"
          className="SamplingOptsNumberEditBox"
        >
          <RestartAltIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default SamplingOptsPanel;
