import { type SamplingOpts } from "@SpCore/ProjectDataModel";
import { type Progress } from "@SpStanSampler/StanModelWorker";
import StanSampler, {
  type StanSamplerStatus,
} from "@SpStanSampler/StanSampler";
import { useEffect, useReducer, useState } from "react";

export type StanRun = {
  status: StanSamplerStatus;
  errorMessage: string;
  progress?: Progress;
  samplingOpts?: SamplingOpts;
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
      if (action.errorMessage) {
        return {
          ...state,
          status: action.status,
          errorMessage: action.errorMessage,
        };
      }
      return { ...state, status: action.status };
    case "startSampling":
      return {
        status: "sampling",
        errorMessage: "",
        samplingOpts: action.samplingOpts,
      };
    case "samplerReturn":
      return {
        ...state,
        status: "completed",
        draws: action.draws,
        paramNames: action.paramNames,
        computeTimeSec: action.computeTimeSec,
      };
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
