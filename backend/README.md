# Stan-Playground compilation server

While the sampling of the model and other computations
take place in the browser, compiling the model to WebAssembly requires
a server. This folder contains the source code and [Docker](https://www.docker.com/)
build config for that server.

## Server architecture

The server is a simple Python-based server implemented using [FastAPI](https://fastapi.tiangolo.com/).

It provides the following endpoints:

- `/probe` - a GET endpoint to check that the server is live and responding
- `/compile` - a POST endpoint that accepts Stan code as the body and returns a
  model id after compiling and cacheing the model
- `/download/{model_id}/{filename}` - GET endpoints to download the results using the
  id provided by `/compile`. Valid filenames are `main.js` and `main.wasm`.
- `/restart` - a POST endpoint that causes the server to stop, allowing an outside
  orchestrator to restart it. This is used by our CI system to manage updates.

The server listens to the following environment variables for configuration:

- `TINYSTAN` or `TINYSTAN_DIR` - the location to look for a [tinystan](github.com/WardBrian/tinystan) installation. Required.

  **Note**: This `tinystan` folder is expected to be configured to build WebAssembly. Consult the Dockerfile and `local.mk` files for
  reference.
- `SWS_PASSCODE` - a simple `Authorization: Bearer` token for the `/compile` endpoint. Required.
- `SWS_RESTART_TOKEN` - a simple `Authorization: Bearer` token for the `/restart` endpoint. Optional, defaults to disabling the `/restart` endpoint.
- `SWS_JOB_DIR` - the path used for compilation and scratch work. Optional, defaults to `/jobs`.
- `SWS_BUILT_MODEL_DIR` - the path used to store (and cache) the results of compilation. Optional, defaults to `/compiled_models`.
- `SWS_COMPILATION_TIMEOUT` - the maximum time in seconds a compilation is allowed to take. Optional, defaults to 300 (5 minutes).
- `SWS_LOG_LEVEL` - logging configuration. Should be one of `DEBUG`, `INFO`, `WARNING`, `ERROR`, or `CRITICAL`. Optional, defaults to `INFO`.

The actual server is run and distributed as a Docker image. The Dockerfile is responsible for:

- Installing and configuring `tinystan` for WebAssembly usage, including installing its dependency `oneTBB`.
- Installing Python, FastAPI, and `uvicorn` for running the server.
- Configuring the required environment variables and providing a startup command.

## Running a local server

We provide a public server for convenience, but users can always run their
own using

```bash
docker run -p 8083:8080 -it ghcr.io/flatironinstitute/stan-wasm-server:latest
```

See [the docs](https://flatironinstitute.github.io/stan-playground/compilation_server_setup.html) for more.

## Building the Docker image from scratch

Rather than downloading from the Github Container Repository,
the image for the server can also be built from the Dockerfile in this `backend/` folder:

```bash
# from within the backend/ folder
docker build -t stan-playground .
docker run -p 8083:8080 -it stan-playground
```
