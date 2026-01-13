# Compilation server setup

These instructions are only required if you want to set up your own compilation server.

To run your own server locally using [Docker](https://www.docker.com/), execute the following command:

```
docker run -p 8083:8080 -it ghcr.io/flatironinstitute/stan-wasm-server:latest
```

This will download the latest version of the compilation server, with all the necessary dependencies, and
start it running on the required port.

After setting up the server, navigate to https://stan-playground.flatironinstitute.org.

In the menu bar, you can choose to use either the public server or your local server. If you opt for the local server, the default port is 8083. If you change this port or use a different host, update your settings in the "Custom server" option.

To compile a Stan model, click the "compile" button at the top of the Stan file editor. After compilation, you can input JSON data to run the sampling. The results will be displayed directly in the browser, and there is also an option to download them.

**Troubleshooting**: If you have doubts about whether the compilation server is working, you can verify that it is responding:

```
curl http://localhost:8083/probe
```

## More information

Curious about editing the server, building the image from scratch, or what
endpoints are provided? Consult the [backend README file](https://github.com/flatironinstitute/stan-playground/blob/main/backend/README.md)
