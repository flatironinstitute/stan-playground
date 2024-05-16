# stan-playground

:warning: **Early Access:** This software is in a preliminary stage and may not yet be suitable for practical use.

Run Stan models directly in your browser.

[Visit the live site!](https://stan-playground.vercel.app)

## Overview

Stan Playground enables you to run Stan sampling directly in your browser using your computer's CPU, eliminating the need for any local installation. While the Stan models execute in the browser, the compilation process requires a dedicated server. We provide a default public server for your convenience, but you can also set up your own compilation server either locally or remotely. With this setup, you can seamlessly edit Stan programs, compile them, input JSON data, run sampling, and view or download the results—all within your browser. This is made possible by a specially prepared WebAssembly-compiled version of Stan that operates in a background thread.

This project is based on [stan-web-demo](https://github.com/WardBrian/stan-web-demo) which shows how to use [TinyStan](https://github.com/WardBrian/tinystan) to build a WebAssembly version of a Stan model that can be executed in the browser. While stan-web-demo focuses on integrating a specific Stan model into a website—essentially "baking" the model into the web environment—stan-playground is designed for a broader purpose. It offers a flexible platform for experimenting with and exploring various Stan models. This makes it ideal for users looking to test different statistical models and hypotheses directly in their browser, without the commitment to a single model implementation.

## Instructions

Stan Playground allows you to use a public server or set up your own compilation server. To run your own server locally using Docker, execute the following command:

```
docker run -p 8083:8080 -it magland/stan-wasm-server:latest
```

After setting up the server, navigate to https://stan-playground.vercel.app/.

In the menu bar, you can choose to use either the public server or your local server. If you opt for the local server, the default port is 8083. If you change this port or use a different host, update your settings in the "Custom server" option.

To compile a Stan model, click the "compile" button at the top of the Stan file editor. After compilation, you can input JSON data to run the sampling. The results will be displayed directly in the browser, and there is also an option to download them.


## Troubleshooting

If you have doubts about whether the compilation server is working, you can verify that it is responding:

```
curl http://localhost:8083/probe
```

## For developers

The source code for the frontend is in the gui folder. See the readme there.

The source code for the dockerized server is in the docker folder.

## Notes

**How is this different from the previous stan-playground?** The previous version of stan-playground also facilitated running Stan models through the browser. However, it relied on server-side processing for sampling. In contrast, this iteration of stan-playground (despite sharing the same name) performs all sampling directly within the browser, enhancing user control and privacy.

## License

Apache License 2.0

## Authors

- [Jeremy Magland](https://github.com/magland)
- [Brian Ward](https://github.com/WardBrian)
- [Jeff Soules](https://github.com/jsoules)

Center for Computational Mathematics, Flatiron Institute