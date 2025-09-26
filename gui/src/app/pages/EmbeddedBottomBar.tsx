import { FunctionComponent, use, useCallback, useMemo } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LaunchIcon from "@mui/icons-material/Launch";
import HelpIcon from "@mui/icons-material/Help";
import Settings from "@mui/icons-material/Settings";
import CancelIcon from "@mui/icons-material/Cancel";

import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import { SamplingOpts } from "@SpCore/Project/ProjectDataModel";
import type { SamplerState } from "@SpCore/StanSampler/SamplerTypes";
import StanSampler from "@SpCore/StanSampler/StanSampler";
import SamplingProgressCircular from "@SpAreas/ControlArea/SamplingArea/RunArea/SamplerProgressCircular";
import { UserSettingsContext } from "@SpCore/Settings/UserSettings";
import CompileButton from "@SpAreas/ControlArea/SamplingArea/RunArea/CompileButton";
import SamplingOptsPanel from "@SpAreas/ControlArea/SamplingArea/RunArea/SamplingOptsPanel";

type EmbeddedBottomBarProps = {
  sampler: StanSampler | undefined;
  samplerState: SamplerState;
};

const EmbeddedBottomBar: FunctionComponent<EmbeddedBottomBarProps> = ({
  sampler,
  samplerState,
}) => {
  return (
    <Box sx={{ display: "flex", height: 52 }}>
      <CompileOrRunControls sampler={sampler} samplerState={samplerState} />
      <span className="MenuBarSpacer" />
      <SiteButtons />
    </Box>
  );
};

const CompileOrRunControls: FunctionComponent<EmbeddedBottomBarProps> = ({
  sampler,
  samplerState,
}) => {
  const { compileStatus } = use(CompileContext);

  return (
    <>
      {compileStatus === "compiled" ? (
        <RunCompact sampler={sampler} samplerState={samplerState} />
      ) : (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
          <CompileButton />
        </Stack>
      )}
    </>
  );
};

// Preset options for dropdowns
const CHAIN_OPTIONS = [1, 2, 4, 8];
const WARMUP_OPTIONS = [0, 500, 1000, 2000];
const SAMPLE_OPTIONS = [100, 500, 1000, 2000];
const RADIUS_OPTIONS = [0, 0.1, 1.0, 2.0, 5.0];
const SEED_OPTIONS = ["random", 1, 2, 3, 4, 5] satisfies (number | "random")[];
const OPTIONS = {
  num_chains: CHAIN_OPTIONS,
  num_warmup: WARMUP_OPTIONS,
  num_samples: SAMPLE_OPTIONS,
  init_radius: RADIUS_OPTIONS,
  seed: SEED_OPTIONS,
};

const RunCompact: FunctionComponent<EmbeddedBottomBarProps> = ({
  sampler,
  samplerState,
}) => {
  const { data, update } = use(ProjectContext);
  const opts = data.samplingOpts;

  const setSamplingOpts = useCallback(
    (newOpts: SamplingOpts) => {
      update({ type: "setSamplingOpts", opts: newOpts });
    },
    [update],
  );

  const handleRun = useCallback(async () => {
    if (!sampler) return;
    sampler.sample(data.dataFileContent, data.samplingOpts);
  }, [sampler, data.dataFileContent, data.samplingOpts]);

  const handleCancel = useCallback(() => {
    if (sampler) {
      sampler.cancel();
    }
  }, [sampler]);

  const isSampling = samplerState.status === "sampling";
  const isLoading = samplerState.status === "loading";
  const isDisabled = isSampling || isLoading;

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ height: "100%", overflowX: "auto", px: 1 }}
    >
      {!isSampling && (
        <Button
          variant="contained"
          color="success"
          onClick={handleRun}
          disabled={isDisabled || !sampler}
        >
          Run
        </Button>
      )}
      {isSampling && (
        <Stack direction="row" spacing={1}>
          <SamplingProgressCircular
            report={samplerState.progress}
            numChains={opts.num_chains}
            size={24}
          />
          <Tooltip title="Cancel sampling">
            <IconButton color="error" onClick={handleCancel} size="small">
              <CancelIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
      <SamplingOptsPanel
        samplingOpts={data.samplingOpts}
        setSamplingOpts={!isSampling ? setSamplingOpts : undefined}
        direction="row"
        options={OPTIONS}
      />
    </Stack>
  );
};

type SiteButtonsProps = {
  // empty
};

const SiteButtons: FunctionComponent<SiteButtonsProps> = () => {
  const { data } = use(ProjectContext);

  const modelIsSaved = useMemo(() => {
    return data.stanFileContent === data.ephemera.stanFileContent;
  }, [data.ephemera.stanFileContent, data.stanFileContent]);

  const {
    settingsWindow: { openSettings },
  } = use(UserSettingsContext);

  const openInStanPlayground = useCallback(() => {
    const baseUrl = window.location.origin;
    const url = new URL(baseUrl);
    url.searchParams.set("stan", createDataUrl(data.stanFileContent));
    url.searchParams.set("data", createDataUrl(data.dataFileContent));
    window.open(url.toString(), "_blank");
  }, [data.dataFileContent, data.stanFileContent]);

  return (
    <Stack direction="row" alignItems="center" sx={{ height: "100%" }}>
      {modelIsSaved && (
        <Tooltip title="Open in full Stan Playground (new tab)">
          <IconButton onClick={openInStanPlayground} size="small">
            <LaunchIcon />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Settings">
        <IconButton
          onClick={() => openSettings("personalization")}
          size="small"
        >
          <Settings />
        </IconButton>
      </Tooltip>
      <Tooltip title="View source code on GitHub">
        <IconButton
          onClick={() =>
            window.open(
              "https://github.com/flatironinstitute/stan-playground",
              "_blank",
            )
          }
          size="small"
        >
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

const createDataUrl = (content: string) => {
  return "data:text/plain;charset=utf-8," + encodeURIComponent(content);
};

export default EmbeddedBottomBar;
