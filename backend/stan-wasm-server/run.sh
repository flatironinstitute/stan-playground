#!/bin/bash

set -ex

uvicorn --app-dir ./src/app main:app --host 0.0.0.0 --port 8080 --workers 4
