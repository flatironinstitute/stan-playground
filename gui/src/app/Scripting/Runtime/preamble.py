import argparse
import json
import os

import cmdstanpy

HERE = os.path.dirname(os.path.abspath(__file__))

argparser = argparse.ArgumentParser(prog=f"Stan-Playground: {TITLE}")
