import { FunctionComponent } from "react";

import Button from "@mui/material/Button";
import { StanSamplerStatus } from "@SpCore/StanSampler/SamplerTypes";

type RunProps = {
  handleRun: () => Promise<void>;
  cancelRun: () => void;
  runStatus: StanSamplerStatus;
};

const RunPanel: FunctionComponent<RunProps> = ({
  handleRun,
  cancelRun,
  runStatus,
}) => {
  return (
    <div>
      <Button
        variant="contained"
        color="success"
        onClick={handleRun}
        disabled={runStatus === "sampling" || runStatus === "loading"}
      >
        run sampling
      </Button>
      &nbsp;
      {runStatus === "sampling" && (
        <Button
          color="error"
          variant="outlined"
          onClick={cancelRun}
          disabled={runStatus !== "sampling"}
        >
          cancel
        </Button>
      )}
    </div>
  );
};

export default RunPanel;
