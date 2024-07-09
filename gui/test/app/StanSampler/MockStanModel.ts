import { vi } from "vitest";

import type StanModel from "tinystan";
import type { PrintCallback } from "tinystan";

const mockedLoad = async (
  _create: any,
  printCallback: PrintCallback | null,
) => {
  await new Promise((resolve) => setTimeout(resolve, 50));

  if (_create === "fail") {
    return Promise.reject(new Error("error for testing in load!"));
  }

  const model = {
    stanVersion: vi.fn(() => "1.2.3"),
    sample: vi.fn(({ num_chains }) => {
      if (num_chains === 999) {
        throw new Error("error for testing in sample!");
      }

      printCallback &&
        printCallback(`Chain [1] Iteration:  123 / 1000 [ 45%]  (Sampling)`);
      return {
        paramNames: ["a", "b"],
        draws: [
          [1, 2],
          [3, 4],
        ],
      };
    }),
  } as unknown as StanModel;

  return model;
};

export default mockedLoad;
