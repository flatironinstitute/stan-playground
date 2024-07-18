import { SamplingOpts } from "@SpCore/ProjectDataModel";
import { Replies, Requests } from "@SpStanSampler/StanModelWorker";
import StanWorkerUrl from "@SpStanSampler/StanModelWorker?worker&url";
import type { SamplerParams } from "tinystan";
import { type StanRunAction } from "./useStanSampler";

export type StanSamplerStatus =
  | ""
  | "loading"
  | "loaded"
  | "sampling"
  | "completed"
  | "failed";

type StanSamplerAndCleanup = {
  sampler: StanSampler;
  cleanup: () => void;
};

class StanSampler {
  #worker: Worker | undefined;
  #samplingStartTimeSec: number = 0;

  private constructor(
    private compiledUrl: string,
    private update: (action: StanRunAction) => void,
  ) {
    this._initialize();
  }

  static __unsafe_create(
    compiledUrl: string,
    update: (action: StanRunAction) => void,
  ): StanSamplerAndCleanup {
    const sampler = new StanSampler(compiledUrl, update);
    const cleanup = () => {
      console.log("terminating model worker");
      sampler.#worker && sampler.#worker.terminate();
      sampler.#worker = undefined;
    };
    return { sampler, cleanup };
  }

  _initialize() {
    this.#worker = new Worker(StanWorkerUrl, {
      name: "tinystan worker",
      type: "module",
    });

    this.update({ type: "clear" });

    this.#worker.onmessage = (e) => {
      const purpose: Replies = e.data.purpose;
      switch (purpose) {
        case Replies.Progress: {
          this.update({ type: "progressUpdate", progress: e.data.report });
          break;
        }
        case Replies.ModelLoaded: {
          this.update({ type: "statusUpdate", status: "loaded" });
          break;
        }
        case Replies.StanReturn: {
          if (e.data.error) {
            this.update({
              type: "statusUpdate",
              status: "failed",
              errorMessage: e.data.error,
            });
          } else {
            this.update({
              type: "samplerReturn",
              draws: e.data.draws,
              paramNames: e.data.paramNames,
              computeTimeSec: Date.now() / 1000 - this.#samplingStartTimeSec,
            });
          }
          break;
        }
      }
    };
    this.update({ type: "statusUpdate", status: "loading" });
    this.#worker.postMessage({ purpose: Requests.Load, url: this.compiledUrl });
  }

  sample(data: any, samplingOpts: SamplingOpts) {
    const refresh = calculateReasonableRefreshRate(samplingOpts);
    const sampleConfig: Partial<SamplerParams> = {
      ...samplingOpts,
      data,
      seed: samplingOpts.seed !== undefined ? samplingOpts.seed : null,
      refresh,
    };
    if (!this.#worker) throw new Error("model worker is undefined");

    this.update({ type: "startSampling", samplingOpts });

    this.#samplingStartTimeSec = Date.now() / 1000;
    this.#worker.postMessage({ purpose: Requests.Sample, sampleConfig });
  }

  cancel() {
    this.#worker?.terminate();
    this._initialize();
  }
}

const calculateReasonableRefreshRate = (samplingOpts: SamplingOpts) => {
  const totalSamples =
    (samplingOpts.num_samples + samplingOpts.num_warmup) *
    samplingOpts.num_chains;

  const onePercent = Math.floor(totalSamples / 100);

  const nearestMultipleOfTen = Math.round(onePercent / 10) * 10;

  return Math.max(10, nearestMultipleOfTen);
};

export default StanSampler;
