import { expect, onTestFinished } from "vitest";
import StanModel from "../../../../src/app/tinystan";
import { soakingPrintCallback } from "../../../../src/app/tinystan/util";
import { ModuleSettings, MockedModule, mockModule } from "./WasmModule";

export const getMockedModel = async (p: Partial<ModuleSettings>) => {
  const mockedModule: MockedModule = mockModule(p);
  onTestFinished(() => {
    expect(mockedModule).toHaveNoMemoryLeaks();
  });

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
