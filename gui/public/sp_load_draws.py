# Used in pyodideWorker for running analysis.py

from typing import List
import numpy as np


class DrawsObject:
    def __init__(self, sp_data):
        if "sampling" not in sp_data:
            raise ValueError("Unexpected: sampling key not found in sp_data")
        sampling: dict = sp_data["sampling"]
        self._draws: List[List[float]] = sampling["draws"]
        self._all_parameter_names: List[str] = sampling["paramNames"]
        self._num_chains: int = sampling["numChains"]
        self._chain_ids: List[int] = sampling["chainIds"]

    def as_dataframe(self):
        # The first column is the chain id
        # The second column is the draw number
        # The remaining columns are the parameter values
        import pandas as pd

        data = []
        for chain_id in range(1, self._num_chains + 1):
            chain_draws = []
            for i in range(len(self._draws)):
                if self._chain_ids[i] == chain_id:
                    chain_draws.append(self._draws[i])
            for draw_index, draw in enumerate(chain_draws):
                data.append([chain_id, draw_index + 1] + draw)
        df = pd.DataFrame(data, columns=["chain", "draw"] + self._all_parameter_names)
        return df

    def as_numpy(self):
        return np.array(self._draws)

    def get(self, pname: str) -> np.ndarray:
        if pname in self._all_parameter_names:
            ind = self._all_parameter_names.index(pname)
            return np.array([draw[ind] for draw in self._draws])
        else:
            base_pname = pname.split(".")[0]
            pp = [p for p in self._all_parameter_names if p.startswith(base_pname + ".")]
            if len(pp) == 0:
                raise ValueError(f"Parameter {pname} not found")
            # Here we assume that the parameters are in the correct order.
            # Matrices will be flattened.
            # TODO: Use stanio for this instead
            inds = [self._all_parameter_names.index(p) for p in pp]
            return np.array([[draw[ind] for ind in inds] for draw in self._draws])

    @property
    def parameter_names(self):
        pnames = []
        for p in self._all_parameter_names:
            p_base = p.split(".")[0]
            if p_base not in pnames:
                pnames.append(p_base)
        return pnames


def sp_load_draws(sp_data):
    return DrawsObject(sp_data)
