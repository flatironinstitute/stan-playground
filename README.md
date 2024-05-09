# stan-playground

:warning: This is a very preliminary version. Not ready to be used seriously.

Run Stan models locally in the browser

## Instructions

For now, you need to run a server locally to do the compilation of the models.

```
docker run -p 8083:8080 -it magland/stan-wasm-server:latest
```

Then visit

https://stan-playground.vercel.app/

Compile and run the sampling

## Troubleshooting

If you have doubts about whether the compilation server is working, you can verify that it is responding:

```
curl http://localhost:8083/probe
```

## For developers

The source code for the frontend is in [this monorepo](https://github.com/magland/fi-sci/tree/main/apps/stan-playground).


The source code for the server that does the compilation is in [docker](docker).

## Notes

Right now the sampler runs in the main thread, so it freezes the UI. We'll need to put this in a worker thread.

**How is this different from the previous stan-playground?** That other stan-playground was also about running Stan models via the browser, but the sampling was done in the cloud. For this project (different project, same name) the sampling is done locally in the browser.
