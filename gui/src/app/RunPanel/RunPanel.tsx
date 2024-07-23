/* eslint-disable @typescript-eslint/no-explicit-any */
import Box from "@mui/material/Box";
import LinearProgress, {
  LinearProgressProps,
} from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { FunctionComponent, useCallback } from "react";

import { SamplingOpts } from "@SpCore/ProjectDataModel";
import { Progress } from "@SpStanSampler/StanModelWorker";
import StanSampler from "@SpStanSampler/StanSampler";
import { StanRun } from "@SpStanSampler/useStanSampler";
import Button from "@mui/material/Button";

type RunPanelProps = {
  sampler?: StanSampler;
  latestRun: StanRun;
  data: any | undefined;
  dataIsSaved: boolean;
  samplingOpts: SamplingOpts;
};

const RunPanel: FunctionComponent<RunPanelProps> = ({
  sampler,
  latestRun,
  data,
  dataIsSaved,
  samplingOpts,
}) => {
  const { status: runStatus, errorMessage, progress } = latestRun;

  const handleRun = useCallback(async () => {
    if (!sampler) return;
    sampler.sample(data, samplingOpts);
  }, [sampler, data, samplingOpts]);

  const cancelRun = useCallback(() => {
    if (!sampler) return;
    sampler.cancel();
  }, [sampler]);

  if (!sampler)
    return <div className="RunPanelPadded">Stan model not compiled</div>;

  if (!dataIsSaved) {
    return <div className="RunPanelPadded">Data not saved</div>;
  }
  return (
    <div className="RunPanel">
      <div className="RunPanelPadded">
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
          <hr />
          {runStatus === "loading" && <div>Loading compiled Stan model...</div>}
          {runStatus === "sampling" && (
            <div>
              Sampling
              <SamplingProgressComponent
                report={progress}
                numChains={samplingOpts.num_chains}
              />
            </div>
          )}
          {runStatus === "completed" && <div>done sampling</div>}
          {runStatus === "failed" && (
            <div>
              failed: {errorMessage} (see browser console for more details)
            </div>
          )}
        </div>
      </div>
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

export default RunPanel;
