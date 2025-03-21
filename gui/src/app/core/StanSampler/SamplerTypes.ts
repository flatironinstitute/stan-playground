import type { SamplingOpts } from "@SpCore/Project/ProjectDataModel";

export enum Requests {
  Load = "load",
  Sample = "sample",
}

export type SampleConfig = Omit<SamplingOpts, "seed"> & {
  data: string;
  refresh: number;
  seed: number | null;
};

export type StanModelRequestMessage =
  | {
      purpose: Requests.Load;
      url: string;
    }
  | {
      purpose: Requests.Sample;
      sampleConfig: SampleConfig;
    };

export enum Replies {
  ModelLoaded = "modelLoaded",
  StanReturn = "stanReturn",
  Progress = "progress",
}

export type StanModelReplyMessage =
  | {
      purpose: Replies.ModelLoaded;
    }
  | {
      purpose: Replies.StanReturn;
      error: string;
    }
  | {
      purpose: Replies.StanReturn;
      draws: number[][];
      paramNames: string[];
      error: null;
      consoleText: string;
      sampleConfig: SampleConfig;
    }
  | {
      purpose: Replies.Progress;
      report: Progress;
    };

export type Progress = {
  chain: number;
  iteration: number;
  totalIterations: number;
  percent: number;
  warmup: boolean;
};

export type StanSamplerStatus =
  | ""
  | "loading"
  | "loaded"
  | "sampling"
  | "completed"
  | "failed";

export type StanRun = {
  consoleText: string;
  draws: number[][];
  paramNames: string[];
  computeTimeSec: number;
  sampleConfig: SampleConfig;
};

export type SamplerState = {
  status: StanSamplerStatus;
  errorMessage: string;
  progress?: Progress;
  latestRun?: StanRun;
};

export type NeedsSamplerState = {
  samplerState: SamplerState;
};
