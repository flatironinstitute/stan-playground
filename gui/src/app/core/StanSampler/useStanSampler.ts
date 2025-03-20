import { useEffect, useReducer, useState } from "react";

import { type SamplingOpts } from "@SpCore/Project/ProjectDataModel";
import { unreachable } from "@SpUtil/unreachable";

import { type Progress } from "./StanModelWorker";
import StanSampler, { type StanSamplerStatus } from "./StanSampler";

export type StanRun = {
  status: StanSamplerStatus;
  errorMessage: string;
  progress?: Progress;
  runResult?: {
    consoleText: string;
    draws: number[][];
    paramNames: string[];
    computeTimeSec: number;
    samplingOpts: SamplingOpts & { data: string };
  };
};

export type NeedsLatestRun = {
  latestRun: StanRun;
};

const initialStanRun: StanRun = {
  status: "",
  errorMessage: "",
};

export type StanRunAction =
  | { type: "clear" }
  | {
      type: "statusUpdate";
      status: StanSamplerStatus;
      errorMessage?: string;
    }
  | {
      type: "progressUpdate";
      progress: Progress;
    }
  | {
      type: "startSampling";
    }
  | {
      type: "samplerReturn";
      draws: number[][];
      paramNames: string[];
      computeTimeSec: number;
      consoleText: string;
      samplingOpts: SamplingOpts & { data: string };
    };

export const StanRunReducer = (
  state: StanRun,
  action: StanRunAction,
): StanRun => {
  switch (action.type) {
    case "clear":
      return initialStanRun;
    case "progressUpdate":
      return { ...state, progress: action.progress };
    case "statusUpdate":
      return {
        ...state,
        status: action.status,
        errorMessage: action.errorMessage ?? state.errorMessage,
      };
    case "startSampling":
      return {
        // preserve previous draws, paramNames, etc in case they are still being rendered while sampling progresses
        runResult: state.runResult,
        status: "sampling",
        errorMessage: "",
      };
    case "samplerReturn":
      return {
        ...state,
        status: "completed",
        runResult: {
          draws: action.draws,
          paramNames: action.paramNames,
          computeTimeSec: action.computeTimeSec,
          samplingOpts: action.samplingOpts,
          consoleText: action.consoleText,
        },
      };
    default:
      return unreachable(action);
  }
};

const useStanSampler = (compiledMainJsUrl: string | undefined) => {
  const [latestRun, update] = useReducer(StanRunReducer, initialStanRun);

  const [sampler, setSampler] = useState<StanSampler | undefined>(undefined);

  useEffect(() => {
    update({ type: "clear" });
    if (!compiledMainJsUrl) {
      setSampler(undefined);
      return;
    }
    const { sampler, cleanup: destructor } = StanSampler.__unsafe_create(
      compiledMainJsUrl,
      update,
    );
    setSampler(sampler);
    return destructor;
  }, [compiledMainJsUrl]);

  return { sampler, latestRun };
};

export default useStanSampler;
