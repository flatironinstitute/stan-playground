import { type SamplingOpts } from "@SpCore/ProjectDataModel";
import { type Progress } from "@SpStanSampler/StanModelWorker";
import StanSampler, {
  type StanSamplerStatus,
} from "@SpStanSampler/StanSampler";
import { unreachable } from "@SpUtil/unreachable";
import { useEffect, useReducer, useState } from "react";

export type StanRun = {
  status: StanSamplerStatus;
  errorMessage: string;
  progress?: Progress;
  samplingOpts?: SamplingOpts;
  data?: string;
  draws?: number[][];
  paramNames?: string[];
  computeTimeSec?: number;
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
      samplingOpts: SamplingOpts;
      data: string;
    }
  | {
      type: "samplerReturn";
      draws: number[][];
      paramNames: string[];
      computeTimeSec: number;
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
        ...state,
        status: "sampling",
        errorMessage: "",
        samplingOpts: action.samplingOpts,
        data: action.data,
      };
    case "samplerReturn":
      return {
        ...state,
        status: "completed",
        draws: action.draws,
        paramNames: action.paramNames,
        computeTimeSec: action.computeTimeSec,
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
