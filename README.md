# stan-playground

:warning: This is a very preliminary version. Not ready for practical use.

Run Stan models locally in the browser

[Visit the live site!](https://stan-playground.vercel.app)

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

The source code for the frontend is in the gui folder. See the readme there.

The source code for the dockerized server is in the docker folder.

## Notes

Right now the sampler runs in the main thread, so it freezes the UI. We'll need to put this in a worker thread.

**How is this different from the previous stan-playground?** That other stan-playground was also about running Stan models via the browser, but the sampling was done on a server. For this project (same name) the sampling is done locally in the browser.
