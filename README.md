# stan-playground

Run Stan models in the browser

## Instructions

For now, you need to run a server locally to do the compilation of the models.

```
docker run -p 8083:8080 -it magland/stan-wasm-server:latest
```

Verify that the server is responding

```
curl http://localhost:8083/probe
```

Visit

https://stan-playground.vercel.app/

Compile and sample

## For developers

The source code for the frontend is in [this monorepo](https://github.com/magland/fi-sci/tree/main/apps/stan-playground).



