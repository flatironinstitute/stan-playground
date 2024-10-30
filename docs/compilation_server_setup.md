# Compilation server setup

These instructions are only required if you want to set up your own compilation server. If you are content with using the public server, you can skip this section.

To run your own server locally using Docker, execute the following command:

```
docker run -p 8083:8080 -it magland/stan-wasm-server:latest
```

After setting up the server, navigate to https://stan-playground.flatironinstitute.org.

In the menu bar, you can choose to use either the public server or your local server. If you opt for the local server, the default port is 8083. If you change this port or use a different host, update your settings in the "Custom server" option.

To compile a Stan model, click the "compile" button at the top of the Stan file editor. After compilation, you can input JSON data to run the sampling. The results will be displayed directly in the browser, and there is also an option to download them.

**Troubleshooting**: If you have doubts about whether the compilation server is working, you can verify that it is responding:

```
curl http://localhost:8083/probe
```