import { SamplerParams, PathfinderParams, HMCMetric } from "./types";

import type { internalTypes } from "./types";
type ptr = internalTypes["ptr"];

export const HMC_SAMPLER_VARIABLES = [
  "lp__",
  "accept_stat__",
  "stepsize__",
  "treedepth__",
  "n_leapfrog__",
  "divergent__",
  "energy__",
];
export const PATHFINDER_VARIABLES = ["lp_approx__", "lp__"];

const NULL = 0 as ptr;
const PTR_SIZE = 4;

const defaultSamplerParams: SamplerParams = {
  data: "",
  num_chains: 4,
  inits: "",
  seed: null,
  id: 1,
  init_radius: 2,
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
  stepsize: 1,
  stepsize_jitter: 0,
  max_depth: 10,
  refresh: 100,
  num_threads: -1,
};
const defaultPathfinderParams: PathfinderParams = {
  data: "",
  num_paths: 4,
  inits: "",
  seed: null,
  id: 1,
  init_radius: 2,
  num_draws: 1000,
  max_history_size: 5,
  init_alpha: 0.001,
  tol_obj: 1e-12,
  tol_rel_obj: 10000,
  tol_grad: 1e-8,
  tol_rel_grad: 10000000,
  tol_param: 1e-8,
  num_iterations: 1000,
  num_elbo_draws: 25,
  num_multi_draws: 1000,
  calculate_lp: true,
  psis_resample: true,
  refresh: 100,
  num_threads: -1,
};

export const internalConstants = {
  NULL,
  PTR_SIZE,
  defaultSamplerParams,
  defaultPathfinderParams,
};
