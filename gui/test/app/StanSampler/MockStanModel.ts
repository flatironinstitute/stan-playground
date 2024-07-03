import { vi } from "vitest";

import StanModel, { PrintCallback } from "tinystan";

const mockModelLoad = (_create: any, printCallback: PrintCallback | null) => {
  const model = {
    stanVersion: vi.fn(() => "1.2.3"),
    sample: vi.fn(({ num_samples, refresh }) => {
      if (printCallback && refresh) {
        for (let i = 0; i < num_samples; i++) {
          if (num_samples % refresh === 0) {
            printCallback(
              `Chain [1] Iteration: ${i} / ${num_samples} [${Math.round((100 * i) / num_samples)}%]  (Sampling)`,
            );

            // sleep for 0.1 seconds
            const start = Date.now();
            while (Date.now() - start < 100) {
              //
            }
          }
        }
      }

      return {
        paramNames: ["a", "b"],
        draws: [
          [1, 2],
          [3, 4],
        ],
      };
    }),
    pathfinder: vi.fn(() => ({
      paramNames: ["a", "b"],
      draws: [
        [1, 2],
        [3, 4],
      ],
    })),
  } as unknown as StanModel;

  return Promise.resolve(model);
};

export default mockModelLoad;
