import type { SamplerParams } from "tinystan";
import { defaultSamplingOpts, SamplingOpts } from "../Project/ProjectDataModel";
import { Progress, Replies, Requests } from "./StanModelWorker";
import StanWorkerUrl from "./StanModelWorker?worker&url";
import { openDB } from "idb";

export type StanSamplerStatus =
  | ""
  | "loading"
  | "loaded"
  | "sampling"
  | "completed"
  | "failed";

class StanSampler {
  #worker: Worker | undefined;
  #status: StanSamplerStatus = "";
  #errorMessage: string = "";
  #onProgressCallbacks: ((progress: Progress) => void)[] = [];
  #onStatusChangedCallbacks: (() => void)[] = [];
  #draws: number[][] = [];
  #computeTimeSec: number | undefined = undefined;
  #paramNames: string[] = [];
  #samplingStartTimeSec: number = 0;
  #samplingOpts: SamplingOpts = defaultSamplingOpts; // the sampling options used in the last sample call
  #samplingCacheKey: any | undefined = undefined;
  #cacheHit: boolean = false;

  private constructor(private compiledUrl: string, private stanCode: string) {
    this._initialize();
  }

  static __unsafe_create(compiledUrl: string, stanCode: string): {
    sampler: StanSampler;
    cleanup: () => void;
  } {
    const sampler = new StanSampler(compiledUrl, stanCode);
    const cleanup = () => {
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
    this.#status = "loading";
    this.#worker.onmessage = (e) => {
      const purpose: Replies = e.data.purpose;
      switch (purpose) {
        case Replies.Progress: {
          this.#onProgressCallbacks.forEach((callback) =>
            callback(e.data.report),
          );
          break;
        }
        case Replies.ModelLoaded: {
          this.#status = "loaded";
          this.#onStatusChangedCallbacks.forEach((cb) => cb());
          break;
        }
        case Replies.StanReturn: {
          if (e.data.error) {
            this.#errorMessage = e.data.error;
            this.#status = "failed";
            this.#onStatusChangedCallbacks.forEach((cb) => cb());
          } else {
            this.#draws = e.data.draws;
            this.#paramNames = e.data.paramNames;
            this.#computeTimeSec =
              Date.now() / 1000 - this.#samplingStartTimeSec;
            this.#status = "completed";
            this.#onStatusChangedCallbacks.forEach((cb) => cb());
            if ((this.#samplingCacheKey) && (typeof this.#samplingOpts.seed === "number")) {
              saveToSamplingCache(this.#samplingCacheKey, {
                draws: this.#draws,
                paramNames: this.#paramNames,
                computeTimeSec: this.#computeTimeSec,
              });
            }
          }
          break;
        }
      }
    };
    this.#worker.postMessage({ purpose: Requests.Load, url: this.compiledUrl });
  }
  sample(data: any, samplingOpts: SamplingOpts) {
    const refresh = calculateReasonableRefreshRate(samplingOpts);
    const sampleConfig: Partial<SamplerParams> = {
      data,
      num_chains: samplingOpts.num_chains,
      num_warmup: samplingOpts.num_warmup,
      num_samples: samplingOpts.num_samples,
      init_radius: samplingOpts.init_radius,
      seed: samplingOpts.seed !== undefined ? samplingOpts.seed : null,
      refresh,
    };
    if (!this.#worker) return;
    if (this.#status === "") {
      console.warn("Model not loaded yet");
      return;
    }
    if (sampleConfig.num_chains === undefined) {
      console.warn("Number of chains not specified");
      return;
    }
    if (this.#status === "sampling") {
      console.warn("Already sampling");
      return;
    }
    if (this.#status === "loading") {
      console.warn("Model not loaded yet");
      return;
    }
    this.#samplingOpts = samplingOpts;
    this.#draws = [];
    this.#paramNames = [];
    this.#samplingStartTimeSec = Date.now() / 1000;
    this.#status = "sampling";
    this.#samplingCacheKey = {
      stanCode: this.stanCode,
      sampleConfig,
    };
    checkSamplingCache(this.#samplingCacheKey).then((cacheItem) => {
      if (cacheItem) {
        this.#status = "completed";
        this.#draws = cacheItem.draws;
        this.#paramNames = cacheItem.paramNames;
        this.#computeTimeSec = cacheItem.computeTimeSec;
        this.#onStatusChangedCallbacks.forEach((cb) => cb());
        this.#cacheHit = true;
        return;
      }
      this.#cacheHit = false;
      if (!this.#worker) throw Error("Unexpected missing worker");
      this.#worker.postMessage({ purpose: Requests.Sample, sampleConfig });
      this.#onStatusChangedCallbacks.forEach((cb) => cb());
    });
  }
  onProgress(callback: (progress: Progress) => void) {
    this.#onProgressCallbacks.push(callback);
  }
  onStatusChanged(callback: () => void) {
    this.#onStatusChangedCallbacks.push(callback);
  }
  cancel() {
    if (this.#status === "sampling") {
      this.#worker && this.#worker.terminate();
      this.#status = "";
      this._initialize();
    } else {
      console.warn("Nothing to cancel");
    }
  }
  get draws() {
    return this.#draws;
  }
  get paramNames() {
    return this.#paramNames;
  }
  get status() {
    return this.#status;
  }
  get errorMessage() {
    return this.#errorMessage;
  }
  get computeTimeSec() {
    return this.#computeTimeSec;
  }
  get samplingOpts() {
    return this.#samplingOpts;
  }
  get cacheHit() {
    return this.#cacheHit;
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

type SamplingCacheItem = {
  draws: number[][];
  paramNames: string[];
  computeTimeSec: number;
};

const isSamplingCacheItem = (item: any): item is SamplingCacheItem => {
  if (!item) return false;
  if (typeof item !== "object") return false;
  if (!Array.isArray(item.draws)) return false;
  for (const draw of item.draws) {
    if (!Array.isArray(draw)) return false;
    for (const value of draw) {
      if (typeof value !== "number") return false;
    }
  }
  if (!Array.isArray(item.paramNames)) return false;
  for (const name of item.paramNames) {
    if (typeof name !== "string") return false;
  }
  if (typeof item.computeTimeSec !== "number") return false;
  return true;
};

const dbPromise = openDB('samplingCacheDB', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('cache')) {
      db.createObjectStore('cache', { keyPath: 'key' });
    }
  },
});

