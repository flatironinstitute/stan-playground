import Box from "@mui/material/Box";
import LinearProgress, {
  LinearProgressProps,
} from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { FunctionComponent } from "react";

import Button from "@mui/material/Button";
import { SamplingOpts } from "@SpCore/ProjectDataModel";
import { Progress } from "@SpStanSampler/StanModelWorker";
import { StanSamplerStatus } from "@SpStanSampler/StanSampler";

type CompiledRunPanelProps = {
  handleRun: () => Promise<void>;
  cancelRun: () => void;
  runStatus: StanSamplerStatus;
  progress: Progress | undefined;
  samplingOpts: SamplingOpts;
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
    done sampling
  </div>
);

const CompiledRunPanel: FunctionComponent<CompiledRunPanelProps> = ({
  handleRun,
  runStatus,
  cancelRun,
  progress,
  samplingOpts,
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
        <SamplingProgressComponent
          report={progress}
          numChains={samplingOpts.num_chains}
        />
      </div>
    </>
  );

  const failedDiv = (
    <div>
      <hr />
      Sampling failed!
      <pre className="SamplerError">{errorMessage}</pre>
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

type SamplingProgressComponentProps = {
  report: Progress | undefined;
  numChains: number;
};

const SamplingProgressComponent: FunctionComponent<
  SamplingProgressComponentProps
> = ({ report, numChains }) => {
  if (!report) return <span />;
  const progress =
    ((report.iteration + (report.chain - 1) * report.totalIterations) /
      (report.totalIterations * numChains)) *
    100;
  return (
    <>
      <div className="SamplingProgress">
        <LinearProgressWithLabel
          sx={{
            height: 10,
            // https://stackoverflow.com/a/73009519
            "& .MuiLinearProgress-bar": {
              transition: "none",
            },
          }}
          value={progress}
        />
      </div>
      <div>
        Chain {report.chain} Iteration: {report.iteration} /{" "}
        {report.totalIterations} ({report.warmup ? "Warmup" : "Sampling"})
      </div>
    </>
  );
};

// from https://mui.com/material-ui/react-progress/#linear-with-label
const LinearProgressWithLabel = (
  props: LinearProgressProps & { value: number },
) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

export default CompiledRunPanel;
