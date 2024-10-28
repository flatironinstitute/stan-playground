import {
  initialDataModel,
  ProjectDataModel,
  ProjectKnownFiles,
} from "@SpCore/ProjectDataModel";
import makePyRuntimeScript from "@SpScripting/Runtime/makePyRuntime";
import { describe, expect, test } from "vitest";

const testDataModel: ProjectDataModel = structuredClone(initialDataModel);
Object.values(ProjectKnownFiles).forEach((f) => {
  testDataModel[f] = JSON.stringify(f);
});
testDataModel.meta.title = "my title";

const full = `TITLE="my title"
import argparse
import json
import os

import cmdstanpy

HERE = os.path.dirname(os.path.abspath(__file__))

argparser = argparse.ArgumentParser(prog=f"Stan-Playground: {TITLE}")
argparser.add_argument("--install-cmdstan", action="store_true", help="Install cmdstan if it is missing")
argparser.add_argument("--ignore-saved-data", action="store_true", help="Ignore saved data.json files")
args, _ = argparser.parse_known_args()

if args.ignore_saved_data:
    print("executing data.py")
    with open(os.path.join(HERE, "data.py")) as f:
        exec(f.read())
    if "data" not in locals():
        raise ValueError("data variable not defined in data.py")
else:
    print("Loading data from data.json, pass --ignore--saved-data to run data.py instead")
    data = os.path.join(HERE, 'data.json')

def rename_sampling_options(k):
    """
    convert between names used in
    Stan-Playground and CmdStanPy
    """

    if k == "init_radius":
        return "inits"
    if k == "num_warmup":
        return "iter_warmup"
    if k == "num_samples":
        return "iter_sampling"
    if k == "num_chains":
        return "chains"

    raise ValueError(f"Unknown sampling option: {k}")


if os.path.isfile(os.path.join(HERE, "sampling_opts.json")):
    print("loading sampling_opts.json")
    with open(os.path.join(HERE, "sampling_opts.json")) as f:
        s = json.load(f)
    sampling_opts = {rename_sampling_options(k): v for k, v in s.items()}
else:
    sampling_opts = {}

try:
    cmdstanpy.cmdstan_path()
except Exception:
    if args.install_cmdstan:
        cmdstanpy.install_cmdstan()
    else:
        raise ValueError("cmdstan not found, use --install-cmdstan to install")

print("compiling model")
model = cmdstanpy.CmdStanModel(stan_file=os.path.join(HERE, "main.stan"))

print("sampling")
fit = model.sample(data=data, **sampling_opts)

print(fit.summary())

# Used in pyodideWorker for running analysis.py

from typing import TYPE_CHECKING, List, TypedDict

import numpy as np
import pandas as pd
import stanio

# We don't import this unconditionaly because
# we only install it when the user's script needs it
if TYPE_CHECKING:
    from arviz import InferenceData


class SpData(TypedDict):
    draws: List[List[float]]
    paramNames: List[str]
    numChains: int


class DrawsObject:
    def __init__(self, sp_data: SpData):

        self._all_parameter_names: List[str] = sp_data["paramNames"]

        self._params = stanio.parse_header(",".join(self._all_parameter_names))

        self._num_chains: int = sp_data["numChains"]

        # draws come in as num_params by (num_chains * num_draws)
        self._draws = (
            np.array(sp_data["draws"])
            .transpose()
            .reshape(self._num_chains, -1, len(self._all_parameter_names))
        )

    def __repr__(self) -> str:
        return f"""SpDraws with {self._num_chains} chains, {self._draws.shape[1]} draws, and {self._draws.shape[2]} parameters.
        Methods:
        - as_dataframe(): return a pandas DataFrame of the draws.
        - as_numpy(): return a numpy array indexed by (chain, draw, parameter)
        - as_arviz(): return an arviz InferenceData object
        - get(pname: str): return a numpy array of the parameter values for the given parameter name"""

    def as_dataframe(self) -> pd.DataFrame:
        # The first column is the chain id
        # The second column is the draw number
        # The remaining columns are the parameter values

        (num_chains, num_draws, num_params) = self._draws.shape
        flattened = self._draws.reshape(-1, num_params)

        chain_ids = np.repeat(np.arange(1, num_chains + 1), num_draws)
        draw_numbers = np.tile(np.arange(1, num_draws + 1), num_chains)

        data = np.column_stack((chain_ids, draw_numbers, flattened))

        df = pd.DataFrame(data, columns=["chain", "draw"] + self._all_parameter_names)
        return df

    def as_numpy(self) -> np.ndarray:
        return np.array(self._draws)

    def get(self, pname: str) -> np.ndarray:
        if pname not in self._params:
            raise ValueError(f"Parameter {pname} not found")
        return self._params[pname].extract_reshape(self._draws)

    def to_arviz(self) -> "InferenceData":
        import arviz as az

        return az.from_dict(
            posterior={pname: self.get(pname) for pname in self.parameter_names},
        )

    @property
    def parameter_names(self) -> List[str]:
        return list(self._params.keys())

    @property
    def raw_parameter_names(self) -> List[str]:
        return list(self._all_parameter_names)


def sp_load_draws(sp_data: SpData) -> DrawsObject:
    return DrawsObject(sp_data)

import matplotlib.pyplot as plt

print("executing analysis.py")

sp_data = {
    "draws": fit.draws(concat_chains=True),
    "paramNames": fit.metadata.cmdstan_config["raw_header"].split(","),
    "numChains": fit.chains,
}

draws = sp_load_draws(sp_data)
del sp_data

with open(os.path.join(HERE, "analysis.py")) as f:
    exec(f.read())

if len(plt.gcf().get_children()) > 1:
    plt.show()
`;

describe("Python runtime", () => {
  // these serve as "golden" tests, just to make sure the output is as expected

  test("Export full", () => {
    const runPy = makePyRuntimeScript(testDataModel);
    expect(runPy).toEqual(full);
  });

  test("Export without data", () => {
    const noData = {
      ...testDataModel,
      dataFileContent: "",
      dataPyFileContent: "",
    };
    const runPy = makePyRuntimeScript(noData);

    // we expect the same output minus the data loading part
    const lines = full.split("\n");
    const dataless =
      lines.slice(0, 11).join("\n") +
      "\n" +
      lines[12] +
      "\n" +
      lines.slice(23).join("\n");
    expect(runPy).toEqual(dataless);
  });

  test("Export without analysis", () => {
    const noAnalysis = { ...testDataModel, analysisPyFileContent: "" };
    const runPy = makePyRuntimeScript(noAnalysis);

    // we expect the same output, truncated after the sampling part
    const analysisless = full.split("\n").slice(0, 65).join("\n") + "\n";

    expect(runPy).toEqual(analysisless);
  });
});