const saveToSamplingCache = async (key: any, value: SamplingCacheItem) => {
  const keyString = await getSamplingCacheKeyString(key);
  const valueString = JSON.stringify(value);
  const db = await dbPromise;
  const tx = db.transaction('cache', 'readwrite');
  const store = tx.objectStore('cache');
  store.put({ key: keyString, value: valueString });
  await tx.done;
}

const checkSamplingCache = async (key: any) => {
  const keyString = await getSamplingCacheKeyString(key);
  const db = await dbPromise;
  const tx = db.transaction('cache');
  const store = tx.objectStore('cache');
  const cachedItem = await store.get(keyString);
  await tx.done;
  if (!cachedItem) return null;
  const value = JSON.parse(cachedItem.value);
  if (!isSamplingCacheItem(value)) {
    console.warn("Invalid cache item");
    return null;
  }
  return value;
}

const getSamplingCacheKeyString = async (key: any) => {
  const keyJson = jsonStringifyDeterministic(key);
  const keySha1 = await sha1(keyJson);
  return `sampling-cache-${keySha1}`;
}

const sha1 = async (str: string) => {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export const jsonStringifyDeterministic = (
  obj: any,
  space: string | number | undefined = undefined,
) => {
  const allKeys: string[] = [];
  JSON.stringify(obj, function (key, value) {
    allKeys.push(key);
    return value;
  });
  allKeys.sort();
  return JSON.stringify(obj, allKeys, space);
};

export default StanSampler;
