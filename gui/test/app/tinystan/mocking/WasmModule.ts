import { vi } from "vitest";

import type { internalTypes } from "../../../../src/app/tinystan/types";
type ptr = internalTypes["ptr"];
type model_ptr = internalTypes["model_ptr"];
type cstr = internalTypes["cstr"];

export type ModuleSettings = {
  // the return code of the algorithms
  returnCode: number;
  // comma-separated list of parameter names
  paramNames: string;
  // number of unconstrained parameters in the model
  // differs from the above if constrains or transformed parameters are present
  numFreeParams: number;
  // if true, the model constructor will fail (return address 0)
  modelFails: boolean;
};

const defaultModuleSettings: ModuleSettings = {
  returnCode: 0,
  paramNames: "foo,bar,baz",
  numFreeParams: 3,
  modelFails: false,
};

// 128MB heap, filled with increasing numbers.
// This allows us to check where values came from
// relative to each other
const fakeHeap = new Float64Array(16 * 1024 * 1024);
for (let i = 0; i < fakeHeap.length; i++) {
  fakeHeap[i] = i;
}

export const mockModule = (p: Partial<ModuleSettings>) => {
  const { returnCode, numFreeParams, paramNames, modelFails } = {
    ...defaultModuleSettings,
    ...p,
  };

  // malloc returns unique number - useful for checking leaks
  // 8 aligned to mimic "real" double*. The code accessing the heap
  // does divide by 8 to get indices.
  let malloc_base = 1;
  const nextAddr = () => (malloc_base++ * 8) as unknown as ptr;

  const module = {
    _malloc: vi.fn(nextAddr),
    _tinystan_create_model: vi.fn(
      () => (modelFails ? 0 : nextAddr()) as unknown as model_ptr,
    ),
    _tinystan_model_param_names: vi.fn(() => paramNames as unknown as cstr),
    _tinystan_model_num_free_params: vi.fn(() => numFreeParams),
    _tinystan_separator_char: vi.fn(() => "%".charCodeAt(0)),
    // simulate failure by returning non-zero return code
    _tinystan_sample: vi.fn(() => returnCode),
    _tinystan_pathfinder: vi.fn(() => returnCode),
    _tinystan_get_error_message: vi.fn(
      (ptr) => `Error inside WASM at address ${ptr}` as unknown as cstr,
    ),
    // we just lie to typescript about cstrs, and use strings instead
    UTF8ToString: vi.fn((s) => s as unknown as string),
    stringToUTF8: vi.fn((s) => s as unknown as cstr),
    getValue: vi.fn((_ptr, type) => {
      if (type === "i32") return 123;
      if (type === "*") return 999;
      throw new Error(`Unexpected type ${type} in mock`);
    }),
    // These mocks are fine to be empty/undefined
    _free: vi.fn(),
    _tinystan_destroy_model: vi.fn(),
    _tinystan_get_error_type: vi.fn(),
    _tinystan_destroy_error: vi.fn(),
    _tinystan_api_version: vi.fn(),
    _tinystan_stan_version: vi.fn(),
    lengthBytesUTF8: vi.fn(),
    HEAPF64: fakeHeap,
  };

  return module;
};

export type MockedModule = ReturnType<typeof mockModule>;
