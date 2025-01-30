import { vi } from "vitest";

import { defaultSamplingOpts } from "@SpCore/Project/ProjectDataModel";
import type StanModel from "tinystan";
import type { PrintCallback } from "tinystan";

import fakeURL from "./empty.ts?url";
import failSentinel from "./fail.ts";
import erroringURL from "./fail.ts?url";

export const mockCompiledMainJsUrl = fakeURL;
export const erroringCompiledMainJsUrl = erroringURL;

const erroring_num_chains = 999;

export const erroringSamplingOpts = {
  ...defaultSamplingOpts,
  num_chains: erroring_num_chains,
};

export const mockedParamNames = ["a", "b"];
export const mockedDraws = [
  [1, 2],
  [3, 4],
];

export const mockedProgress = {
  chain: 1,
  iteration: 123,
  totalIterations: 1000,
  percent: 45,
  warmup: false,
};

const mockedProgressString = `Chain [${mockedProgress.chain}] \
Iteration: ${mockedProgress.iteration} \
/ ${mockedProgress.totalIterations} \
[${mockedProgress.percent.toString().padStart(3)}%]  \
(${mockedProgress.warmup ? "Warmup" : "Sampling"})`;

const mockedLoad = async (
  _create: any,
  printCallback: PrintCallback | null,
) => {
  await new Promise((resolve) => setTimeout(resolve, 50));

  if (_create === failSentinel) {
    return Promise.reject("error for testing in load!");
  }

  const model = {
    stanVersion: vi.fn(() => "1.2.3"),
    sample: vi.fn(({ num_chains }) => {
      if (num_chains === erroring_num_chains) {
        throw new Error("error for testing in sample!");
      }

      printCallback && printCallback(mockedProgressString);

      return {
        paramNames: mockedParamNames,
        draws: mockedDraws,
      };
    }),
  } as unknown as StanModel;

  return model;
};

export default mockedLoad;
