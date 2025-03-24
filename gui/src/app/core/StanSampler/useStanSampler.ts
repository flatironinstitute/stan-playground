import { useEffect, useReducer, useState } from "react";

import { unreachable } from "@SpUtil/unreachable";
import {
  Progress,
  SampleConfig,
  SamplerState,
  StanSamplerStatus,
} from "./SamplerTypes";
import StanSampler from "./StanSampler";

const initialState: SamplerState = {
  status: "",
  errorMessage: "",
};

export type SamplerStateAction =
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
      sampleConfig: SampleConfig;
    };

const SamplerStateReducer = (
  state: SamplerState,
  action: SamplerStateAction,
): SamplerState => {
  switch (action.type) {
    case "clear":
      return initialState;
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
        latestRun: state.latestRun,
        status: "sampling",
        errorMessage: "",
      };
    case "samplerReturn":
      return {
        ...state,
        status: "completed",
        latestRun: {
          draws: action.draws,
          paramNames: action.paramNames,
          computeTimeSec: action.computeTimeSec,
          sampleConfig: action.sampleConfig,
          consoleText: action.consoleText,
        },
      };
    default:
      return unreachable(action);
  }
};

const useStanSampler = (compiledMainJsUrl: string | undefined) => {
  const [samplerState, update] = useReducer(SamplerStateReducer, initialState);

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

  return { sampler, samplerState };
};

export default useStanSampler;
