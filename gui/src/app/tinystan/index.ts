// Newtype trick to create distinct types for different kinds of pointers
const brand = Symbol("brand");
type Brand<T, U> = T & {
  [brand]: U;
};

type ptr = Brand<number, "raw pointer">;
type model_ptr = Brand<number, "model pointer">;
type error_ptr = Brand<number, "error object pointer">;
type cstr = Brand<number, "null-terminated char pointer">;

interface WasmModule {
  _malloc(n_bytes: number): ptr;
  _free(pointer: ptr | cstr): void;
  _tinystan_create_model(data: cstr, seed: number, err_ptr: ptr): model_ptr;
  _tinystan_destroy_model(model: model_ptr): void;
  _tinystan_model_param_names(model: model_ptr): cstr;
  _tinystan_model_num_free_params(model: model_ptr): number;
  _tinystan_separator_char(): number;
  // prettier-ignore
  _tinystan_sample(model: model_ptr, num_chains: number, inits: cstr, seed: number, id: number,
    init_radius: number, num_warmup: number, num_samples: number, metric: number, init_inv_metric: ptr,
    adapt: number, delta: number, gamma: number, kappa: number, t0: number, init_buffer: number,
    term_buffer: number, window: number, save_warmup: number, stepsize: number, stepsize_jitter: number,
    max_depth: number, refresh: number, num_threads: number, out: ptr, out_size: number, metric_out: ptr,
    err_ptr: ptr): number;
  _tinystan_get_error_message(err_ptr: error_ptr): cstr;
  _tinystan_get_error_type(err_ptr: error_ptr): number;
  _tinystan_destroy_error(err_ptr: error_ptr): void;
  _tinystan_api_version(major: ptr, minor: ptr, patch: ptr): void;
  _tinystan_stan_version(major: ptr, minor: ptr, patch: ptr): void;
  lengthBytesUTF8(str: string): number;
  UTF8ToString(ptr: cstr, max?: number): string;
  stringToUTF8(str: string, outPtr: cstr, maxBytesToWrite: number): number;
  getValue(ptr: number, type: string): number;
  HEAPF64: Float64Array;
}

const NULL = 0 as ptr;

const HMC_SAMPLER_VARIABLES = [
  "lp__",
  "accept_stat__",
  "stepsize__",
  "treedepth__",
  "n_leapfrog__",
  "divergent__",
  "energy__",
];

export enum HMCMetric {
  UNIT = 0,
  DENSE = 1,
  DIAGONAL = 2,
}

export type PrintCallback = (s: string) => void;

export type StanDraws = {
  paramNames: string[];
  draws: number[][];
};

export interface SamplerParams {
  data: string | object;
  num_chains: number;
  inits: string | object | string[] | object[];
  seed: number | null;
  id: number;
  init_radius: number;
  num_warmup: number;
  num_samples: number;
  metric: HMCMetric;
  save_metric: boolean,
  init_inv_metric: number[] | number[][] | null;
  adapt: boolean;
  delta: number;
  gamma: number;
  kappa: number;
  t0: number;
  init_buffer: number;
  term_buffer: number;
  window: number;
  save_warmup: boolean;
  stepsize: number;
  stepsize_jitter: number;
  max_depth: number;
  refresh: number;
  num_threads: number;
}

const defaultSamplerParams: SamplerParams = {
  data: "",
  num_chains: 4,
  inits: "",
  seed: null,
  id: 1,
  init_radius: 2.0,
  num_warmup: 1000,
  num_samples: 1000,
  metric: HMCMetric.DIAGONAL,
  save_metric: false,
  init_inv_metric: null, // currently unused
  adapt: true,
  delta: 0.8,
  gamma: 0.05,
  kappa: 0.75,
  t0: 10,
  init_buffer: 75,
  term_buffer: 50,
  window: 25,
  save_warmup: false,
  stepsize: 1.0,
  stepsize_jitter: 0.0,
  max_depth: 10,
  refresh: 100,  // this is how often it prints out progress
  num_threads: -1,
};

export default class StanModel {
  private m: WasmModule;
  private printCallback: PrintCallback | null;
  // used to send multiple JSON values in one string
  private sep: string;

  private constructor(m: WasmModule, pc: PrintCallback | null) {
    this.m = m;
    this.printCallback = pc;
    this.sep = String.fromCharCode(m._tinystan_separator_char());
  }

  public static async load(
    createModule: (proto?: object) => Promise<WasmModule>,
    printCallback: PrintCallback | null,
  ): Promise<StanModel> {
    // Create the initial object which will have the rest of the WASM
    // functions attached to it
    // See https://emscripten.org/docs/api_reference/module.html
    const prototype = { print: printCallback };

    const module = await createModule(prototype);
    return new StanModel(module, printCallback);
  }

  private encodeString(s: string): cstr {
    const len = this.m.lengthBytesUTF8(s) + 1;
    const ptr = this.m._malloc(len) as unknown as cstr;
    this.m.stringToUTF8(s, ptr, len);
    return ptr;
  }

  private handleError(err_ptr: ptr): void {
    const err = this.m.getValue(err_ptr, "*") as error_ptr;
    const err_msg_ptr = this.m._tinystan_get_error_message(err);
    const err_msg = "Exception from Stan:\n" + this.m.UTF8ToString(err_msg_ptr);
    this.m._tinystan_destroy_error(err);
    this.printCallback?.(err_msg);
    throw new Error(err_msg);
  }

  private encodeInits(inits: string | object | string[] | object[]): cstr {
    if (Array.isArray(inits)) {
      return this.encodeString(inits.map((i) => jsonify(i)).join(this.sep));
    } else {
      return this.encodeString(jsonify(inits));
    }
  }

