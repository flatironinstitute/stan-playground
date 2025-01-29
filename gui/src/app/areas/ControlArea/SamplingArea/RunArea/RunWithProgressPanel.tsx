import Box from "@mui/material/Box";
import { FunctionComponent } from "react";

import Button from "@mui/material/Button";
import { Progress } from "@SpCore/StanSampler/StanModelWorker";
import { StanSamplerStatus } from "@SpCore/StanSampler/StanSampler";
import SamplingProgressComponent from "./SamplerProgress";

type RunWithProgressProps = {
  handleRun: () => Promise<void>;
  cancelRun: () => void;
  runStatus: StanSamplerStatus;
  progress: Progress | undefined;
  numChains: number;
  errorMessage: string;
};

const loadingDiv = (
  <div>
    <hr />
    Loading compiled Stan model...
  </div>
);

const completedDiv = (
  <div>
    <hr />
    Done sampling
  </div>
);

const RunWithProgressPanel: FunctionComponent<RunWithProgressProps> = ({
  handleRun,
  runStatus,
  cancelRun,
  progress,
  numChains,
  errorMessage,
}) => {
  const samplingDiv = (
    <>
      <Button
        color="error"
        variant="outlined"
        onClick={cancelRun}
        disabled={runStatus !== "sampling"}
      >
        cancel
      </Button>
      <hr />
      <div>
        Sampling
        <SamplingProgressComponent report={progress} numChains={numChains} />
      </div>
    </>
  );

  const failedDiv = (
    <div>
      <hr />
      Sampling failed!
      <Box color="error.main">
        <pre className="SamplerError">{errorMessage}</pre>
      </Box>
      <span className="details">(see browser console for more details)</span>
    </div>
  );

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
      {runStatus === "loading" ? (
        loadingDiv
      ) : runStatus === "completed" ? (
        completedDiv
      ) : runStatus === "failed" ? (
        failedDiv
      ) : runStatus === "sampling" ? (
        samplingDiv
      ) : (
        <></>
      )}
    </div>
  );
};

export default RunWithProgressPanel;
