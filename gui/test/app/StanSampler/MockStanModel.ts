import { vi } from "vitest";

import type StanModel from "tinystan";
import type { PrintCallback } from "tinystan";

const mockedLoad = async (
  _create: any,
  printCallback: PrintCallback | null,
) => {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const model = {
    stanVersion: vi.fn(() => "1.2.3"),
    sample: vi.fn(() => {
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
