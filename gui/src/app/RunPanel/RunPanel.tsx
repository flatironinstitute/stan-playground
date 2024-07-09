/* eslint-disable @typescript-eslint/no-explicit-any */
import Box from "@mui/material/Box";
import LinearProgress, {
  LinearProgressProps,
} from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { FunctionComponent, useCallback } from "react";

import { SamplingOpts } from "../Project/ProjectDataModel";
import { Progress } from "../StanSampler/StanModelWorker";
import StanSampler from "../StanSampler/StanSampler";
import {
  useSamplerProgress,
  useSamplerStatus,
} from "../StanSampler/useStanSampler";

type RunPanelProps = {
  width: number;
  height: number;
  sampler?: StanSampler;
  data: any | undefined;
  dataIsSaved: boolean;
  samplingOpts: SamplingOpts;
};

const RunPanel: FunctionComponent<RunPanelProps> = ({
  width,
  height,
  sampler,
  data,
  dataIsSaved,
  samplingOpts,
}) => {
  const { status: runStatus, errorMessage } = useSamplerStatus(sampler);
  const progress = useSamplerProgress(sampler);

  const handleRun = useCallback(async () => {
    if (!sampler) return;
    sampler.sample(data, samplingOpts);
  }, [sampler, data, samplingOpts]);

  const cancelRun = useCallback(() => {
    if (!sampler) return;
    sampler.cancel();
  }, [sampler]);

  if (!sampler)
    return <div style={{ padding: 5 }}>Stan model not compiled</div>;

  if (!dataIsSaved) {
    return <div style={{ padding: 5 }}>Data not saved</div>;
  }
  return (
    <div style={{ position: "absolute", width, height, overflowY: "auto" }}>
      <div style={{ padding: 5 }}>
        <div>
          <button
            onClick={handleRun}
            disabled={runStatus === "sampling" || runStatus === "loading"}
          >
            run sampling
          </button>
          &nbsp;
          {runStatus === "sampling" && (
            <button onClick={cancelRun} disabled={runStatus !== "sampling"}>
              cancel
            </button>
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
      <div style={{ width: "45%" }}>
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