  private withModel<T>(
    data: string | object,
    seed: number,
    f: (model: model_ptr) => T,
  ): T {
    const data_ptr = this.encodeString(jsonify(data));
    const err_ptr = this.m._malloc(4);
    const model = this.m._tinystan_create_model(data_ptr, seed, err_ptr);
    this.m._free(data_ptr);

    if (model == 0) {
      this.handleError(err_ptr);
    }
    this.m._free(err_ptr);
    try {
      return f(model);
    } finally {
      this.m._tinystan_destroy_model(model);
    }
  }

  public sample(p: Partial<SamplerParams>): StanDraws {
    const {
      data,
      num_chains,
      inits,
      seed,
      id,
      init_radius,
      num_warmup,
      num_samples,
      metric,
      save_metric,
      adapt,
      delta,
      gamma,
      kappa,
      t0,
      init_buffer,
      term_buffer,
      window,
      save_warmup,
      stepsize,
      stepsize_jitter,
      max_depth,
      refresh,
      num_threads,
    } = { ...defaultSamplerParams, ...p };

    if (num_chains < 1) {
      throw new Error("num_chains must be at least 1");
    }
    if (num_warmup < 0) {
      throw new Error("num_warmup must be non-negative");
    }
    if (num_samples < 1) {
      throw new Error("num_samples must be at least 1");
    }

    let seed_ = seed;
    if (seed_ === null) {
      seed_ = Math.floor(Math.random() * (2 ^ 32));
    }

    return this.withModel(data, seed_, model => {
      // Get the parameter names
      const rawParamNames = this.m.UTF8ToString(
        this.m._tinystan_model_param_names(model),
      );
      const paramNames = HMC_SAMPLER_VARIABLES.concat(rawParamNames.split(','));

      const n_params = paramNames.length;

      const free_params = this.m._tinystan_model_num_free_params(model);
      if (free_params === 0) {
        throw new Error("No parameters to sample");
      }

      // TODO: allow init_inv_metric to be specified
      const init_inv_metric_ptr = NULL;

      let metric_out = NULL;
      if (save_metric) {
        if (metric === HMCMetric.DENSE)
          metric_out = this.m._malloc(free_params * free_params * Float64Array.BYTES_PER_ELEMENT);
        else
          metric_out = this.m._malloc(free_params * Float64Array.BYTES_PER_ELEMENT);
      }

      // Allocate memory for the output
      const n_draws =
        num_chains * (save_warmup ? num_samples + num_warmup : num_samples);
      const n_out = n_draws * n_params;
      const out_ptr = this.m._malloc(n_out * Float64Array.BYTES_PER_ELEMENT);

      // Sample from the model
      const err_ptr = this.m._malloc(4);
      const result = this.m._tinystan_sample(
        model,
        num_chains,
        this.encodeInits(inits),
        seed_ || 0,
        id,
        init_radius,
        num_warmup,
        num_samples,
        metric.valueOf(),
        init_inv_metric_ptr,
        adapt ? 1 : 0,
        delta,
        gamma,
        kappa,
        t0,
        init_buffer,
        term_buffer,
        window,
        save_warmup ? 1 : 0,
        stepsize,
        stepsize_jitter,
        max_depth,
        refresh,
        num_threads,
        out_ptr,
        n_out,
        metric_out,
        err_ptr,
      );

      if (result != 0) {
        this.handleError(err_ptr);
      }
      this.m._free(err_ptr);

      const out_buffer = this.m.HEAPF64.subarray(
        out_ptr / Float64Array.BYTES_PER_ELEMENT,
        out_ptr / Float64Array.BYTES_PER_ELEMENT + n_out,
      );

      // copy out parameters of interest
      const draws: number[][] = Array.from({ length: n_params }, (_, i) =>
        Array.from({ length: n_draws }, (_, j) => out_buffer[i + n_params * j])
      );

      // Clean up
      this.m._free(out_ptr);

      let metric_array: number[] | number[][] | null = null;

      if (save_metric) {
        if (metric === HMCMetric.DENSE) {
          const metric_buffer = this.m.HEAPF64.subarray(
            metric_out / Float64Array.BYTES_PER_ELEMENT,
            metric_out / Float64Array.BYTES_PER_ELEMENT + free_params * free_params,
          );
          metric_array = Array.from({ length: free_params }, (_, i) =>
            Array.from({ length: free_params }, (_, j) => metric_buffer[i * free_params + j])
          );
        } else {
          const metric_buffer = this.m.HEAPF64.subarray(
            metric_out / Float64Array.BYTES_PER_ELEMENT,
            metric_out / Float64Array.BYTES_PER_ELEMENT + free_params,
          );
          metric_array = Array.from({ length: free_params }, (_, i) => metric_buffer[i]);
        }
      }
      this.m._free(metric_out);

      return { paramNames, draws, metric: metric_array };
    });
  }

  public stanVersion(): string {
    const major = this.m._malloc(4);
    const minor = this.m._malloc(4);
    const patch = this.m._malloc(4);
    this.m._tinystan_stan_version(major, minor, patch);
    const version =
      this.m.getValue(major, "i32") +
      "." +
      this.m.getValue(minor, "i32") +
      "." +
      this.m.getValue(patch, "i32");
    this.m._free(major);
    this.m._free(minor);
    this.m._free(patch);
    return version;
  }
}


const jsonify = (obj: string | object): string => {
  if (typeof obj === "string") {
    return obj;
  } else {
    return JSON.stringify(obj);
  }
}
