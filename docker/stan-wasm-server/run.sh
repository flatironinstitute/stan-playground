#!/bin/bash

set -ex

uvicorn main:app --host 0.0.0.0 --port 8080 --workers 4
