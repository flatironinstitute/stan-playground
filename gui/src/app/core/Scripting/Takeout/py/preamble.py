import argparse
import json
import os

import cmdstanpy

HERE = os.path.dirname(os.path.abspath(__file__))

argparser = argparse.ArgumentParser(prog=f"Stan-Playground: {TITLE}")
argparser.add_argument("--install-cmdstan", action="store_true", help="Install cmdstan if it is missing")
argparser.add_argument("--ignore-saved-data", action="store_true", help="Ignore saved data.json files")
args, _ = argparser.parse_known_args()
