import { expect, vi } from "vitest";

import type { internalTypes } from "../../../../src/app/tinystan/types";
import StanModel from "../../../../src/app/tinystan";
import { soakingPrintCallback } from "../../../../src/app/tinystan/util";
type ptr = internalTypes["ptr"];
type model_ptr = internalTypes["model_ptr"];
type cstr = internalTypes["cstr"];

export type ModuleSettings = {
  returnCode: number;
  numParams: number;
  paramNames: string;
  modelFails?: boolean;
};

const defaultModuleSettings: ModuleSettings = {
  returnCode: 0,
  numParams: 3,
  paramNames: "foo,bar,baz",
  modelFails: false,
};

// 128MB heap, filled with increasing numbers
const fakeHeap = new Float64Array(16 * 1024 * 1024);
for (let i = 0; i < fakeHeap.length; i++) {
  fakeHeap[i] = i;
}

const mockModule = (p: Partial<ModuleSettings>) => {
  const { returnCode, numParams, paramNames, modelFails } = {
    ...defaultModuleSettings,
    ...p,
  };

  let malloc_base = 1;

  const module = {
    // malloc returns unique number - useful for checking leaks
    // 8 aligned to mimic "real" double*
    _malloc: vi.fn(() => (malloc_base++ * 8) as unknown as ptr),
    _free: vi.fn(),
    _tinystan_create_model: vi.fn(
      () => (modelFails ? 0 : malloc_base++ * 8) as unknown as model_ptr,
    ),
    _tinystan_destroy_model: vi.fn(),
    _tinystan_model_param_names: vi.fn(() => paramNames as unknown as cstr),
    _tinystan_model_num_free_params: vi.fn(() => numParams),
    _tinystan_separator_char: vi.fn(() => 37), // '%'
    _tinystan_sample: vi.fn(() => returnCode),
    _tinystan_pathfinder: vi.fn(() => returnCode),
    _tinystan_get_error_message: vi.fn(
      (ptr) => `Error inside WASM at address ${ptr}` as unknown as cstr,
    ),
    _tinystan_get_error_type: vi.fn(),
    _tinystan_destroy_error: vi.fn(),
    _tinystan_api_version: vi.fn(),
    _tinystan_stan_version: vi.fn(),
    lengthBytesUTF8: vi.fn(),
    UTF8ToString: vi.fn((s) => s as unknown as string),
    stringToUTF8: vi.fn((s) => s as unknown as cstr),
    getValue: vi.fn((_ptr, type) => {
      if (type === "i32") return 123;
      if (type === "*") return 999;
      throw new Error(`Unexpected type ${type} in mock`);
    }),
    HEAPF64: fakeHeap,
  };
  return module;
};

export type MockedModule = ReturnType<typeof mockModule>;

export const getMockedModel = async (p: Partial<ModuleSettings>) => {
  const mockedModule: MockedModule = mockModule(p);
  const { printCallback, getStdout, clearStdout } = soakingPrintCallback();

  const model = await StanModel.load(async (_) => mockedModule, printCallback);

  return { mockedModule, model, getStdout, clearStdout };
};

// see https://vitest.dev/guide/extending-matchers.html
expect.extend({
  // Checks three main memory issues:
  // 1. Double free
  // 2. Malloc without free
  // 3. Model created without destroyed
  toHaveNoMemoryLeaks: (module: MockedModule, _) => {
    const freedAddresses = module._free.mock.calls
      .map((args) => args[0])
      .filter((x) => x !== 0);
    const uniqueFreedAddresses = new Set(freedAddresses);
    if (uniqueFreedAddresses.size !== freedAddresses.length) {
      return {
        pass: false,
        message: () =>
          `Double free! Some addresses were freed multiple times: ${freedAddresses}`,
      };
    }

    for (const { value } of module._malloc.mock.results) {
      if (!uniqueFreedAddresses.has(value)) {
        return {
          pass: false,
          message: () => `Memory leak! Address ${value} was never freed.`,
        };
      }
    }

    const destroyedModels = module._tinystan_destroy_model.mock.calls.map(
      (args: any) => args[0],
    );
    for (const { value } of module._tinystan_create_model.mock.results) {
      if (value !== 0 && !destroyedModels.includes(value)) {
        return {
          pass: false,
          message: () =>
            `Memory leak! Model at address ${value} was never destroyed.`,
        };
      }
    }

    return { pass: true, message: () => "" };
  },
});
