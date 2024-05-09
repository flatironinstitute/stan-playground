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
  _tinystan_sample(model:model_ptr, num_chains:number, inits:cstr, seed:number, id:number,
    init_radius:number, num_warmup:number, num_samples:number, metric:number, init_inv_metric:cstr,
    adapt:number, delta:number, gamma:number, kappa:number, t0:number, init_buffer:number,
    term_buffer:number, window:number, save_warmup:number, stepsize:number, stepsize_jitter:number,
    max_depth:number, refresh:number, num_threads:number, out:ptr, out_size:number, metric_out:ptr,
    err_ptr:ptr): number;
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
const NULLSTR = 0 as cstr;

export enum HMCMetric {
  UNIT = 0,
  DENSE = 1,
  DIAGONAL = 2,
}

export type PrintCallback = (s: string) => void;


export default class StanModel {
  private m: WasmModule;
  private printCallback: PrintCallback | null = null;
  private stdoutHolder: { text: string };

  private constructor(
    m: WasmModule,
    printCallback: PrintCallback | null = null,
    stdoutHolder: { text: string },
  ) {
    this.m = m;
    this.printCallback = printCallback;
    this.stdoutHolder = stdoutHolder;
  }

  public static async load(
    createModule: (proto?: object) => Promise<WasmModule>,
    printCallback: PrintCallback | null,
  ): Promise<StanModel> {
    // Create the initial object which will have the rest of the WASM
    // functions attached to it
    // See https://emscripten.org/docs/api_reference/module.html

    const stdoutHolder = { text: "" };

    const prototype: { [k: string]: unknown } = {};
    if (printCallback !== null) {
      prototype.print = (...args: unknown[]) => {
        const text = args.join(" ");
        stdoutHolder.text = stdoutHolder.text + text + "\n";
      };
    }

    const module = await createModule(prototype);
    return new StanModel(module, printCallback, stdoutHolder);
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

  private withModel<T>(
    data: string | object,
    seed: number,
    f: (model: model_ptr) => T,
  ): T {
    const err_ptr = this.m._malloc(4);
    if (typeof data === "object") {
      data = JSON.stringify(data);
    }

    const data_ptr = this.encodeString(data);
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

  // Supports most of the TinyStan API except for
  // - inits
  // - init inv metric
  // - save_metric
  public sample(
    data: string | object = "",
    num_chains: number = 4,
    seed: number | null = null,
    id: number = 1,
    init_radius: number = 2.0,
    num_warmup: number = 1000,
    num_samples: number = 1000,
    metric: HMCMetric = HMCMetric.DIAGONAL,
    adapt: boolean = true,
    delta: number = 0.8,
    gamma: number = 0.05,
    kappa: number = 0.75,
    t0: number = 10,
    init_buffer: number = 75,
    term_buffer: number = 50,
    window: number = 25,
    save_warmup: boolean = false,
    stepsize: number = 1.0,
    stepsize_jitter: number = 0.0,
    max_depth: number = 10,
    refresh: number = 100,
    num_threads: number = -1,
  ): number[][] {
    if (num_chains < 1) {
      throw new Error("num_chains must be at least 1");
    }
    if (num_warmup < 0) {
      throw new Error("num_warmup must be non-negative");
    }
    if (num_samples < 1) {
      throw new Error("num_samples must be at least 1");
    }

    if (seed === null) {
      seed = Math.floor(Math.random() * (2 ^ 32));
    }

    return this.withModel(data, seed, model => {
      // Get the parameter names
      const paramNames = this.m.UTF8ToString(
        this.m._tinystan_model_param_names(model),
      );
      // Get the number of parameters
      const n_params = paramNames.split(",").length;

      // Allocate memory for the output
      const n_draws =
        num_chains * (save_warmup ? num_samples + num_warmup : num_samples);
      const n_out = n_draws * (n_params + 7);
      const out_ptr = this.m._malloc(n_out * Float64Array.BYTES_PER_ELEMENT);

      // Sample from the model
      this.stdoutHolder.text = "";
      const err_ptr = this.m._malloc(4);
      const result = this.m._tinystan_sample(
        model,
        num_chains,
        NULLSTR, // inits
        seed || 0, // jfm added default of 0 because seed could be null
        id,
        init_radius,
        num_warmup,
        num_samples,
        metric.valueOf(),
        NULLSTR, // init inv metric
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
        NULL,
        err_ptr,
      );
      if (this.printCallback !== null) {
        this.printCallback(this.stdoutHolder.text);
      }

      if (result != 0) {
        this.handleError(err_ptr);
      }
      this.m._free(err_ptr);

      const out_buffer = this.m.HEAPF64.subarray(
        out_ptr / Float64Array.BYTES_PER_ELEMENT,
        out_ptr / Float64Array.BYTES_PER_ELEMENT + n_out,
      );

      // copy out parameters of interest
      const output: number[][] = Array.from({ length: n_params }, () => []);
      for (let i = 0; i < n_draws; i++) {
        for (let j = 0; j < n_params; j++) {
          const elm = out_buffer[i * (n_params + 7) + 7 + j];
          output[j][i] = elm;
        }
      }
      // Clean up
      this.m._free(out_ptr);

      return output;
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
