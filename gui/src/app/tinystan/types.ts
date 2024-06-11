export type StanVariableInputs = Record<string, unknown>;

export type PrintCallback = (s: string) => void;

export enum HMCMetric {
  UNIT = 0,
  DENSE = 1,
  DIAGONAL = 2,
}

export type StanDraws = {
  paramNames: string[];
  draws: number[][];
  metric?: number[][] | number[][][];
};

export interface SamplerParams {
  data: string | StanVariableInputs;
  num_chains: number;
  inits: string | StanVariableInputs | string[] | StanVariableInputs[];
  seed: number | null;
  id: number;
  init_radius: number;
  num_warmup: number;
  num_samples: number;
  metric: HMCMetric;
  save_metric: boolean;
  init_inv_metric: number[] | number[][] | number[][][] | null;
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

interface LBFGSConfig {
  max_history_size: number;
  init_alpha: number;
  tol_obj: number;
  tol_rel_obj: number;
  tol_grad: number;
  tol_rel_grad: number;
  tol_param: number;
  num_iterations: number;
}

interface PathfinderUniqueParams {
  data: string | StanVariableInputs;
  num_paths: number;
  inits: string | StanVariableInputs | string[] | StanVariableInputs[];
  seed: number | null;
  id: number;
  init_radius: number;
  num_draws: number;
  num_elbo_draws: number;
  num_multi_draws: number;
  calculate_lp: boolean;
  psis_resample: boolean;
  refresh: number;
  num_threads: number;
}

export type PathfinderParams = LBFGSConfig & PathfinderUniqueParams;

// ------------- internal types -------------
// not exported directly, only used for WASM
// communication and therefore may not be stable

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
  // prettier-ignore
  _tinystan_pathfinder(model: model_ptr, num_paths: number, inits: cstr, seed: number, id: number,
    init_radius: number, num_draws: number, max_history_size: number, init_alpha: number, tol_obj: number,
    tol_rel_obj: number, tol_grad: number, tol_rel_grad: number, tol_param: number, num_iterations: number,
    num_elbo_draws: number, num_multi_draws: number, calculate_lp: number, psis_resample: number,
    refresh: number, num_threads: number, out: ptr, out_size: number, err_ptr: ptr): number;
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

export type internalTypes = {
  WasmModule: WasmModule;
  ptr: ptr;
  model_ptr: model_ptr;
  error_ptr: error_ptr;
  cstr: cstr;
};
