import { SamplingOpts } from "@SpCore/Project/ProjectDataModel";
import { unreachable } from "@SpUtil/unreachable";

import {
  Replies,
  Requests,
  StanModelReplyMessage,
  StanModelRequestMessage,
} from "./SamplerTypes";
import { type SamplerStateAction } from "./useStanSampler";
import StanWorkerUrl from "./StanModelWorker?worker&url";

type StanSamplerAndCleanup = {
  sampler: StanSampler;
  cleanup: () => void;
};

class StanSampler {
  #stanWorker: Worker | undefined;
  #samplingStartTimeSec: number = 0;

  private constructor(
    private compiledUrl: string,
    private update: (action: SamplerStateAction) => void,
  ) {
    this._initialize();
  }

  static __unsafe_create(
    compiledUrl: string,
    update: (action: SamplerStateAction) => void,
  ): StanSamplerAndCleanup {
    const sampler = new StanSampler(compiledUrl, update);
    const cleanup = () => {
      console.log("terminating model worker");
      sampler.#stanWorker && sampler.#stanWorker.terminate();
      sampler.#stanWorker = undefined;
    };
    return { sampler, cleanup };
  }

  _initialize() {
    this.#stanWorker = new Worker(StanWorkerUrl, {
      name: "tinystan worker",
      type: "module",
    });

    this.#stanWorker.onmessage = (e: MessageEvent<StanModelReplyMessage>) => {
      switch (e.data.purpose) {
        case Replies.Progress: {
          this.update({ type: "progressUpdate", progress: e.data.report });
          break;
        }
        case Replies.ModelLoaded: {
          this.update({ type: "statusUpdate", status: "loaded" });
          break;
        }
        case Replies.StanReturn: {
          if (e.data.error !== null) {
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
              computeTimeSec:
                performance.now() / 1000 - this.#samplingStartTimeSec,
              consoleText: e.data.consoleText,
              sampleConfig: e.data.sampleConfig,
            });
          }
          break;
        }
        default:
          unreachable(e.data);
      }
    };
    this.update({ type: "statusUpdate", status: "loading" });
    this.postMessage({ purpose: Requests.Load, url: this.compiledUrl });
  }

  sample(data: string, samplingOpts: SamplingOpts) {
    const sampleConfig = makeSamplerConfig(samplingOpts, data);

    if (!this.#stanWorker) throw new Error("model worker is undefined");

    this.update({ type: "startSampling" });

    this.#samplingStartTimeSec = performance.now() / 1000;
    this.postMessage({ purpose: Requests.Sample, sampleConfig });
  }

  private postMessage(message: StanModelRequestMessage) {
    if (!this.#stanWorker) throw new Error("model worker is undefined");
    this.#stanWorker.postMessage(message);
  }

  cancel() {
    this.#stanWorker?.terminate();
    this._initialize();
  }
}

const makeSamplerConfig = (samplingOpts: SamplingOpts, data: string) => {
  const refresh = calculateReasonableRefreshRate(samplingOpts);
  return {
    ...samplingOpts,
    data,
    // this line is equivalent to what TinyStan itself does,
    // but by doing it ourselves we can e.g. store it in the csv file zip
    seed: samplingOpts.seed ?? Math.floor(Math.random() * Math.pow(2, 32)),
    refresh,
  };
};

const calculateReasonableRefreshRate = (samplingOpts: SamplingOpts) => {
  const totalSamples =
    (samplingOpts.num_samples + samplingOpts.num_warmup) *
    samplingOpts.num_chains;

  const twoHalfPercent = Math.floor(totalSamples / 40);

  const nearestMultipleOfTen = Math.round(twoHalfPercent / 10) * 10;

  return Math.max(15, nearestMultipleOfTen);
};

export default StanSampler;
