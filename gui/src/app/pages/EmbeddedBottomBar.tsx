import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import {
  defaultSamplingOpts,
  SamplingOpts,
} from "@SpCore/Project/ProjectDataModel";
import type { SamplerState } from "@SpCore/StanSampler/SamplerTypes";
import StanSampler from "@SpCore/StanSampler/StanSampler";
import SamplingProgressCircular from "../areas/ControlArea/SamplingArea/RunArea/SamplerProgressCircular";
import { UserSettingsContext } from "@SpCore/Settings/UserSettings";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LaunchIcon from "@mui/icons-material/Launch";
import HelpIcon from "@mui/icons-material/Help";
import Settings from "@mui/icons-material/Settings";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CancelIcon from "@mui/icons-material/Cancel";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import { FunctionComponent, use, useCallback, useMemo } from "react";

// Preset options for dropdowns
const CHAIN_OPTIONS = [1, 2, 4, 8];
const WARMUP_OPTIONS = [0, 500, 1000, 2000];
const SAMPLE_OPTIONS = [100, 500, 1000, 2000];
const RADIUS_OPTIONS = [0, 0.1, 1.0, 2.0, 5.0];

type EmbeddedBottomBarProps = {
  sampler: StanSampler | undefined;
  samplerState: SamplerState;
};

const EmbeddedBottomBar: FunctionComponent<EmbeddedBottomBarProps> = ({
  sampler,
  samplerState,
}) => {
  const { compile, compileStatus, validSyntax, isConnected } =
    use(CompileContext);

  const { data: projectData } = use(ProjectContext);
  const {
    settingsWindow: { openSettings },
  } = use(UserSettingsContext);

  const modelIsPresent = useMemo(() => {
    return projectData.stanFileContent.trim();
  }, [projectData.stanFileContent]);

  const modelIsSaved = useMemo(() => {
    return projectData.stanFileContent === projectData.ephemera.stanFileContent;
  }, [projectData.ephemera.stanFileContent, projectData.stanFileContent]);

  const openInStanPlayground = useCallback(() => {
    const baseUrl = window.location.origin;
    const url = new URL(baseUrl);
    url.searchParams.set("stan", createDataUrl(projectData.stanFileContent));
    url.searchParams.set("data", createDataUrl(projectData.dataFileContent));
    window.open(url.toString(), "_blank");
  }, [projectData]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        height: 52,
      }}
    >
      {compileStatus === "compiled" ? (
        <RunCompact sampler={sampler} samplerState={samplerState} />
      ) : (
        <>
          <Tooltip
            title={
              !validSyntax
                ? "Syntax error"
                : !isConnected
                  ? "Not connected to compilation server"
                  : ""
            }
          >
            <span>
              <Button
                variant="contained"
                color="primary"
                onClick={() => compile()}
                disabled={
                  !validSyntax ||
                  !isConnected ||
                  !modelIsPresent ||
                  !modelIsSaved
                }
              >
                Compile
              </Button>
            </span>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
        </>
      )}
      {modelIsSaved && (
        <>
          <Tooltip title="Open in full Stan Playground (new tab)">
            <IconButton onClick={openInStanPlayground} size="small">
              <LaunchIcon />
            </IconButton>
          </Tooltip>
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
        </>
      )}
    </Box>
  );
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

  const handleReset = useCallback(() => {
    setSamplingOpts(defaultSamplingOpts);
  }, [setSamplingOpts]);

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
    <>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ height: "100%", overflowX: "auto", px: 1 }}
      >
        <Box>
          <Stack direction="row" spacing={1}>
            {!isSampling && (
              <Button
                variant="contained"
                color="success"
                onClick={handleRun}
                disabled={isDisabled || !sampler}
                size="small"
              >
                Run
              </Button>
            )}
            {isSampling && (
              <>
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
              </>
            )}
          </Stack>
        </Box>

        <Tooltip title="Number of sampling chains">
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel>Chains</InputLabel>
            <Select
              value={opts.num_chains}
              label="Chains"
              disabled={isDisabled}
              onChange={(e) =>
                setSamplingOpts({
                  ...opts,
                  num_chains: e.target.value as number,
                })
              }
            >
              {CHAIN_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>

        <Tooltip title="Number of warmup draws per chain">
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Warmup</InputLabel>
            <Select
              value={opts.num_warmup}
              label="Warmup"
              disabled={isDisabled}
              onChange={(e) =>
                setSamplingOpts({
                  ...opts,
                  num_warmup: e.target.value as number,
                })
              }
            >
              {WARMUP_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>

        <Tooltip title="Number of regular draws per chain">
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Samples</InputLabel>
            <Select
              value={opts.num_samples}
              label="Samples"
              disabled={isDisabled}
              onChange={(e) =>
                setSamplingOpts({
                  ...opts,
                  num_samples: e.target.value as number,
                })
              }
            >
              {SAMPLE_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>

        <Tooltip title="Radius for initial parameter values">
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Radius</InputLabel>
            <Select
              value={opts.init_radius}
              label="Radius"
              disabled={isDisabled}
              onChange={(e) =>
                setSamplingOpts({
                  ...opts,
                  init_radius: e.target.value as number,
                })
              }
            >
              {RADIUS_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>

        <Tooltip title="Random seed">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={opts.seed !== undefined}
                  disabled={isDisabled}
                  size="small"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSamplingOpts({
                        ...opts,
                        seed: 0,
                      });
                    } else {
                      setSamplingOpts({
                        ...opts,
                        seed: undefined,
                      });
                    }
                  }}
                />
              }
              label="Seed"
              sx={{ margin: 0 }}
            />
            {opts.seed !== undefined && (
              <TextField
                size="small"
                type="number"
                value={opts.seed}
                disabled={isDisabled}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setSamplingOpts({
                      ...opts,
                      seed: value,
                    });
                  }
                }}
                sx={{ width: 60 }}
                inputProps={{ min: 0 }}
              />
            )}
          </Box>
        </Tooltip>

        <Tooltip title="Reset to default values">
          <IconButton onClick={handleReset} disabled={isDisabled} size="small">
            <RestartAltIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );
};

const createDataUrl = (content: string) => {
  return "data:text/plain;charset=utf-8," + encodeURIComponent(content);
};

export default EmbeddedBottomBar;
