# Used in pyodideWorker for running analysis.py

from typing import List, TypedDict

import numpy as np
import pandas as pd
import stanio


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

    @property
    def parameter_names(self) -> List[str]:
        return list(self._params.keys())

    @property
    def raw_parameter_names(self) -> List[str]:
        return list(self._all_parameter_names)


def sp_load_draws(sp_data: SpData) -> DrawsObject:
    return DrawsObject(sp_data)
